// crud version 0.3.2
// (MIT) 22-11-2013
// https://github.com/DubFriend/CRUD
(function () {
'use strict';

var identity = function (x) {
    return x;
};

var increment = function (x) {
    return x += 1;
};

var decrement = function (x) {
    return x -= 1;
};

var dot = function (key, object) {
    return object[key];
};

var partial = function (f) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function () {
        var remainingArgs = Array.prototype.slice.call(arguments);
        return f.apply(null, args.concat(remainingArgs));
    };
};

var isArray = function (value) {
    return value instanceof Array;
};

var isObject = function (value) {
    return !isArray(value) && (value instanceof Object);
};

var isFunction = function (value) {
    return value instanceof Function;
};

var isEmpty = function (object) {
    for(var i in object) {
        if(object.hasOwnProperty(i)) {
            return false;
        }
    }
    return true;
};

var isNumeric = function (candidate) {
    return !isNaN(candidate);
};

var isInteger = function (candidate) {
    return isNumeric(candidate) && Number(candidate) % 1 === 0;
};

//deep copy of json objects
var copy = function (object) {
    return JSON.parse(JSON.stringify(object));
};

var foreach = function (collection, callback) {
    for(var i in collection) {
        if(collection.hasOwnProperty(i)) {
            callback(collection[i], i, collection);
        }
    }
};

var range = function (a, b) {
    var i, start, end, array = [];
    if(b === undefined) {
        start = 0;
        end = a - 1;
    }
    else {
        start = a;
        end = b;
    }
    for(i = start; i <= end; i += 1) {
        array.push(i);
    }
    return array;
};

var reverse = function (array) {
    var reversed = [], i;
    for(i = array.length - 1; i >= 0; i -= 1) {
        reversed.push(array[i]);
    }
    return reversed;
};

var last = function (array) {
    return array[array.length - 1];
};

var mapToArray = function (collection, callback) {
    var mapped = [];
    foreach(collection, function (value, key, coll) {
        mapped.push(callback(value, key, coll));
    });
    return mapped;
};

var mapToObject = function (collection, callback, keyCallback) {
    var mapped = {};
    foreach(collection, function (value, key, coll) {
        key = keyCallback ? keyCallback(key, value) : key;
        mapped[key] = callback(value, key, coll);
    });
    return mapped;
};

var appendKey = function (appendingString, collection) {
    return map(collection, identity, function (key) {
        return appendingString + key;
    });
};

var map = function (collection, callback, keyCallback) {
    return isArray(collection) ?
        mapToArray(collection, callback) :
        mapToObject(collection, callback, keyCallback);
};

var keys = function (collection) {
    return mapToArray(collection, function (val, key) {
        return key;
    });
};

var values = function (collection) {
    return mapToArray(collection, function (val) {
        return val;
    });
};

var reduce = function (collection, callback) {
    var accumulation;
    foreach(collection, function (val, key) {
        accumulation = callback(accumulation, val, key, collection);
    });
    return accumulation;
};

var filter = function (collection, callback) {
    var filtered;

    if(isArray(collection)) {
        filtered = [];
        foreach(collection, function (val, key, coll) {
            if(callback(val, key, coll)) {
                filtered.push(val);
            }
        });
    }
    else {
        filtered = {};
        foreach(collection, function (val, key, coll) {
            if(callback(val, key, coll)) {
                filtered[key] = val;
            }
        });
    }

    return filtered;
};

var union = function () {
    var united = {};
    foreach(arguments, function (object) {
        foreach(object, function (value, key) {
            united[key] = value;
        });
    });
    return united;
};

//execute callback at most one time on the minimumInterval
var debounce = function (minimumInterval, callback, isImmediate) {
    var timeout = null;
    var isAttemptBlockedOnInterval = false;
    return function () {
        var that = this, args = arguments;
        if(timeout === null) {
            timeout = setTimeout(function () {
                if(!isImmediate || isAttemptBlockedOnInterval) {
                    callback.apply(that, args);
                }
                isAttemptBlockedOnInterval = false;
                timeout = null;
            }, minimumInterval);
            if(isImmediate) {
                callback.apply(that, args);
            }
        }
        else {
            isAttemptBlockedOnInterval = true;
        }
    };
};

var generateUniqueID = (function () {
    var count = 0;
    return function () {
        return count += 1;
    };
}());

var mixinPubSub = function (object) {
    object = object || {};
    var topics = {};

    object.publish = function (topic, data) {
        foreach(topics[topic], function (callback) {
            callback(data);
        });
    };

    object.subscribe = function (topic, callback) {
        topics[topic] = topics[topic] || [];
        topics[topic].push(callback);
    };

    object.unsubscribe = function (callback) {
        foreach(topics, function (subscribers) {
            var index = subscribers.indexOf(callback);
            if(index !== -1) {
                subscribers.splice(index, 1);
            }
        });
    };

    return object;
};

// ##     ##   #######   ########   ########  ##
// ###   ###  ##     ##  ##     ##  ##        ##
// #### ####  ##     ##  ##     ##  ##        ##
// ## ### ##  ##     ##  ##     ##  ######    ##
// ##     ##  ##     ##  ##     ##  ##        ##
// ##     ##  ##     ##  ##     ##  ##        ##
// ##     ##   #######   ########   ########  ########

var createModel = function (fig, my) {
    fig = fig || {};
    var that = mixinPubSub();

    my.url = fig.url;
    my.data = fig.data;

    that.validate = fig.validate || function (data) {
        return {};
    };

    that.get = function (key) {
        return key ? my.data[key] : copy(my.data);
    };

    that.set = function (successCallback, newData, options) {
        options = options || {};
        var errors = options.validate === false ? {} : that.validate(newData);
        if(isEmpty(errors)) {
            my.data = union(my.data, newData);
            if(options.silent !== true) {
                that.publish('change', newData);
                successCallback(newData, options);
            }
            return true;
        }
        else {
            if(options.silent !== true) {
                that.publish('error', errors);
            }
            return false;
        }
    };

    return that;
};


var ajaxErrorResponse = function (that, jqXHR) {
    if(jqXHR.status === 409) {
        that.publish('error', jqXHR.responseJSON);
    }
};

//  ######    ######   ##     ##  ########  ##     ##     ###
// ##    ##  ##    ##  ##     ##  ##        ###   ###    ## ##
// ##        ##        ##     ##  ##        #### ####   ##   ##
//  ######   ##        #########  ######    ## ### ##  ##     ##
//       ##  ##        ##     ##  ##        ##     ##  #########
// ##    ##  ##    ##  ##     ##  ##        ##     ##  ##     ##
//  ######    ######   ##     ##  ########  ##     ##  ##     ##

var createSchemaModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        id = fig.id,
        deletable = fig.deletable,
        ajax = fig.ajax || function (fig) {
            $.ajax({
                url: that.isNew() ? my.url : my.url + '/' + that.id(),
                method: fig.method,
                data: fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(my.data) : my.data,
                dataType: 'json',
                beforeSend: partial(that.publish, 'form:waiting:start'),
                success: fig.success,
                error: partial(ajaxErrorResponse, that),
                complete: partial(that.publish, 'form:waiting:end')
            });
        };

    that.isNew = function () {
        return id === undefined ? true : false;
    };

    that.id = function () {
        return id;
    };

    that.set = partial(that.set, function () {});

    that.clear = function () {
        my.data = {};
        id = undefined;
        that.publish('change', that);
    };

    that.save = function () {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            ajax({
                url: that.isNew() ? my.url : my.url + '/' + id,
                method: that.isNew() ? 'POST' : 'PUT',
                data: my.data,
                success: function (response) {
                    var wasNew = that.isNew();
                    id = that.isNew() ? response : id;
                    that.publish('saved', wasNew);
                }
            });
        }
        that.publish('error', errors);
    };

    that.delete = function () {
        console.log('delete', that.id());
        if(!that.isNew()) {
            ajax({
                url: my.url + '/' + id,
                method: 'DELETE',
                success: function (response) {
                    console.log('delete success', response);
                    var id = that.id();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.clear();
        }
    };

    return that;
};

// ########      ###      ######    ####  ##    ##     ###     ########   #######   ########
// ##     ##    ## ##    ##    ##    ##   ###   ##    ## ##       ##     ##     ##  ##     ##
// ##     ##   ##   ##   ##          ##   ####  ##   ##   ##      ##     ##     ##  ##     ##
// ########   ##     ##  ##   ####   ##   ## ## ##  ##     ##     ##     ##     ##  ########
// ##         #########  ##    ##    ##   ##  ####  #########     ##     ##     ##  ##   ##
// ##         ##     ##  ##    ##    ##   ##   ###  ##     ##     ##     ##     ##  ##    ##
// ##         ##     ##   ######    ####  ##    ##  ##     ##     ##      #######   ##     ##

var createPaginatorModel = function (fig) {
    fig = fig || {};
    fig.data = fig.data || {};
    fig.data.pageNumber = fig.pageNumber || 1;
    fig.data.numberOfPages = fig.numberOfPages || 1;
    var my = {};
    var that = createModel(fig, my),

        requestModel = fig.requestModel;

    that.validate = function (testData) {
        testData = testData || my.data;
        var errors = {};
        var tempNumberOfPages = testData.numberOfPages !== undefined ?
            testData.numberOfPages : my.data.numberOfPages;
        var tempPageNumber = testData.pageNumber !== undefined ?
            testData.pageNumber : my.data.pageNumber;

        if(tempPageNumber <= 0) {
            errors.pageNumber = 'Page number must be greater than zero.';
        }
        else if(tempPageNumber > tempNumberOfPages) {
            errors.pageNumber = 'Page number must be less than or ' +
                                'equal to the number of pages.';
        }
        return errors;
    };

    that.set = partial(that.set, function (newData) {
        if(newData.pageNumber) {
            that.publish('change:pageNumber', newData);
            requestModel.changePage(newData.pageNumber, 'paginator');
        }
    });

    return that;
};

//  #######   ########   ########   ########  ########
// ##     ##  ##     ##  ##     ##  ##        ##     ##
// ##     ##  ##     ##  ##     ##  ##        ##     ##
// ##     ##  ########   ##     ##  ######    ########
// ##     ##  ##   ##    ##     ##  ##        ##   ##
// ##     ##  ##    ##   ##     ##  ##        ##    ##
//  #######   ##     ##  ########   ########  ##     ##

var createOrderModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'order'));

    that.toggle = (function () {
        var toggleOrder = ['neutral', 'ascending', 'descending'];
        return function (name) {
            var currentIndex = toggleOrder.indexOf(my.data[name]);
            var newIndex = (currentIndex + 1) % toggleOrder.length;
            var newData = {};
            newData[name] = toggleOrder[newIndex];
            that.set(newData);
        };
    }());

    return that;
};

