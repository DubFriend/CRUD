var createFormTemplate = function (schema, crudName, crudLabel) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudLabel + '</legend>' +
            '<span class="crud-status">{{status}}</span>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    '<input type="submit" value="Save"/>' +
                    '<button class="crud-close-form">Close</button>' +
                '</div>' +
                '<div class="crud-help">{{GLOBALHelp}}</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};
