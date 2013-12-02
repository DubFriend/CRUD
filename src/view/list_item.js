var createListItemTemplate = function (schema, id, deletable, readOnly) {
    return '' +
    (
        !readOnly ?
        '<td>' +
            (deletable ? '<input type="checkbox" class="crud-list-selected"/>' : '') +
            (readOnly ? '' : '<input type="button" class="crud-edit-button" value="Edit"/>') +
        '</td>' : ''
    ) +
    (id ? '<td name="id">{{id}}</td>' : '') +
    reduce(schema, function (acc, item) {
        return (acc || '') +
        '<td name="' + item.name + '">{{' + item.name + '}}</td>';
    });
};
