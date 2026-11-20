<?php
/**
 * 公开帮助文档 + 公告 API
 * 绕过框架中间件，直接查询数据库返回 JSON
 * URL: http://poolapi.kyyp.cn/api/help.php?type=articles
 * URL: http://poolapi.kyyp.cn/api/help.php?type=announcements
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    $db = new PDO(
        'mysql:host=127.0.0.1;port=13306;dbname=billiards;charset=utf8mb4',
        'billiards',
        'dengyouming2tll',
        [PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $type = $_GET['type'] ?? 'articles';

    if ($type === 'articles') {
        $stmt = $db->query("SELECT id, title, category, content, created_at FROM bi_help_articles WHERE status='published' ORDER BY sort_order ASC, created_at DESC");
        $list = $stmt->fetchAll();
        echo json_encode(['code' => 1, 'data' => ['list' => $list]], JSON_UNESCAPED_UNICODE);
    } elseif ($type === 'announcements') {
        $stmt = $db->query("SELECT id, title, content, created_at FROM bi_announcements WHERE status='published' ORDER BY created_at DESC LIMIT 20");
        $list = $stmt->fetchAll();
        echo json_encode(['code' => 1, 'data' => ['list' => $list]], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['code' => 0, 'msg' => 'type must be articles or announcements']);
    }
} catch (Exception $e) {
    echo json_encode(['code' => 0, 'msg' => $e->getMessage()]);
}
