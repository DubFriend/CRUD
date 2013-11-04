var createInput = function (item, name, crudName) {

    var ID = generateUniqueID() + '-';

    var input = function (checked, value, isInputClass) {
        isInputClass = isInputClass === undefined ? true : isInputClass;
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
                return (acc || '') +
                '<label for="' + ID + name + '-' + value + '">' +
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
            return input();

        case 'password':
            return input();

        case 'textarea':
            return '' +
            '<div class="input">' +
                '<textarea id="' + ID + crudName + '-' + name + '" ' +
                          'name="' + name + '">' +
                    '{{' + name + '}}' +
                '</textarea>' +
            '</div>';

        case 'checkbox':
            return inputGroup();

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

var reduceFormSchema = function (schema, crudName) {
    return reduce(schema, function (acc, item, name) {
        return (acc || '') +
        '<div class="control-set">' +
            '<label for="' + crudName + '-' + name + '" class="label">' +
                name +
            '</label>' +
            createInput(item, name, crudName) +
            '<div class="crud-help">{{' + name + 'Help}}</div>' +
        '</div>';
    });
};

// ########   #######   ########   ##     ##
// ##        ##     ##  ##     ##  ###   ###
// ##        ##     ##  ##     ##  #### ####
// ######    ##     ##  ########   ## ### ##
// ##        ##     ##  ##   ##    ##     ##
// ##        ##     ##  ##    ##   ##     ##
// ##         #######   ##     ##  ##     ##

var createFormTemplate = function (schema, crudName) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduceFormSchema(schema, crudName) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" class="js-crud-save" value="Save"/>' +
                    '<button id="crud-new-item" type="button">' +
                        'New ' + crudName +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};

// ########  ####  ##        ########  ########  ########
// ##         ##   ##           ##     ##        ##     ##
// ##         ##   ##           ##     ##        ##     ##
// ######     ##   ##           ##     ######    ########
// ##         ##   ##           ##     ##        ##   ##
// ##         ##   ##           ##     ##        ##    ##
// ##        ####  ########     ##     ########  ##     ##


var createFilterTemplate = function (schema, crudName) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>Search ' + crudName + '</legend>' +
            reduceFormSchema(schema, crudName) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" class="js-crud-filter" value="Search"/>' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};

// ##        ####   ######   ########      ####  ########  ########  ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ###   ###
// ##         ##   ##           ##          ##      ##     ##        #### ####
// ##         ##    ######      ##          ##      ##     ######    ## ### ##
// ##         ##         ##     ##          ##      ##     ##        ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ##     ##
// ########  ####   ######      ##         ####     ##     ########  ##     ##

var createListItemTemplate = function (schema, crudName) {
    return '' +
    '<td><input type="checkbox" class="crud-list-selected"/></td>' +
    reduce(schema, function (acc, item, name) {
        return (acc || '') +
        '<td class="crud-list-item-column" name="' + name + '">{{' + name + '}}</td>';
    });
};

// ##        ####   ######   ########
// ##         ##   ##    ##     ##
// ##         ##   ##           ##
// ##         ##    ######      ##
// ##         ##         ##     ##
// ##         ##   ##    ##     ##
// ########  ####   ######      ##

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
                    return (acc || '') +
                    '<th>' +
                        '{{#orderable.' + name + '}}' +
                            '<a href="#" data-name="' + name + '" class="crud-order">' +
                                '{{#order.' + name + '.ascending}}' +
                                    '<span  crud-order-ascending">' +
                                        '{{{orderIcon.ascending}}}' +
                                    '</span>' +
                                '{{/order.' + name + '.ascending}}' +

                                '{{#order.' + name + '.descending}}' +
                                    '<span class="crud-order-descending">' +
                                        '{{{orderIcon.descending}}}' +
                                    '</span>' +
                                '{{/order.' + name + '.descending}}' +

                                '{{#order.' + name + '.neutral}}' +
                                    '<span class="crud-order-neutral">' +
                                        '{{{orderIcon.neutral}}}' +
                                    '</span>' +
                                '{{/order.' + name + '.neutral}}' +
                            '</a>' +
                        '{{/orderable.' + name + '}}' +
                        '<span class="crud-th-content">' +
                            name +
                        '</span>' +
                    '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody id="crud-list-item-container"></tbody>' +
    '</table>' +
    '<button id="crud-delete-selected">Delete Selected</button>';
};

// ########      ###      ######    ####  ##    ##     ###     ########   #######   ########
// ##     ##    ## ##    ##    ##    ##   ###   ##    ## ##       ##     ##     ##  ##     ##
// ##     ##   ##   ##   ##          ##   ####  ##   ##   ##      ##     ##     ##  ##     ##
// ########   ##     ##  ##   ####   ##   ## ## ##  ##     ##     ##     ##     ##  ########
// ##         #########  ##    ##    ##   ##  ####  #########     ##     ##     ##  ##   ##
// ##         ##     ##  ##    ##    ##   ##   ###  ##     ##     ##     ##     ##  ##    ##
// ##         ##     ##   ######    ####  ##    ##  ##     ##     ##      #######   ##     ##

var createPaginatorTemplate = function () {
    return '' +
    '<div class="crud-paginator">' +
        '<ol class="crud-pages">' +
            '{{#pages}}' +
                '<li><a data-page-number="{{.}}" href="#/page/{{.}}">{{.}}</a></li>' +
            '{{/pages}}' +
        '</ol>' +
        '<form class="crud-goto-page-form">' +
            '<span class="number-of-pages">pages: {{numberOfPages}}</span>' +
            '<input type="text" name="goto-page" id="crud-goto-page" placeholder="page #"/>' +
            '<input type="submit" value="Go"/>' +
            '<div class="crud-help"></div>' +
        '</form>' +
    '</div>';
};
