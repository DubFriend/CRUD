#CRUD
##For when you need to get some serious crud done.

Compatable with IE8+

CRUD generates a full featured ajax interface for Creating, Reading, Updating and Deleting Data.

CRUD makes RESTful AJAX requests to the url of your choosing, and makes no assumptions about the backend implementation.  The example backend implementation here is written in PHP, but you are free to use any server side language or framework that you wish.

By default, CRUD will generate a flexible HTML markup, however you can also override these templates with your own custom template generators. (see example_bootstrap.html for a completely overriden example, as well as example_minimal.html as a starting point for building your own custom templates.)

##Example Usage

```javascript
CRUD.full({
	//The name you are giving to this data collection (should be a single word)
    name: 'Thing',

    //the url that crud will make ajax requests to
    url: 'users.php',khkjh

    //for servers that do not support PUT or DELETE methods.
    //if set to true, POST, PUT, and DELETE requests will all be
    //POST requests with a url method parameter set to POST, PUT or DELETE.
    isSoftREST: false,

    //client side validation.
    validate: function (data) {
        var error = {};
        if(data.username.length < 6) {
            error.username = 'Username must be a minimum of 6 characters.';
        }
        return error;
    },

    //can optionaly disable delete functionality
    deletable: true,

    //readOnly will disable delete and edit functionality
    readOnly: false,

    //all items must have a unique id named "id".
    //however you can hide this field from the client interface,
    //simply do not include this field to hide id's.
    id: {
        orderable: true,
        order: 'ascending',
        label: 'id'
    },

    //The schema for each row of your data.
    schema: [
        {
        	//the name used "behind the scenes", (using the fieldname that corresponds)
        	//to your database often makes sense.
            name: 'username',
            //the name that the user sees in the interface.  If the label field is absent,
            //label will default to the "name" field above.
            label: 'Username',
            //the HTML input form type to use. (available options are
            //text, textarea, checkbox, radio, and select)
            type: 'text',
            //optionally set a default value to prepopulate the form when creating
            //a new data item.
            value: 'default'
        },
        {
            name: 'description',
            type: 'textarea',
            //if the orderable field is present, the interface will include a control to sort
            //the data items by this field. (It's up to you to implement this on the server)
            orderable: true,
            //set the default order to 'ascending', 'descending', or 'neutral'
            order: 'ascending'
        },
        {
            name: 'fruit',
            type: 'checkbox',
            values: [
                { value: 'apple', label: 'La Pomme' },
                { value: 'orange', label: 'L\'Orange' }
            ],
            //a checkbox group is the only fieldtype that holds multiple values (hence the array)
            value: ['orange']
        },
        {
            name: 'letter',
            type: 'radio',
            values: [
                { value: 'a', label: 'A' },
                { value: 'b' },
                { value: 'c' },
                { value: 'd', label: 'D' }
            ],
            value: 'b',
            orderable: true
        },
        {
            name: 'awesome',
            type: 'select',
            values: [
            	//note that all values should be of the type string
                { value: '1', label: 'One' },
                { value: '2', label: 'Two' },
                { value: '3', label: 'Three' }
            ]
        }
    ],

    //if instantFilter is set to true, the search module will respond without
    //the user having to click an "enter" button.
    instantFilter: true,
    //the schema used for the search module.  Follows the same format as the regular schema,
    //but does not support the "order" field.  Note that you will need to implement any
    //search (filter) functionality on the server.
    filterSchema: [
        {
            name: "Maximum_Awesome",
            label: "Awesome",
            type: 'select',
            values: [
                { value: '1', label: '<= One' },
                { value: '2', label: '<= Two' },
                { value: '3', label: '<= Three' }
            ],
            value: '3'
        },
        {
            name: "Textarea",
            label: "Textarea",
            type: 'text'
        },
        {
            name: "fruit",
            type: 'checkbox',
            values: [
                { value: 'apple', label: 'pomme' },
                { value: 'orange' }
            ]
        }
    ]
});

```

