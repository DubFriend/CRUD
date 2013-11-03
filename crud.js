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
        key = keyCallback ? keyCallback(key) : key;
        mapped[key] = callback(value, key, coll);
    });
    return mapped;
};

var appendKey = function (appendingString, collection) {
    collection = collection || {};
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
        ajax = fig.ajax || function (fig) {
            $.ajax({
                url: that.isNew() ? my.url : my.url + '/' + that.id(),
                method: fig.method,
                data: fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(my.data) : my.data,
                dataType: 'json',
                success: fig.success,
                error: partial(ajaxErrorResponse, that)
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
                    that.clear();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.clear();
            that.publish('change', that);
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
            requestModel.changePage(newData.pageNumber);
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

    that.set = partial(that.set, requestModel.search);

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

    that.set = partial(that.set, requestModel.search);

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
                    appendKey('filter_', filterModel.get()),
                    appendKey('order_', orderModel.get())
                ),
                dataType: 'json',
                success: partial(that.publish, 'load'),
                error: partial(ajaxErrorResponse, that)
            });
        };

    that.init = function (fig) {
        url = fig.url;
        paginatorModel = fig.paginatorModel;
        filterModel = fig.filterModel;
        orderModel = fig.orderModel;
    };

    that.changePage = function (pageNumber) {
        ajax({ page: pageNumber });
    };

    that.search = function () {
        paginatorModel.set({ pageNumber: 1 }, { silent: true });
        ajax();
    };

    return that;
};
var createInput = function (item, name, crudName) {

    var ID = generateUniqueID() + '-';

    var input = function (checked, value, isInputClass) {
        isInputClass = isInputClass === undefined ? true : isInputClass;
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
        (isInputClass ? '<div class="input">' : '') +
            '<input type="' + item.type + '" ' + id() +
                    'name="' + name + '" ' + valueHTML() +
                    (checked ? 'checked' : '') + '/>' +
        (isInputClass ? '</div>' : '');
    };

    var inputGroup = function () {
        return '' +
        '<div class="input">' +
            reduce(item.values, function (acc, value) {
                return (acc || '') +
                '<label for="' + ID + name + '-' + value + '">' +
                    value +
                '</label>' +
                '{{#' + name + '.' + value + '}}' +
                    input(true, value, false) +
                '{{/' + name + '.' + value + '}}' +
                '{{^' + name + '.' + value + '}}' +
                    input(false, value, false) +
                '{{/' + name + '.' + value + '}}';
            }) +
        '</div>';
    };

    switch(item.type) {
        case 'text':
            return input();

        case 'password':
            return input();

        case 'textarea':
            return '' +
            '<div class="input">' +
                '<textarea id="' + ID + crudName + '-' + name + '" ' +
                          'name="' + name + '">' +
                    '{{' + name + '}}' +
                '</textarea>' +
            '</div>';

        case 'checkbox':
            return inputGroup();

        case 'radio':
            return inputGroup();

        case 'select':
            return '' +
            '<div class="input">' +
                '<select name="' + name + '">' +
                    reduce(item.values, function (acc, value) {
                        acc = acc || '';
                        return acc +
                        '{{#' + name + '.' + value + '}}' +
                            '<option value="' + value + '" selected>' +
                                value +
                            '</option>' +
                        '{{/' + name + '.' + value + '}}' +
                        '{{^' + name + '.' + value + '}}' +
                            '<option value="' + value + '">' +
                                value +
                            '</option>' +
                        '{{/' + name + '.' + value + '}}';
                    }) +
                '</select>' +
            '</div>';

        default:
            throw 'Invalid input type: ' + item.type;
    }
};

