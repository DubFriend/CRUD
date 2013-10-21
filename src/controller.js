var createController = function (fig) {
    var that = {},
        el = fig.el,
        render = function (isRenderError, data) {
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

    that.render = partial(render, true);
    that.renderNoError = partial(render, false);

    return that;
};

var createListItemController = function (fig) {
    fig = fig || {};
    fig.el = fig.el || '#crud-list-item-' + fig.model.id();
    var that = mixinPubSub(createController(fig));

    that.isSelected = function () {
        return that.$('.crud-list-selected').attr('checked') ? true : false;
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

var createListController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        items = [],
        renderItems = function () {
            var $container = that.$('#crud-list-item-container');
            $container.html('');
            foreach(items, function (item) {
                console.log(item.model.id());
                var elID = 'crud-list-item-' + item.model.id();
                $container.append(
                    '<tr id="' + elID + '" ' + 'class="list-item"></tr>'
                );
                item.render();
            });
        };

    that.setSelected = function (selectedItemController) {
        foreach(items, function (itemController) {
            itemController.deselect();
        });
        selectedItemController.select();
    };

    that.add = function (itemController) {
        items.push(itemController);
        renderItems();
    };

    that.getItemControllerByID = function (id) {
        return filter(items, function (controller) {
            return controller.model.id() === id;
        })[0];
    };

    that.remove = function (id) {
        items = filter(items, function (controller) {
            return controller.model.id() !== id;
        });
        renderItems();
    };

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

            switch(item.type) {
                case 'radio':
                    return get(':checked');
                case 'select':
                    return get(' option:selected');
                case 'checkbox':
                    var checked = [];
                    that.$('[name="' + name + '"]:checked').each(function () {
                        checked.push($(this).val());
                    });
                    return checked;
                default:
                    return that.$('[name="' + name + '"]').val();
            }
        });
    };

    that.bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize());
            that.model.save();
        });

        that.model.subscribe('saved', function (model) {
            console.log('saved event');
        });

        that.model.subscribe('change', function (model) {
            that.render();
        });
    };

    return that;
};
