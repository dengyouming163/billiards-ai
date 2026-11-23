<?php
require __DIR__ . '/vendor/autoload.php';
$app = new think\App();
$app->initialize();

$storeId = 'store_0f88f94bc530137f2a8a';
$count = think\facade\Db::name('busi_table')->where('store_id', $storeId)->count();
echo "当前: {$count} 张台桌\n";

$zone = think\facade\Db::name('busi_zone')->where('store_id', $storeId)->find();
$zoneId = $zone ? $zone['id'] : '';

for ($i = 1; $i <= 20; $i++) {
    $name = 'A' . str_pad($count + $i, 2, '0', STR_PAD_LEFT);
    $exists = think\facade\Db::name('busi_table')->where('store_id', $storeId)->where('name', $name)->find();
    if (!$exists) {
        think\facade\Db::name('busi_table')->insert([
            'id' => 'table_' . bin2hex(random_bytes(8)),
            'store_id' => $storeId,
            'zone_id' => $zoneId,
            'name' => $name,
            'number' => $name,
            'status' => 'idle',
            'hourly_rate' => 30,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }
}

$newCount = think\facade\Db::name('busi_table')->where('store_id', $storeId)->count();
echo "新增: " . ($newCount - $count) . " 张\n总计: {$newCount} 张\n";
