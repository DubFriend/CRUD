<?php
ini_set('display_errors', 1);
error_reporting(E_STRICT|E_ALL);

define('NUMBER_OF_ROWS_TO_GENERATE', 5000);

require '../sequel.php';

function getRandomFromArray(array $array) {
    return $array[rand(0, count($array) - 1)];
}

$names = explode("\n", file_get_contents('names.txt'));
function getRandomName($names, $numberOfNames = null) {
    $numberOfNames = $numberOfNames > 0 ? $numberOfNames : 1;
    $namesSample = array();
    for($i = 0; $i < $numberOfNames; $i += 1) {
        $namesSample[] = getRandomFromArray($names);
    }
    return implode(', ', $namesSample);
}

$sql = new Sequel(new PDO(
    'mysql:dbname=crud_demo;host=localhost',
    'root',
    'P0l.ar-B3ar'
));

for($i = 0; $i < NUMBER_OF_ROWS_TO_GENERATE; $i += 1) {
    $sql->insert('crud', array(
        'text' => getRandomName($names),
        'textarea' => getRandomName($names, rand(0, 5)),
        'fruit' => getRandomFromArray(array('', 'apple', 'orange', 'apple,orange')),
        'letter' => getRandomFromArray(array('a', 'b', 'c', 'd')),
        'awesome' => getRandomFromArray(array('1', '2', '3'))
    ));
}
?>
