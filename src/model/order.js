var createOrderModel = function (fig) {
    fig = fig || {};
    var my = {};
    var that = createModel(fig, my),
        orderings = copy(fig.data),
        requestModel = fig.requestModel;

    that.set = partial(that.set, partial(requestModel.search, 'order'));

    that.toggle = (function () {
        var toggleOrder = ['neutral', 'ascending', 'descending'];
        return function (name) {
            var currentIndex = toggleOrder.indexOf(my.data[name]);
            var newIndex = (currentIndex + 1) % toggleOrder.length;
            var newData = {};
            newData[name] = toggleOrder[newIndex];

            if(newData[name] !== 'neutral') {
                that.set(union(map(orderings, function () {
                    return 'neutral';
                }), newData));
            }
            else {
                that.set(newData);
            }
        };
    }());

    return that;
};
