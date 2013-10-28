<?php
//----------------------------------------------------------
// GET

// items/page/2
// items/page/5?filter_foo=val1&filter_bar=val2...
// items/page/1?order_foo=ascending&order_bar=descending
// items/page/2?order_foo=ascending
// items/page/7?filter_favorite_color=green&order_username=ascending

// always paginate. Example response:
// {
//     "pages": 5,
//     "data": [{row1},{row2},...]
// }

//------------------------------------------------------------
// POST

// items

// return the id of the new item if successfull.  Use the same
// error response schema as for PUT.

//-----------------------------------------------------------
// PUT

// items/id

// respond with true if successfull.  Otherwise set
// http status code to 409. Error response example
// {
//     "GLOBAL": "optional global error response message",
//     "fieldName": "error message for a specific field"
// }

//------------------------------------------------------------
// DELETE

// same schema as for PUT.

ini_set('display_errors', 1);
error_reporting(E_STRICT|E_ALL);

require 'jsonStore.php';
$file = new jsonStore('data');

function getID() {
    return explode('/', $_SERVER['PATH_INFO'])[1];
}

function getPageNO() {
    return explode('/', $_SERVER['PATH_INFO'])[2];
}

$requestData = json_decode(file_get_contents('php://input'), true);

$response = null;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $response = array('pages' => 150, 'data' => $file->select());
        break;
    case 'PUT':
        $file->update($requestData, array('id' => getID()));
        if($requestData['letter'] === 'a') {
            http_response_code(409);
            $response = array(
                'letter' => 'server dont like letter a',
                'GLOBAL' => 'global error message'
            );
        }
        else {
            $response = true;
        }
        break;
    case 'POST':
        $response = $file->insert($_POST);
        break;
    case 'DELETE':
        $file->delete(array('id' => getID()));
        $response = true;
        break;
    default:
        throw new Exception("Invalid Request Method");
}

echo json_encode($response);
?>
