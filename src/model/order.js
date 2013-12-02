var createOrderModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'order'));

    that.toggle = (function () {
        var toggleOrder = ['neutral', 'ascending', 'descending'];
        return function (name) {
            var currentIndex = toggleOrder.indexOf(my.data[name]);
            var newIndex = (currentIndex + 1) % toggleOrder.length;
            var newData = {};
            newData[name] = toggleOrder[newIndex];
            that.set(newData);
        };
    }());

    return that;
};
