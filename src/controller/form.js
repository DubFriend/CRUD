var createFormController = function (fig, my) {
    fig = fig || {};
    my = my || {};

    fig.model = fig.model || fig.createDefaultModel();

    var that = createController(fig),
        //isOpen = false,
        modal = fig.modal;

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    that.open = function () {
        modal.open(that.$());
    };

    that.close = function () {
        modal.close(that.$());
    };

    // var bind = function () {
    my.bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize(), { validate: false });
            that.model.save();
        });

        that.$('.crud-close-form').unbind();
        that.$('.crud-close-form').click(function (e) {
            e.preventDefault();
            that.close();
        });

        that.publish('bind');
    };

    my.bind();

    var setNewModelVisibility = function () {
        if(that.model.isNew()) {
            that.$('*').removeClass('crud-status-edit');
            that.$('*').addClass('crud-status-create');
        }
        else {
            that.$('*').addClass('crud-status-edit');
            that.$('*').removeClass('crud-status-create');
        }
    };

    var parentRender = that.render;
    that.render = function (data, errors, extra) {
        parentRender(data, errors, union({
            status: (that.model.isNew() ? 'Create' : 'Edit')
        }, extra));
        setNewModelVisibility();
        my.bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data) {
        parentRenderNoError(data, undefined, {
            status: (that.model.isNew() ? 'Create' : 'Edit')
        });
        that.$('.crud-new-item').hide();
        setNewModelVisibility();
        my.bind();
    };

    that.setModel = (function () {
        var savedCallback = function () {
            setNewModelVisibility();
            that.close();
        };
        var changeCallback = function (model) {
            that.render();
        };
        var errorCallback = function (errors) {
            that.render(that.model.get(), errors);
        };

        return function (newModel) {
            that.model.unsubscribe(changeCallback);
            that.model.unsubscribe(savedCallback);
            that.model.unsubscribe(errorCallback);
            newModel.subscribe('change', changeCallback);
            newModel.subscribe('saved', savedCallback);
            newModel.subscribe('error', errorCallback);
            that.model = newModel;
            if(newModel.isNew()) {
                that.renderNoError();
            }
            else {
                that.render();
            }
        };
    }());

    return that;
};
