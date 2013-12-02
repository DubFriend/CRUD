var orderable = function (name) {
    return '' +
    '{{#orderable.' + name + '}}' +
        '<a href="#" data-name="' + name + '" class="crud-order">' +
            '{{#order.' + name + '.ascending}}' +
                '{{{orderIcon.ascending}}}' +
            '{{/order.' + name + '.ascending}}' +

            '{{#order.' + name + '.descending}}' +
                '{{{orderIcon.descending}}}' +
            '{{/order.' + name + '.descending}}' +

            '{{#order.' + name + '.neutral}}' +
                '{{{orderIcon.neutral}}}' +
            '{{/order.' + name + '.neutral}}' +
        '</a>' +
    '{{/orderable.' + name + '}}';
};

var createListTemplate = function (schema, crudName, id, deletable, readOnly) {
    var ID = generateUniqueID();
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                (
                    !readOnly  ?
                    '<th>' +
                        (
                            deletable ?
                            '<label for="' + ID + '-crud-list-select-all">All</label>' +
                            '<input type="checkbox" id="' + ID + '-crud-list-select-all" ' +
                               'class="crud-list-select-all"/>': ''
                        ) +
                    '</th>' : ''
                ) +
                (
                    id ?
                    '<th>' +
                        orderable('id') +
                        '<span class="crud-th-content">' +
                            (id.label || 'id') +
                        '</span>' +
                    '</th>' : ''
                ) +
                reduce(schema, function (acc, item) {
                    return (acc || '') +
                    '<th>' +
                        orderable(item.name) +
                        '<span class="crud-th-content">' +
                            (item.label || item.name) +
                        '</span>' +
                    '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody class="crud-list-item-container"></tbody>' +
    '</table>' +
    (deletable ? '<button class="crud-delete-selected">Delete Selected</button>' : '');
};
