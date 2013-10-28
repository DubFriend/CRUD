// ##     ##   #######   ########   ########  ##
// ###   ###  ##     ##  ##     ##  ##        ##
// #### ####  ##     ##  ##     ##  ##        ##
// ## ### ##  ##     ##  ##     ##  ######    ##
// ##     ##  ##     ##  ##     ##  ##        ##
// ##     ##  ##     ##  ##     ##  ##        ##
// ##     ##   #######   ########   ########  ########

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

//  ######    ######   ##     ##  ########  ##     ##     ###
// ##    ##  ##    ##  ##     ##  ##        ###   ###    ## ##
// ##        ##        ##     ##  ##        #### ####   ##   ##
//  ######   ##        #########  ######    ## ### ##  ##     ##
//       ##  ##        ##     ##  ##        ##     ##  #########
// ##    ##  ##    ##  ##     ##  ##        ##     ##  ##     ##
//  ######    ######   ##     ##  ########  ##     ##  ##     ##

var createSchemaModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        id = fig.id,
        ajax = fig.ajax || function (fig) {
            $.ajax({
                url: that.isNew() ? my.url : my.url + '/' + that.id(),
                method: fig.method,
                data: fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(my.data) : my.data,
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

// ########      ###      ######    ####  ##    ##     ###     ########   #######   ########
// ##     ##    ## ##    ##    ##    ##   ###   ##    ## ##       ##     ##     ##  ##     ##
// ##     ##   ##   ##   ##          ##   ####  ##   ##   ##      ##     ##     ##  ##     ##
// ########   ##     ##  ##   ####   ##   ## ## ##  ##     ##     ##     ##     ##  ########
// ##         #########  ##    ##    ##   ##  ####  #########     ##     ##     ##  ##   ##
// ##         ##     ##  ##    ##    ##   ##   ###  ##     ##     ##     ##     ##  ##    ##
// ##         ##     ##   ######    ####  ##    ##  ##     ##     ##      #######   ##     ##

var createPaginatorModel = function (fig) {
    fig = fig || {};
    var my = {};
    fig.data = fig.data || {};
    fig.data.pageNumber = fig.pageNumber || 1;
    fig.data.numberOfPages = fig.numberOfPages || 1;

    var that = createModel(fig, my);//mixinPubSub(),
        //data = {},
        //url = fig.url;

    that.validate = function (testData) {
        testData = testData || my.data;
        var errors = {};
        var tempNumberOfPages = testData.numberOfPages !== undefined ?
            testData.numberOfPages : my.data.numberOfPages;
        var tempPageNumber = testData.pageNumber !== undefined ?
            testData.pageNumber : my.data.pageNumber;

        if(tempPageNumber <= 0) {
            errors.pageNumber = 'Page number must be greater than zero.';
        }
        else if(tempPageNumber > tempNumberOfPages) {
            errors.pageNumber = 'Page number must be less than or ' +
                                'equal to the number of pages.';
        }
        return errors;
    };

    that.set = partial(that.set, function (newData) {
        if(newData.pageNumber) {
            $.ajax({
                url: my.url + '/page/' + newData.pageNumber,
                method: 'GET',
                dataType: 'json',
                success: partial(that.publish, 'load'),
                error: partial(ajaxErrorResponse, that)
            });
        }
    });

    return that;
};

//  #######   ########   ########   ########  ########
// ##     ##  ##     ##  ##     ##  ##        ##     ##
// ##     ##  ##     ##  ##     ##  ##        ##     ##
// ##     ##  ########   ##     ##  ######    ########
// ##     ##  ##   ##    ##     ##  ##        ##   ##
// ##     ##  ##    ##   ##     ##  ##        ##    ##
//  #######   ##     ##  ########   ########  ##     ##

var createOrderModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        schemaModel = fig.schemaModel;

    var appendKey = function (appendingString, collection) {
        collection = collection || {};
        return map(collection, identity, function (key) {
            return appendingString + key;
        });
    };

    that.set = partial(that.set, function (newData) {
        fig = fig || {};
        schemaModel.set({ pageNumber: 1 }, { silent: true });
        $.ajax({
            url: my.url + '/page/1',
            method: 'GET',
            data: appendKey('order_', my.data),
            dataType: 'json',
            success: partial(that.publish, 'load'),
            error: partial(ajaxErrorResponse, that)
        });
    });

    return that;
};