// ########  ####  ##        ########  ########  ########
// ##         ##   ##           ##     ##        ##     ##
// ##         ##   ##           ##     ##        ##     ##
// ######     ##   ##           ##     ######    ########
// ##         ##   ##           ##     ##        ##   ##
// ##         ##   ##           ##     ##        ##    ##
// ##        ####  ########     ##     ########  ##     ##

var createFilterModel = function (fig) {
    fig = fig || {};
    var my = {},
        that = createModel(fig, my),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'filter'));

    return that;
};

// ########   ########   #######   ##     ##  ########   ######   ########
// ##     ##  ##        ##     ##  ##     ##  ##        ##    ##     ##
// ##     ##  ##        ##     ##  ##     ##  ##        ##           ##
// ########   ######    ##     ##  ##     ##  ######     ######      ##
// ##   ##    ##        ##  ## ##  ##     ##  ##              ##     ##
// ##    ##   ##        ##    ##   ##     ##  ##        ##    ##     ##
// ##     ##  ########   ##### ##   #######   ########   ######      ##

var createRequestModel = function () {
    var that = mixinPubSub(),
        url,
        paginatorModel,
        orderModel,
        filterModel,
        ajax = function (fig) {
            fig = fig || {};
            $.ajax({
                url: url + '/page/' + (fig.page || 1),
                method: 'GET',
                data: union(
                    (filterModel ? appendKey('filter_', filterModel.get()) : {}),
                    appendKey('order_', orderModel.get())
                ),
                dataType: 'json',
                beforeSend: partial(that.publish, fig.moduleName + ':waiting:start'),
                success: partial(that.publish, 'load'),
                error: partial(ajaxErrorResponse, that),
                complete: partial(that.publish, fig.moduleName + ':waiting:end')
            });
        };

    that.init = function (fig) {
        url = fig.url;
        paginatorModel = fig.paginatorModel;
        filterModel = fig.filterModel;
        orderModel = fig.orderModel;
    };

    that.changePage = function (pageNumber, moduleName) {
        ajax({ page: pageNumber, moduleName: moduleName });
    };

    that.search = function (moduleName) {
        if(paginatorModel.get('pageNumber') !== 1) {
            paginatorModel.set({ pageNumber: 1 });
        }
        ajax({ moduleName: moduleName });
    };

    return that;
};
var createInput = function (fig) {

    var item = fig.item;

    var name = item.name;

    var crudName = fig.name;

    var className = fig.class || '';

    var ID = fig.ID ? fig.ID + '-' : generateUniqueID() + '-';

    var input = function (checked, value) {
        var valueHTML = function () {
            return item.type === 'checkbox' || item.type === 'radio' ?
                'value="' + value + '" ' : 'value="{{' + name + '}}" ';
        };

        var id = function () {
            return item.type === 'checkbox' || item.type === 'radio' ?
                'id="' + ID + name + '-' + value + '" ' :
                'id="' + ID + crudName + '-' + name + '" ';
        };

        return '' +
        '<input type="' + item.type + '" ' + id() +
                'name="' + name + '" ' + valueHTML() +
                ' class="' + className + '" ' +
                (checked ? 'checked' : '') + '/>';
    };

    var inputGroup = function () {
        return '' +
        reduce(item.values, function (acc, valueObject) {
            var value = valueObject.value;
            return (acc || '') +
            '<label for="' + ID + name + '-' + value + '">' +
                (valueObject.label || value) +
            '</label>' +
            '{{#' + name + '.' + value + '}}' +
                input(true, value) +
            '{{/' + name + '.' + value + '}}' +
            '{{^' + name + '.' + value + '}}' +
                input(false, value) +
            '{{/' + name + '.' + value + '}}';
        });
    };

    switch(item.type) {
        case 'text':
            return input();

        case 'password':
            return input();

        case 'textarea':
            return '' +
            '<textarea id="' + ID + crudName + '-' + name + '" ' +
                      'name="' + name + '" class="' + className + '">' +
                '{{' + name + '}}' +
            '</textarea>';

        case 'checkbox':
            return inputGroup();

        case 'radio':
            return inputGroup();

        case 'select':
            return '' +
            '<select name="' + name + '" class="' + className + '">' +
                reduce(item.values, function (acc, valueObject) {
                    var value = valueObject.value;
                    acc = acc || '';
                    return acc +
                    '{{#' + name + '.' + value + '}}' +
                        '<option value="' + value + '" selected>' +
                            (valueObject.label || value) +
                        '</option>' +
                    '{{/' + name + '.' + value + '}}' +
                    '{{^' + name + '.' + value + '}}' +
                        '<option value="' + value + '">' +
                            (valueObject.label || value) +
                        '</option>' +
                    '{{/' + name + '.' + value + '}}';
                }) +
            '</select>';

        default:
            throw 'Invalid input type: ' + item.type;
    }
};


