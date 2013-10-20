this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        name = fig.name,
        schema = fig.schema,
        validate = fig.validate,
        model = createModel({
            data: map(schema, function (item) {
                return item.value || null;
            }),
            validate: validate
        });

    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);
    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);

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

    that.serialize = function (data) {
        return formController.serialize();
    };

    return that;
};
