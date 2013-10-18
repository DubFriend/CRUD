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
                    if(data.textarea !== '') {
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
                        type: 'textarea'
                    },
                    checkbox: {
                        type: 'checkbox',
                        value: true
                    },
                    radio: {
                        type: 'radio',
                        values: ['a', 'b'],
                        value: 'a'
                    },
                    select: {
                        type: 'select',
                        values: ['a', 'b'],
                        value: ['a']
                    }
                }
            });
        }
    });

    test('initial render', function () {
        crud.init();
        //console.log('form-template', crud.formTemplate);
        //console.log('list-template', crud.listTemplate);
        ok($('#thing-crud-container').html(), 'form rendered');
        ok($('#thing-crud-list-container').html(), 'list rendered');
    });

}());
