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
