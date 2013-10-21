this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        name = fig.name,
        schema = fig.schema,
        validate = fig.validate,
        createDefaultModel = function () {
            return createModel({
                url: fig.url,
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
        formController.model = model;
        formController.bind();
        formController.renderNoError();
    };

    that.newItem = function () {
        var defaultModel = createDefaultModel();

        setForm(defaultModel);

        var selectedCallback = function (itemController) {
            listController.setSelected(itemController);
            setForm(itemController.model);
            console.log('selected id: ' + itemController.model.id());
        };

        defaultModel.subscribe('saved', function () {
            that.newItem();
            var itemController = createListItemController({
                model: defaultModel,
                schema: schema,
                template: that.listItemTemplate
            });
            itemController.subscribe('selected', selectedCallback);
            listController.add(itemController);
        });

        defaultModel.subscribe('deleted', function (id) {
            var itemController = listController.getItemControllerByID(id);
            itemController.unsubscribe(selectedCallback);
            listController.remove(id);
        });
    };

    that.init = function () {
        that.newItem();
    };

    return that;
};
