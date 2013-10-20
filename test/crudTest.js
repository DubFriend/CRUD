(function () {
    'use strict';

    var name = 'thing';

    var crud, $fixture = $('#qunit-fixture'), schema, validate;

    var buildModel = function (fig) {
        fig = fig || {};
        var id = fig.id || undefined;
        var ajax = fig.ajax || function () {};
        return createModel({
            id: id,
            url: 'testurl',
            data: fig.data || getDefaultData(),
            validate: validate,
            ajax: ajax
        });
    };

    var buildController = function () {
        return createController({
            el: '',
            schema: schema,
            template: 'testTemplate',
            model: buildModel()
        });
    };

    var buildFormController = function () {
        return createFormController({
            el: '#' + name + '-crud-container',
            schema: schema,
            model: buildModel(),
            template: createFormTemplate(schema, name)
        });
    };

    var buildListController = function () {
        createListController({
            el: '#' + name + '-crud-list-container',
            schema: schema,
            model: buildModel(),
            template: createListTemplate(schema, name)
        });
    };

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

            validate = function (data) {
                var error = {};
                if(data.text !== 'default') {
                    error.text = 'text error';
                }
                if(data.password !== null) {
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
            };

            crud = createCRUD({
                name: 'thing',
                url: 'crud.php',
                validate: validate,
                schema: schema
            });
        }
    });

    var getDefaultData = function () {
        return map(schema, function (obj) {
            return obj.value || null;
        });
    };

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
        crud.render(union(getDefaultData(), { text: 'wrong' }));
        deepEqual(
            getFormErrorData(),
            union(nullError(), { text: 'text error' }),
            'renders error message'
        );
    });


    test('model.isNew', function () {
        strictEqual(true, buildModel().isNew(), 'model without id is new');
        strictEqual(false, buildModel({ id: 5 }).isNew(), 'model with id is not new');
    });

    asyncTest('model.save', function () {
        expect(5);
        var model = buildModel({
            ajax: function (fig) {
                equal(fig.url, 'testurl', 'ajax correct url');
                equal(fig.method, 'POST', 'ajax post on new save');
                deepEqual(getDefaultData(), fig.data, 'ajax data set');
                model.subscribe('saved', function (thisModel) {
                    equal(thisModel, model, 'models are the same object');
                    strictEqual(false, thisModel.isNew(), 'model no longer new');
                    start();
                });
                fig.success(5);
            }
        });
        model.save();
    });

    asyncTest('model.save errors', function () {
        expect(3);
        var ajaxCalled = false;
        var model = buildModel({
            ajax: function () {
                ajaxCalled = true;
            },
            data: union(getDefaultData(), { text: 'wrong' })
        });

        model.subscribe('formError', function (errors) {
            strictEqual(ajaxCalled, false, 'ajax not called');
            strictEqual(model.isNew(), true, 'still new');
            deepEqual(errors, { text: 'text error' }, 'publishes form errors');
            start();
        });

        model.save();
    });

    asyncTest('model.save not new', function () {
        expect(6);
        var model = buildModel({
            id: 5,
            ajax: function (fig) {
                equal(fig.url, 'testurl/5', 'id added to url');
                equal(fig.method, 'PUT', 'method is put');
                deepEqual(getDefaultData(), fig.data, 'ajax data set (id not included)');
                model.subscribe('saved', function (thisModel) {
                    equal(thisModel, model, 'models are the same object');
                    strictEqual(false, thisModel.isNew(), 'model not new');
                    strictEqual(5, thisModel.id(), 'id is not set by response');
                    start();
                });
                fig.success('not five');
            }
        });
        model.save();
    });

    asyncTest('model.delete', function () {
        expect(6);
        var model = buildModel({
            id: 5,
            ajax: function (fig) {
                equal(fig.url, 'testurl/5', 'id added to url');
                equal(fig.method, 'DELETE', 'method is delete');
                model.subscribe('destroyed', function (thisModel) {
                    equal(thisModel, model, 'models are the same object');
                    strictEqual(true, thisModel.isNew(), 'model is reset to new');
                    strictEqual(thisModel.id(), undefined, 'id is cleared');
                    deepEqual(thisModel.get(), {}, 'model is cleared');
                    start();
                });
                fig.success('?');
            }
        });
        model.delete();
    });

    test('model.delete fail: has no id', function () {
        var isAjaxCalled = false;
        var model = buildModel({
            ajax: function (fig) {
                isAjaxCalled = true;
            }
        });
        model.delete();
        strictEqual(false, isAjaxCalled, 'ajax not called');
        deepEqual({}, model.get(), 'model cleared');
    });

    test('controller.mapModelToView', function () {
        deepEqual(
            buildController().mapModelToView(getDefaultData()),
            {
                checkbox: { a: true, b: true },
                password: null,
                radio: { a: true },
                select: { b: true },
                text: "default",
                textarea: "default"
            },
            'maps data for view'
        );
    });

    test('formController.serialize', function () {
        deepEqual(buildFormController().serialize(), getFormData());
    });

}());
