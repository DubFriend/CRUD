var createPaginatorController = function (fig) {
    fig = fig || {};
    var that = createController(fig);

    var bind = function () {
        that.$('li a').unbind();
        that.$('li a').click(function (e) {
            e.preventDefault();
            var pageNumber = Number($(this).data('page-number'));
            that.model.set({ pageNumber: pageNumber });
        });

        that.$('.crud-goto-page-form').unbind();
        that.$('.crud-goto-page-form').submit(function (e) {
            e.preventDefault();
            var $input = that.$('.crud-goto-page-form').find('[name="goto-page"]');
            var pageNumber = $input.val();
            if(isInteger(pageNumber)) {
                that.model.set({ pageNumber: Number(pageNumber) });
            }
            else {
                $input.val('');
            }
        });

        that.publish('bind');
    };

    var calculatePageRange = function () {
        // ex: [-2, -1, 0, 1, 2] -> [1, 2, 3, 4, 5]
        var rolloverNegatives = function (array) {
            var shifted = [];
            foreach(reverse(array), function (number) {
                if(number <= 0) {
                    shifted.push(last(shifted) + 1);
                }
                else {
                    shifted.unshift(number);
                }
            });
            return shifted;
        };

        //should be called after rolloverNegatives
        var rolloverPastMaxPageNumber = function (array) {
            var shifted = [];
            foreach(array, function (number) {
                var rolloverValue = shifted.length === 0 ?
                    number : shifted[0] - 1;
                if(number <= that.model.get('numberOfPages')) {
                    shifted.push(number);
                }
                else if(rolloverValue > 0) {
                    shifted.unshift(rolloverValue);
                }
            });
            return shifted;
        };

        var currentPage = that.model.get('pageNumber');
        return rolloverPastMaxPageNumber(
            rolloverNegatives(range(currentPage - 3, currentPage + 3))
        );
    };

    that.setSelected = function (pageNumber) {
        that.$('li a').removeClass('selected');
        that.$('li a[data-page-number="' + pageNumber + '"]').addClass('selected');
    };

    that.render = function (pages) {
        pages = pages || calculatePageRange();
        var error = that.model.validate();
        that.$().html(fig.render(that.template, {
            pages: pages,
            numberOfPages: that.model.get('numberOfPages'),
            error: error
        }));
        that.setSelected(that.model.get('pageNumber'));
        bind();
    };

    that.setPage = function (pageNumber) {
        that.model.set({ pageNumber: pageNumber });
    };

    that.setNextPage = throttle(300, function () {
        var currentPage = that.model.get('pageNumber');
        if(currentPage + 1 <= that.model.get('numberOfPages')) {
            that.setPage(currentPage + 1);
        }
    });

    that.setPreviousPage = throttle(300, function () {
        var currentPage = that.model.get('pageNumber');
        if(currentPage > 1) {
            that.setPage(currentPage - 1);
        }
    });

    that.model.subscribe('change', function (data) {
        that.render();
    });

    return that;
};
