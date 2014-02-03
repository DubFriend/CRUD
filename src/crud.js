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
            bindModel(model);
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
        $(document).keydown(function (e) {
            if(listController.$().is(':hover')) {
                switch(e.keyCode) {
                    case 37: //left arrow key
                        e.preventDefault();
                        formController.close();
                        paginatorController.setPreviousPage();
                        break;
                    case 38: //up arrow key
                        e.preventDefault();
                        listController.setPreviousSelected();
                        break;
                    case 39: //right arrow key
                        e.preventDefault();
                        formController.close();
                        paginatorController.setNextPage();
                        break;
                    case 40: //down arrow key
                        e.preventDefault();
                        listController.setNextSelected();
                        break;
                    case 13: //enter key
                        if(listController.selectedItem) {
                            e.preventDefault();
                            listController.selectedItem.publish(
                                'edit', listController.selectedItem
                            );
                        }
                        break;
                }
            }
        });

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
