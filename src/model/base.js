var createModel = function (fig, my) {
    fig = fig || {};
    var that = mixinPubSub();

    my.url = fig.url;
    my.data = fig.data;

    that.validate = fig.validate || function (data) {
        return {};
    };

    that.get = function (key) {
        return key ? my.data[key] : copy(my.data);
    };

    that.set = function (successCallback, newData, options) {
        options = options || {};
        var errors = options.validate === false ? {} : that.validate(newData);
        if(isEmpty(errors)) {
            my.data = union(my.data, newData);
            if(options.silent !== true) {
                that.publish('change', newData);
                successCallback(newData, options);
            }
            return true;
        }
        else {
            if(options.silent !== true) {
                that.publish('error', errors);
            }
            return false;
        }
    };

    return that;
};


var ajaxErrorResponse = function (that, jqXHR) {
    if(jqXHR.status === 409) {
        that.publish('error', jqXHR.responseJSON);
    }
};
