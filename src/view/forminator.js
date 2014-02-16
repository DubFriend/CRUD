var createForminatorTemplate = function (schema, crudName) {
    'use strict';
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduceFormSchema(schema.form, crudName) +
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    reduce(schema.actions, function (acc, action) {
                        return (acc || '') +
                        '<input type="' + action.type + '" ' +
                               'class="' + action["class"] + '" ' +
                               'value="' + action.label + '"/>';
                    }) +
                '</div>' +
                '<div class="success">' +
                    '{{successMessage}}' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};
