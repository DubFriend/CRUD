(function () {
    'use strict';

var identity = function (x) {
    return x;
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

var map = function (collection, callback, keyCallback) {
    var mapped;
    if(isArray(collection)) {
        mapped = [];
        foreach(collection, function (value, key, coll) {
            mapped.push(callback(value, key, coll));
        });
    }
    else {
        mapped = {};
        foreach(collection, function (value, key, coll) {
            key = keyCallback ? keyCallback(key) : key;
            mapped[key] = callback(value, key, coll);
        });
    }
    return mapped;
};

var reduce = function (collection, callback) {
    var accumulation;
    foreach(collection, function (val, key) {
        accumulation = callback(accumulation, val, key, collection);
    });
    return accumulation;
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

var createModel = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        data = fig.data || {},
        id = fig.id || undefined,
        ajax = fig.ajax || function (fig) {
            $.ajax({
                url: url,
                method: fig.method,
                data: fig.data,
                dataType: 'json',
                success: fig.success,
                error: function () {
                    console.error('crud ajax error', arguments);
                    that.publish('ajaxError', arguments);
                }
            });
        };

    that.isNew = function () {
        return id === undefined ? true : false;
    };

    that.id = function () {
        return id;
    };

    that.get = function (key) {
        return key ? data[key] : copy(data);
    };

    that.set = function (newData) {
        foreach(newData, function (value, key) {
            data[key] = value;
        });
        that.publish('change', that);
    };

    that.clear = function () {
        data = {};
        id = undefined;
        that.publish('change', that);
    };

    that.validate = fig.validate || function () {
        return {};
    };

    that.save = function () {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            ajax({
                url: that.isNew() ? url : url + '/' + id,
                method: that.isNew() ? 'POST' : 'PUT',
                data: data,
                success: function (response) {
                    id = that.isNew() ? response : id;
                    that.publish('saved', that);
                }
            });
        }
        that.publish('formError', errors);
    };

    that.delete = function () {
        if(!that.isNew()) {
            ajax({
                url: url + '/' + id,
                method: 'DELETE',
                success: function (response) {
                    that.clear();
                    that.publish('destroyed', that);
                }
            });
        }
        else {
            that.clear();
        }
    };

    return that;
};

var createFormTemplate = function (schema, crudName) {

    var createInput = function (item, name) {

        var input = function (checked, value, isInputClass) {
            isInputClass = isInputClass === undefined ? true : isInputClass;
            var valueHTML = function () {
                return item.type === 'checkbox' || item.type === 'radio' ?
                    'value="' + value + '" ' : 'value="{{' + name + '}}" ';
            };

            var id = function () {
                return item.type === 'checkbox' || item.type === 'radio' ?
                    'id="' + name + '-' + value + '" ' :
                    'id="' + crudName + '-' + name + '" ';
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
                    acc = acc || '';
                    return acc +
                    '<label for="' + name + '-' + value + '">' +
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
            case 'password':
                return input();

            case 'textarea':
                return '' +
                '<div class="input">' +
                    '<textarea id="' + crudName + '-' + name + '" ' +
                              'name="' + name + '">' +
                        '{{' + name + '}}' +
                    '</textarea>' +
                '</div>';

            case 'checkbox':
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

    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduce(schema, function (acc, item, name) {
                acc = acc || '';
                return acc +
                '<div class="control-set">' +
                    '<label for="' + crudName + '-' + name + '" class="label">' +
                        name +
                    '</label>' +
                    createInput(item, name) +
                    '<div class="crud-help">{{' + name + 'Help}}</div>' +
                '</div>';
            }) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" class="js-crud-save" value="Save"/>' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};



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
                    acc = acc || '';
                    return acc + '<th>' + name + '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
    '</table>';
};

var createController = function (fig) {
    var that = {},
        el = fig.el;

    that.schema = fig.schema;
    that.model = fig.model;
    that.template = fig.template;

    that.$ = function (selector) {
        return selector ? $(el).find(selector) : $(el);
    };

    that.mapModelToView = function (modelData) {
        var isSelected = function (choice, value, name) {
            var type = that.schema[name].type;
            return type === 'radio' || type === 'select' ?
                choice === value : value.indexOf(choice) !== -1;
        };

        return map(modelData, function (value, name) {
            var type = that.schema[name].type;
            if(type === 'checkbox' || type === 'select' || type === 'radio' ) {
                var mappedValue = {};
                foreach(that.schema[name].values, function (choice) {
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
    };

    var render = function (isRenderError, data) {
        data = data || that.model.get();
        that.$().html(Mustache.render(that.template, union(
            that.mapModelToView(data),
            (isRenderError ? map(that.model.validate(data),
                identity,
                function (key) {
                    return key + 'Help';
                }) : {}
            )
        )));
    };

    that.render = partial(render, true);
    that.renderNoError = partial(render, false);

    return that;
};

var createListController = function (fig) {
    fig = fig || {};
    var that = createController(fig);


    return that;
};

var createFormController = function (fig) {
    fig = fig || {};
    var that = createController(fig);

    that.serialize = function () {
        return map(that.schema, function (item, name) {
            var get = function (pseudo) {
                return that.$('[name="' + name + '"]' + (pseudo || '')).val();
            };

            var checkbox = function () {
                var checked = [];
                that.$('[name="' + name + '"]:checked').each(function () {
                    checked.push($(this).val());
                });
                return checked;
            };

            switch(item.type) {
                case 'radio':
                    return get(':checked');
                case 'select':
                    return get(' option:selected');
                case 'checkbox':
                    return checkbox();
                default:
                    return that.$('[name="' + name + '"]').val();
            }
        });
    };

    that.$().submit(function (e) {
        e.preventDefault();
        that.model.set(that.serialize());
        that.model.save();
    });

    that.model.subscribe('change', function (model) {
        that.render();
    });

    that.model.subscribe('saved', function (model) {
        console.log('saved event');
    });

    return that;
};

this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        name = fig.name,
        schema = fig.schema,
        validate = fig.validate,
        model = createModel({
            url: fig.url,
            data: map(schema, function (item) {
                return item.value || null;
            }),
            validate: validate
        });

    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        model: model,
        template: that.formTemplate
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        model: model,
        template: that.listTemplate
    });

    that.init = function () {
        formController.renderNoError();
        listController.renderNoError();
    };

    that.render = function (data) {
        formController.render(data);
        listController.render(data);
    };

    return that;
};

}).call(this);
