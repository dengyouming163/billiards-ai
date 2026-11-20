<?php
use \Workerman\Worker;
use \GatewayWorker\Gateway;

$gateway = new Gateway("tcp://0.0.0.0:8283");
$gateway->name = 'BilliardsTCPGateway';
$gateway->count = 1;
$gateway->lanIp = '127.0.0.1';
$gateway->startPort = 4100;
$gateway->registerAddress = '127.0.0.1:1238';

if (!defined('GLOBAL_START')) {
    Worker::runAll();
}
