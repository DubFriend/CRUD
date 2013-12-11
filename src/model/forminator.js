var createForminatorModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my);

    that.set = partial(that.set, function () {});

    that.clear = function () {
        my.data = {};
        that.publish('change', that);
    };

    that.submit = function (action) {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            $.ajax({
                url: my.url,
                method: action.method || 'POST',
                data: my.data,
                dataType: 'json',
                //beforeSend: partial(that.publish, 'waiting:start'),
                beforeSend: function () {
                    that.publish('waiting:start');
                    action.beforeSend();
                },
                success: function (response) {
                    console.log('success', response);
                    action.success(response);
                    //that.publish('posted', response);
                },
                error: function (jqXHR) {
                    action.error(jqXHR);
                    ajaxErrorResponse(that, jqXHR);
                },
                complete: function (jqXHR) {
                    action.complete(jqXHR);
                    that.publish('waiting:end', jqXHR);
                }
                // error: partial(ajaxErrorResponse, that),
                // complete: partial(that.publish, 'waiting:end')
            });
        }
        that.publish('error', errors);
    };

    return that;
};
