(function () {
    'use strict';

    var name = 'thing';

    var crud, $fixture = $('#qunit-fixture'), schema, validate;

    var buildModel = function (fig) {
        fig = fig || {};
        var id = fig.id || undefined;
        var ajax = fig.ajax || function () {};
        return createSchemaModel({
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
            createDefaultModel: buildModel,
            template: createFormTemplate(schema, name)
        });
    };

    var buildSchema = function (extend) {
        return union({
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
        }, extend || {});
    };

    module('crud', {
        setup: function () {
            $fixture.html(
                '<div id="thing-crud-container"></div>' +
                '<div id="thing-crud-list-container"></div>'
            );

            schema = buildSchema();

            validate = function (data) {
                var error = {};
                if(data.text !== 'default') {
                    error.text = 'text error';
                }
                if(data.password !== '') {
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
                schema: buildSchema()
            });
        }
    });

    var getDefaultData = function () {
        return map(buildSchema(), function (obj) {
            return obj.value || '';
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
        buildFormController().render(union(getDefaultData(), { text: 'wrong' }));
        deepEqual(
            getFormErrorData(),
            union(nullError(), { text: 'text error' }),
            'renders error message'
        );
    });

    test('checkbox no values', function () {
        crud = createCRUD({
            name: 'thing',
            url: 'crud.php',
            validate: validate,
            schema: buildSchema({
                checkbox: {
                    type: 'checkbox',
                    values: ['a', 'b']
                }
            })
        });
        crud.init();
        ok(true, 'initiated without error');
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
                model.subscribe('saved', function (wasNew) {
                    //equal(thisModel, model, 'models are the same object');
                    //setTimeout(function () {
                    strictEqual(wasNew, true, 'passed previous "new" status');
                    //strictEqual(false, thisModel.isNew(), 'model no longer new');
                    strictEqual(false, model.isNew(), 'model no longer new');
                    start();
                    //}, 0);

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

        model.subscribe('error', function (errors) {
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
                model.subscribe('saved', function (wasNew) {
                    strictEqual(wasNew, false, 'previous "new" status is false');
                    strictEqual(model.isNew(), false, 'model not new');
                    strictEqual(5, model.id(), 'id is not set by response');
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
                model.subscribe('destroyed', function (id) {
                    equal(id, 5, 'models are the same object');
                    strictEqual(true, model.isNew(), 'model is reset to new');
                    strictEqual(model.id(), undefined, 'id is cleared');
                    deepEqual(model.get(), {}, 'model is cleared');
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
        deepEqual(model.get(), {}, 'model cleared');
    });

    test('controller.mapModelToView', function () {
        deepEqual(
            buildController().mapModelToView(getDefaultData()),
            {
                checkbox: { a: true, b: true },
                password: '',
                radio: { a: true },
                select: { b: true },
                text: 'default',
                textarea: 'default'
            },
            'maps data for view'
        );
    });

    test('formController.serialize', function () {
        deepEqual(buildFormController().serialize(), getFormData());
    });

    test('formController updates view on model change', function () {
        var controller = buildFormController();
        controller.model.set({ text: 'foo' });
        deepEqual(getFormData(), union(getDefaultData(), { text: 'foo' }));
    });


    var listItemController;
    var buildListItemController = function (el) {
        return createListItemController({
            el: el || '#list-item-container',
            model: buildModel({ id: 5 }),
            schema: buildSchema(),
            template: createListItemTemplate(buildSchema())
        });
    };

    var getListItemData = function (el) {
        var $el = $(el || '#list-item-container');
        return map(buildSchema(), function (val, name) {
            return $el.find('[name="' + name + '"]').html();
        });
    };

    module('listItemController', {
        setup: function () {
            $fixture.html('<tr id="list-item-container"></tr>');
            listItemController = buildListItemController();
        }
    });

    test('listItemController, renders data', function () {
        listItemController.render();
        deepEqual(
            getListItemData(),
            union(getDefaultData(), { checkbox: 'a, b' }),
            'renders expected data'
        );
    });

    test('listItemController, does not render on model change', function () {
        listItemController.render();
        listItemController.model.set({ checkbox: ['b'] });
        deepEqual(
            getListItemData(),
            union(getDefaultData(), { checkbox: 'a, b' }),
            'renders expected data'
        );
    });

    test('listItemController, renders on model saved', function () {
        listItemController.model.publish('saved', listItemController.model);
        deepEqual(
            getListItemData(),
            union(getDefaultData(), { checkbox: 'a, b' }),
            'renders expected data'
        );
    });

    test('listItemController, publishes selected on click', function () {
        var isSelectedPublished;
        listItemController.render();
        listItemController.subscribe('selected', function (controller) {
            isSelectedPublished = true;
        });
        listItemController.$('.crud-list-item-column').click();
        strictEqual(isSelectedPublished, true, 'publishes on click');
    });



    test('listItemController.isSelected', function () {
        listItemController.render();
        strictEqual(listItemController.isSelected(), false, 'initially unselected');
        $('.crud-list-selected').attr('checked', true);
        strictEqual(listItemController.isSelected(), true, 'selected');
    });

    var listController;
    var buildListController = function () {
        return createListController({
            el: '#' + name + '-crud-list-container',
            schema: buildSchema(),
            model: buildModel(),
            template: createListTemplate(buildSchema(), name)
        });
    };

    var getListHeaderData = function () {
        var $el = $('#thing-crud-list-container');
        var mapped = [];
        $el.find('th').each(function () {
            mapped.push($(this).html());
        });
        mapped.shift(); //remove the "All" checkbox
        return mapped;
    };

    module('listController', {
        setup: function () {
            listController = buildListController();
            $fixture.html('<div id="thing-crud-list-container"></div>');
        }
    });

    test('renders head', function () {
        listController.render();
        deepEqual(getListHeaderData(), keys(getDefaultData()));
    });

    test('add', function () {
        listController.render();
        listController.add(buildListItemController('#crud-list-item-5'));
        deepEqual(
            getListItemData('#crud-list-item-5'),
            union(getDefaultData(), { checkbox: 'a, b' }),
            'item gets rendered'
        );
    });

    test('remove', function () {
        listController.render();
        listController.add(buildListItemController('#crud-list-item-5'));
        listController.remove(5);
        strictEqual($('#crud-list-item-container').html(), '', 'item removed');
    });


    var paginatorModel;
    module('paginator model', {
        setup: function () {
            paginatorModel = createPaginatorModel();
        }
    });

    var getDefaultPaginatorData = function (){
        return { pageNumber: 1, numberOfPages: 1 };
    };

    test('validate zero', function () {
        deepEqual(paginatorModel.validate({ pageNumber: 0 }), {
            pageNumber: 'Page number must be greater than zero.'
        }, 'pageNumber must be > 0');
    });

    test('validate pageNumber too large', function () {
        deepEqual(paginatorModel.validate({ pageNumber: 2 }), {
            pageNumber: 'Page number must be less than or ' +
                        'equal to the number of pages.'
        }, 'pageNumber cannot exceed number of pages');
    });

    test('validate based on supplied numberOfPages if given.', function () {
        deepEqual(
            paginatorModel.validate({ pageNumber: 3, numberOfPages: 3 }), {},
            'responds to numberOfPages being set.'
        );
    });

    test('validate if only numberOfPages given and makes pageNumber too large', function () {
        paginatorModel.set({ pageNumber: 2, numberOfPages: 3 });
        deepEqual(paginatorModel.validate({ numberOfPages: 1 }), {
            pageNumber: 'Page number must be less than or ' +
                        'equal to the number of pages.'
        });
    });

    asyncTest('set', function () {
        expect(2);
        paginatorModel.subscribe('change', function (data) {
            deepEqual(data, { numberOfPages: 3, pageNumber: 2 }, 'publishes');
            start();
        });
        paginatorModel.set({numberOfPages: 3, pageNumber: 2 });
        deepEqual(paginatorModel.get(), {numberOfPages: 3, pageNumber: 2 }, 'data set');
    });

    asyncTest('set error', function () {
        expect(2);
        paginatorModel.subscribe('error', function (errors) {
            deepEqual(errors, {
                pageNumber: 'Page number must be less than or ' +
                            'equal to the number of pages.'
            }, 'publishes error');
            start();
        });
        paginatorModel.set({ pageNumber: 2 });
        deepEqual(paginatorModel.get(), getDefaultPaginatorData(), 'data not set');
    });


    // var buildFormController = function () {
    //     return createFormController({
    //         el: '#' + name + '-crud-container',
    //         schema: schema,
    //         model: buildModel(),
    //         createDefaultModel: buildModel,
    //         template: createFormTemplate(schema, name)
    //     });
    // };

    var paginatorController;
    module('paginatorController', {
        setup: function () {
            //note: .crud-pages has a padding of 6px and zero margin.
            //      .crud-pages li have widths of 10px.
            //set in the html test file.
            $fixture.html(
                '<div id="thing-crud-list-container"></div>' +
                '<div id="thing-crud-paginator-nav"></div>'
            );
            $fixture.find('#thing-crud-list-container').width(31);
            paginatorController = createPaginatorController({
                el: '#thing-crud-paginator-nav',
                model: createPaginatorModel(),
                template: createPaginatorTemplate()
            });
        }
    });

    test('calculateNumberOfPagesToDisplay', function () {
        strictEqual(
            paginatorController.calculateNumberOfPagesToDisplay(), 2,
            'accounts for padding'
        );
    });

}());

