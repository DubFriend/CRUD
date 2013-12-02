var createForminatorTemplate = function (schema, crudName) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    '<input type="submit" value="Submit"/>' +
                '</div>' +
                '<div class="success">' +
                    '{{successMessage}}' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};