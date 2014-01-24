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

require 'sequel.php';

define('ROWS_PER_PAGE', 10);

$sql = new Sequel(new PDO(
    'mysql:dbname=crud_demo;host=localhost',
    'root',
    'P0l.ar-B3ar'
));

function getID() {
    return explode('/', $_SERVER['PATH_INFO'])[1];
}

//gets page number off of url with format, base_url/page/5
function getPageNumber() {
    //default to page 1 if none are given.
    if(isset($_SERVER['PATH_INFO'])) {
        $pieces = explode('/', $_SERVER['PATH_INFO']);
        return count($pieces) === 3 ? $pieces[2] : '1';
    }
    else {
        return '1';
    }
}

function doesStartWith($start, $string) {
    return substr($string, 0, strlen($start)) === $start;
}

//example: array('order_a' => 3, 'filter_b' => 'foo') -> array('a' => 3, 'b' => 'foo')
function stripLabelFromKeys($startsWith, array $array) {
    $stripped = array();
    foreach($array as $label => $value) {
        $stripped[substr($label, strlen($startsWith))] = $value;
    }
    return $stripped;
}

function getParameters($startsWith, array $request) {
    $parameters = array();
    foreach($request as $key => $value) {
        if(doesStartWith($startsWith, $key)) {
            $parameters[$key] = $value;
        }
    }
    return stripLabelFromKeys($startsWith, $parameters);
}

function buildOrderBySQL(array $request) {
    $orders = array_filter(
        getParameters('order_', $request),
        function ($direction) {
            return $direction !== 'neutral';
        }
    );
    $orderSQL = array();
    foreach($orders as $column => $direction) {
        if($direction === 'ascending') {
            $orderSQL[] = $column . ' ASC';
        }
        else if($direction === 'descending') {
            $orderSQL[] = $column . ' DESC';
        }
        else {
            throw new Exception(
                '"order_" GET variables must by of values ' .
                '"ascending", "descending", or "neutral"'
            );
        }
    }
    return count($orderSQL) > 0 ? ' ORDER BY ' . implode(', ', $orderSQL) : '';
}

function buildWhereSQL(array $request) {
    $filters = array_filter(getParameters('filter_', $request), function ($value) {
        return $value !== '';
    });
    $filtersSQL = array();
    foreach($filters as $name => $value) {
        switch($name) {
            case 'Maximum_Awesome':
                $filtersSQL[] = 'awesome <= ' . $value;
                break;
            case 'Search_Textarea':
                $filtersSQL[] = 'textarea LIKE "%' . $value . '%"';
                break;
            case 'fruit':
                if(is_array($value)) {
                    $filtersSQL[] = 'fruit = "' . implode(',', $value) . '"';
                }
                else {
                    throw new Exception('Checkboxes should return an array.');
                }
                break;
            default:
                throw new Exception('Invalid filter keyname "' . $name . '".');
        }
    }
    return count($filtersSQL) > 0 ? ' WHERE ' . implode(' AND ', $filtersSQL) : '';
}

$response = null;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $results = $sql->query(
            "SELECT * FROM crud " .
            buildWhereSQL($_GET) . ' ' .
            buildOrderBySQL($_GET) . ' ' .
            'LIMIT ' . ((getPageNumber() - 1) * ROWS_PER_PAGE) . ', ' . ROWS_PER_PAGE
        );


        $unaccountedForColumnData = array_map(function ($row) {
            $row['foo'] = 'bar';
            return $row;
        },$results->toArray());

        $response = array(
            'pages' => ceil($results->count() / ROWS_PER_PAGE),
            'data' => $unaccountedForColumnData
            // 'data' => array_merge($results->toArray())
        );
        break;
    case 'PUT':
        $requestData = json_decode(file_get_contents('php://input'), true);
        if($requestData['letter'] === 'a') {
            http_response_code(409);
            $response = array(
                'letter' => 'server dont like letter a',
                'GLOBAL' => 'global error message'
            );
        }
        else {
            $requestData['fruit'] = implode(',', $requestData['fruit']);
            $response = $sql->update('crud', $requestData, array('id' => getID()));
        }
        break;
    case 'POST':
        $_POST['fruit'] = implode(',', $_POST['fruit']);
        $response = $sql->insert('crud', $_POST);
        break;
    case 'DELETE':
        $response = $sql->delete('crud', array('id' => getID()));
        break;
    default:
        throw new Exception("Invalid Request Method");
}

echo json_encode($response);
?>