var reduceFormSchema = function (schema, crudName) {
    return reduce(schema, function (acc, item, name) {
        return (acc || '') +
        '<div class="control-set">' +
            '<label for="' + crudName + '-' + name + '" class="label">' +
                name +
            '</label>' +
            createInput(item, name, crudName) +
            '<div class="crud-help">{{' + name + 'Help}}</div>' +
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
            reduceFormSchema(schema, crudName) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" class="js-crud-save" value="Save"/>' +
                    '<button id="crud-new-item" type="button">' +
                        'New ' + crudName +
                    '</button>' +
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


var createFilterTemplate = function (schema, crudName) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>Search ' + crudName + '</legend>' +
            reduceFormSchema(schema, crudName) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" class="js-crud-filter" value="Search"/>' +
                '</div>' +
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

var createListItemTemplate = function (schema, crudName) {
    return '' +
    '<td><input type="checkbox" class="crud-list-selected"/></td>' +
    reduce(schema, function (acc, item, name) {
        return (acc || '') +
        '<td class="crud-list-item-column" name="' + name + '">{{' + name + '}}</td>';
    });
};

// ##        ####   ######   ########
// ##         ##   ##    ##     ##
// ##         ##   ##           ##
// ##         ##    ######      ##
// ##         ##         ##     ##
// ##         ##   ##    ##     ##
// ########  ####   ######      ##

var createListTemplate = function (schema, crudName) {
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                '<th>' +
                    '<label for="crud-list-select-all">All</label>' +
                    '<input type="checkbox" id="crud-list-select-all"/>' +
                '</th>' +
                reduce(schema, function (acc, item, name) {
                    return (acc || '') +
                    '<th>' +
                        '{{#orderable.' + name + '}}' +
                            '<a href="#" data-name="' + name + '" class="crud-order">' +
                                '{{#order.' + name + '.ascending}}' +
                                    '<span  crud-order-ascending">' +
                                        '{{{orderIcon.ascending}}}' +
                                    '</span>' +
                                '{{/order.' + name + '.ascending}}' +

                                '{{#order.' + name + '.descending}}' +
                                    '<span class="crud-order-descending">' +
                                        '{{{orderIcon.descending}}}' +
                                    '</span>' +
                                '{{/order.' + name + '.descending}}' +

                                '{{#order.' + name + '.neutral}}' +
                                    '<span class="crud-order-neutral">' +
                                        '{{{orderIcon.neutral}}}' +
                                    '</span>' +
                                '{{/order.' + name + '.neutral}}' +
                            '</a>' +
                        '{{/orderable.' + name + '}}' +
                        '<span class="crud-th-content">' +
                            name +
                        '</span>' +
                    '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody id="crud-list-item-container"></tbody>' +
    '</table>' +
    '<button id="crud-delete-selected">Delete Selected</button>';
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
                '<li><a data-page-number="{{.}}" href="#/page/{{.}}">{{.}}</a></li>' +
            '{{/pages}}' +
        '</ol>' +
        '<form class="crud-goto-page-form">' +
            '<input type="text" name="goto-page" id="crud-goto-page" placeholder="page #"/>' +
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
    var that = {},
        el = fig.el,
        render = function (isRenderError, data, errors) {
            data = data || that.model.get();
            if(isRenderError) {
                errors = that.mapErrorData(union(that.model.validate(data), errors));
            }
            else {
                errors = {};
            }
            that.$().html(Mustache.render(that.template, union(
                that.mapModelToView(data), errors
            )));
        };

    that.mapErrorData = function (errorData) {
        return map(errorData, identity, function (key) {
            return key + 'Help';
        });
    };

    that.schema = fig.schema;
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
                foreach(schema[name].values, function (choice) {
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
    var that = mixinPubSub(createController(fig));

    that.isSelected = function () {
        return that.$('.crud-list-selected').prop('checked') ? true : false;
    };

    var parentMapModelToView = that.mapModelToView;
    that.mapModelToView = function (modelData) {
        return map(parentMapModelToView(modelData), function (value, name) {
            if(isObject(value)) {
                return mapToArray(value, function (isSelected, name) {
                    return name;
                }).join(', ');
            }
            else {
                return value;
            }
        });
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
        that.$('.crud-list-item-column').hover(
            function () {
                that.$().addClass('hover');
            },
            function () {
                that.$().removeClass('hover');
            }
        );

        that.$('.crud-list-item-column').click(function () {
            that.publish('selected', that);
        });
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
    var that = mixinPubSub(createController(fig)),
        items = [],
        orderIcon = {
            ascending: '&#8679;',
            descending: '&#8681;',
            neutral: '&#8691;'
        },

        bind = function () {
            that.$('#crud-list-select-all').unbind();
            that.$('#crud-list-select-all').change(function () {
                that.$('.crud-list-selected').prop(
                    'checked', $(this).is(':checked')
                );
            });

            that.$('#crud-delete-selected').unbind();
            that.$('#crud-delete-selected').click(function (e) {
                e.preventDefault();
                foreach(items, function (listItemController) {
                    if(listItemController.isSelected()) {
                        listItemController.model.delete();
                    }
                });
            });

            that.$('.crud-list-selected').unbind();
            that.$('.crud-list-selected').change(function () {
                $('#crud-list-select-all').prop('checked', false);
            });

            that.$('.crud-order').unbind();
            that.$('.crud-order').click(function () {
                that.orderModel.toggle($(this).data('name'));
            });
        };

    that.orderModel = fig.orderModel;

    var parentRender = that.renderNoError;
    that.renderNoError = function () {
        that.$().html(Mustache.render(that.template, {
            orderable: map(that.schema, partial(dot, 'orderable')),
            order: map(that.orderModel.get(), function (order, name) {
                if(order === 'ascending') {
                    return { ascending: true };
                }
                else if(order === 'descending') {
                    return { descending: true };
                }
                else {
                    return { neutral: true };
                }
            }),
            orderIcon: orderIcon
        }));
    };

    that.renderItems = function () {
        var $container = that.$('#crud-list-item-container');
        $container.html('');
        foreach(items, function (item) {
            var elID = 'crud-list-item-' + item.model.id();
            $container.append(
                '<tr id="' + elID + '" ' + 'class="list-item"></tr>'
            );
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
        $('#crud-list-select-all').prop('checked', isSelected);
    };

    that.add = function (itemController) {
        items.push(itemController);
        //that.renderItems();
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
        //that.renderItems();
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
        that.$('li a').click(function () {
            var pageNumber = Number($(this).data('page-number'));
            that.model.set({ pageNumber: pageNumber });
        });
    };

    that.setSelected = function (pageNumber) {
        that.$('li a').removeClass('selected');
        that.$('li a').each(function () {
            if(Number($(this).data('page-number')) === pageNumber) {
                $(this).addClass('selected');
            }
        });
    };

    that.render = function (pages) {
        pages = pages || that.calculatePageRange();
        var error = that.model.validate();
        that.$().html(Mustache.render(that.template, {
            pages: pages,
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

        return function () {
            initHTMLWidths();
            var currentPage = that.model.get('pageNumber');
            var bufferWidth = (widths.container - widthOfNumber(currentPage)) / 2;
            var pagesToRender = filter(rolloverNonPositives(
                    reverse(getPageNumbers(currentPage, bufferWidth, false))
                    .concat([currentPage])
                    .concat(getPageNumbers(currentPage, bufferWidth, true))
                ),
                function (pageNumber) {
                    return pageNumber <= that.model.get('numberOfPages');
                }
            );
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
    var that = mixinPubSub(createController(fig)),
        filterSchema = fig.filterSchema,
        serialize = function () {
            return serializeFormBySchema(that.$(), filterSchema);
        };

    var parentMapModelToView = that.mapModelToView;
    that.mapModelToView = function (modelData) {
        return parentMapModelToView(modelData, filterSchema);
    };

    that.renderNoError();
    that.$().submit(function (e) {
        e.preventDefault();
        console.log('serialize', serialize());
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
    var that = mixinPubSub(createController(fig));

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    var bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize());
            that.model.save();
        });

        $('#crud-new-item').unbind();
        $('#crud-new-item').click(function () {
            that.setModel(fig.createDefaultModel());
            that.publish('new');
        });
    };

    bind();

    var setNewModelButtonVisibility = function () {
        var $newItemButton = that.$('#crud-new-item');
        if(that.model.isNew() && !$newItemButton.is(':hidden')) {
            $newItemButton.hide();
        }
        else if(!that.model.isNew() && $newItemButton.is(':hidden')) {
            $newItemButton.show();
        }
    };

    var parentRender = that.render;
    that.render = function (data, errors) {
        parentRender(data, errors);
        setNewModelButtonVisibility();
        bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data) {
        parentRenderNoError(data);
        that.$('#crud-new-item').hide();
        setNewModelButtonVisibility();
        bind();
    };

    that.setModel = (function () {
        var savedCallback = setNewModelButtonVisibility;
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

    that.setModel(that.model);

    return that;
};

this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        url = fig.url,
        name = fig.name,
        setEmptyCheckboxes = function (item) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item;
        },
        schema = map(fig.schema, setEmptyCheckboxes),
        filterSchema = map(fig.filterSchema, setEmptyCheckboxes),
        validate = fig.validate,
        createDefaultModel = function (data, id) {
            return createSchemaModel({
                id: id,
                url: url,
                data: data || map(schema, function (item) {
                    return item.value || null;
                }),
                validate: validate
            });
        };


    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.listItemTemplate = fig.listItemTemplate || createListItemTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);
    that.paginatorTemplate = fig.paginatorTemplate || createPaginatorTemplate();
    that.filterTemplate = fig.filterTemplate || createFilterTemplate(filterSchema, name);

    var requestModel = createRequestModel();

    var paginatorModel = createPaginatorModel({
        requestModel: requestModel
    });

    var filterModel = createFilterModel({
        requestModel: requestModel,
        data: map(filterSchema, function (item, name) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item.value === undefined ? null : item.value;
        })
    });

    var filterController = createFilterController({
        el: '#' + name + '-crud-filter-container',
        model: filterModel,
        filterSchema: filterSchema,
        template: that.filterTemplate
    });

    var paginatorController = createPaginatorController({
        el: '#' + name + '-crud-paginator-nav',
        model: paginatorModel,
        template: that.paginatorTemplate
    });
    paginatorController.render();

    var orderModel = createOrderModel({
        data: map(filter(schema, partial(dot, 'orderable')), function (item, name) {
            return item.order || 'neutral';
        }),
        requestModel: requestModel
    });

    requestModel.init({
        url: url,
        paginatorModel: paginatorModel,
        filterModel: filterModel,
        orderModel: orderModel
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        model: createDefaultModel(),
        orderModel: orderModel,
        createModel: createDefaultModel,
        template: that.listTemplate
    });
    listController.renderNoError();

    var bindModel = function (model) {
        model.subscribe('saved', function (wasNew) {
            if(wasNew) {
                addItem(model);
                listController.renderItems();
            }
        });

        model.subscribe('destroyed', function (id) {
            console.log('destroyed', id);
            listController.remove(id);
            listController.setSelectAll(false);
            listController.renderItems();
        });

        return model;
    };

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        createDefaultModel: function() {
            return bindModel(createDefaultModel());
        },
        template: that.formTemplate
    });

    formController.subscribe('new', function () {
        listController.setSelected();
    });

    var setForm = function (model) {
        formController.setModel(model);
    };

    var selectedCallback = function (itemController) {
        listController.setSelected(itemController);
        setForm(itemController.model);
    };

    var addItem = function (model) {
        var itemController = createListItemController({
            model: model,
            schema: schema,
            template: that.listItemTemplate
        });
        itemController.subscribe('selected', selectedCallback);
        listController.add(itemController);
        listController.setSelected(itemController);
        bindModel(model);
    };


    that.newItem = function () {
        var defaultModel = createDefaultModel();
        setForm(defaultModel);
        bindModel(defaultModel);
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

    var load = function (response) {
        console.log('load', response);
        setCRUDList(response.data);
        paginatorController.model.set({ numberOfPages: response.pages });
    };

    that.init = function () {
        that.newItem();
        requestModel.subscribe('load', load);
        paginatorController.setPage(1);
    };

    return that;
};

}).call(this);
