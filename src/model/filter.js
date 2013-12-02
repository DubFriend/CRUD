var createFilterModel = function (fig) {
    fig = fig || {};
    var my = {},
        that = createModel(fig, my),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'filter'));

    return that;
};
