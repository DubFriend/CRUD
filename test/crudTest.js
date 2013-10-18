(function () {
    'use strict';

    var crud, $fixture = $('#qunit-fixture');
    module('render', {
        setup: function () {
            $fixture.html(
                '<div id="thing-crud-container"></div>' +
                '<div id="thing-crud-list-container"></div>'
            );

            crud = createCRUD({
                name: 'thing',
                url: 'crud.php',
                validate: function (data) {
                    var error = {};
                    if(data.text !== 'default') {
                        error.text = 'text error';
                    }
                    if(data.checkbox !== true) {
                        error.checkbox = 'checkbox error';
                    }
                    if(data.textarea !== 'default') {
                        error.textarea = 'textarea error';
                    }
                    if(data.radio !== 'apple') {
                        error.radio = 'radio error';
                    }
                    if(data.select !== 'blue') {
                        error.select = 'select error';
                    }
                    return error;
                },
                schema: {
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
                        value: ['a', 'b']
                    }
                }
            });
        }
    });

    var getFormData = function () {
        var $el = $('#thing-crud-container');
        var checkbox = [], select = [];
        $el.find('[name="checkbox"]:checked').each(function () {
            checkbox.push($(this).val());
        });
        $el.find('[name="select"] option:selected').each(function () {
            select.push($(this).val());
        });
        return {
            text: $el.find('[name="text"]').val(),
            password: $el.find('[name="password"]').val(),
            textarea: $el.find('[name="textarea"]').val(),
            checkbox: checkbox,
            radio: $el.find('[name="radio"]:checked').val(),
            select: select
        };
    };

    test('initial render', function () {
        crud.init();
        ok($('#thing-crud-container').html(), 'form container not empty');
        ok($('#thing-crud-list-container').html(), 'list container not empty');
    });

    test('renders initial values', function () {
        crud.init();
        deepEqual(getFormData(), {
            checkbox: ['a', 'b'],
            password: '',
            radio: 'a',
            text: 'default',
            select: ['b'],
            textarea: 'default'
        }, 'renders initial default form values');
    });

}());
