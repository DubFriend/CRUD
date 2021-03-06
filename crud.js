// crud version 0.4.0
// (MIT) 16-02-2014
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
    return $.isArray(value);
};

var isObject = function (value) {
    return !isArray(value) && (value !== null && typeof value === 'object');
    // return !isArray(value) && (value instanceof Object);
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
    return $.extend(true, {}, object);
    // return JSON.parse(JSON.stringify(object));
};

var shallowCopy = function (objects) {
    return map(objects, identity);
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
    var united = {}, i, object;
    for(i = 0; i < arguments.length; i += 1) {
        object = arguments[i];
        foreach(object, function (value, key) {
            united[key] = value;
        });
    }
    return united;
};

var subSet = function (object, subsetKeys) {
    return filter(object, function (value, key) {
        return subsetKeys.indexOf(key) !== -1;
    });
};

var excludedSet = function (object, excludedKeys) {
    return filter(object, function (value, key) {
        return excludedKeys.indexOf(key) === -1;
    });
};

var remove = function (collection, item) {
    return filter(collection, function (element) {
        return element !== item;
    });
};

//execute callback immediately and at most one time on the minimumInterval,
//ignore block attempts
var throttle = function (minimumInterval, callback) {
    var timeout = null;
    return function () {
        var that = this, args = arguments;
        if(timeout === null) {
            timeout = setTimeout(function () {
                timeout = null;
            }, minimumInterval);
            callback.apply(that, args);
        }
    };
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
            var index = $.inArray(callback, subscribers);
            // var index = subscribers.indexOf(callback);
            if(index !== -1) {
                subscribers.splice(index, 1);
            }
        });
    };

    return object;
};


// queryjs
// https://github.com/DubFriend/queryjs
// MIT License 2014 Brian Detering
var queryjs = (function () {
    'use strict';

    var queryjs = {};

    var extend = union;

    // var foreach = function (object, callback) {
    //     var key;
    //     for(key in object) {
    //         if(object.hasOwnProperty(key)) {
    //             callback(object[key], key, object);
    //         }
    //     }
    // };

    // var extend = function () {
    //     var united = {};
    //     foreach(arguments, function (object, key) {
    //         foreach(object, function (value, key) {
    //             united[key] = value;
    //         });
    //     });
    //     return united;
    // };

    var parse = function (url) {
        var domain = '', hash = '';
        var getParameterStrings = function () {
            var isHash = url.indexOf('#') !== -1,
                isQuery = url.indexOf('?') !== -1,
                queryString = '';

            if(isQuery) {
                queryString = url.split('?')[1] || '';
                if(isHash) {
                    queryString = queryString.split('#')[0] || '';
                }
            }

            if(isQuery) {
                domain = url.split('?')[0] || '';
            }
            else if (isHash) {
                domain = url.split('#')[0] || '';
            }
            else {
                domain = url;
            }

            if(isHash) {
                hash = url.split('#')[1] || '';
            }

            return queryString ? queryString.split('&') : [];
        };

        var parameterStrings = getParameterStrings(url),
            params = {},
            key, value, i;

        for(i = 0; i < parameterStrings.length; i += 1) {
            key = parameterStrings[i].split('=')[0];
            value = parameterStrings[i].split('=')[1];
            params[key] = value;
        }

        return {
            url: domain || '',
            hash: hash || '',
            parameters: params
        };
    };

    var stringify = function (parsed) {
        var key, parameterStrings = [];

        foreach(parsed.parameters, function (value, key) {
            parameterStrings.push(key + '=' + parsed.parameters[key]);
        });

        return parsed.url +
            (parameterStrings.length > 0 ?
                '?' + parameterStrings.join('&') : '') +
            (parsed.hash ? '#' + parsed.hash : '');
    };

    queryjs.get = function (url) {
        return parse(url).parameters;
    };

    queryjs.set = function (url, params) {
        var parsed = parse(url);
        parsed.parameters = extend(parsed.parameters, params);
        return stringify(parsed);
    };

    return queryjs;

}());


if (typeof console === "undefined"){
    console={};
    console.warn = function () {};
}

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

var createSchemaModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        id = fig.id,
        deletable = fig.deletable,

        isSoftREST = fig.isSoftREST,

        ajax = fig.ajax || function (fig) {


            // var url = that.isNew() ? my.url : my.url + '/' + that.id(),
            var url = that.isNew() ? my.url : queryjs.set(my.url, { id: that.id() }),
                method, data;

            if(isSoftREST) {
                // url += '?method=' + fig.method;
                url = queryjs.set(url, { method: fig.method });
                method = 'POST';
                data = my.data;
            }
            else {
                method = fig.method;
                data = fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(my.data) : my.data;
            }

            // console.log('method: ', method, ' url: ', url);




            $.ajax({
                url: url,
                method: method,
                data: data,

                cache: false,

                dataType: fig.dataType || 'json',
                beforeSend: partial(that.publish, 'form:waiting:start'),
                success: fig.success,
                error: fig.error || partial(ajaxErrorResponse, that),
                complete: fig.complete || partial(that.publish, 'form:waiting:end')
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
        // console.log('errors', keys(errors));
        if(isEmpty(errors)) {
            ajax({
                // url: that.isNew() ? my.url : my.url + '/' + id,
                url: that.isNew() ? my.url : queryjs.set(my.url, { id: id }),
                method: that.isNew() ? 'POST' : 'PUT',
                data: my.data,
                success: function (response) {
                    // console.log('saved', response);
                    var wasNew = that.isNew();
                    id = that.isNew() ? response : id;
                    that.publish('saved', wasNew);
                },
                error: function (jqXHR, text) {
                    console.log('error: ', text);
                    ajaxErrorResponse(that, jqXHR);
                }
            });
        }
        else {
            that.publish('error', errors);
        }
    };

    // that.delete = function () {
    that["delete"] = function () {
        if(!that.isNew()) {
            ajax({
                // url: my.url + '/' + id,
                url: queryjs.set(my.url, { id: id }),

                method: 'DELETE',
                success: function (response) {
                    var id = that.id();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.publish('destroyed');
            that.clear();
        }
    };

    return that;
};

var createRequestModel = function () {
    var that = mixinPubSub(),
        url,
        paginatorModel,
        orderModel,
        filterModel,
        ajax = function (fig) {
            fig = fig || {};
            // console.log('url', queryjs.set(url, { page: fig.page || 1 }));
            $.ajax({
                // url: url + '/page/' + (fig.page || 1),
                url: queryjs.set(url, { page: fig.page || 1 }),
                cache: false,
                method: 'GET',
                data: union(
                    (filterModel ? appendKey('filter_', filterModel.get()) : {}),
                    appendKey('order_', orderModel.get())
                ),
                dataType: 'json',
                beforeSend: partial(that.publish, fig.moduleName + ':waiting:start'),
                success: function (response) {
                    partial(that.publish, 'load')(response);
                },
                error: partial(ajaxErrorResponse, that),
                complete: partial(that.publish, fig.moduleName + ':waiting:end')
            });
        };



    that.init = function (fig) {
        url = fig.url;
        paginatorModel = fig.paginatorModel;
        filterModel = fig.filterModel;
        orderModel = fig.orderModel;
        // console.log('url', url);
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
var createFilterModel = function (fig) {
    fig = fig || {};
    var my = {},
        that = createModel(fig, my),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'filter'));

    return that;
};

var createOrderModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        orderings = copy(fig.data),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'order'));

    that.toggle = (function () {
        var toggleOrder = ['neutral', 'ascending', 'descending'];
        return function (name) {
            // var currentIndex = toggleOrder.indexOf(my.data[name]);
            var currentIndex = $.inArray(my.data[name], toggleOrder);
            var newIndex = (currentIndex + 1) % toggleOrder.length;
            var newData = {};
            newData[name] = toggleOrder[newIndex];

            if(newData[name] !== 'neutral') {
                that.set(union(map(orderings, function () {
                    return 'neutral';
                }), newData));
            }
            else {
                that.set(newData);
            }
        };
    }());

    return that;
};
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

var createForminatorModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my);

    that.set = partial(that.set, function () {});

    that.submit = function (action) {

        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            $.ajax({
                url: my.url,
                method: action.method || 'POST',
                data: my.data,
                dataType: 'json',
                beforeSend: function () {
                    that.publish('waiting:start');
                    action.beforeSend();
                },
                success: function (response) {
                    that.publish('posted', response);
                    action.success(response);
                },
                error: function (jqXHR) {
                    ajaxErrorResponse(that, jqXHR);
                    action.error(jqXHR);
                },
                complete: function (jqXHR) {
                    that.publish('waiting:end', jqXHR);
                    action.complete(jqXHR);
                }
            });
        }
        that.publish('error', errors);
    };

    return that;
};

var createInput = function (fig) {

    var item = fig.item;
    var name = item.name;
    var crudName = fig.name;
    var className = fig["class"] || '';
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
                    "class": 'foo'
                }) +
            '</div>' +
            '<div class="crud-help">{{' + item.name + 'Help}}</div>' +
        '</div>';
    });
};

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

var createFilterTemplate = function (schema, crudName, isInstantFilter, crudLabel) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>Search ' + crudLabel + '</legend>' +
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

var createFormTemplate = function (schema, crudName, crudLabel) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudLabel + '</legend>' +
            '<span class="crud-status">{{status}}</span>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    '<input type="submit" value="Save"/>' +
                    '<button class="crud-close-form">Close</button>' +
                '</div>' +
                '<div class="crud-help">{{GLOBALHelp}}</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};

