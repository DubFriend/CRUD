this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        url = fig.url,
        name = fig.name,
        id = fig.id || false,
        isInstantFilter = fig.instantFilter || false,
        deletable = fig.deletable === false ? false : true,
        setEmptyCheckboxes = function (item) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item;
        },
        schema = map(fig.schema, setEmptyCheckboxes),
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

    var selectedCallback = function (itemController) {
        listController.setSelected(itemController);
        setForm(itemController.model);
    };

    var addItem = function (model, options) {
        options = options || {};
        var itemController = createListItemController({
            model: model,
            schema: schema,
            template: that.listItemTemplate
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

    var load = function (response) {
        setCRUDList(response.data);
        paginatorController.model.set({ numberOfPages: response.pages });
    };

    var newItem = function () {
        var defaultModel = createDefaultModel();
        setForm(defaultModel);
        bindModel(defaultModel);
    };


    //that.listTemplate = fig.listTemplate || createListTemplate(schema, name, id, deletable);
    that.listTemplate = fig.createListTemplate ?
        fig.createListTemplate.apply({
            schema: schema,
            name: name,
            id: id,
            deletable: deletable,
            orderable: orderable,
            uniqueID: generateUniqueID
        }) : createListTemplate(schema, name, id, deletable);


    //that.listItemTemplate = fig.listItemTemplate || createListItemTemplate(schema, id, deletable);
    that.listItemTemplate = fig.createListItemTemplate ?
        fig.createListItemTemplate.apply({
            schema: schema,
            id: id,
            deletable: deletable
        }) : createListItemTemplate(schema, id, deletable);


    //that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);
    that.formTemplate = fig.createFormTemplate ?
        fig.createFormTemplate.apply({
            schema: schema,
            name: name,
            createInput: createInput,
            uniqueID: generateUniqueID
        }) : createFormTemplate(schema, name);

    //that.filterTemplate = fig.filterTemplate || createFilterTemplate(filterSchema, name, isInstantFilter);
    that.filterTemplate = fig.createFilterTemplate ?
        fig.createFilterTemplate.apply({
            filterSchema: filterSchema,
            name: name,
            createInput: createInput,
            isInstantFilter: isInstantFilter,
            uniqueID: generateUniqueID
        }) : createFilterTemplate(filterSchema, name, isInstantFilter);


    //that.paginatorTemplate = fig.paginatorTemplate || createPaginatorTemplate();
    that.paginatorTemplate = fig.createPaginatorTemplate ?
        fig.createPaginatorTemplate() : createPaginatorTemplate();

    //that.deleteConfirmationTemplate = fig.deleteConfirmationTemplate || createDeleteConfirmationTemplate();
    that.deleteConfirmationTemplate = fig.createDeleteConfirmationTemplate ?
        fig.createDeleteConfirmationTemplate() : createDeleteConfirmationTemplate();

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

    var filterController = createFilterController({
        el: '#' + name + '-crud-filter-container',
        model: filterModel,
        filterSchema: filterSchema,
        isInstantFilter: isInstantFilter,
        template: that.filterTemplate
    });

    var paginatorController = createPaginatorController({
        el: '#' + name + '-crud-paginator-nav',
        model: paginatorModel,
        template: that.paginatorTemplate
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        isIDOrderable: id && id.orderable ? true : false,
        model: createDefaultModel(),
        orderModel: orderModel,
        createModel: createDefaultModel,
        template: that.listTemplate,
        deleteConfirmationTemplate: that.deleteConfirmationTemplate
    });

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        createDefaultModel: function() {
            return bindModel(createDefaultModel());
        },
        template: that.formTemplate
    });

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