var reduceFormSchema = function (schema, crudName) {
    return reduce(schema, function (acc, item) {
        return (acc || '') +
        '<div class="crud-control-set">' +
            '<label for="' + crudName + '-' + item.name + '">' +
                (item.label || item.name) +
            '</label>' +
            '<div class="crud-input-group">' +
                createInput({
                    item: item,
                    name: crudName,
                    class: 'foo'
                }) +
            '</div>' +
            '<div class="crud-help">{{' + item.name + 'Help}}</div>' +
        '</div>';
    });
};

// ########   #######   ########   ##     ##
// ##        ##     ##  ##     ##  ###   ###
// ##        ##     ##  ##     ##  #### ####
// ######    ##     ##  ########   ## ### ##
// ##        ##     ##  ##   ##    ##     ##
// ##        ##     ##  ##    ##   ##     ##
// ##         #######   ##     ##  ##     ##

var createFormTemplate = function (schema, crudName) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            '<span class="crud-status">{{status}}</span>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    '<input type="submit" value="Save"/>' +
                    '<button class="crud-close-form">Close</button>' +
                    // '<button class="crud-new-item">' +
                    //     'New ' + crudName +
                    // '</button>' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};

// ########  ####  ##        ########  ########  ########
// ##         ##   ##           ##     ##        ##     ##
// ##         ##   ##           ##     ##        ##     ##
// ######     ##   ##           ##     ######    ########
// ##         ##   ##           ##     ##        ##   ##
// ##         ##   ##           ##     ##        ##    ##
// ##        ####  ########     ##     ########  ##     ##

var createFilterTemplate = function (schema, crudName, isInstantFilter) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>Search ' + crudName + '</legend>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<div class="label">&nbsp;</div>' +
                (
                    isInstantFilter ? '' :
                    '<div class="crud-input-group">' +
                        '<input type="submit" value="Search"/>' +
                    '</div>'
                ) +
            '</div>' +
        '</fieldset>' +
    '</form>';
};

// ##        ####   ######   ########      ####  ########  ########  ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ###   ###
// ##         ##   ##           ##          ##      ##     ##        #### ####
// ##         ##    ######      ##          ##      ##     ######    ## ### ##
// ##         ##         ##     ##          ##      ##     ##        ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ##     ##
// ########  ####   ######      ##         ####     ##     ########  ##     ##

var createListItemTemplate = function (schema, id, deletable) {
    return '' +
    (
        deletable ?
            '<td><input type="checkbox" class="crud-list-selected"/></td>' : ''
    ) +
    (function () {
        if(id) {
            return '<td name="id">{{id}}</td>';
        }
        else {
            return '';
        }
    }()) +
    reduce(schema, function (acc, item) {
        return (acc || '') +
        '<td name="' + item.name + '">{{' + item.name + '}}</td>';
    });
};

