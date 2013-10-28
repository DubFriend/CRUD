var ajaxErrorResponse = function (that, jqXHR) {
    if(jqXHR.status === 409) {
        that.publish('error', jqXHR.responseJSON);
    }
};

var createSchemaModel = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        data = fig.data || {},
        id = fig.id,
        ajax = fig.ajax || function (fig) {
            $.ajax({
                url: that.isNew() ? url : url + '/' + that.id(),
                method: fig.method,
                data: fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(data) : data,
                dataType: 'json',
                success: fig.success,
                error: partial(ajaxErrorResponse, that)
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
        that.publish('error', errors);
    };

    that.delete = function () {
        console.log('delete', that.id());
        if(!that.isNew()) {
            ajax({
                url: url + '/' + id,
                method: 'DELETE',
                success: function (response) {
                    console.log('delete success', response);
                    var id = that.id();
                    that.clear();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.clear();
            that.publish('change', that);
        }
    };

    return that;
};




var createPaginatorModel = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(), data = {},
        url = fig.url;

    data.pageNumber = fig.pageNumber || 1;
    data.numberOfPages = fig.numberOfPages || 1;

    that.validate = function (testData) {
        testData = testData || data;
        var errors = {};
        var tempNumberOfPages = testData.numberOfPages !== undefined ?
            testData.numberOfPages : data.numberOfPages;
        var tempPageNumber = testData.pageNumber !== undefined ?
            testData.pageNumber : data.pageNumber;

        if(tempPageNumber <= 0) {
            errors.pageNumber = 'Page number must be greater than zero.';
        }
        else if(tempPageNumber > tempNumberOfPages) {
            errors.pageNumber = 'Page number must be less than or ' +
                                'equal to the number of pages.';
        }
        return errors;
    };

    that.set = function (newData) {
        var errors = that.validate(newData);
        if(isEmpty(errors)) {
            data = union(data, newData);
            that.publish('change', newData);
            if(newData.pageNumber) {
                $.ajax({
                    url: url + '/page/' + that.get('pageNumber'),
                    method: 'GET',
                    dataType: 'json',
                    success: partial(that.publish, 'load'),
                    error: partial(ajaxErrorResponse, that)
                });
            }
            return true;
        }
        else {
            that.publish('error', errors);
            return false;
        }
    };

    that.get = function (key) {
        return key ? data[key] : copy(data);
    };

    return that;
};