var createFormListTemplate = function (schema, crudName, deletable, saveAll, crudLabel) {
    return '' +
    //each form list template gets its own delete confirmation template
    createDeleteConfirmationTemplate() +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudLabel + '</legend>' +
            '<span class="crud-status">{{status}}</span>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    (saveAll ? '' : '<input type="submit" value="Save"/>') +
                    (deletable ? '<button class="crud-delete">Delete</button>' : '') +
                '</div>' +
                '<div class="success">' +
                    '{{successMessage}}' +
                '</div>' +
                '<div class="crud-help">{{GLOBALHelp}}</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};

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

var createListTemplate = function (schema, crudName, id, deletable, readOnly) {
    var ID = generateUniqueID();
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                (
                    !readOnly  ?
                    '<th>' +
                        (
                            deletable ?
                            '<label for="' + ID + '-crud-list-select-all">All</label>' +
                            '<input type="checkbox" id="' + ID + '-crud-list-select-all" ' +
                               'class="crud-list-select-all"/>': ''
                        ) +
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

var createListItemTemplate = function (schema, id, deletable, readOnly) {
    return '' +
    (
        !readOnly ?
        '<td>' +
            (deletable ? '<input type="checkbox" class="crud-list-selected"/>' : '') +
            (readOnly ? '' : '<input type="button" class="crud-edit-button" value="Edit"/>') +
        '</td>' : ''
    ) +
    (id ? '<td name="id">{{id}}</td>' : '') +
    reduce(schema, function (acc, item) {
        return (acc || '') +
        '<td name="' + item.name + '">{{' + item.name + '}}</td>';
    });
};

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

var createForminatorTemplate = function (schema, crudName) {
    'use strict';
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduceFormSchema(schema.form, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    reduce(schema.actions, function (acc, action) {
                        return (acc || '') +
                        '<input type="' + action.type + '" ' +
                               'class="' + action["class"] + '" ' +
                               'value="' + action.label + '"/>';
                    }) +
                '</div>' +
                '<div class="success">' +
                    '{{successMessage}}' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
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

            that.$().html(fig.render(that.template, union(
                that.mapModelToView(data), errors, (extra || {})
            )));
        };

    that.setEl = function (newEl) {
        el = newEl;
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

            // if(type === 'select') {
            //     console.log('choice: ', choice, 'value: ', value);
            // }

            // if(isArray(choice)) {
            //     console.log('array ', name);
            // }

            // console.log('type: ', type, ' choice: ', choice, ' value: ', value);
            if(isArray(value)) {
                return $.inArray(choice, value) !== -1;
            }
            else {
                return choice === value;
            }

        };

        return map(modelData, function (value, name) {

            // console.log(name + ': ', typeof value);

            if(schema[name]) {
                var type = schema[name].type;


                if(
                    type === 'checkbox' ||
                    type === 'select' ||
                    type === 'radio'
                ) {
                    var mappedValue = {};
                    foreach(schema[name].values, function (choiceObject) {

                        var choice = isObject(choiceObject) ?
                            choiceObject.value : choiceObject;

                        if(isSelected(choice, value, name)) {
                            mappedValue[choice] = true;
                        }
                    });
                    return mappedValue;
                }
                else {
                    return value;
                }
            }
            else {
                console.warn(
                    'warning: schema attribute of name: ' +
                    name + ' does not exist.'
                );
            }
        });
    };

    that.render = partial(render, true);
    that.renderNoError = partial(render, false);

    return that;
};

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

var createFormController = function (fig, my) {
    fig = fig || {};
    my = my || {};

    fig.model = fig.model || fig.createDefaultModel();

    var that = createController(fig),
        modal = fig.modal;

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    that.open = function () {
        modal.open(that.$());
    };

    that.close = function () {
        modal.close(that.$());
    };

    that.save = function () {
        that.model.set(that.serialize(), { validate: false });
        that.model.save();
    };

    my.bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.save();
        });

        that.$('.crud-close-form').unbind();
        that.$('.crud-close-form').click(function (e) {
            e.preventDefault();
            that.close();
        });

        that.publish('bind');
    };

    my.bind();

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
    that.render = function (data, errors, extra) {
        parentRender(data, errors, union({
            status: (that.model.isNew() ? 'Create' : 'Edit')
        }, extra));
        setNewModelVisibility();
        my.bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data) {
        parentRenderNoError(data, undefined, {
            status: (that.model.isNew() ? 'Create' : 'Edit')
        });
        that.$('.crud-new-item').hide();
        setNewModelVisibility();
        my.bind();
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

//extension of formController (only minor changes needed)
var createFormListController = function (fig) {
    var my = {};
    var that = createFormController(fig, my),
        modal = fig.modal,
        deleteConfirmationTemplate = fig.deleteConfirmationTemplate,
        isDisplaySavedMessage = fig.isDisplaySavedMessage,
        openDeleteConfirmation = function () {
            modal.open(that.$('.crud-delete-modal'));
        },
        closeDeleteConfirmation = function () {
            modal.close(that.$('.crud-delete-modal'));
        };

    if(isDisplaySavedMessage) {
        that.model.subscribe('saved', function () {
            that.render(that.model.get(), {}, { successMessage: 'Save Successfull.' });
            setTimeout(function () {
                that.$('.success').html('');
            }, 5000);
        });
    }

    that.setModel(that.model);

    var parentBind = my.bind;
    my.bind = function () {
        that.$('.crud-delete').unbind();
        that.$('.crud-delete').click(function (e) {
            e.preventDefault();
            openDeleteConfirmation();
        });

        that.$('.crud-confirm-delete').unbind();
        that.$('.crud-confirm-delete').click(function (e) {
            e.preventDefault();
            that.model["delete"]();
            closeDeleteConfirmation();
        });

        that.$('.crud-cancel-delete').unbind();
        that.$('.crud-cancel-delete').click(function (e) {
            e.preventDefault();
            closeDeleteConfirmation();
        });

        parentBind();
    };

    return that;
};

var createListController = function (fig) {
    fig = fig || {};
    var that = createController(fig),

        // name = fig.name,

        $deleteConfirmation = $('#' + fig.name + '-crud-confirm-delete'),

        selectedItem,
        items = [],

        isIDOrderable = fig.isIDOrderable === true ? true : false,

        orderIcon = {
            ascending: '&#8679;',
            descending: '&#8681;',
            neutral: '&#8691;'
        },

        modal = fig.modal,

        deleteConfirmationTemplate = fig.deleteConfirmationTemplate,

        openDeleteConfirmation = function () {
            modal.open($deleteConfirmation.find('.crud-delete-modal'));
        },

        closeDeleteConfirmation = function () {
            modal.close($deleteConfirmation.find('.crud-delete-modal'));
        },

        bindDeleteConfirmation = function () {
            $deleteConfirmation.find('.crud-cancel-delete').unbind();
            $deleteConfirmation.find('.crud-confirm-delete').unbind();
            $deleteConfirmation.find('.crud-cancel-delete').click(closeDeleteConfirmation);
            $deleteConfirmation.find('.crud-confirm-delete').click(function () {
                foreach(items, function (listItemController) {
                    if(listItemController.isSelected()) {
                        listItemController.model["delete"]();
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
                that.$('.crud-list-select-all').prop('checked', false);
            });

            that.$('.crud-order').unbind();
            that.$('.crud-order').click(function (e) {
                e.preventDefault();
                that.orderModel.toggle($(this).data('name'));
            });
            that.publish('bind');
        };


    $deleteConfirmation.html(fig.render(deleteConfirmationTemplate));

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

        that.$().html(fig.render(that.template, data));
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
        that.selectedItem = selectedItemController;
    };

    that.setNextSelected = function () {
        var selectedIndex = items.indexOf(that.selectedItem || items[0]);
        if(selectedIndex !== -1 && selectedIndex + 1 < items.length) {
            var controller = items[selectedIndex + 1];
            controller.publish('selected', controller);
        }
    };

    that.setPreviousSelected = function () {
        var selectedIndex = items.indexOf(that.selectedItem || items[1]);
        if(selectedIndex > 0) {
            var controller = items[selectedIndex - 1];
            controller.publish('selected', controller);
        }
    };

    that.setSelectAll = function (isSelected) {
        that.$('.crud-list-select-all').prop('checked', isSelected);
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
        foreach(newData, function (order, column) {
            that.$('[data-name="' + column + '"]').html(
                '<span  crud-order-' + order + '">' +
                    orderIcon[order] +
                '</span>'
            );
        });
    });

    return that;
};

var createListItemController = function (fig) {
    fig = fig || {};
    fig.el = '#' + fig.name + '-crud-list-container #crud-list-item-' + fig.model.id();
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

        that.$().click(function () {
            that.publish('selected', that);
        });

        that.$().dblclick(function () {
            that.publish('edit', that);
        });

        that.$('.crud-edit-button').click(function () {
            that.publish('edit', that);
        });

        that.publish('bind');
    };

    that.model.subscribe('saved', function (model) {
        that.render();
    });

    return that;
};

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

    var calculatePageRange = function () {
        // ex: [-2, -1, 0, 1, 2] -> [1, 2, 3, 4, 5]
        var rolloverNegatives = function (array) {
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

        //should be called after rolloverNegatives
        var rolloverPastMaxPageNumber = function (array) {
            var shifted = [];
            foreach(array, function (number) {
                var rolloverValue = shifted.length === 0 ?
                    number : shifted[0] - 1;
                if(number <= that.model.get('numberOfPages')) {
                    shifted.push(number);
                }
                else if(rolloverValue > 0) {
                    shifted.unshift(rolloverValue);
                }
            });
            return shifted;
        };

        var currentPage = that.model.get('pageNumber');
        return rolloverPastMaxPageNumber(
            rolloverNegatives(range(currentPage - 3, currentPage + 3))
        );
    };

    that.setSelected = function (pageNumber) {
        that.$('li a').removeClass('selected');
        that.$('li a[data-page-number="' + pageNumber + '"]').addClass('selected');
    };

    that.render = function (pages) {
        var numberOfPages = that.model.get('numberOfPages');
        if(numberOfPages > 1) {
            pages = pages || calculatePageRange();
            var error = that.model.validate();
            that.$().html(fig.render(that.template, {
                pages: pages,
                numberOfPages: numberOfPages,
                error: error
            }));
            that.setSelected(that.model.get('pageNumber'));
            bind();
        }
        else {
            // dont show paginator if there is only one page.
            that.$().html('');
        }
    };

    that.setPage = function (pageNumber) {
        that.model.set({ pageNumber: pageNumber });
    };

    that.setNextPage = throttle(300, function () {
        var currentPage = that.model.get('pageNumber');
        if(currentPage + 1 <= that.model.get('numberOfPages')) {
            that.setPage(currentPage + 1);
        }
    });

    that.setPreviousPage = throttle(300, function () {
        var currentPage = that.model.get('pageNumber');
        if(currentPage > 1) {
            that.setPage(currentPage - 1);
        }
    });

    that.model.subscribe('change', function (data) {
        that.render();
    });

    return that;
};

var createForminatorController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        actions = fig.actions;

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    that.clear = function () {
        that.model.set(map(that.model.get(), function (value) {
            return isArray(value) ? [] : '';
        }), { validate: false, silent: true });
        that.renderNoError();
    };

    var bind = function () {
        var actionThis = {
            $: that.$,
            render: that.render,
            renderNoError: that.renderNoError,
            set: that.model.set,
            get: that.model.get,
            clear: that.clear
        };

        var getAction = function (actionObject, actionName) {
            return actionObject[actionName] ? function () {
                actionObject[actionName].apply(actionThis);
            } : function () {};
        };

        foreach(actions, function (action) {
            var getActionForThisObject = partial(getAction, action);

            //prevent form submission by default
            that.$().submit(function (e) { e.preventDefault(); });

            if(action.type === 'submit') {
                that.$().unbind();
                that.$().submit(function (e) {
                    e.preventDefault();
                    that.model.set(that.serialize(), { validate: false });
                    that.model.submit({
                        method: action.method,
                        beforeSend: getActionForThisObject('beforeSend'),
                        success: getActionForThisObject('success'),
                        error: getActionForThisObject('error'),
                        complete: getActionForThisObject('complete')
                    });
                });
            }
            else if(action.type === 'button') {
                that.$('[value="' + action.label + '"]').unbind();
                that.$('[value="' + action.label + '"]').click(function () {
                    action.action.apply(actionThis);
                });
            }
            else {
                throw "Unexpected action type " + action.type;
            }
        });

        that.publish('bind');
    };

    bind();

    var parentRender = that.render;
    that.render = function (data, errors, extra) {
        parentRender(data, errors, extra);
        bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data, extra) {
        parentRenderNoError(data, {}, extra);
        bind();
    };

    that.model.subscribe('change', that.render);
    that.model.subscribe('error', function (errors) {
        that.render(that.model.get(), errors);
    });

    that.renderNoError();

    return that;
};

