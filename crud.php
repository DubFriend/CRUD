<?php
$response;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        break;
    case 'PUT':
        $response = true;
        break;
    case 'POST':
        $response = substr(md5(rand()), 0, 7);
        break;
    case 'DELETE':
        $response = true;
        break;
    default:
        throw new Exception("Invalid Request Method");
}
echo json_encode($response);
?>
