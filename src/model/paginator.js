var createPaginatorModel = function (fig) {
    fig = fig || {};
    fig.data = fig.data || {};
    fig.data.pageNumber = fig.pageNumber || 1;
    fig.data.numberOfPages = fig.numberOfPages || 1;
    var my = {};
    var that = createModel(fig, my),
        requestModel = fig.requestModel;
        // isFirstPageSet = true;

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

    that.set = function (newData, options) {
        console.log('NEW DATA', newData);
        options = options || {};
        var errors = options.validate === false ? {} : that.validate(newData);
        if(isEmpty(errors)) {
            my.data = union(my.data, newData);
            if(options.silent !== true) {
                that.publish('change', newData);
                if(newData.pageNumber) {
                    that.publish('change:pageNumber', newData);
                    requestModel.changePage(newData.pageNumber, 'paginator');
                }
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

    // that.set = partial(that.set, function (newData) {
    //     console.log('SET', newData);
    //     if(newData.pageNumber) {
    //         that.publish('change:pageNumber', newData);
    //         requestModel.changePage(newData.pageNumber, 'paginator');
    //     }
    // });

    return that;
};
