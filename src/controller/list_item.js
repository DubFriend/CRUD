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
