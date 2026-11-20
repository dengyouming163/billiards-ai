# 一键结算提成实施计划

> **Goal:** 新增后端批量提成结算 API + 前端一键结算按钮

---

### Task 1: 后端 — 新增批量结算 API

**文件:** 修改 `d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\assistant\AssistantController.php`

- [ ] **Step 1: 新增 batchSettleCommission 方法**

```php
/**
 * 一键结算历史提成
 * POST /assistant.Assistant/batchSettleCommission
 */
public function batchSettleCommission()
{
    $storeId = $this->request->post('store_id', $this->storeId);
    $startDate = $this->request->post('start_date', '');
    $endDate = $this->request->post('end_date', '');

    if (empty($storeId)) {
        return JsonService::fail('门店ID不能为空');
    }

    $query = \app\common\model\merchant\OrderItem::alias('oi')
        ->join('busi_order o', 'o.id = oi.order_id')
        ->where('o.store_id', $storeId)
        ->where('oi.item_type', 'assistant')
        ->whereNotNull('oi.assistant_id')
        ->where('oi.assistant_id', '<>', '')
        ->whereIn('oi.status', ['completed', 'serving'])
        ->where('oi.final_price', '>', 0);

    if (!empty($startDate)) $query->where('oi.created_at', '>=', $startDate . ' 00:00:00');
    if (!empty($endDate)) $query->where('oi.created_at', '<=', $endDate . ' 23:59:59');

    $items = $query->field('oi.*')->order('oi.created_at', 'asc')->select();

    $total = count($items);
    $processed = 0; $skipped = 0; $errors = 0;

    foreach ($items as $item) {
        // 跳过已有提成记录的
        $exists = \app\common\model\merchant\CommissionRecord::where('order_item_id', $item['id'])->find();
        if ($exists) { $skipped++; continue; }

        // 检查提成配置
        $config = \app\common\model\merchant\CommissionConfig::where('assistant_id', $item['assistant_id'])->where('status', 1)->find();
        if (!$config) { $skipped++; continue; }

        try {
            \app\storeapi\logic\assistant\AssistantLogic::calculateCommission(
                $item['assistant_id'], $item['id'],
                floatval($item['final_price'] ?? $item['total_price'] ?? 0), $storeId
            );
            $processed++;
        } catch (\Exception $e) { $errors++; }
    }

    return JsonService::success("成功结算 {$processed} 笔，跳过 {$skipped} 笔" . ($errors > 0 ? "，失败 {$errors} 笔" : ''), [
        'total' => $total, 'processed' => $processed, 'skipped' => $skipped, 'errors' => $errors
    ]);
}
```

- [ ] **Step 2: Commit + Deploy**

```bash
git add wwwapi/
git commit -m "feat(commission): add batchSettleCommission API for retroactive settlement"
git tag -a wwwapi/v1.4.25 -m "deploy: batch commission settlement"
git push server wwwapi/v1.4.25
```

---

### Task 2: 前端 — wwwstore 添加一键结算按钮

**文件:** 修改 `d:\wwwroot\wwwbilliards\www\wwwstore\src\components\assistant\CommissionConfigPanel.tsx`

- [ ] **Step 1: 在统计卡片区域下方添加按钮和处理逻辑**

在 CommissionsTab 的 stats cards 下方添加：
```tsx
<Button onClick={handleBatchSettle} disabled={batchSettling} variant="outline" className="w-full">
  {batchSettling ? '结算中...' : '一键结算历史提成'}
</Button>
```

添加状态和处理函数：
```tsx
const [batchSettling, setBatchSettling] = useState(false)
const [batchResult, setBatchResult] = useState<string | null>(null)

const handleBatchSettle = async () => {
  setBatchSettling(true); setBatchResult(null)
  try {
    const res = await post('/assistant.Assistant/batchSettleCommission', { store_id: currentStore?.id })
    toast.success(res?.message || '结算完成')
    setBatchResult(`共 ${res.total} 笔，成功 ${res.processed} 笔，跳过 ${res.skipped} 笔`)
    loadStats()
  } catch (e: any) { toast.error(e?.message || '结算失败') }
  finally { setBatchSettling(false) }
}
```

需要确保 `post` 和 `toast` 已导入，`currentStore` 可用。

- [ ] **Step 3: Commit**

```bash
git add wwwstore/src/components/assistant/CommissionConfigPanel.tsx
git commit -m "feat(commission): add one-click batch settlement button in admin panel"
```

---

### Task 3: 验证

1. 后端：`POST /assistant.Assistant/batchSettleCommission` 返回正确统计
2. 前端：按钮可点击 → 显示结果
3. 防重复：同一订单再次执行，skipped 数增加，processed=0
