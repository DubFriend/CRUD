var createForminatorController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        actions = fig.actions;

    that.serialize = function () {
        return serializeFormBySchema(that.$(), that.schema);
    };

    var bind = function () {
        var actionThis = {
            $: that.$, set: that.model.set, get: that.model.get
        };

        var getAction = function (actionObject, actionName) {
            return actionObject[actionName] ? function () {
                actionObject[actionName].apply(actionThis);
            } : function () {};
        };

        foreach(actions, function (action) {
            var getActionForThisObject = partial(getAction, action);

            //prevent form submission by default
            that.$().submit(function (e) { e.preventDefault(); });

            if(action.type === 'submit') {
                that.$().unbind();
                that.$().submit(function (e) {
                    e.preventDefault();
                    that.model.set(that.serialize(), { validate: false });
                    that.model.submit({
                        method: action.method,
                        beforeSend: getActionForThisObject('beforeSend'),
                        success: getActionForThisObject('success'),
                        error: getActionForThisObject('error'),
                        complete: getActionForThisObject('complete')
                    });
                });
            }
            else if(action.type === 'button') {
                that.$('[value="' + action.label + '"]').unbind();
                that.$('[value="' + action.label + '"]').click(function () {
                    action.action.apply(actionThis);
                });
            }
            else {
                throw "Unexpected action type " + action.type;
            }
        });


        // that.$().unbind();
        // that.$().submit(function (e) {
        //     e.preventDefault();
        //     that.model.set(that.serialize(), { validate: false });
        //     that.model.submit();
        // });
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