// ##        ####   ######   ########
// ##         ##   ##    ##     ##
// ##         ##   ##           ##
// ##         ##    ######      ##
// ##         ##         ##     ##
// ##         ##   ##    ##     ##
// ########  ####   ######      ##

var orderable = function (name) {
    return '' +
    '{{#orderable.' + name + '}}' +
        '<a href="#" data-name="' + name + '" class="crud-order">' +
            '{{#order.' + name + '.ascending}}' +
                '{{{orderIcon.ascending}}}' +
            '{{/order.' + name + '.ascending}}' +

            '{{#order.' + name + '.descending}}' +
                '{{{orderIcon.descending}}}' +
            '{{/order.' + name + '.descending}}' +

            '{{#order.' + name + '.neutral}}' +
                '{{{orderIcon.neutral}}}' +
            '{{/order.' + name + '.neutral}}' +
        '</a>' +
    '{{/orderable.' + name + '}}';
};

var createListTemplate = function (schema, crudName, id, deletable) {
    var ID = generateUniqueID();
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                (
                    deletable ?
                    '<th>' +
                        '<label for="' + ID + '-crud-list-select-all">All</label>' +
                        '<input type="checkbox" id="' + ID + '-crud-list-select-all" ' +
                               'class="crud-list-select-all"/>' +
                    '</th>' : ''
                ) +
                (
                    id ?
                    '<th>' +
                        orderable('id') +
                        '<span class="crud-th-content">' +
                            (id.label || 'id') +
                        '</span>' +
                    '</th>' : ''
                ) +
                reduce(schema, function (acc, item) {
                    return (acc || '') +
                    '<th>' +
                        orderable(item.name) +
                        '<span class="crud-th-content">' +
                            (item.label || item.name) +
                        '</span>' +
                    '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody class="crud-list-item-container"></tbody>' +
    '</table>' +
    (deletable ? '<button class="crud-delete-selected">Delete Selected</button>' : '');
};

// ########   ########  ##        ########  ########  ########
// ##     ##  ##        ##        ##           ##     ##
// ##     ##  ##        ##        ##           ##     ##
// ##     ##  ######    ##        ######       ##     ######
// ##     ##  ##        ##        ##           ##     ##
// ##     ##  ##        ##        ##           ##     ##
// ########   ########  ########  ########     ##     ########

var createDeleteConfirmationTemplate = function () {
    return '' +
    '<div class="crud-delete-modal modal">' +
        '<div class="crud-modal-dialogue">' +
            '<p class="crud-message">' +
                'Are you sure you want to delete the selected items?' +
            '</p>' +
            '<center>' +
                '<button class="crud-confirm-delete">' +
                    'Delete' +
                '</button>' +
                '<button class="crud-cancel-delete">' +
                    'Cancel' +
                '</button>' +
            '</center>' +
        '</div>' +
    '</div>';
};

// ########      ###      ######    ####  ##    ##     ###     ########   #######   ########
// ##     ##    ## ##    ##    ##    ##   ###   ##    ## ##       ##     ##     ##  ##     ##
// ##     ##   ##   ##   ##          ##   ####  ##   ##   ##      ##     ##     ##  ##     ##
// ########   ##     ##  ##   ####   ##   ## ## ##  ##     ##     ##     ##     ##  ########
// ##         #########  ##    ##    ##   ##  ####  #########     ##     ##     ##  ##   ##
// ##         ##     ##  ##    ##    ##   ##   ###  ##     ##     ##     ##     ##  ##    ##
// ##         ##     ##   ######    ####  ##    ##  ##     ##     ##      #######   ##     ##

var createPaginatorTemplate = function () {
    return '' +
    '<div class="crud-paginator">' +
        '<ol class="crud-pages">' +
            '{{#pages}}' +
                '<li><a data-page-number="{{.}}" href="#">{{.}}</a></li>' +
            '{{/pages}}' +
        '</ol>' +
        '<form class="crud-goto-page-form">' +
            '<span class="number-of-pages">pages: {{numberOfPages}}</span>' +
            '<input type="text" name="goto-page" placeholder="page #"/>' +
            '<input type="submit" value="Go"/>' +
            '<div class="crud-help"></div>' +
        '</form>' +
    '</div>';
};

var serializeFormBySchema = function ($el, schema) {
    return map(schema, function (item, name) {
        var getValue = function (pseudo) {
            return $el.find('[name="' + name + '"]' + (pseudo || '')).val();
        };

        switch(item.type) {
            case 'radio':
                return getValue(':checked');
            case 'select':
                return getValue(' option:selected');
            case 'checkbox':
                var checked = [];
                $el.find('[name="' + name + '"]:checked').each(function () {
                    checked.push($(this).val());
                });
                return checked;
            default:
                return getValue();
        }
    });
};

//  ######    #######   ##    ##  ########  ########    #######   ##        ##        ########  ########
// ##    ##  ##     ##  ###   ##     ##     ##     ##  ##     ##  ##        ##        ##        ##     ##
// ##        ##     ##  ####  ##     ##     ##     ##  ##     ##  ##        ##        ##        ##     ##
// ##        ##     ##  ## ## ##     ##     ########   ##     ##  ##        ##        ######    ########
// ##        ##     ##  ##  ####     ##     ##   ##    ##     ##  ##        ##        ##        ##   ##
// ##    ##  ##     ##  ##   ###     ##     ##    ##   ##     ##  ##        ##        ##        ##    ##
//  ######    #######   ##    ##     ##     ##     ##   #######   ########  ########  ########  ##     ##

var createController = function (fig) {
    var that = mixinPubSub(),
        el = fig.el,
        render = function (isRenderError, data, errors, extra) {
            data = data || that.model.get();
            if(isRenderError) {
                errors = that.mapErrorData(union(that.model.validate(data), errors));
            }
            else {
                errors = {};
            }
            that.$().html(Mustache.render(that.template, union(
                that.mapModelToView(data), errors, (extra || {})
            )));
        };

    that.mapErrorData = function (errorData) {
        return map(errorData, identity, function (key) {
            return key + 'Help';
        });
    };

    that.mapSchema = function (schema) {
        return mapToObject(
            schema,
            function (item) {
                return filter(item, function (item, key) {
                    return key !== 'name';
                });
            },
            function (key, item) {
                return item.name;
            }
        );
    };

    that.schema = that.mapSchema(fig.schema);
    that.model = fig.model;
    that.template = fig.template;

    that.$ = function (selector) {
        return selector ? $(el).find(selector) : $(el);
    };

    that.mapModelToView = function (modelData, schema) {
        schema = schema || that.schema;
        var isSelected = function (choice, value, name) {
            var type = schema[name].type;
            return type === 'radio' || type === 'select' ?
                choice === value : value.indexOf(choice) !== -1;
        };

        var viewData = map(modelData, function (value, name) {
            var type = schema[name].type;
            if(type === 'checkbox' || type === 'select' || type === 'radio' ) {
                var mappedValue = {};
                foreach(schema[name].values, function (choiceObject) {
                    var choice = isObject(choiceObject) ? choiceObject.value : choiceObject;
                    if(isSelected(choice, value, name)) {
                        mappedValue[choice] = true;
                    }
                });
                return mappedValue;
            }
            else {
                return value;
            }
        });

        return viewData;
    };

    that.render = partial(render, true);
    that.renderNoError = partial(render, false);

    return that;
};

// ##        ####   ######   ########      ####  ########  ########  ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ###   ###
// ##         ##   ##           ##          ##      ##     ##        #### ####
// ##         ##    ######      ##          ##      ##     ######    ## ### ##
// ##         ##         ##     ##          ##      ##     ##        ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ##     ##
// ########  ####   ######      ##         ####     ##     ########  ##     ##

var createListItemController = function (fig) {
    fig = fig || {};
    fig.el = fig.el || '#crud-list-item-' + fig.model.id();
    var that = createController(fig);
    that.isSelected = function () {
        return that.$('.crud-list-selected').prop('checked') ? true : false;
    };

    //if value has an associated label then display that instead.
    var mapToValueLabels = function (name, value) {
        var item = that.schema[name];
        var mappedValue;
        foreach(that.schema[name].values, function (valueObject) {
            if(valueObject.value === value) {
                mappedValue = valueObject.label || valueObject.value;
            }
        });
        return mappedValue;
    };

    var parentMapModelToView = that.mapModelToView;
    that.mapModelToView = function (modelData) {
        return union(
            { id: that.model.id() },
            map(parentMapModelToView(modelData), function (value, itemName) {
                if(isObject(value)) {
                    return mapToArray(value, function (isSelected, name) {
                        return mapToValueLabels(itemName, name);
                    }).join(', ');
                }
                else {
                    return value;
                }
            })
        );
    };

    var parentRender = that.render;
    that.render = function (data) {
        parentRender(data);
        that.bindView();
    };

    that.select = function () {
        that.$().addClass('selected');
    };

    that.deselect = function () {
        that.$().removeClass('selected');
    };

    that.bindView = function () {
        that.$().hover(
            function () {
                that.$().addClass('hover');
            },
            function () {
                that.$().removeClass('hover');
            }
        );

        that.$().dblclick(function () {
            that.publish('selected', that);
        });

        that.publish('bind');
    };

    that.model.subscribe('saved', function (model) {
        that.render();
    });

    return that;
};

// ##        ####   ######   ########
// ##         ##   ##    ##     ##
// ##         ##   ##           ##
// ##         ##    ######      ##
// ##         ##         ##     ##
// ##         ##   ##    ##     ##
// ########  ####   ######      ##

var createListController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        items = [],
        modal = fig.modal,
        isIDOrderable = fig.isIDOrderable === true ? true : false,
        orderIcon = {
            ascending: '&#8679;',
            descending: '&#8681;',
            neutral: '&#8691;'
        },
        deleteConfirmationTemplate = fig.deleteConfirmationTemplate,

        openDeleteConfirmation = function () {
            modal.open($('.crud-delete-modal'));
            // $(".crud-delete-modal").modal({
            //     fadeDuration: 200,
            //     fadeDelay: 0,
            //     showClose: false
            // });
        },

        closeDeleteConfirmation = function () {
            modal.close($('.crud-delete-modal'));
            //$.modal.close();
        },

        bindDeleteConfirmation = function () {
            $('.crud-cancel-delete').unbind();
            $('.crud-confirm-delete').unbind();
            $('.crud-cancel-delete').click(closeDeleteConfirmation);
            $('.crud-confirm-delete').click(function () {
                foreach(items, function (listItemController) {
                    if(listItemController.isSelected()) {
                        listItemController.model.delete();
                    }
                });
                closeDeleteConfirmation();
            });
        },

        bind = function () {
            that.$('.crud-list-select-all').unbind();
            that.$('.crud-list-select-all').change(function () {
                that.$('.crud-list-selected').prop(
                    'checked', $(this).is(':checked')
                );
            });

            that.$('.crud-delete-selected').unbind();
            that.$('.crud-delete-selected').click(openDeleteConfirmation);


            that.$('.crud-list-selected').unbind();
            that.$('.crud-list-selected').change(function () {
                $('.crud-list-select-all').prop('checked', false);
            });

            that.$('.crud-order').unbind();
            that.$('.crud-order').click(function (e) {
                e.preventDefault();
                that.orderModel.toggle($(this).data('name'));
            });
            that.publish('bind');
        };

    $('body').prepend(Mustache.render(deleteConfirmationTemplate));
    bindDeleteConfirmation();

    that.orderModel = fig.orderModel;

    var parentRender = that.renderNoError;
    that.renderNoError = function () {
        var data = {
            orderable: union(
                { id: isIDOrderable },
                map(that.schema, partial(dot, 'orderable'))
            ),
            order: union(
                map(that.orderModel.get(), function (order, name) {
                    if(order === 'ascending') {
                        return { ascending: true };
                    }
                    else if(order === 'descending') {
                        return { descending: true };
                    }
                    else {
                        return { neutral: true };
                    }
                })
            ),
            orderIcon: orderIcon
        };

        that.$().html(Mustache.render(that.template, data));
    };

    that.renderItems = function () {
        var $container = that.$('.crud-list-item-container');
        $container.html('');
        foreach(items, function (item) {
            var elID = 'crud-list-item-' + item.model.id();
            $container.append('<tr id="' + elID + '"></tr>');
            item.render();
        });
        bind();
    };

    that.setSelected = function (selectedItemController) {
        foreach(items, function (itemController) {
            itemController.deselect();
        });
        if(selectedItemController) {
            selectedItemController.select();
        }
    };

    that.setSelectAll = function (isSelected) {
        $('.crud-list-select-all').prop('checked', isSelected);
    };

    that.add = function (itemController, options) {
        options = options || {};
        if(options.prepend === true) {
            items.unshift(itemController);
        }
        else {
            items.push(itemController);
        }
    };

    that.getItemControllerByID = function (id) {
        return filter(items, function (controller) {
            return controller.model.id() === id;
        })[0];
    };

    that.clear = function () {
        items = [];
    };

    that.remove = function (id) {
        items = filter(items, function (controller) {
            return controller.model.id() != id;
        });
    };

    //rerendering the whole template was a glitchy
    that.orderModel.subscribe('change', function (newData) {
        that.$('[data-name="' + keys(newData)[0] + '"]').html(
            '<span  crud-order-' + values(newData)[0] + '">' +
                orderIcon[values(newData)[0]] +
            '</span>'
        );
    });

    return that;
};

// ########      ###      ######    ####  ##    ##     ###     ########   #######   ########
// ##     ##    ## ##    ##    ##    ##   ###   ##    ## ##       ##     ##     ##  ##     ##
// ##     ##   ##   ##   ##          ##   ####  ##   ##   ##      ##     ##     ##  ##     ##
// ########   ##     ##  ##   ####   ##   ## ## ##  ##     ##     ##     ##     ##  ########
// ##         #########  ##    ##    ##   ##  ####  #########     ##     ##     ##  ##   ##
// ##         ##     ##  ##    ##    ##   ##   ###  ##     ##     ##     ##     ##  ##    ##
// ##         ##     ##   ######    ####  ##    ##  ##     ##     ##      #######   ##     ##

var createPaginatorController = function (fig) {
    fig = fig || {};
    var that = createController(fig);

    var bind = function () {
        that.$('li a').unbind();
        that.$('li a').click(function (e) {
            e.preventDefault();
            var pageNumber = Number($(this).data('page-number'));
            that.model.set({ pageNumber: pageNumber });
        });

        that.$('.crud-goto-page-form').unbind();
        that.$('.crud-goto-page-form').submit(function (e) {
            e.preventDefault();
            var $input = that.$('.crud-goto-page-form').find('[name="goto-page"]');
            var pageNumber = $input.val();
            if(isInteger(pageNumber)) {
                that.model.set({ pageNumber: Number(pageNumber) });
            }
            else {
                $input.val('');
            }
        });

        that.publish('bind');
    };

    that.setSelected = function (pageNumber) {
        that.$('li a').removeClass('selected');
        that.$('li a[data-page-number="' + pageNumber + '"]').addClass('selected');
    };

    that.render = function (pages) {
        pages = pages || that.calculatePageRange();
        var error = that.model.validate();
        that.$().html(Mustache.render(that.template, {
            pages: pages,
            numberOfPages: that.model.get('numberOfPages'),
            error: error
        }));
        that.setSelected(that.model.get('pageNumber'));
        bind();
    };

    that.setPage = function (pageNumber) {
        that.model.set({ pageNumber: pageNumber });
    };

    //determines how many page list items to render based on width of the list
    //template by default.
    that.calculatePageRange = (function () {
        var lastCalculation = 1;
        var testPageNumbers = [1, 12, 123, 1234, 12345, 123456, 1234567];
        var widths;

        var initHTMLWidths = function () {
            that.$().css({ visibility: 'hidden' });

            that.render(testPageNumbers);
            var $listItems = that.$('li');

            var gotoWidth = that.$('.crud-goto-page-form').width();

            widths = {
                digits: map(testPageNumbers, function (number, index) {
                    return $listItems.eq(index).width();
                }),
                container: that.$('.crud-pages').width() - gotoWidth - 5,
                goto: gotoWidth
            };

            that.render(lastCalculation);
            that.$().removeAttr('style');
        };

        var widthOfNumber = function (number) {
            return widths.digits[number.toString().length - 1];
        };

        var getPageNumbers = function (startingNumber, buffer, isAscending) {
            var pageNumber = startingNumber,
                accumulatedWidth = 0,
                numbers = [],
                advance = isAscending ? increment : decrement;

            while(accumulatedWidth < buffer) {
                pageNumber = advance(pageNumber);
                accumulatedWidth += widthOfNumber(pageNumber);
                numbers.push(pageNumber);
            }
            numbers.pop();
            return numbers;
        };

        // ex: [-2, -1, 0, 1, 2] -> [1, 2, 3, 4, 5]
        var rolloverNonPositives = function (array) {
            var shifted = [];
            foreach(reverse(array), function (number) {
                if(number <= 0) {
                    shifted.push(last(shifted) + 1);
                }
                else {
                    shifted.unshift(number);
                }
            });
            return shifted;
        };

        var fineTune = function (pagesSoFarInput) {
            var pagesSoFar = copy(pagesSoFarInput);
            var lengthSoFar = reduce(pagesSoFar, function (acc, pageNumber) {
                return (acc || 0) + widthOfNumber(pageNumber);
            });
            var gapLength = widths.container - lengthSoFar;
            var nextPage = last(pagesSoFar) + 1;
            if(
                gapLength > widthOfNumber(nextPage) &&
                nextPage <= that.model.get('numberOfPages')
            ) {
                pagesSoFar.push(nextPage);
            }
            else if(gapLength < 0) {
                pagesSoFar.pop();
            }
            return pagesSoFar;
        };

        return function () {
            initHTMLWidths();
            var currentPage = that.model.get('pageNumber');
            var bufferWidth = (widths.container - widthOfNumber(currentPage)) / 2;
            var pagesToRender = fineTune(filter(rolloverNonPositives(
                    reverse(getPageNumbers(currentPage, bufferWidth, false))
                    .concat([currentPage])
                    .concat(getPageNumbers(currentPage, bufferWidth, true))
                ),
                function (pageNumber) {
                    return pageNumber <= that.model.get('numberOfPages');
                }
            ));
            return pagesToRender;
        };
    }());

    that.model.subscribe('change', function (data) {
        that.render();
    });

    return that;
};

// ########  ####  ##        ########  ########  ########
// ##         ##   ##           ##     ##        ##     ##
// ##         ##   ##           ##     ##        ##     ##
// ######     ##   ##           ##     ######    ########
// ##         ##   ##           ##     ##        ##   ##
// ##         ##   ##           ##     ##        ##    ##
// ##        ####  ########     ##     ########  ##     ##

var createFilterController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        filterSchema = that.mapSchema(fig.filterSchema),
        isInstantFilter = fig.isInstantFilter,
        serialize = function () {
            return serializeFormBySchema(that.$(), filterSchema);
        };

    var parentMapModelToView = that.mapModelToView;

    var onFormChange = partial(debounce, 500, function () {
        that.model.set(serialize());
    });

    that.mapModelToView = function (modelData) {
        return parentMapModelToView(modelData, filterSchema);
    };

    that.renderNoError();

    if(isInstantFilter) {
        foreach(filterSchema, function (item, name) {
            var $elem = that.$('[name="' + name + '"]');
            switch(item.type) {
                case 'text':
                case 'password':
                case 'textarea':
                    //wait until end of timeout to execute
                    $elem.keyup(onFormChange(false));
                    break;
                case 'radio':
                case 'checkbox':
                case 'select':
                    //execute immediately
                    $elem.change(onFormChange(true));
                    break;
                default:
                    throw 'Invalid item type: ' + item.type;
            }
        });
    }

    that.$().submit(function (e) {
        e.preventDefault();
        that.model.set(serialize());
    });

    return that;
};

