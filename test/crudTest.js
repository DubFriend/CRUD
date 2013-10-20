(function () {
    'use strict';

    var crud, $fixture = $('#qunit-fixture'), schema;
    module('crud', {
        setup: function () {
            $fixture.html(
                '<div id="thing-crud-container"></div>' +
                '<div id="thing-crud-list-container"></div>'
            );

            schema = {
                text: {
                    type: 'text',
                    value: 'default'
                },
                password: {
                    type: 'password'
                },
                textarea: {
                    type: 'textarea',
                    value: 'default'
                },
                checkbox: {
                    type: 'checkbox',
                    values: ['a', 'b'],
                    value: ['a', 'b']
                },
                radio: {
                    type: 'radio',
                    values: ['a', 'b'],
                    value: 'a'
                },
                select: {
                    type: 'select',
                    values: ['a', 'b'],
                    value: 'b'
                }
            };

            crud = createCRUD({
                name: 'thing',
                url: 'crud.php',
                validate: function (data) {
                    var error = {};
                    if(data.text !== 'default') {
                        error.text = 'text error';
                    }
                    if(data.password != null) {
                        error.password = 'password error';
                    }
                    if(data.checkbox[0] !== 'a' || data.checkbox[1] !== 'b') {
                        error.checkbox = 'checkbox error';
                    }
                    if(data.textarea !== 'default') {
                        error.textarea = 'textarea error';
                    }
                    if(data.radio !== 'a') {
                        error.radio = 'radio error';
                    }
                    if(data.select !== 'b') {
                        error.select = 'select error';
                    }
                    return error;
                },
                schema: schema
            });
        }
    });

    var getFormData = function () {
        var $el = $('#thing-crud-container');
        var checkbox = [], select = [];
        $el.find('[name="checkbox"]:checked').each(function () {
            checkbox.push($(this).val());
        });
        return {
            text: $el.find('[name="text"]').val(),
            password: $el.find('[name="password"]').val(),
            textarea: $el.find('[name="textarea"]').val(),
            checkbox: checkbox,
            radio: $el.find('[name="radio"]:checked').val(),
            select: $el.find('[name="select"] option:selected').val()
        };
    };

    var getFormErrorData = function () {
        var getErrorFor = function (name) {
            return $('[name="' +  name + '"]')
                .parent().parent().find('.crud-help').html();
        };

        return {
            text: getErrorFor('text'),
            password: getErrorFor('password'),
            textarea: getErrorFor('textarea'),
            checkbox: getErrorFor('checkbox'),
            radio: getErrorFor('radio'),
            select: getErrorFor('select')
        };
    };

    var validFormData = function () {
        return map(schema, partial(dot, 'value'));
    };

    var nullError = function () {
        return {
            text: '',
            password: '',
            textarea: '',
            checkbox: '',
            radio: '',
            select: ''
        };
    };

    test('initial render', function () {
        crud.init();
        ok($('#thing-crud-container').html(), 'form container not empty');
        ok($('#thing-crud-list-container').html(), 'list container not empty');
        deepEqual(getFormErrorData(), nullError(), 'validation errors not rendered');
    });

    test('renders initial values', function () {
        crud.init();
        deepEqual(getFormData(), {
            checkbox: ['a', 'b'],
            password: '',
            radio: 'a',
            text: 'default',
            select: 'b',
            textarea: 'default'
        }, 'renders initial default form values');
    });

    test('renders errors', function () {
        crud.init();
        crud.render(union(validFormData(), { text: 'wrong' }));
        deepEqual(
            getFormErrorData(),
            union(nullError(), { text: 'text error' }),
            'renders error message'
        );
    });

    test('serialize form', function () {
        crud.init();
        deepEqual(crud.serialize(), getFormData());
    });

}());
