var createInput = function (fig) {

    var item = fig.item;
    var name = item.name;
    var crudName = fig.name;
    var className = fig.class || '';
    var ID = fig.ID ? fig.ID + '-' : generateUniqueID() + '-';

    var input = function (checked, value) {
        var valueHTML = function () {
            return item.type === 'checkbox' || item.type === 'radio' ?
                'value="' + value + '" ' : 'value="{{' + name + '}}" ';
        };

        var id = function () {
            return item.type === 'checkbox' || item.type === 'radio' ?
                'id="' + ID + name + '-' + value + '" ' :
                'id="' + ID + crudName + '-' + name + '" ';
        };

        return '' +
        '<input type="' + item.type + '" ' + id() +
                'name="' + name + '" ' + valueHTML() +
                ' class="' + className + '" ' +
                (checked ? 'checked' : '') + '/>';
    };

    var inputGroup = function () {
        return '' +
        reduce(item.values, function (acc, valueObject) {
            var value = valueObject.value;
            return (acc || '') +
            '<label for="' + ID + name + '-' + value + '">' +
                (valueObject.label || value) +
            '</label>' +
            '{{#' + name + '.' + value + '}}' +
                input(true, value) +
            '{{/' + name + '.' + value + '}}' +
            '{{^' + name + '.' + value + '}}' +
                input(false, value) +
            '{{/' + name + '.' + value + '}}';
        });
    };

    switch(item.type) {
        case 'text':
            return input();

        case 'password':
            return input();

        case 'textarea':
            return '' +
            '<textarea id="' + ID + crudName + '-' + name + '" ' +
                      'name="' + name + '" class="' + className + '">' +
                '{{' + name + '}}' +
            '</textarea>';

        case 'checkbox':
            return inputGroup();

        case 'radio':
            return inputGroup();

        case 'select':
            return '' +
            '<select name="' + name + '" class="' + className + '">' +
                reduce(item.values, function (acc, valueObject) {
                    var value = valueObject.value;
                    acc = acc || '';
                    return acc +
                    '{{#' + name + '.' + value + '}}' +
                        '<option value="' + value + '" selected>' +
                            (valueObject.label || value) +
                        '</option>' +
                    '{{/' + name + '.' + value + '}}' +
                    '{{^' + name + '.' + value + '}}' +
                        '<option value="' + value + '">' +
                            (valueObject.label || value) +
                        '</option>' +
                    '{{/' + name + '.' + value + '}}';
                }) +
            '</select>';

        default:
            throw 'Invalid input type: ' + item.type;
    }
};


var reduceFormSchema = function (schema, crudName) {
    return reduce(schema, function (acc, item) {
        return (acc || '') +
        '<div class="crud-control-set">' +
            '<label for="' + crudName + '-' + item.name + '">' +
                (item.label || item.name) +
            '</label>' +
            '<div class="crud-input-group">' +
                createInput({
                    item: item,
                    name: crudName,
                    class: 'foo'
                }) +
            '</div>' +
            '<div class="crud-help">{{' + item.name + 'Help}}</div>' +
        '</div>';
    });
};
