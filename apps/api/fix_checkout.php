<?php
$file = "/www/wwwroot/wwwapi/app/storeapi/logic/order/CheckoutLogic.php";
$f = file_get_contents($file);

// 1. calculateTableFee: pass $now and accept optional param
$f = str_replace(
    'self::calculateTableFee($order, $table);',
    'self::calculateTableFee($order, $table, $now);',
    $f
);
$f = str_replace(
    'public static function calculateTableFee($order, $table = null)',
    'public static function calculateTableFee($order, $table = null, ?int $now = null)',
    $f
);
$f = str_replace('$now = time();', '$now = $now ?? time();', $f);

// 2. calculateAssistantFee: pass $now
$f = str_replace(
    'self::calculateAssistantFee($items);',
    'self::calculateAssistantFee($items, $now);',
    $f
);
$f = str_replace(
    'public static function calculateAssistantFee(array $items)',
    'public static function calculateAssistantFee(array $items, ?int $now = null)',
    $f
);
// Fix time() calls in assistant fee
$f = str_replace(
    "time() - strtotime(\$item['started_at'])",
    "(\$now ?? time()) - strtotime(\$item['started_at'])",
    $f
);
$f = str_replace(
    'time() - strtotime($startedAt)',
    '($now ?? time()) - strtotime($startedAt)',
    $f
);

// 3. Fix the checkout function to pass bill_locked_at to getBill
$f = str_replace(
    "\$bill = self::getBill(\$orderId, \$storeId);",
    "\$bill = self::getBill(\$orderId, \$storeId, \$params['bill_locked_at'] ?? null);",
    $f
);

file_put_contents($file, $f);
echo "Fixed\n";
