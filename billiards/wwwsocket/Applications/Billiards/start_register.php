<?php
use \Workerman\Worker;
use \GatewayWorker\Register;

$register = new Register('text://127.0.0.1:1238');

if (!defined('GLOBAL_START')) {
    Worker::runAll();
}
