var createDeleteConfirmationTemplate = function () {
    return '' +
    '<div class="crud-delete-modal modal">' +
        '<div class="crud-modal-dialogue">' +
            '<p class="crud-message">' +
                'Are you sure you want to delete the selected items?' +
            '</p>' +
            '<center>' +
                '<button class="crud-confirm-delete">' +
                    'Delete' +
                '</button>' +
                '<button class="crud-cancel-delete">' +
                    'Cancel' +
                '</button>' +
            '</center>' +
        '</div>' +
    '</div>';
};
