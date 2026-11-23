<?php
require __DIR__ . '/vendor/autoload.php';
$app = new think\App();
$app->initialize();

$storeId = 'store_0f88f94bc530137f2a8a';

// 1. 创建VIP区域（如不存在）
$zone = think\facade\Db::name('busi_zone')->where('store_id', $storeId)->where('name', 'VIP')->find();
if (!$zone) {
    $zoneId = 'zone_' . bin2hex(random_bytes(8));
    think\facade\Db::name('busi_zone')->insert([
        'id' => $zoneId,
        'store_id' => $storeId,
        'name' => 'VIP',
        'color' => '#8b5cf6',
        'created_at' => date('Y-m-d H:i:s'),
    ]);
    echo "VIP区域已创建\n";
} else {
    $zoneId = $zone['id'];
    echo "VIP区域已存在\n";
}

// 2. 获取A001的计费规则
$a001 = think\facade\Db::name('busi_table')->where('store_id', $storeId)->where('name', 'A001')->find();
$pricingId = $a001 ? ($a001['pricing_id'] ?? '') : '';
$hourlyRate = $a001 ? ($a001['hourly_rate'] ?? 30) : 30;
echo "A001 计费规则: pricing_id={$pricingId}, hourly_rate={$hourlyRate}\n";

// 3. 添加10张VIP台桌
$count = think\facade\Db::name('busi_table')->where('store_id', $storeId)->where('zone_id', $zoneId)->count();
for ($i = 1; $i <= 10; $i++) {
    $num = str_pad($count + $i, 2, '0', STR_PAD_LEFT);
    $name = 'V' . $num;
    $exists = think\facade\Db::name('busi_table')->where('store_id', $storeId)->where('name', $name)->find();
    if (!$exists) {
        think\facade\Db::name('busi_table')->insert([
            'id' => 'table_' . bin2hex(random_bytes(8)),
            'store_id' => $storeId,
            'zone_id' => $zoneId,
            'name' => $name,
            'number' => $name,
            'status' => 'idle',
            'pricing_id' => $pricingId,
            'hourly_rate' => $hourlyRate,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }
}

$vipCount = think\facade\Db::name('busi_table')->where('store_id', $storeId)->where('zone_id', $zoneId)->count();
echo "VIP区域: {$vipCount} 张台桌\n";
$total = think\facade\Db::name('busi_table')->where('store_id', $storeId)->count();
echo "门店总计: {$total} 张\n";
