<?php 
define('APPNAME', 'DATAMAKE_BY_SAIYA');

include 'config.php';
include 'db.php';
$ret = array(
	'result'	=> false,
	'msg'		=> 'Unknown error!'
);
if (!empty($_POST['__action'])) {
	$action = strtolower($_POST['__action']);
	unset($_POST['__action']);
	$result = false;
	switch ($action) {
		case 'test-db':
			$db = getDBInstance($_POST);
			if ( !is_a($db,'DB') ) {
				$ret['msg'] = $db;
			} else {
				$ret = true;
				unset($ret['msg']);
			}
			break;
		case 'insert':
			$ret = insert($_POST);
			break;
		case 'update':
			$ret = update($_POST);
			break;
		case 'delete':
			$ret = delete($_POST);
			break;
		case 'select':
			$ret = select($_POST);
			break;
		case 'sqlstr':
			$ret = executeSql($_POST);
			break;
		default:
			$ret['msg'] = 'No action found!';
			break;
	}
}
$a = json_encode($ret);
error_log(print_r($a,true));
echo json_encode($ret);

function insert($data)
{
	$ret['result'] = false;
	$ret['msg'] = 'Insert failed';
	error_log(print_r($data,true));
	if (!empty($data['__table_name'])) {
		$tableName = $data['__table_name'];

		$db = getDBInstance($data);
		if ( !is_a($db,'DB') ) {
			$ret['msg'] = $db;
			return $ret;
		}
		unset($data['__table_name'],$data['__db_config']);
		$len = count($data);
		if ($len) {
			$sql = 'insert into ' . $tableName;
			$values = array_values($data);
			$keys = array_keys($data);
			$keys = implode(',', $keys);
			$sql .= '(' . $keys . ') ';
			$keys = str_repeat('?,', $len);
			$keys = substr($keys, 0, 2 * $len -1);
			$sql .= 'values(' . $keys . ')';
			try {
				$result = $db->execute($sql,$values);
				if ($result) {
					$ret['result'] = true;
					unset($ret['msg']);
				} else {
					$ret['msg'] = 'Oh dear! I donnot know how this error comes, U could tell me. Thanks.';
				}
			} catch (Exception $e) {
				$ret['msg'] = $e->getMessage();
			}
		} else {
			$ret['msg'] = 'No fields recieved!';
		}
	} else {
		$ret['msg'] = 'No table name recieved!';
	}
	return $ret;
}

function update($data)
{
	$ret['result'] = false;
	$ret['msg'] = 'Delete failed';
	if (!empty($data['__table_name'])) {
		$tableName = $data['__table_name'];

		$db = getDBInstance($data);
		if ( !is_a($db,'DB') ) {
			$ret['msg'] = $db;
			return $ret;
		}
		unset($data['__table_name'],$data['__db_config']);
		if (empty($data['data']) || !is_array($data['data'])) {
			$ret['msg'] = 'No values recieved.';
			return $ret;
		}
		if (empty($data['condition']) || !is_array($data['condition'])) {
			$ret['msg'] = 'No condition recieved! If U wanna update all records in ' . $tableName .', please use db tools.';
			return $ret;
		}
		$sql = 'update ' . $tableName . ' set ';
		$keys = array_keys($data['data']);
		$keys = implode('=?,', $keys);
		$keys .= '=? ';
		$sql .= $keys;
		$values = array_values($data['data']);
		$sql .= 'where ';
		$keys = array_keys($data['condition']);
		$keys = implode('=? and ', $keys);
		$keys .= '=?';
		$keys = array_values($data['condition']);
		$values += $keys;
		try {
			$result = $db->execute($sql,$values);
			if ($result) {
				$ret['result'] = true;
				$ret['msg'] = $result . ' entries have been modified.';
			} else {
				$ret['msg'] = 'No entries have been modified.';
			}
		} catch (Exception $e) {
			$ret['msg'] = $e->getMessage();
		}
	} else {
		$ret['msg'] = 'No table name recieved!';
	}
	return $ret;
}

function delete($data)
{
	$ret['result'] = false;
	$ret['msg'] = 'Delete failed';
	if (!empty($data['__table_name'])) {
		$tableName = $data['__table_name'];

		$db = getDBInstance($data);
		if ( !is_a($db,'DB') ) {
			$ret['msg'] = $db;
			return $ret;
		}
		unset($data['__table_name'],$data['__db_config']);
		$len = count($data);
		if ($len) {
			$sql = 'delete from ' . $tableName . ' where ';
			$keys = array_keys($data);
			$keys = implode('=? and ', $keys);
			$keys .= '=?';
			$sql .= $keys;
			$values = array_values($data);
			try {
				$result = $db->execute($sql,$values);
				if ($ret) {
					$ret['result'] = true;
					$ret['msg'] = $result . ' entries have been deleted.';
				} else {
					$ret['result'] = false;
					$ret['msg'] = 'No entry has been deleted.';
				}
			} catch (Exception $e) {
				$ret['msg'] = $e->getMessage();
			}
		} else {
			$ret['msg'] = 'No condition recieved, U cannot delete the whole table by this tool!';
		}
	} else {
		$ret['msg'] = 'No table name recieved!';
	}
	return $ret;
}

function select($data)
{
	$ret['msg'] = 'select failed';
	$ret['result'] = false;
	if (!empty($data['__table_name'])) {
		$tableName = $data['__table_name'];

		$db = getDBInstance($data);
		if ( !is_a($db,'DB') ) {
			$ret['msg'] = $db;
			return $ret;
		}
		unset($data['__table_name'],$data['__db_config']);
		$len = count($data);
		if ($len) {
			$sql = 'select * from ' . $tableName . ' where ';
			$keys = array_keys($data);
			$keys = implode('=? and ', $keys);
			$keys .= '=?';
			$sql .= $keys;
			$values = array_values($data);
			try {
				$ret['entries'] = $db->getAll($sql,$values);
				$ret['result'] = true;
				unset($ret['msg']);
			} catch (Exception $e) {
				$ret['msg'] = $e->getMessage();
			}
		} else {
			$ret['msg'] = 'No condition recieved! If U wanna lookup all records in ' . $tableName .', please use db tools.';
		}
	} else {
		$ret['msg'] = 'No table name recieved!';
	}
	return $ret;
}

function executeSql($data)
{
	$ret['msg'] = 'execute sql failed';
	$ret['result'] = false;
	if (empty($data['sql']) || !is_string($data['sql'])) {
		$ret['msg'] = 'No sql statement recieved.';
		return $ret;
	}
	$sql = trim($data['sql']);
	$db = getDBInstance($data);
	if ( !is_a($db,'DB') ) {
		$ret['msg'] = $db;
		return $ret;
	}
	if (0 === stripos($sql,'select')) { //select statements
		try {
			$ret['entries'] = $db->getAll($sql);
			$ret['result'] = true;
			unset($ret['msg']);
		} catch (Exception $e) {
			$ret['msg'] = $e->getMessage();
		}
	} else {
		try {
			$ret['result'] = $db->execute($sql);
		} catch (Exception $e) {
			$ret['msg'] = $e->getMessage();
		}
	}
	return $ret;
}

function getDBInstance($data)
{
	global $config;
	$ret = 'Failed to connect to the database.';
	if (!empty($data['__db_config']) && is_array($data['__db_config'])) {
		$config = $data['__db_config'];
	}
	try {
		$ret = DB::getInstance($config);
	} catch (Exception $e) {
		$ret = $e->getMessage();
	}
	return $ret;
}
