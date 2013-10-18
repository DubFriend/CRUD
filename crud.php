<?php
$response;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
    case 'PUT':
    case 'POST':
    case 'DELETE':
    default:
}
echo json_encode($response);
?>
