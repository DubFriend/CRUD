<?php
ini_set('display_errors', 1);
error_reporting(E_STRICT|E_ALL);

require 'jsonStore.php';
$file = new jsonStore('data');

function getID() {
    return explode('/', $_SERVER['PATH_INFO'])[1];
}

$requestData = json_decode(file_get_contents('php://input'), true);
$response = null;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $response = $file->select();
        break;
    case 'PUT':
        $file->update($requestData, array('id' => getID()));
        if($requestData['letter'] === 'a') {
            http_response_code(409);
            $response = array('letter' => 'server dont like letter a');
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
