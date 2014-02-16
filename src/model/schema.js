var createSchemaModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        id = fig.id,
        deletable = fig.deletable,

        isSoftREST = fig.isSoftREST,

        ajax = fig.ajax || function (fig) {


            // var url = that.isNew() ? my.url : my.url + '/' + that.id(),
            var url = that.isNew() ? my.url : queryjs.set(my.url, { id: that.id() }),
                method, data;

            if(isSoftREST) {
                // url += '?method=' + fig.method;
                url = queryjs.set(url, { method: fig.method });
                method = 'POST';
                data = my.data;
            }
            else {
                method = fig.method;
                data = fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(my.data) : my.data;
            }

            // console.log('method: ', method, ' url: ', url);




            $.ajax({
                url: url,
                method: method,
                data: data,

                cache: false,

                dataType: fig.dataType || 'json',
                beforeSend: partial(that.publish, 'form:waiting:start'),
                success: fig.success,
                error: fig.error || partial(ajaxErrorResponse, that),
                complete: fig.complete || partial(that.publish, 'form:waiting:end')
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
        // console.log('errors', keys(errors));
        if(isEmpty(errors)) {
            ajax({
                // url: that.isNew() ? my.url : my.url + '/' + id,
                url: that.isNew() ? my.url : queryjs.set(my.url, { id: id }),
                method: that.isNew() ? 'POST' : 'PUT',
                data: my.data,
                success: function (response) {
                    // console.log('saved', response);
                    var wasNew = that.isNew();
                    id = that.isNew() ? response : id;
                    that.publish('saved', wasNew);
                },
                error: function (jqXHR, text) {
                    console.log('error: ', text);
                    ajaxErrorResponse(that, jqXHR);
                }
            });
        }
        else {
            that.publish('error', errors);
        }
    };

    // that.delete = function () {
    that["delete"] = function () {
        if(!that.isNew()) {
            ajax({
                // url: my.url + '/' + id,
                url: queryjs.set(my.url, { id: id }),

                method: 'DELETE',
                success: function (response) {
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
