var createModel = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        data = fig.data || {},
        id = fig.id || undefined,
        ajax = fig.ajax || function (fig) {
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

    that.set = function (newData) {
        foreach(newData, function (value, key) {
            data[key] = value;
        });
        that.publish('change', that);
    };

    that.clear = function () {
        data = {};
        id = undefined;
        that.publish('change', that);
    };

    that.validate = fig.validate || function () {
        return {};
    };

    that.save = function () {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            ajax({
                url: that.isNew() ? url : url + '/' + id,
                method: that.isNew() ? 'POST' : 'PUT',
                data: data,
                success: function (response) {
                    var wasNew = that.isNew();
                    id = that.isNew() ? response : id;
                    that.publish('saved', wasNew);
                }
            });
        }
        that.publish('formError', errors);
    };

    that.delete = function () {
        if(!that.isNew()) {
            ajax({
                url: url + '/' + id,
                method: 'DELETE',
                success: function (response) {
                    var id = that.id();
                    that.clear();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.clear();
        }
    };

    return that;
};
