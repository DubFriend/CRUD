<?php
abstract class CRUD {
    // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
    const NOT_IMPLEMENTED = 501;
    const CONFLICT = 409;

    private $get, $put, $post, $orderableColumns;

    function __construct(array $fig = array()) {
        $this->get = isset($fig['get']) ? $fig['get'] : $_GET;
        $this->post = isset($fig['post']) ? $fig['post'] : $_POST;
        $this->put = isset($fig['put']) ?
            $fig['put'] : json_decode(file_get_contents('php://input'), true);
        $this->orderableColumns = isset($fig['orderableColumns']) ?
            $fig['orderableColumns'] : array();
    }

    function respond($requestMethod = null) {
        $requestMethod = $requestMethod ?: $_SERVER['REQUEST_METHOD'];
        switch($requestMethod) {
            case 'GET':
                return $this->get();
            case 'PUT':
                return $this->put();
            case 'POST':
                return $this->post();
            case 'DELETE':
                return $this->delete();
            default:
                return $this->unimplementedResponse($requestMethod);
        }
    }

    protected function get() {
        $this->unimplementedResponse('GET');
    }

    protected function put() {
        $this->unimplementedResponse('PUT');
    }

    protected function post() {
        $this->unimplementedResponse('POST');
    }

    protected function delete() {
        $this->unimplementedResponse('DELETE');
    }

    protected function getFilterParameters() {
        return $this->getParameters('filter_', $this->get);
    }

    protected function getOrderParameters() {
        return $this->getParameters('order_', $this->get);
    }

    protected function getPageNumber() {
        //default to page 1 if none are given.
        return isset($this->get['page']) ? $this->get['page'] : 1;
    }

    protected function getID() {
        return isset($this->get['id']) ? $this->get['id'] : null;
    }

    protected function getRequestBody() {
        return $this->post ?: $this->put;
    }

    protected function mapIDKeys(array $data, $idKey) {
        $mapped = array();
        foreach($data as $row) {
            $id = $row[$idKey];
            unset($row[$idKey]);
            $row['id'] = $id;
            $mapped[] = $row;
        }
        return $mapped;
    }

    protected function buildOrderBySQL() {
        $orders = array_filter(
            $this->getOrderParameters(),
            function ($direction) {
                return $direction !== 'neutral';
            }
        );
        $orderSQL = array();
        foreach($orders as $column => $direction) {
            if(in_array($column, $this->orderableColumns)) {
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
            else {
                throw new Exception(
                    $column . ' not in the list or acceptable order columns.'
                );
            }
        }

        return count($orderSQL) > 0 ?
            ' ORDER BY ' . implode(', ', $orderSQL) : '';
    }



    private function unimplementedResponse($method) {
        http_response_code(self::NOT_IMPLEMENTED);
        return array(
            'message' => htmlentities($method) . ' requests are not implemented.'
        );
    }

    private function getParameters($startsWith, array $request) {
        $parameters = array();
        foreach($request as $key => $value) {
            if($this->doesStartWith($startsWith, $key)) {
                $parameters[$key] = $value;
            }
        }
        return $this->stripLabelFromKeys($startsWith, $parameters);
    }

    private function doesStartWith($start, $string) {
        return substr($string, 0, strlen($start)) === $start;
    }

    //example: array('order_a' => 3, 'filter_b' => 'foo') -> array('a' => 3, 'b' => 'foo')
    private function stripLabelFromKeys($startsWith, array $array) {
        $stripped = array();
        foreach($array as $label => $value) {
            $stripped[substr($label, strlen($startsWith))] = $value;
        }
        return $stripped;
    }
}
?>
