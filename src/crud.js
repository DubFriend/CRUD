this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        url = fig.url,
        name = fig.name,
        schema = fig.schema,
        validate = fig.validate,
        createDefaultModel = function () {
            return createModel({
                url: url,
                data: map(schema, function (item) {
                    return item.value || null;
                }),
                validate: validate
            });
        };

    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.listItemTemplate = fig.listItemTemplate || createListItemTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        model: createDefaultModel(),
        template: that.listTemplate
    });
    listController.renderNoError();

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        model: createDefaultModel(),
        template: that.formTemplate
    });

    var setForm = function (model) {
        formController.setModel(model);
        // formController.model = model;
        // formController.bind();
        // formController.renderNoError();
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
    };

    that.newItem = function () {
        var defaultModel = createDefaultModel();

        setForm(defaultModel);

        defaultModel.subscribe('saved', function (wasNew) {
            that.newItem();
            if(wasNew) {
                addItem(defaultModel);
            }
        });

        defaultModel.subscribe('deleted', function (id) {
            var itemController = listController.getItemControllerByID(id);
            itemController.unsubscribe(selectedCallback);
            listController.remove(id);
        });
    };

    that.init = function () {
        that.newItem();
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: function (rows) {
                foreach(rows, function (row) {
                    var id = row.id;
                    delete row.id;
                    addItem(createModel({
                        url: url,
                        id: id,
                        data: row,
                        validate: validate
                    }));
                });
            }
        });
    };

    return that;
};
