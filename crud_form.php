<?php
$response = null;
if($_POST['letter'] === 'a') {
    http_response_code(409);
    $response = array(
        'letter' => 'server dont like letter a',
        'GLOBAL' => 'global error message'
    );
}
else {
    $response = true;
}
echo json_encode($response);
?>
