<?php
use \Workerman\Worker;
use \GatewayWorker\Gateway;

$gateway = new Gateway("websocket://0.0.0.0:8282");
$gateway->name = 'BilliardsWebSocketGateway';
$gateway->count = 2;
$gateway->lanIp = '127.0.0.1';
$gateway->startPort = 4000;
$gateway->registerAddress = '127.0.0.1:1238';

$gateway->pingInterval = 30;
$gateway->pingNotResponseLimit = 2;
$gateway->pingData = '{"type":"pong"}';

if (!defined('GLOBAL_START')) {
    Worker::runAll();
}
