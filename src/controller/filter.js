var createFilterController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        filterSchema = that.mapSchema(fig.filterSchema),
        isInstantFilter = fig.isInstantFilter,
        serialize = function () {
            return serializeFormBySchema(that.$(), filterSchema);
        };

    var parentMapModelToView = that.mapModelToView;

    var onFormChange = partial(debounce, 500, function () {
        that.model.set(serialize());
    });

    that.mapModelToView = function (modelData) {
        return parentMapModelToView(modelData, filterSchema);
    };

    that.renderNoError();

    if(isInstantFilter) {
        foreach(filterSchema, function (item, name) {
            var $elem = that.$('[name="' + name + '"]');
            switch(item.type) {
                case 'text':
                case 'password':
                case 'textarea':
                    //wait until end of timeout to execute
                    $elem.keyup(onFormChange(false));
                    break;
                case 'radio':
                case 'checkbox':
                case 'select':
                    //execute immediately
                    $elem.change(onFormChange(true));
                    break;
                default:
                    throw 'Invalid item type: ' + item.type;
            }
        });
    }

    that.$().submit(function (e) {
        e.preventDefault();
        that.model.set(serialize());
    });

    return that;
};
