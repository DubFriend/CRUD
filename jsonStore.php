<?php
class jsonStore {
    private $path, $data;
    function __construct($path) {
        $this->path = $path . '.json';
        if(!file_exists($this->path)) {
            file_put_contents($this->path, '[]');
            $this->data = array();
        }
        else {
            $this->load();
        }
    }

    function select(array $whereEquals = array()) {
        $results = array();
        $this->eachRowWhereEquals(
            $whereEquals,
            function ($row, $index) use (&$results) {
                $results[] = $row;
            }
        );
        return $results;
    }

    function insert(array $row = array()) {
        if(!array_key_exists('id', $row)) {
            $row['id'] = uniqid();
        }
        if(count($this->select(array('id' => $row['id']))) > 0) {
            throw new Exception("id " . $row['id'] . " allready exists");
        }
        else {
            $this->data[] = $row;
        }
        $this->save();
        return $row['id'];
    }

    function update(array $update = array(), array $whereEquals = array()) {
        $this->eachRowWhereEquals(
            $whereEquals,
            function ($row, $index) use ($update) {
                foreach($update as $key => $value) {
                    $this->data[$index][$key] = $value;
                }
            }
        );
        $this->save();
    }

    function delete(array $whereEquals = array()) {
        $toDelete = array();
        $this->eachRowWhereEquals(
            $whereEquals,
            function ($row, $index) use (&$toDelete) {
                $toDelete[] = $index;
            }
        );
        //loop backwords to avoid indeces going out of sync.
        for($i = count($toDelete) - 1; $i >= 0; $i -= 1) {
            unset($this->data[$toDelete[$i]]);
        }
        $this->save();
    }

    private function eachRowWhereEquals(array $whereEquals, $callback) {
        for($i = 0; $i < count($this->data); $i += 1) {
            $row = $this->data[$i];
            $isMatch = true;
            foreach($whereEquals as $column => $value) {
                if(!array_key_exists($column, $row) || $row[$column] != $value) {
                    $isMatch = false;
                }
            }
            if($isMatch) {
                $callback($row, $i);
            }
        }
    }

    private function load() {
        $this->data = json_decode(file_get_contents($this->path), true);
    }

    private function save() {
        file_put_contents($this->path, json_encode($this->data));
    }
}
?>
