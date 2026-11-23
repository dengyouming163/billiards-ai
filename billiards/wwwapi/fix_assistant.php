<?php
$f = file_get_contents("/www/wwwroot/wwwapi/app/storeapi/logic/order/CheckoutLogic.php");
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
$f = str_replace(
    "time() - strtotime(\$item[",
    "(\$now ?? time()) - strtotime(\$item[",
    $f
);
$f = str_replace(
    'time() - strtotime($startedAt)',
    '($now ?? time()) - strtotime($startedAt)',
    $f
);
file_put_contents("/www/wwwroot/wwwapi/app/storeapi/logic/order/CheckoutLogic.php", $f);
echo "Fixed assistant fee\n";
