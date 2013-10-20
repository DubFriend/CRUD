var createModel = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        data = fig.data || {},
        id = fig.id || undefined,
        ajax = function (fig) {
            $.ajax({
                url: url,
                method: fig.method,
                data: fig.data,
                dataType: 'json',
                success: fig.success,
                error: function () {
                    console.error('crud ajax error', arguments);
                    that.publish('ajaxError', arguments);
                }
            });
        };

    that.isNew = function () {
        return id === undefined ? true : false;
    };

    that.id = function () {
        return id;
    };

    that.get = function (key) {
        return key ? data[key] : copy(data);
    };

    that.set = function (data) {
        foreach(data, function (value, key) {
            data[key] = value;
        });
        that.publish('change', that);
    };

    that.clear = function () {
        data = {};
        id = undefined;
    };

    that.validate = fig.validate || function () {
        return {};
    };

    that.save = function () {
        var errors = that.validate();
        if(isEmpty(errors)) {
            ajax({
                url: that.isNew() ? url : url + '/' + id,
                method: that.isNew() ? 'POST' : 'PUT',
                data: data,
                success: function (response) {
                    id = that.isNew() ? response : id;
                    that.publish('saved', that);
                }
            });
        }
        that.publish('formError', errors);
    };

    that.delete = function () {
        if(!that.isNew()) {
            ajax({
                method: 'DELETE',
                data: { id: id },
                success: function (response) {
                    that.publish('destroyed', that);
                }
            });
        }
        that.clear();
    };

    return that;
};
