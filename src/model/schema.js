var createSchemaModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        id = fig.id,
        deletable = fig.deletable,

        isSoftREST = fig.isSoftREST,

        ajax = fig.ajax || function (fig) {
            var url = that.isNew() ? my.url : my.url + '/' + that.id(),
                method, data;

            if(isSoftREST) {
                url += '?method=' + fig.method;
                method = 'POST';
                data = my.data;
            }
            else {
                method = fig.method;
                data = fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(my.data) : my.data;
            }
            $.ajax({
                //url: that.isNew() ? my.url : my.url + '/' + that.id(),
                //method: fig.method,
                url: url,
                method: method,
                data: data,
                // data: fig.method === 'PUT' || fig.method === 'DELETE' ?
                //         JSON.stringify(my.data) : my.data,
                dataType: 'json',
                beforeSend: partial(that.publish, 'form:waiting:start'),
                success: fig.success,
                error: partial(ajaxErrorResponse, that),
                complete: partial(that.publish, 'form:waiting:end')
            });
        };

    that.isNew = function () {
        return id === undefined ? true : false;
    };

    that.id = function () {
        return id;
    };

    that.set = partial(that.set, function () {});

    that.clear = function () {
        my.data = {};
        id = undefined;
        that.publish('change', that);
    };

    that.save = function () {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            ajax({
                url: that.isNew() ? my.url : my.url + '/' + id,
                method: that.isNew() ? 'POST' : 'PUT',
                data: my.data,
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
                url: my.url + '/' + id,
                method: 'DELETE',
                success: function (response) {
                    console.log('delete success', response);
                    var id = that.id();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.publish('destroyed');
            that.clear();
        }
    };

    return that;
};
