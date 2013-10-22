<?php
class JSONstore {
    private $path;
    function __construct($path) {
        $this->path = $path;
    }

    function select(array $whereEquals = array()) {

    }

    function insert(array $row = array()) {

    }

    function update(array $row = array(), array $whereEquals = array()) {

    }

    function delete(array $whereEquals = array()) {

    }

    private function load() {

    }

    private function save(array $data) {

    }
}

$response;
switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $response = array(
            array(
                'id' => '7',
                'text' => 'foo',
                'fruit' => array('apple', 'orange'),
                'letter' => 'b',
                'awesome' => '4'
            ),
            array(
                'id' => '8',
                'fruit' => array('apple'),
                'text' => 'default',
                'color' => 'blue'
            )
        );
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
