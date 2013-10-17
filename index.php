<html>
<head>
    <title>CRUD</title>
    <style></style>
</head>
<body>
    <h1>CRUD</h1>
    <div id="thing-container"></div>
    <div id="thing-list-container"></div>

    <script src="jquery-1.10.2.js"></script>
    <script src="mustache.js"></script>
    <script src="crud.js"></script>
    <script>
        var crud = createCRUD({
            id: 'thing',
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
                textarea: {
                    type: 'text'
                },
                checkbox: {
                    type: 'checkbox',
                    value: true
                },
                radio: {
                    type: 'radio'
                    value: 'apple'
                },
                select: {
                    type: 'select',
                    value: 'blue'
                }
            }
        });
    </script>
</body>
</html>