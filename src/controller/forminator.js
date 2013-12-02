var createForminatorController = function (fig) {
    fig = fig || {};
    var that = createController(fig);

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    var bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize(), { validate: false });
            that.model.submit();
        });
        that.publish('bind');
    };

    bind();

    var parentRender = that.render;
    that.render = function (data, errors, extra) {
        parentRender(data, errors, extra);
        bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data) {
        parentRenderNoError(data);
        bind();
    };

    that.model.subscribe('change', that.render);
    that.model.subscribe('error', function (errors) {
        that.render(that.model.get(), errors);
    });

    that.renderNoError();

    return that;
};
