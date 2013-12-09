var createListController = function (fig) {
    fig = fig || {};
    var that = createController(fig),

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
            modal.open($('.crud-delete-modal'));
        },

        closeDeleteConfirmation = function () {
            modal.close($('.crud-delete-modal'));
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



    // $('body').prepend(Mustache.render(deleteConfirmationTemplate));
    $('body').prepend(fig.render(deleteConfirmationTemplate));


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
