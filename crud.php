<?php
$response;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        break;
    case 'PUT':
        break;
    case 'POST':
        break;
    case 'DELETE':
        break;
    default:
        throw new Exception("Invalid Request Method");
}
echo json_encode($response);
?>
