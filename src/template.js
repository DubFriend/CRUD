var createFormTemplate = function (schema, crudName) {

    var createInput = function (item, name) {

        var input = function (checked, value, isInputClass) {
            isInputClass = isInputClass === undefined ? true : isInputClass;
            var valueHTML = function () {
                return item.type === 'checkbox' || item.type === 'radio' ?
                    'value="' + value + '" ' : 'value="{{' + name + '}}" ';
            };

            var id = function () {
                return item.type === 'checkbox' || item.type === 'radio' ?
                    'id="' + name + '-' + value + '" ' :
                    'id="' + crudName + '-' + name + '" ';
            };

            return '' +
            (isInputClass ? '<div class="input">' : '') +
                '<input type="' + item.type + '" ' + id() +
                        'name="' + name + '" ' + valueHTML() +
                        (checked ? 'checked' : '') + '/>' +
            (isInputClass ? '</div>' : '');
        };

        var inputGroup = function () {
            return '' +
            '<div class="input">' +
                reduce(item.values, function (acc, value) {
                    acc = acc || '';
                    return acc +
                    '<label for="' + name + '-' + value + '">' +
                        value +
                    '</label>' +
                    '{{#' + name + '.' + value + '}}' +
                        input(true, value, false) +
                    '{{/' + name + '.' + value + '}}' +
                    '{{^' + name + '.' + value + '}}' +
                        input(false, value, false) +
                    '{{/' + name + '.' + value + '}}';
                }) +
            '</div>';
        };

        switch(item.type) {
            case 'text':
            case 'password':
                return input();

            case 'textarea':
                return '' +
                '<div class="input">' +
                    '<textarea id="' + crudName + '-' + name + '" ' +
                              'name="' + name + '">' +
                        '{{' + name + '}}' +
                    '</textarea>' +
                '</div>';

            case 'checkbox':
            case 'radio':
                return inputGroup();

            case 'select':
                return '' +
                '<div class="input">' +
                    '<select name="' + name + '">' +
                        reduce(item.values, function (acc, value) {
                            acc = acc || '';
                            return acc +
                            '{{#' + name + '.' + value + '}}' +
                                '<option value="' + value + '" selected>' +
                                    value +
                                '</option>' +
                            '{{/' + name + '.' + value + '}}' +
                            '{{^' + name + '.' + value + '}}' +
                                '<option value="' + value + '">' +
                                    value +
                                '</option>' +
                            '{{/' + name + '.' + value + '}}';
                        }) +
                    '</select>' +
                '</div>';

            default:
                throw 'Invalid input type: ' + item.type;
        }
    };

    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduce(schema, function (acc, item, name) {
                acc = acc || '';
                return acc +
                '<div class="control-set">' +
                    '<label for="' + crudName + '-' + name + '" class="label">' +
                        name +
                    '</label>' +
                    createInput(item, name) +
                    '<div class="crud-help">{{' + name + 'Help}}</div>' +
                '</div>';
            }) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" value="Save"/>' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};



var createListTemplate = function (schema, crudName) {
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                '<th>' +
                    '<label for="crud-list-select-all">All</label>' +
                    '<input type="checkbox" id="crud-list-select-all"/>' +
                '</th>' +
                reduce(schema, function (acc, item, name) {
                    acc = acc || '';
                    return acc + '<th>' + name + '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
    '</table>';
};
