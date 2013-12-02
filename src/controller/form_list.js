//extension of formController (only minor changes needed)
var createFormListController = function (fig) {
    var my = {};
    var that = createFormController(fig, my),
        modal = fig.modal,
        deleteConfirmationTemplate = fig.deleteConfirmationTemplate,
        openDeleteConfirmation = function () {
            modal.open(that.$('.crud-delete-modal'));
        },
        closeDeleteConfirmation = function () {
            modal.close(that.$('.crud-delete-modal'));
        };

    that.model.subscribe('saved', function () {
        that.render(that.model.get(), {}, { successMessage: 'Save Successfull.' });
    });

    that.setModel(that.model);

    var parentBind = my.bind;
    my.bind = function () {
        that.$('.crud-delete').unbind();
        that.$('.crud-delete').click(function (e) {
            e.preventDefault();
            openDeleteConfirmation();
        });

        that.$('.crud-confirm-delete').unbind();
        that.$('.crud-confirm-delete').click(function (e) {
            e.preventDefault();
            that.model.delete();
            closeDeleteConfirmation();
        });

        that.$('.crud-cancel-delete').unbind();
        that.$('.crud-cancel-delete').click(function (e) {
            e.preventDefault();
            modal.close(that.$('.crud-delete-modal'));
        });

        parentBind();
    };

    return that;
};
