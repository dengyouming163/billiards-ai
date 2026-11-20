# Assistant Billing Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable assistant billing rules (`minute` / `half_hour`) to wwwapi backend and wwwstore admin panel.

**Architecture:** Backend-only change. Add `billing_rule` column to `busi_assistant` and `busi_assistant_level` tables. Implement per-minute and half-hour-rounding calculation in `endAssistantService`. wwwstore PC admin adds a radio selector with live example. wwwstoreapp mobile app unchanged.

**Tech Stack:** PHP ThinkPHP 8, MySQL

---

### Task 1: Database Migration

**Files:**
- Create: SQL migration script

- [ ] **Step 1: Add `billing_rule` column to assistant tables**

```sql
ALTER TABLE `busi_assistant` ADD COLUMN `billing_rule` VARCHAR(16) DEFAULT 'half_hour' COMMENT '计费方式: minute-按分钟, half_hour-半小时';
ALTER TABLE `busi_assistant_level` ADD COLUMN `billing_rule` VARCHAR(16) DEFAULT 'half_hour' COMMENT '计费方式: minute-按分钟, half_hour-半小时';
```

- [ ] **Step 2: Verify**

```sql
DESCRIBE busi_assistant billing_rule;
DESCRIBE busi_assistant_level billing_rule;
-- Should show varchar(16) DEFAULT 'half_hour'
```

---

### Task 2: Backend Logic — Billing Calculation Helper

**Files:**
- Modify: `app/storeapi/logic/assistant/AssistantLogic.php` — add `calculateFee()` method

- [ ] **Step 1: Add `calculateFee` static method after `formatAssistant`**

```php
/**
 * 根据计费规则计算费用
 * @param float $hourlyRate 时薪（元/小时）
 * @param int $minutes 服务分钟数
 * @param string $billingRule 计费规则：minute-按分钟, half_hour-半小时
 * @return float 费用（元）
 */
public static function calculateFee(float $hourlyRate, int $minutes, string $billingRule = 'half_hour'): float
{
    if ($minutes <= 0 || $hourlyRate <= 0) {
        return 0.00;
    }
    
    if ($billingRule === 'minute') {
        // 按分钟：精确计时
        return round(($minutes / 60) * $hourlyRate, 2);
    }
    
    // 默认：半小时计费，向上取整到30分钟单位
    $units = ceil($minutes / 30);        // 30分钟为一个计费单位
    $hours = $units * 0.5;               // 转换为小时
    return round($hours * $hourlyRate, 2);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/storeapi/logic/assistant/AssistantLogic.php
git commit -m "feat: add calculateFee helper for assistant billing rules"
```

---

### Task 3: Backend Logic — Use `calculateFee` in `endAssistantService`

**Files:**
- Modify: `app/storeapi/logic/order/OrderLogic.php` — update `endAssistantService()`

- [ ] **Step 1: Find where assistant fee is currently calculated in `endAssistantService`**

Locate the section that calculates `final_price` for assistant items. Replace the hardcoded calculation with `AssistantLogic::calculateFee()`.

- [ ] **Step 2: Replace calculation**

```php
// Before (hardcoded per-minute or hourly):
// $fee = round(($minutes / 60) * $hourlyRate, 2);

// After:
use app\storeapi\logic\assistant\AssistantLogic;

$assistant = Assistant::where('id', $assistantId)->find();
$hourlyRate = (float)($assistant['hourly_rate'] ?? 0);
$billingRule = $assistant['billing_rule'] ?? 'half_hour';
$fee = AssistantLogic::calculateFee($hourlyRate, $minutes, $billingRule);
```

- [ ] **Step 3: Commit**

```bash
git add app/storeapi/logic/order/OrderLogic.php
git commit -m "feat: use billing_rule in endAssistantService fee calculation"
```

---

### Task 4: Backend API — Assistant CRUD Supports `billing_rule`

**Files:**
- Modify: `app/storeapi/logic/assistant/AssistantLogic.php` — `getList()`, `create()`, `update()`
- Modify: `app/storeapi/controller/assistant/AssistantController.php` — ensure params pass through

- [ ] **Step 1: Add `billing_rule` to `getList()` response**

In `formatAssistant()` or `getList()`, add `billing_rule` to the output:

```php
'billing_rule' => $item['billing_rule'] ?? 'half_hour',
```

- [ ] **Step 2: Support `billing_rule` in `create()`**

In `create()`, add to the Assistant::create data:
```php
'billing_rule' => $params['billing_rule'] ?? 'half_hour',
```

- [ ] **Step 3: Support `billing_rule` in `update()`**

In `update()`, add to $updateData:
```php
if (isset($params['billing_rule'])) $updateData['billing_rule'] = $params['billing_rule'];
```

- [ ] **Step 4: Do the same for `AssistantLevel` `createLevel()` and `updateLevel()`**

```php
// createLevel:
'billing_rule' => $params['billing_rule'] ?? 'half_hour',

// updateLevel:
if (isset($params['billing_rule'])) $updateData['billing_rule'] = $params['billing_rule'];
```

- [ ] **Step 5: Commit**

```bash
git add app/storeapi/logic/assistant/AssistantLogic.php app/storeapi/controller/assistant/AssistantController.php
git commit -m "feat: assistant CRUD supports billing_rule field"
```

---

### Task 5: Frontend — wwwstore Admin Panel Billing Rule Selector

**Files:**
- Modify: wwwstore assistant config page (add radio selector with examples)

- [ ] **Step 1: Add billing rule selector to assistant edit/create form**

```vue
<view class="form-item">
  <text class="form-label">计费方式</text>
  <view class="billing-rule-selector">
    <view 
      class="rule-option" 
      :class="{ active: form.billing_rule === 'half_hour' }"
      @click="form.billing_rule = 'half_hour'"
    >
      <view class="rule-title">以半小时为计费单位</view>
      <view class="rule-desc">不满半小时按半小时算，行业通用做法</view>
      <view class="rule-example">
        <text class="example-label">示例（80元/小时，服务70分钟）：</text>
        <text class="example-calc">70分钟 → 1.5小时 → 1.5 × 80 = 120 元</text>
      </view>
    </view>
    <view 
      class="rule-option" 
      :class="{ active: form.billing_rule === 'minute' }"
      @click="form.billing_rule = 'minute'"
    >
      <view class="rule-title">按分钟计费</view>
      <view class="rule-desc">精确计时，按实际分钟数计费</view>
      <view class="rule-example">
        <text class="example-label">示例（80元/小时，服务70分钟）：</text>
        <text class="example-calc">70 ÷ 60 × 80 = 93.33 元</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 2: Add `billing_rule` to form data and submit**

```typescript
const form = reactive({
  name: '',
  phone: '',
  hourly_rate: 0,
  billing_rule: 'half_hour',  // default
  // ... other fields
})
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/assistant/ 
git commit -m "feat: add billing rule selector with examples to assistant config"
```

---

### Task 6: Integration Test

- [ ] **Step 1: Test half_hour billing**

Create an assistant with hourly_rate=80, billing_rule=half_hour. Start service, wait 70 minutes, end service. Verify fee = 120.00.

- [ ] **Step 2: Test minute billing**

Change billing_rule to minute. Start service, wait 70 minutes, end service. Verify fee = 93.33.

- [ ] **Step 3: Test backward compatibility**

Existing assistants without billing_rule should default to half_hour (database default). Verify their billing still works correctly.

- [ ] **Step 4: Commit final verification**

```bash
git commit -m "test: verify assistant billing rules work correctly"
```
