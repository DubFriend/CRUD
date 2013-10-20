this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        name = fig.name,
        schema = fig.schema,
        validate = fig.validate,
        model = createModel({
            url: fig.url,
            data: map(schema, function (item) {
                return item.value || null;
            }),
            validate: validate
        });

    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        model: model,
        template: that.formTemplate
    });

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        model: model,
        template: that.listTemplate
    });

    that.init = function () {
        formController.renderNoError();
        listController.renderNoError();
    };

    that.render = function (data) {
        formController.render(data);
        listController.render(data);
    };

    return that;
};