this.CRUD = (function () {

var isDeletable = function (deletable, readOnly) {
    return readOnly ? false : (deletable === false ? false : true);
};

var setEmptyCheckboxes = function (item) {
    if(item.type === 'checkbox') {
        item.value = item.value || [];
    }
    return item;
};

var mapSchema = function (schema) {
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
};

var mapSchemaToModelData = function (schema) {
    return mapToObject(
        schema,
        function (item) {
            return item.value || null;
        },
        function (key, item) {
            return item.name;
        }
    );
};

var createDefaultModelBase = function (that, data, id) {
    return createSchemaModel({
        id: id,
        url: that.url,
        isSoftREST: that.isSoftREST,
        data: data || mapSchemaToModelData(that.schema),
        validate: that.validate
    });
};

var createBindPublish = function (publish, controller, moduleName) {
    return partial(publish, 'bind:' + moduleName, controller.$);
};

var subscribeWaitingPublish = function (publish, model, moduleName) {
    model.subscribe(
        moduleName + ':waiting:start',
        partial(publish, moduleName + ':waiting:start')
    );
    model.subscribe(
        moduleName + ':waiting:end',
        partial(publish, moduleName + ':waiting:end')
    );
};

var defaultModal = {
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
};

return {
    full: function (fig) {
        fig = fig || {};
        var that = mixinPubSub(),
            url = fig.url,
            name = fig.name,
            label = fig.label || name,
            id = fig.id || false,
            isInstantFilter = fig.instantFilter || false,
            readOnly = fig.readOnly || false,
            deletable = isDeletable(fig.deletable, readOnly),

            render = fig.render || function (template, data) {
                return Mustache.render(template, data);
            },

            isSoftREST = fig.isSoftREST || false,

            modal = fig.modal || defaultModal,

            viewSchema = map(fig.schema, setEmptyCheckboxes),
            viewFilterSchema = map(fig.filterSchema, setEmptyCheckboxes),

            schema = mapSchema(viewSchema),
            filterSchema = mapSchema(viewFilterSchema),

            validate = fig.validate,

            createDefaultModel = partial(createDefaultModelBase, {
                url: url,
                isSoftREST: isSoftREST,
                schema: schema,
                validate: validate
            });

        var selectedCallback = function (itemController) {
            listController.setSelected(itemController);
            if(!readOnly) {
                setForm(itemController.model);
            }
        };

        var editCallback = function (itemController) {
            selectedCallback(itemController);
            formController.open();
        };

        var addItem = function (model, options) {
            options = options || {};
            var itemController = createListItemController({
                name: name,
                model: model,
                schema: viewSchema,
                template: listItemTemplate,
                render: render
            });
            itemController.subscribe('selected', selectedCallback);
            itemController.subscribe('edit', editCallback);
            listController.add(itemController, options);
            listController.setSelected(itemController);
            if(options.bind !== false) {
                bindModel(model);
            }
            return itemController;
        };

        var setCRUDList = function (rows) {
            listController.clear();
            if(rows.length > 0) {
                $('#' + name + '-crud-list-container').show();
                $('#' + name + '-crud-no-results-message').hide();
                foreach(rows, function (row) {
                    var id = row.id;
                    delete row.id;
                    addItem(createDefaultModel(row, id));
                    listController.setSelected();
                });
                listController.renderItems();
            }
            else {
                $('#' + name + '-crud-list-container').hide();
                $('#' + name + '-crud-no-results-message').show();
            }
        };

        var load = (function () {
            var isFirstLoad = true;
            return function (response) {
                setCRUDList(response.data);
                paginatorController.model.set({
                    numberOfPages: response.pages || 1
                });
                if(isFirstLoad) {
                    paginatorController.render();
                    isFirstLoad = false;
                }
            };
        }());


        var bindModel = function (model) {
            model.subscribe('saved', function (wasNew) {
                if(wasNew) {
                    // console.log('new item');
                    var itemController = addItem(model, {
                        prepend: true,
                        bind: false
                    });
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

            subscribeWaitingPublish(that.publish, model, 'form');

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
                readOnly: readOnly,
                orderable: orderable,
                uniqueID: generateUniqueID
            }) : createListTemplate(viewSchema, name, id, deletable, readOnly);

        var listItemTemplate = fig.createListItemTemplate ?
            fig.createListItemTemplate.apply({
                schema: viewSchema,
                id: id,
                deletable: deletable,
                readOnly: readOnly
            }) : createListItemTemplate(viewSchema, id, deletable, readOnly);

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
            template: paginatorTemplate,
            render: render
        });

        var listController = createListController({
            el: '#' + name + '-crud-list-container',
            name: name,
            schema: schema,
            modal: modal,
            isIDOrderable: id && id.orderable ? true : false,
            model: createDefaultModel(),
            orderModel: orderModel,
            createModel: createDefaultModel,
            template: listTemplate,
            deleteConfirmationTemplate: deleteConfirmationTemplate,
            render: render
        });




        var filterTemplate, filterModel, filterController;
        if(fig.filterSchema) {
            filterTemplate = fig.createFilterTemplate ?
                fig.createFilterTemplate.apply({
                    filterSchema: viewFilterSchema,
                    name: name,
                    label: label,
                    createInput: createInput,
                    isInstantFilter: isInstantFilter,
                    uniqueID: generateUniqueID
                }) : createFilterTemplate(viewFilterSchema, name, isInstantFilter, label);

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
                filterSchema: viewFilterSchema,

                isInstantFilter: isInstantFilter,
                template: filterTemplate,
                render: render
            });

            filterModel.subscribe('change', newItem);
            filterController.subscribe(
                'bind',
                createBindPublish(that.publish, filterController, 'filter')
            );
        }



        var formTemplate, formController;
        if(!readOnly) {

            $('#' + name + '-crud-new').html(
                fig.newButtonHTML || '<button>Create New ' + label + '</button>'
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
                    label: label,
                    createInput: createInput,
                    uniqueID: generateUniqueID
                }) : createFormTemplate(viewSchema, name, label);

            formController = createFormController({
                el: '#' + name + '-crud-container',
                schema: schema,
                modal: modal,
                createDefaultModel: function() {
                    return bindModel(createDefaultModel());
                },
                template: formTemplate,
                render: render
            });

            formController.subscribe('new', function () {
                listController.setSelected();
            });

            formController.subscribe(
                'bind',
                createBindPublish(that.publish, formController, 'form')
            );

            paginatorModel.subscribe('change', newItem);
        }
        else {
            //null form Controller
            formController = {
                open: function () {},
                close: function () {}
            };
        }

        requestModel.init({
            url: url,
            paginatorModel: paginatorModel,
            filterModel: filterModel,
            orderModel: orderModel
        });

        listController.renderNoError();

        listController.subscribe(
            'bind',
            createBindPublish(that.publish, listController, 'list')
        );
        paginatorController.subscribe(
            'bind',
            createBindPublish(that.publish, paginatorController, 'paginator')
        );

        requestModel.subscribe('load', load);

        subscribeWaitingPublish(that.publish, requestModel, 'filter');
        subscribeWaitingPublish(that.publish, requestModel, 'order');
        subscribeWaitingPublish(that.publish, requestModel, 'paginator');

        //kicks off an ajax load event (see request model and paginator controller)
        paginatorController.setPage(1);

        //keybindings for list navigation only if mouse is
        //hovering over the list or paginator.
        // $(document).keydown(function (e) {
        //     if(listController.$().is(':hover')) {
        //         switch(e.keyCode) {
        //             case 37: //left arrow key
        //                 e.preventDefault();
        //                 formController.close();
        //                 paginatorController.setPreviousPage();
        //                 break;
        //             case 38: //up arrow key
        //                 e.preventDefault();
        //                 listController.setPreviousSelected();
        //                 break;
        //             case 39: //right arrow key
        //                 e.preventDefault();
        //                 formController.close();
        //                 paginatorController.setNextPage();
        //                 break;
        //             case 40: //down arrow key
        //                 e.preventDefault();
        //                 listController.setNextSelected();
        //                 break;
        //             case 13: //enter key
        //                 if(listController.selectedItem) {
        //                     e.preventDefault();
        //                     listController.selectedItem.publish(
        //                         'edit', listController.selectedItem
        //                     );
        //                 }
        //                 break;
        //         }
        //     }
        // });

        return that;
    },



    formList: function (fig) {
        fig = fig || {};
        var that = mixinPubSub(),
            url = fig.url,
            name = fig.name,
            label = fig.label || name,
            readOnly = fig.readOnly || false,
            deletable = isDeletable(fig.deletable, readOnly),

            saveAll = fig.saveAll || false,

            isSoftREST = fig.isSoftREST || false,

            render = fig.render || function (template, data) {
                return Mustache.render(template, data);
            },

            viewSchema = map(fig.schema, setEmptyCheckboxes),
            schema = mapSchema(viewSchema),
            validate = fig.validate,
            createDefaultModel = partial(createDefaultModelBase, {
                url: url,
                schema: schema,
                isSoftREST: isSoftREST,
                validate: validate
            }),
            modal = fig.modal || defaultModal,
            addItemAction = fig.addItemAction || function ($elem, finished) {
                $elem.hide();
                $elem.slideDown(300, finished);
            },
            removeItemAction = fig.removeItemAction || function ($elem, finished) {
                $elem.slideUp(300, finished);
            },

            formController,

            createDeleteConfirmationTemplate = fig.createDeleteConfirmationTemplate ||
                createDeleteConfirmationTemplate;


        var buildFormListTemplate = function () {
            return fig.createFormListTemplate ?
                fig.createFormListTemplate.apply({
                    schema: viewSchema,
                    name: name,
                    label: label,
                    createInput: createInput,
                    uniqueID: generateUniqueID,
                    deletable: deletable,
                    saveAll: saveAll,
                    createDeleteConfirmationTemplate: createDeleteConfirmationTemplate,
                }) : createFormListTemplate(viewSchema, name, deletable, saveAll, label);
        };

        var buildFormTemplate = function () {
            return fig.createFormTemplate ?
                fig.createFormTemplate.apply({
                    schema: viewSchema,
                    name: name,
                    label: label,
                    createInput: createInput,
                    uniqueID: generateUniqueID
                }) : createFormTemplate(viewSchema, name, label);
        };

        var buildNewFormController = function () {
            var formController = createFormController({
                el: '#' + name + '-crud-container',
                schema: schema,
                modal: modal,
                model: createDefaultModel(),
                template: buildFormTemplate(),
                render: render
            });

            formController.renderNoError();

            formController.setModel(formController.model);

            formController.model.subscribe('saved', function (wasNew) {
                if(wasNew) {
                    addItemToList(formController.model);
                    formController.close();
                }
            });

            return formController;
        };

        var newItem = function (model) {
            if(!formController) {
                formController = buildNewFormController();

                formController.subscribe(
                    'bind',
                    createBindPublish(that.publish, formController.model, 'form')
                );

                subscribeWaitingPublish(that.publish, formController.model, 'form');

                formController.model.subscribe('saved', function () {
                    formController = null;
                });
            }
            formController.open();
        };

        var controllerList = [];

        var addItemToList = function (model) {
            $('#' + name +  '-crud-save-all').show();
            var elID = name + '-crud-item-' + generateUniqueID();
            $('#' + name + '-crud-form-list')
                .prepend('<div class="crud-form-list-item" id="' + elID + '"></div>');

            var controller = createFormListController({
                el: '#' + elID,
                isDisplaySavedMessage: !saveAll,
                schema: schema,
                modal: modal,
                model: model,
                template: buildFormListTemplate(),
                render: render
            });

            controller.subscribe(
                'bind',
                createBindPublish(that.publish, model, 'form')
            );

            subscribeWaitingPublish(that.publish, model, 'form');

            controller.setEl('#' + elID);
            controller.render();

            controllerList.push(controller);

            model.subscribe('destroyed', function (id) {
                removeItemAction(controller.$(), function () {
                    controllerList = remove(controllerList, controller);
                    controller.$().remove();
                });
            });

            addItemAction(controller.$());
        };

        that.saveAllItems = function () {
            var isError = false,
                list = shallowCopy(controllerList);

            if(!isEmpty(controllerList)) {
                foreach(list, function (controller) {
                    var bindToFormError = function (errors) {
                        isError = true;
                        list = remove(list, controller);
                        controller.model.unsubscribe(bindToFormError);
                        controller.model.unsubscribe(bindToFormEnd);
                        that.publish('error', errors);
                    };

                    var bindToFormEnd = function () {
                        list = remove(list, controller);
                        controller.model.unsubscribe(bindToFormError);
                        controller.model.unsubscribe(bindToFormEnd);

                        if(isEmpty(list)) {
                            that.publish('saveAll:complete');
                        }
                        if(isEmpty(list) && !isError) {
                            that.publish('saveAll:end');
                        }
                    };

                    controller.model.subscribe('error', bindToFormError);
                    controller.model.subscribe('saved', bindToFormEnd);
                });
                that.publish('saveAll:start');
                $('#' + name + '-crud-form-list .crud-form-list-item form').submit();
            }
            else {
                that.publish('saveAll:start');
                that.publish('saveAll:end');
            }
        };

        $('#' + name + '-crud-new').html(
            fig.newButtonHTML || '<button>Create New ' + label + '</button>'
        );
        $('#' + name + '-crud-new button').click(newItem);

        $('#' + name + '-crud-save-all').html(
            fig.saveAllButtonHTML ||  '<button>Save All</button>'
        );
        $('#' + name + '-crud-save-all button').click(that.saveAllItems);

        $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            success: function (response) {
                if(response.data.length > 0) {
                    foreach(response.data, function (item) {
                        var id = item.id;
                        delete item.id;
                        addItemToList(createSchemaModel({
                            data: item,
                            url: url,
                            validate: validate,
                            id: id
                        }));
                    });
                }
                else {
                    $('#' + name +  '-crud-save-all').hide();
                }
            },
            error: function () {}
        });

        return that;
    },




    //Just a regular form.  Makes POST requests only.
    forminator: function (fig) {
        fig = fig || {};
        var that = mixinPubSub(),
            url = fig.url,
            name = fig.name,

            schema = mapSchema(map(fig.schema, setEmptyCheckboxes)),
            actions = fig.actions,

            viewSchema = {
                form: map(fig.schema, setEmptyCheckboxes),
                actions: map(actions, function (action) {
                    return subSet(action, ['type', 'class', 'label']);
                })
            },

            validate = fig.validate,

            render = fig.render || function (template, data) {
                return Mustache.render(template, data);
            },

            model = createForminatorModel({
                url: url,
                data: mapSchemaToModelData(fig.schema),
                validate: validate
            }),

            controller = createForminatorController({
                el: '#' + name + '-forminator',
                schema: schema,
                actions: actions,
                model: model,
                template: fig.createForminatorTemplate ?
                    fig.createForminatorTemplate.apply({
                        schema: viewSchema,
                        name: name,
                        createInput: createInput,
                        uniqueID: generateUniqueID
                    }) : createForminatorTemplate(viewSchema, name),
                render: render
            });


        model.subscribe('posted', function (response) {
            controller.render(model.get(), {}, {
                successMessage: fig.successMessage || 'Submit Success.'
            });
        });
        model.subscribe('waiting:start', partial(that.publish, 'waiting:start'));
        model.subscribe('waiting:end', partial(that.publish, 'waiting:end'));
        controller.subscribe('bind', partial(that.publish, 'bind'));

        return that;
    }
};

}());

}).call(this);
