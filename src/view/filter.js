var createFilterTemplate = function (schema, crudName, isInstantFilter, crudLabel) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>Search ' + crudLabel + '</legend>' +
            reduceFormSchema(schema, crudName) +
            '<div class="crud-control-set">' +
                '<div class="label">&nbsp;</div>' +
                (
                    isInstantFilter ? '' :
                    '<div class="crud-input-group">' +
                        '<input type="submit" value="Search"/>' +
                    '</div>'
                ) +
            '</div>' +
        '</fieldset>' +
    '</form>';
};
