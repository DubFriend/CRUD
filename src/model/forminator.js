var createForminatorModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my);

    that.set = partial(that.set, function () {});

    that.submit = function (action) {

        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            $.ajax({
                url: my.url,
                method: action.method || 'POST',
                data: my.data,
                dataType: 'json',
                beforeSend: function () {
                    that.publish('waiting:start');
                    action.beforeSend();
                },
                success: function (response) {
                    console.log('success', response);
                    that.publish('posted', response);
                    action.success(response);
                },
                error: function (jqXHR) {
                    ajaxErrorResponse(that, jqXHR);
                    action.error(jqXHR);
                },
                complete: function (jqXHR) {
                    that.publish('waiting:end', jqXHR);
                    action.complete(jqXHR);
                }
            });
        }
        that.publish('error', errors);
    };

    return that;
};
