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
        filterSchema = map(fig.filterSchema, setEmptyCheckboxes),
        validate = fig.validate,

        createDefaultModel = function (data, id) {
            return createSchemaModel({
                id: id,
                url: url,
                data: data || map(schema, function (item) {
                    return item.value || null;
                }),
                validate: validate
            });
        };

    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.listItemTemplate = fig.listItemTemplate || createListItemTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);
    that.paginatorTemplate = fig.paginatorTemplate || createPaginatorTemplate();
    that.filterTemplate = fig.filterTemplate || createFilterTemplate(filterSchema, name);

    var requestModel = createRequestModel();

    var paginatorModel = createPaginatorModel({
        requestModel: requestModel
    });

    var filterModel = createFilterModel({
        requestModel: requestModel,
        data: map(filterSchema, function (item, name) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item.value === undefined ? null : item.value;
        })
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
    paginatorController.render();

    var orderModel = createOrderModel({
        data: map(filter(schema, partial(dot, 'orderable')), function (item, name) {
            return item.order || 'neutral';
        }),
        requestModel: requestModel
    });

    requestModel.init({
        url: url,
        paginatorModel: paginatorModel,
        filterModel: filterModel,
        orderModel: orderModel
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        model: createDefaultModel(),
        orderModel: orderModel,
        createModel: createDefaultModel,
        template: that.listTemplate
    });
    listController.renderNoError();

    var bindModel = function (model) {
        model.subscribe('saved', function (wasNew) {
            if(wasNew) {
                addItem(model);
            }
        });

        model.subscribe('destroyed', function (id) {
            console.log('destroyed', id);
            listController.remove(id);
            listController.setSelectAll(false);
        });

        return model;
    };

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        createDefaultModel: function() {
            return bindModel(createDefaultModel());
        },
        template: that.formTemplate
    });

    formController.subscribe('new', function () {
        listController.setSelected();
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
            schema: schema,
            template: that.listItemTemplate
        });
        itemController.subscribe('selected', selectedCallback);
        listController.add(itemController);
        listController.setSelected(itemController);
        bindModel(model);
    };


    that.newItem = function () {
        var defaultModel = createDefaultModel();
        setForm(defaultModel);
        bindModel(defaultModel);
    };

    var setCRUDList = function (rows) {
        listController.clear();
        foreach(rows, function (row) {
            var id = row.id;
            delete row.id;
            addItem(createDefaultModel(row, id));
            listController.setSelected();
        });
    };

    var load = function (response) {
        console.log('load', response);
        setCRUDList(response.data);
        paginatorController.model.set({ numberOfPages: response.pages });
    };

    that.init = function () {
        that.newItem();
        requestModel.subscribe('load', load);
        paginatorController.setPage(1);
        filterController.render();
    };

    return that;
};