// ########   #######   ########   ##     ##
// ##        ##     ##  ##     ##  ###   ###
// ##        ##     ##  ##     ##  #### ####
// ######    ##     ##  ########   ## ### ##
// ##        ##     ##  ##   ##    ##     ##
// ##        ##     ##  ##    ##   ##     ##
// ##         #######   ##     ##  ##     ##

var createFormController = function (fig) {
    fig = fig || {};
    fig.model = fig.model || fig.createDefaultModel();

    var that = createController(fig),
        isOpen = false,
        modal = fig.modal;

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    that.open = function () {
        modal.open(that.$());
        // that.$().modal({
        //     fadeDuration: 200,
        //     fadeDelay: 0,
        //     showClose: false
        // });
    };

    that.close = function () {
        modal.close(that.$());
        //$.modal.close();
    };

    var bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize(), { validate: false });
            that.model.save();
        });

        that.$('.crud-close-form').unbind();
        that.$('.crud-close-form').click(function (e) {
            e.preventDefault();
            that.close();
        });

        that.publish('bind');
    };

    bind();

    var setNewModelVisibility = function () {
        if(that.model.isNew()) {
            that.$('*').removeClass('crud-status-edit');
            that.$('*').addClass('crud-status-create');
        }
        else {
            that.$('*').addClass('crud-status-edit');
            that.$('*').removeClass('crud-status-create');
        }
    };

    var parentRender = that.render;
    that.render = function (data, errors) {
        parentRender(data, errors, {
            status: (that.model.isNew() ? 'Create' : 'Edit')
        });
        setNewModelVisibility();
        bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data) {
        parentRenderNoError(data, undefined, {
            status: (that.model.isNew() ? 'Create' : 'Edit')
        });
        that.$('.crud-new-item').hide();
        setNewModelVisibility();
        bind();
    };

    that.setModel = (function () {
        var savedCallback = function () {
            setNewModelVisibility();
            that.close();
        };
        var changeCallback = function (model) {
            that.render();
        };
        var errorCallback = function (errors) {
            that.render(that.model.get(), errors);
        };

        return function (newModel) {
            that.model.unsubscribe(changeCallback);
            that.model.unsubscribe(savedCallback);
            that.model.unsubscribe(errorCallback);
            newModel.subscribe('change', changeCallback);
            newModel.subscribe('saved', savedCallback);
            newModel.subscribe('error', errorCallback);
            that.model = newModel;
            if(newModel.isNew()) {
                that.renderNoError();
            }
            else {
                that.render();
            }
        };
    }());

    return that;
};

