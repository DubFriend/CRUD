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
        reduce(item.values, function (acc, value) {
            return (acc || '') +
            '<label for="' + ID + name + '-' + value + '">' +
                value +
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
            '<div class="crud-control-set">' +
                '<label>&nbsp;</label>' +
                '<div class="crud-input-group">' +
                    '<input type="submit" value="Save"/>' +
                    '<button class="crud-new-item">' +
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

var createFilterTemplate = function (schema, crudName, isInstantFilter) {
    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>Search ' + crudName + '</legend>' +
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

// ##        ####   ######   ########      ####  ########  ########  ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ###   ###
// ##         ##   ##           ##          ##      ##     ##        #### ####
// ##         ##    ######      ##          ##      ##     ######    ## ### ##
// ##         ##         ##     ##          ##      ##     ##        ##     ##
// ##         ##   ##    ##     ##          ##      ##     ##        ##     ##
// ########  ####   ######      ##         ####     ##     ########  ##     ##

var createListItemTemplate = function (schema, id, deletable) {
    return '' +
    (
        deletable ?
            '<td><input type="checkbox" class="crud-list-selected"/></td>' : ''
    ) +
    (function () {
        if(id) {
            return '<td name="id">{{id}}</td>';
        }
        else {
            return '';
        }
    }()) +
    reduce(schema, function (acc, item) {
        return (acc || '') +
        '<td name="' + item.name + '">{{' + item.name + '}}</td>';
    });
};

// ##        ####   ######   ########
// ##         ##   ##    ##     ##
// ##         ##   ##           ##
// ##         ##    ######      ##
// ##         ##         ##     ##
// ##         ##   ##    ##     ##
// ########  ####   ######      ##

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

var createListTemplate = function (schema, crudName, id, deletable) {
    var ID = generateUniqueID();
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                (
                    deletable ?
                    '<th>' +
                        '<label for="' + ID + '-crud-list-select-all">All</label>' +
                        '<input type="checkbox" id="' + ID + '-crud-list-select-all" ' +
                               'class="crud-list-select-all"/>' +
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

// ########   ########  ##        ########  ########  ########
// ##     ##  ##        ##        ##           ##     ##
// ##     ##  ##        ##        ##           ##     ##
// ##     ##  ######    ##        ######       ##     ######
// ##     ##  ##        ##        ##           ##     ##
// ##     ##  ##        ##        ##           ##     ##
// ########   ########  ########  ########     ##     ########

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
                '<li><a data-page-number="{{.}}" href="#">{{.}}</a></li>' +
            '{{/pages}}' +
        '</ol>' +
        '<form class="crud-goto-page-form">' +
            '<span class="number-of-pages">pages: {{numberOfPages}}</span>' +
            '<input type="text" name="goto-page" placeholder="page #"/>' +
            '<input type="submit" value="Go"/>' +
            '<div class="crud-help"></div>' +
        '</form>' +
    '</div>';
};
