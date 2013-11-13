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
        return union(
            { id: that.model.id() },
            map(parentMapModelToView(modelData), function (value, name) {
                if(isObject(value)) {
                    return mapToArray(value, function (isSelected, name) {
                        return name;
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
        //that.$('.crud-list-item-column').hover(
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
        isIDOrderable = fig.isIDOrderable === true ? true : false,
        orderIcon = {
            ascending: '&#8679;',
            descending: '&#8681;',
            neutral: '&#8691;'
        },
        deleteConfirmationTemplate = fig.deleteConfirmationTemplate,

        openDeleteConfirmation = function () {
            $(".crud-delete-modal").modal({
                fadeDuration: 200,
                fadeDelay: 0,
                showClose: false
            });
        },

        closeDeleteConfirmation = function () {
            $.modal.close();
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

        console.log('list render data', data);

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
    var that = mixinPubSub(createController(fig)),
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
    var that = mixinPubSub(createController(fig));

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    var bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize(), { validate: false });
            that.model.save();
        });

        $('.crud-new-item').unbind();
        $('.crud-new-item').click(function (e) {
            e.preventDefault();
            that.setModel(fig.createDefaultModel());
            that.publish('new');
        });
    };

    bind();

    var setNewModelVisibility = function () {
        var $newItemButton = that.$('.crud-new-item');
        if(that.model.isNew()) {
            that.$('form').removeClass('crud-edit-form');
            that.$('form').addClass('crud-create-form');
            if(!$newItemButton.is(':hidden')) {
                $newItemButton.hide();
            }
        }
        else {
            that.$('form').addClass('crud-edit-form');
            that.$('form').removeClass('crud-create-form');
            if($newItemButton.is(':hidden')) {
                $newItemButton.show();
            }
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
        var savedCallback = setNewModelVisibility;
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
