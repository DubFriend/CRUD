this.createCRUD = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        name = fig.name,
        id = fig.id || false,
        isInstantFilter = fig.instantFilter || false,
        readOnly = fig.readOnly || false,
        deletable = readOnly ? false : (fig.deletable === false ? false : true),
        setEmptyCheckboxes = function (item) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item;
        },

        mapSchema = function (schema) {
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
        },

        viewSchema = map(fig.schema, setEmptyCheckboxes),
        viewFilterSchema = map(fig.filterSchema, setEmptyCheckboxes),

        schema = mapSchema(viewSchema),
        filterSchema = mapSchema(viewFilterSchema),


        validate = fig.validate,
        createDefaultModel = function (data, id) {
            return createSchemaModel({
                id: id,
                url: url,
                data: data || mapToObject(
                    schema,
                    function (item) {
                        return item.value || null;
                    },
                    function (key, item) {
                        return item.name;
                    }
                ),
                validate: validate
            });
        };



    var selectedCallback = function (itemController) {
        listController.setSelected(itemController);
        if(!readOnly) {
            setForm(itemController.model);
        }
    };

    var addItem = function (model, options) {
        options = options || {};
        var itemController = createListItemController({
            model: model,
            // schema: schema,
            schema: viewSchema,
            template: listItemTemplate
        });
        itemController.subscribe('selected', selectedCallback);
        listController.add(itemController, options);
        listController.setSelected(itemController);
        bindModel(model);
        return itemController;
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

    var load = (function () {
        var isFirstLoad = true;
        return function (response) {
            setCRUDList(response.data);
            paginatorController.model.set({ numberOfPages: response.pages });
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

    var createBindPublish = function (controller) {
        return partial(that.publish, 'bind', controller.$);
    };


    var requestModel = createRequestModel();


    var listTemplate = fig.createListTemplate ?
        fig.createListTemplate.apply({
            schema: schema,
            name: name,
            id: id,
            deletable: deletable,
            orderable: orderable,
            uniqueID: generateUniqueID
        }) : createListTemplate(viewSchema, name, id, deletable);

    var listItemTemplate = fig.createListItemTemplate ?
        fig.createListItemTemplate.apply({
            schema: viewSchema,
            id: id,
            deletable: deletable
        }) : createListItemTemplate(viewSchema, id, deletable);

    var paginatorTemplate = fig.createPaginatorTemplate ?
        fig.createPaginatorTemplate() : createPaginatorTemplate();

    var deleteConfirmationTemplate = fig.createDeleteConfirmationTemplate ?
        fig.createDeleteConfirmationTemplate() : createDeleteConfirmationTemplate();



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
        template: paginatorTemplate
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        isIDOrderable: id && id.orderable ? true : false,
        model: createDefaultModel(),
        orderModel: orderModel,
        createModel: createDefaultModel,
        template: listTemplate,
        deleteConfirmationTemplate: deleteConfirmationTemplate
    });




    var filterTemplate, filterModel, filterController;
    if(fig.filterSchema) {
        filterTemplate = fig.createFilterTemplate ?
            fig.createFilterTemplate.apply({
                filterSchema: viewFilterSchema,
                name: name,
                createInput: createInput,
                isInstantFilter: isInstantFilter,
                uniqueID: generateUniqueID
            }) : createFilterTemplate(viewFilterSchema, name, isInstantFilter);

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
            //filterSchema: filterSchema,
            filterSchema: viewFilterSchema,

            isInstantFilter: isInstantFilter,
            template: filterTemplate
        });

        filterModel.subscribe('change', newItem);


        filterController.subscribe('bind', createBindPublish(filterController));

    }



    var formTemplate, formController;
    if(!readOnly) {
        formTemplate = fig.createFormTemplate ?
            fig.createFormTemplate.apply({
                schema: viewSchema,
                name: name,
                createInput: createInput,
                uniqueID: generateUniqueID
            }) : createFormTemplate(viewSchema, name);

        formController = createFormController({
            el: '#' + name + '-crud-container',
            schema: schema,
            createDefaultModel: function() {
                return bindModel(createDefaultModel());
            },
            template: formTemplate
        });

        formController.subscribe('new', function () {
            listController.setSelected();
        });

        formController.subscribe('bind', createBindPublish(formController));

        paginatorModel.subscribe('change', newItem);
    }



    requestModel.init({
        url: url,
        paginatorModel: paginatorModel,
        filterModel: filterModel,
        orderModel: orderModel
    });

    listController.renderNoError();

    listController.subscribe('bind', createBindPublish(listController));
    paginatorController.subscribe('bind', createBindPublish(paginatorController));

    requestModel.subscribe('load', load);

    //kicks off an ajax load event, rendering the paginator, list items, and form
    paginatorController.setPage(1);
};
