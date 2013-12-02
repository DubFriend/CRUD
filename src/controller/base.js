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
            that.$().html(Mustache.render(that.template, union(
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