##Implementing the server

You may also see crud.php for a fully worked out example of a backend implementation

(the following examples assume the supplied base url is called "crud.php")

###GET
GET requests are for retrieving data from the server.

All get requests are paginated, urls are of the format crud.php/page/page#?(order and filter parameters)

for example to get the 3rd page of results where "Textarea" is equal to "foo", and the results are ordered by 'letter', ascending, the request would be:

####Some example URL's
items/page/2
items/page/5?filter_foo=val1&filter_bar=val2
items/page/1?order_foo=ascending&order_bar=descending
items/page/7?filter_favorite_color=green&order_username=ascending


####GET Response

Responses to a get request must be a json response of the form:
```json
{
	"pages": "number of pages of results for the given request",
	"data": "rows of the returned data (each row must include a field named "id")"
}
```
Note that all rows must return a unique identifier of the name "id".

Example:
```json
{
	"pages": 7,
	"data": [
		{ "id": 2, "fieldA": "foo" },
		{ "id": 3, "fieldA": "bar" }
	]
}
```

###PUT
PUT requests are for editing a single item of data that allready exists on the server.

PUT request urls are of the format crud.php/id

for example to edit the field with an id of 5 the url would be crud.php/5

the body of the request will be a single JSON object of the form
{ "fieldName": "new value", ... }

####PUT Response

If the update/edit is successfull, simply return true.  If some server-side validation fails, you can return an error object of the same format in the client side validation.  In this case, you will also need to set the HTTP response code to 409 (Conflict)

###POST
POST requests are for creating a new data item.  The request url will simply be the base url provided (crud.php in these examples).  If successfull, the server should return the id of the newly created item.  If server-side validation fails, return an error object with a HTTP response code of 409.

###DELETE
DELETE requests are for deleting a single data item.  DELETE requests have no body, and have a request url of the format crud.php/id

for example crud.php/5 should delete the data item with an id of 5.

Return true if the delete request is successfull.
Return an error object with an HTTP response code of 409 if the item cannot be deleted.


##formList

CRUD.full({...}) creates a fully featured interface, with search and ordering features.  Sometimes however, you know that you'll only ever have a few data items to deal with, and need a much lighter weight interface.

###Example Usage

The Configuration is the same as CRUD.full({}) only their are no filterSchema, id, or order fields.

```javascript
CRUD.formList({
    name: 'Thing',
    url: 'crud.php',

    //isSoftREST: true,

    validate: function (data) {
        var error = {};
        if(data.text.length < 3) {
            error.text = '3 character minimum';
        }
        return error;
    },

    //deletable: false,
    //readOnly: true,

    schema: [
        {
            name: 'text',
            label: 'label yo',
            type: 'text',
            value: 'default'
        },
        {
            name: 'textarea',
            type: 'textarea',
            orderable: true,
            order: 'ascending'
        },
        {
            name: 'fruit',
            type: 'checkbox',
            values: [
                { value: 'apple', label: 'La Pomme' },
                { value: 'orange', label: 'L\'Orange' }
            ],
            value: ['orange']
        },
        {
            name: 'letter',
            type: 'radio',
            values: [
                { value: 'a', label: 'A' },
                { value: 'b' },
                { value: 'c' },
                { value: 'd', label: 'D' }
            ],
            value: 'b',
            orderable: true
        },
        {
            name: 'awesome',
            type: 'select',
            values: [
                { value: '1', label: 'One' },
                { value: '2', label: 'Two' },
                { value: '3', label: 'Three' }
            ]
        }
    ]
});
```

###GET
A single GET request is made to the supplied url after being initiated.  Unlike CRUD.full(),
 the GET request is not paginated.  The server should respond by sending the appropriate data items using the same JSON format as in CRUD.full() (The "pages" field will be unecessary though).

###PUT, POST, DELETE
Follow the same format as in CRUD.full()
