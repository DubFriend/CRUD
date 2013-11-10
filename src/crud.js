this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        url = fig.url,
        name = fig.name,
        setEmptyCheckboxes = function (item) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item;
        },
        schema = map(fig.schema, setEmptyCheckboxes),
        // schemaForController = mapToObject(
        //     schema,
        //     function (item) {
        //         return filter(item, function (item, key) {
        //             return key !== 'name';
        //         });
        //     },
        //     function (key, item) {
        //         return item.name;
        //     }
        // ),
        filterSchema = map(fig.filterSchema, setEmptyCheckboxes),
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

    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.listItemTemplate = fig.listItemTemplate || createListItemTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);
    that.paginatorTemplate = fig.paginatorTemplate || createPaginatorTemplate();
    that.filterTemplate = fig.filterTemplate || createFilterTemplate(filterSchema, name);

    var requestModel = createRequestModel();

    var paginatorModel = createPaginatorModel({ requestModel: requestModel });

    var filterModel = createFilterModel({
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

    var filterController = createFilterController({
        el: '#' + name + '-crud-filter-container',
        model: filterModel,
        filterSchema: filterSchema,
        template: that.filterTemplate
    });

    var paginatorController = createPaginatorController({
        el: '#' + name + '-crud-paginator-nav',
        model: paginatorModel,
        template: that.paginatorTemplate
    });

    var orderModel = createOrderModel({
        data: map(
            filter(
                mapToObject(
                    schema,
                    identity,
                    function (key, item) {
                        return item.name;
                    }
                ),
                partial(dot, 'orderable')
            ),
            function (item, name) {
                return item.order || 'neutral';
            }
        ),
        requestModel: requestModel
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,//schemaForController,
        model: createDefaultModel(),
        orderModel: orderModel,
        createModel: createDefaultModel,
        template: that.listTemplate
    });

    var bindModel = function (model) {
        model.subscribe('saved', function (wasNew) {
            if(wasNew) {
                var itemController = addItem(model);
                listController.renderItems();
                listController.setSelected(itemController);
            }
        });

        model.subscribe('destroyed', function (id) {
            console.log('destroyed', id);
            listController.remove(id);
            listController.setSelectAll(false);
            listController.renderItems();
            newItem();
        });

        return model;
    };

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,//schemaForController,
        createDefaultModel: function() {
            return bindModel(createDefaultModel());
        },
        template: that.formTemplate
    });

    var setForm = function (model) {
        formController.setModel(model);
    };

    var selectedCallback = function (itemController) {
        listController.setSelected(itemController);
        setForm(itemController.model);
    };

    var addItem = function (model) {
        var itemController = createListItemController({
            model: model,
            schema: schema,//schemaForController,
            template: that.listItemTemplate
        });
        itemController.subscribe('selected', selectedCallback);
        listController.add(itemController, { prepend: true });
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

    var load = function (response) {
        console.log('load', response);
        setCRUDList(response.data);
        paginatorController.model.set({ numberOfPages: response.pages });
    };

    var newItem = function () {
        var defaultModel = createDefaultModel();
        setForm(defaultModel);
        bindModel(defaultModel);
    };

    requestModel.init({
        url: url,
        paginatorModel: paginatorModel,
        filterModel: filterModel,
        orderModel: orderModel
    });
    formController.subscribe('new', function () {
        listController.setSelected();
    });
    listController.renderNoError();
    paginatorController.render();
    newItem();
    requestModel.subscribe('load', load);
    paginatorController.setPage(1);
    paginatorModel.subscribe('change', newItem);
    filterModel.subscribe('change', newItem);

};
