<?php
namespace Billiards\Models;

use PDO;

class BaseModel
{
    protected static $pdo = null;
    protected $table = '';

    protected static function getConnection()
    {
        if (self::$pdo === null) {
            $config = require __DIR__ . '/../config/database.php';

            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};charset={$config['charset']}";

            self::$pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
        }

        return self::$pdo;
    }

    public function getTable()
    {
        return $this->table;
    }

    public function findAll($conditions = [], $orderBy = '')
    {
        $pdo = self::getConnection();
        $sql = "SELECT * FROM {$this->table}";
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "`{$key}` = :{$key}";
                $params[":{$key}"] = $value;
            }
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy}";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function findOne($conditions = [])
    {
        $pdo = self::getConnection();
        $sql = "SELECT * FROM {$this->table}";
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "`{$key}` = :{$key}";
                $params[":{$key}"] = $value;
            }
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' LIMIT 1';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetch() ?: null;
    }

    public function findByPk($id)
    {
        return $this->findOne(['id' => $id]);
    }

    public function insert($data)
    {
        $pdo = self::getConnection();
        $columns = implode('`, `', array_keys($data));
        $placeholders = implode(', ', array_map(function($key) {
            return ":{$key}";
        }, array_keys($data)));

        $sql = "INSERT INTO {$this->table} (`{$columns}`) VALUES ({$placeholders})";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);

        return $pdo->lastInsertId();
    }

    public function update($data, $conditions)
    {
        $pdo = self::getConnection();
        $setParts = [];
        $params = [];

        foreach ($data as $key => $value) {
            $setParts[] = "`{$key}` = :set_{$key}";
            $params[":set_{$key}"] = $value;
        }

        $whereParts = [];
        foreach ($conditions as $key => $value) {
            $whereParts[] = "`{$key}` = :where_{$key}";
            $params[":where_{$key}"] = $value;
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $setParts) . ' WHERE ' . implode(' AND ', $whereParts);

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount();
    }
}
