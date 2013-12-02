var createForminatorModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my);

    that.set = partial(that.set, function () {});

    that.clear = function () {
        my.data = {};
        that.publish('change', that);
    };

    that.submit = function () {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            $.ajax({
                url: my.url,
                method: 'POST',
                data: my.data,
                dataType: 'json',
                beforeSend: partial(that.publish, 'waiting:start'),
                success: function (response) {
                    console.log('success', response);
                    that.publish('posted', response);
                },
                error: partial(ajaxErrorResponse, that),
                complete: partial(that.publish, 'waiting:end')
            });
        }
        that.publish('error', errors);
    };

    return that;
};