this.createCRUD = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        name = fig.name,
        id = fig.id || false,
        isInstantFilter = fig.instantFilter || false,
        readOnly = fig.readOnly || false,
        deletable = readOnly ? false : (fig.deletable === false ? false : true),

        modal = fig.modal || {
            open: function ($elem) {
                $elem.modal({
                    fadeDuration: 200,
                    fadeDelay: 0,
                    showClose: false
                });
            },
            close: function ($elem) {
                //this particular implementation doesnt use
                //$elem here, but others might
                $.modal.close();
            }
        },

        setEmptyCheckboxes = function (item) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item;
        },

        mapSchema = function (schema) {
            return map(schema, function (itemRef) {
                var item = copy(itemRef);
                switch(item.type) {
                    case 'radio':
                    case 'checkbox':
                    case 'select':
                        item.values = map(item.values, partial(dot, 'value'));
                        break;
                }
                return item;
            });
        },

        viewSchema = map(fig.schema, setEmptyCheckboxes),
        viewFilterSchema = map(fig.filterSchema, setEmptyCheckboxes),

        schema = mapSchema(viewSchema),
        filterSchema = mapSchema(viewFilterSchema),


        validate = fig.validate,
        createDefaultModel = function (data, id) {
            return createSchemaModel({
                id: id,
                url: url,
                data: data || mapToObject(
                    schema,
                    function (item) {
                        return item.value || null;
                    },
                    function (key, item) {
                        return item.name;
                    }
                ),
                validate: validate
            });
        };



    var selectedCallback = function (itemController) {
        listController.setSelected(itemController);
        if(!readOnly) {
            formController.open();
            setForm(itemController.model);
        }
    };

    var addItem = function (model, options) {
        options = options || {};
        var itemController = createListItemController({
            model: model,
            // schema: schema,
            schema: viewSchema,
            template: listItemTemplate
        });
        itemController.subscribe('selected', selectedCallback);
        listController.add(itemController, options);
        listController.setSelected(itemController);
        bindModel(model);
        return itemController;
    };

    var setCRUDList = function (rows) {
        listController.clear();
        foreach(rows, function (row) {
            var id = row.id;
            delete row.id;
            addItem(createDefaultModel(row, id));
            listController.setSelected();
        });
        listController.renderItems();
    };

    var load = (function () {
        var isFirstLoad = true;
        return function (response) {
            setCRUDList(response.data);
            paginatorController.model.set({ numberOfPages: response.pages });
            if(isFirstLoad) {
                paginatorController.render();
                isFirstLoad = false;
            }
        };
    }());

    var createBindPublish = function (controller, moduleName) {
        return partial(that.publish, 'bind:' + moduleName, controller.$);
    };

    var subscribeWaitingPublish = function (model, moduleName) {
        model.subscribe(
            moduleName + ':waiting:start',
            partial(that.publish, moduleName + ':waiting:start')
        );
        model.subscribe(
            moduleName + ':waiting:end',
            partial(that.publish, moduleName + ':waiting:end')
        );
    };

    var bindModel = function (model) {
        model.subscribe('saved', function (wasNew) {
            if(wasNew) {
                var itemController = addItem(model, { prepend: true });
                listController.renderItems();
                listController.setSelected(itemController);
            }
        });

        model.subscribe('destroyed', function (id) {
            listController.remove(id);
            listController.setSelectAll(false);
            listController.renderItems();
            newItem();
        });

        subscribeWaitingPublish(model, 'form');

        return model;
    };

    var setForm = function (model) {
        formController.setModel(model);
    };

    var newItem = function () {
        var defaultModel = createDefaultModel();
        if(!readOnly) {
            setForm(defaultModel);
        }
        bindModel(defaultModel);
    };






    var listTemplate = fig.createListTemplate ?
        fig.createListTemplate.apply({
            schema: schema,
            name: name,
            id: id,
            deletable: deletable,
            orderable: orderable,
            uniqueID: generateUniqueID
        }) : createListTemplate(viewSchema, name, id, deletable);

    var listItemTemplate = fig.createListItemTemplate ?
        fig.createListItemTemplate.apply({
            schema: viewSchema,
            id: id,
            deletable: deletable
        }) : createListItemTemplate(viewSchema, id, deletable);

    var paginatorTemplate = fig.createPaginatorTemplate ?
        fig.createPaginatorTemplate() : createPaginatorTemplate();

    var deleteConfirmationTemplate = fig.createDeleteConfirmationTemplate ?
        fig.createDeleteConfirmationTemplate() : createDeleteConfirmationTemplate();




    var requestModel = createRequestModel();

    var paginatorModel = createPaginatorModel({ requestModel: requestModel });

    var orderModel = createOrderModel({
        data: map(
            union({ id: id }, filter(
                mapToObject(
                    schema,
                    identity,
                    function (key, item) {
                        return item.name;
                    }
                ),
                partial(dot, 'orderable')
            )),
            function (item, name) {
                return item.order || 'neutral';
            }
        ),
        requestModel: requestModel
    });



    var paginatorController = createPaginatorController({
        el: '#' + name + '-crud-paginator-nav',
        model: paginatorModel,
        template: paginatorTemplate
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        modal: modal,
        isIDOrderable: id && id.orderable ? true : false,
        model: createDefaultModel(),
        orderModel: orderModel,
        createModel: createDefaultModel,
        template: listTemplate,
        deleteConfirmationTemplate: deleteConfirmationTemplate
    });




    var filterTemplate, filterModel, filterController;
    if(fig.filterSchema) {
        filterTemplate = fig.createFilterTemplate ?
            fig.createFilterTemplate.apply({
                filterSchema: viewFilterSchema,
                name: name,
                createInput: createInput,
                isInstantFilter: isInstantFilter,
                uniqueID: generateUniqueID
            }) : createFilterTemplate(viewFilterSchema, name, isInstantFilter);

        filterModel = createFilterModel({
            requestModel: requestModel,
            data: mapToObject(
                filterSchema,
                function (item) {
                    if(item.type === 'checkbox') {
                        item.value = item.value || [];
                    }
                    return item.value === undefined ? null : item.value;
                },
                function (key, item) {
                    return item.name;
                }
            )
        });

        filterController = createFilterController({
            el: '#' + name + '-crud-filter-container',
            model: filterModel,
            //filterSchema: filterSchema,
            filterSchema: viewFilterSchema,

            isInstantFilter: isInstantFilter,
            template: filterTemplate
        });

        filterModel.subscribe('change', newItem);
        filterController.subscribe('bind', createBindPublish(filterController, 'filter'));
    }



    var formTemplate, formController;
    if(!readOnly) {

        // $('body').prepend(
        //     '<div id="' + name + '-crud-container" class="crud-form-modal modal"></div>'
        // );

        $('#' + name + '-crud-new').html(
            fig.newButtonHTML || '<button>Create New ' + name + '</button>'
        );

        $('#' + name + '-crud-new').find('button').click(function () {
            newItem();
            formController.publish('new');
            formController.open();
        });

        formTemplate = fig.createFormTemplate ?
            fig.createFormTemplate.apply({
                schema: viewSchema,
                name: name,
                createInput: createInput,
                uniqueID: generateUniqueID
            }) : createFormTemplate(viewSchema, name);

        formController = createFormController({
            el: '#' + name + '-crud-container',
            schema: schema,
            modal: modal,
            createDefaultModel: function() {
                return bindModel(createDefaultModel());
            },
            template: formTemplate
        });

        formController.subscribe('new', function () {
            listController.setSelected();
        });

        formController.subscribe('bind', createBindPublish(formController, 'form'));

        paginatorModel.subscribe('change', newItem);
    }



    requestModel.init({
        url: url,
        paginatorModel: paginatorModel,
        filterModel: filterModel,
        orderModel: orderModel
    });

    listController.renderNoError();

    listController.subscribe('bind', createBindPublish(listController, 'list'));
    paginatorController.subscribe('bind', createBindPublish(paginatorController, 'paginator'));

    requestModel.subscribe('load', load);

    subscribeWaitingPublish(requestModel, 'filter');
    subscribeWaitingPublish(requestModel, 'order');
    subscribeWaitingPublish(requestModel, 'paginator');

    //kicks off an ajax load event, rendering the paginator, list items, and form
    paginatorController.setPage(1);

    return that;
};

}).call(this);
