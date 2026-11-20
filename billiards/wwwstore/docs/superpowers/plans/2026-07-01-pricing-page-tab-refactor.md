# Pricing Page Tab Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the `/pricing` page to use tab-based layout (rules + coupon) matching the `/employees` page pattern, eliminate the standalone `/coupon-packages` route, and integrate the pricing simulator.

**Architecture:** Tab shell (`page.tsx`) with Button-based tab switching exactly matching `employees/page.tsx` pattern. Two tab components: `PricingRulesTab` (extracted from `pricing-panel.tsx`, ~700 lines) + `PricingCouponTab` (merged from inline `CouponPackageSection` + `coupon-packages/page.tsx`). Communication via `CustomEvent` (preserving current pattern).

**Tech Stack:** Next.js 16, React 19, shadcn/ui, TypeScript, Tailwind CSS

**Design Spec:** `docs/superpowers/specs/2026-07-01-pricing-page-tab-refactor-design.md`

**Reference Files:**
- Tab pattern source: `src/app/employees/page.tsx`
- Rules logic source: `src/app/pricing/pricing-panel.tsx` (to be deleted)
- Coupon logic source: `src/app/coupon-packages/page.tsx` (to be deleted)
- Simulator: `src/app/pricing/pricing-simulator.tsx` (preserved)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Rewrite** | `src/app/pricing/page.tsx` | Tab shell — activeTab state, PageHeader, tab bar, content container |
| **Create** | `src/app/pricing/pricing-rules-tab.tsx` | Rules tab — extracted from pricing-panel.tsx lines 1-731 (all except CouponPackageSection) |
| **Create** | `src/app/pricing/pricing-coupon-tab.tsx` | Coupon tab — enhanced from pricing-panel.tsx lines 734-846 + coupon-packages/page.tsx |
| **Delete** | `src/app/pricing/pricing-panel.tsx` | Content fully migrated to pricing-rules-tab.tsx |
| **Delete** | `src/app/coupon-packages/page.tsx` | Content fully migrated to pricing-coupon-tab.tsx |
| **Preserve** | `src/app/pricing/pricing-simulator.tsx` | No changes needed; imported by pricing-rules-tab.tsx |

---

### Task 1: Rewrite `page.tsx` — Tab Shell

**Files:**
- Rewrite: `src/app/pricing/page.tsx`

- [ ] **Step 1: Write the new page.tsx**

Replace the entire content of `src/app/pricing/page.tsx` with:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, RefreshCw, Table, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { PricingRulesTab } from './pricing-rules-tab';
import { PricingCouponTab } from './pricing-coupon-tab';
import { useAuth } from '@/lib/auth-context';

export default function PricingPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('pricing:rule')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<'rules' | 'coupon'>('rules');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleAddRule = () => {
    window.dispatchEvent(new CustomEvent('openAddPricingRule'));
  };

  const handleAddCoupon = () => {
    window.dispatchEvent(new CustomEvent('openAddCouponPackage'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <PageHeader
        title="计费规则"
        description="管理和配置门店的计费规则与套餐券"
        icon={DollarSign}
      >
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
        {activeTab === 'rules' ? (
          <Button
            onClick={handleAddRule}
            className="bg-white text-emerald-700 hover:bg-white/90 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增规则
          </Button>
        ) : (
          <Button
            onClick={handleAddCoupon}
            className="bg-white text-emerald-700 hover:bg-white/90 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建套餐
          </Button>
        )}
      </PageHeader>

      <div className="mx-auto px-6 py-6 space-y-6">
        {/* Tab bar — exact match with employees/page.tsx */}
        <div className="flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">
          <Button
            variant={activeTab === 'rules' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-xl transition-all duration-200 px-4 ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
                : 'hover:bg-white/80'
            }`}
            onClick={() => setActiveTab('rules')}
          >
            <Table className="w-4 h-4 mr-2" />
            标准计费规则
          </Button>
          <Button
            variant={activeTab === 'coupon' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-xl transition-all duration-200 px-4 ${
              activeTab === 'coupon'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
                : 'hover:bg-white/80'
            }`}
            onClick={() => setActiveTab('coupon')}
          >
            <Package className="w-4 h-4 mr-2" />
            套餐券管理
          </Button>
        </div>

        {/* Content container — exact match with employees/page.tsx */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
          {activeTab === 'rules' && <PricingRulesTab key={refreshKey} />}
          {activeTab === 'coupon' && <PricingCouponTab key={refreshKey} />}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was written**

Run: `wc -l src/app/pricing/page.tsx`
Expected: ~105 lines

- [ ] **Step 3: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat(pricing): rewrite page.tsx as tab shell matching employees pattern"
```

At this point the page will not compile (missing PricingRulesTab and PricingCouponTab). That's expected — they'll be created in the next tasks.

---

### Task 2: Create `pricing-rules-tab.tsx` — Rules Management

**Files:**
- Create: `src/app/pricing/pricing-rules-tab.tsx`
- Reference: `src/app/pricing/pricing-panel.tsx` (lines 1-731)

This component is extracted from `pricing-panel.tsx`, excluding only the `CouponPackageSection` (lines 734-846) and changing the component name from `PricingPanel` to `PricingRulesTab`.

- [ ] **Step 1: Create pricing-rules-tab.tsx**

Copy the existing `pricing-panel.tsx` as a starting point, then make three changes:
1. Remove `CouponPackageSection` (the entire function + its call site at line 524)
2. Change the function name from `PricingPanel` to `PricingRulesTab`
3. Change the CustomEvent listener name from `'openAddDialog'` to `'openAddPricingRule'` and event detail check from `'pricing'` to `'pricingRule'`
4. Integrate `PricingSimulator` at the bottom of the rules list (after the rule cards grid)
5. Change the export from named (`export function PricingPanel`) to named (`export function PricingRulesTab`)

Read the existing file first, then create the new file with:

```bash
cp src/app/pricing/pricing-panel.tsx src/app/pricing/pricing-rules-tab.tsx
```

Then edit `src/app/pricing/pricing-rules-tab.tsx`:

**Change 1 — Rename the component and fix exports (line 197):**

Find:
```tsx
export function PricingPanel() {
```
Replace with:
```tsx
export function PricingRulesTab() {
```

**Change 2 — Fix the CustomEvent listener (line 255-267):**

Find:
```tsx
  useEffect(() => {
    const handleOpenAddDialog = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === "pricing") {
        openAddDialog();
      }
    };
    
    window.addEventListener("openAddDialog", handleOpenAddDialog);
    return () => {
      window.removeEventListener("openAddDialog", handleOpenAddDialog);
    };
  }, []);
```

Replace with:
```tsx
  useEffect(() => {
    const handleOpenAddDialog = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === 'pricingRule') {
        openAddDialog();
      }
    };

    window.addEventListener('openAddPricingRule', handleOpenAddDialog);
    return () => {
      window.removeEventListener('openAddPricingRule', handleOpenAddDialog);
    };
  }, []);
```

**Change 3 — Remove CouponPackageSection call (line 524):**

Find:
```tsx
      <CouponPackageSection storeId={state.currentStore?.id || ''} />
```
Delete this line.

**Change 4 — Add PricingSimulator after the rules grid (line 522, before closing `</div>` of the outer space-y-4 div):**

Find (line 522):
```tsx
      </div>

      <CouponPackageSection storeId={state.currentStore?.id || ''} />
```

Replace with:
```tsx
      </div>

      {/* 计费模拟器 */}
      <PricingSimulator rules={rules} />
```

**Change 5 — Add PricingSimulator import:**

After the existing imports (around line 28), add:
```tsx
import { PricingSimulator } from './pricing-simulator';
```

**Change 6 — Remove CouponPackageSection function (lines 734-846):**

Find and delete everything from line 734 to the end of the file (the entire `CouponPackageSection` function).

- [ ] **Step 2: Verify the file structure**

Run: `wc -l src/app/pricing/pricing-rules-tab.tsx`
Expected: ~740 lines (original 846 minus ~110 lines of CouponPackageSection + ~4 lines of PricingSimulator)

Check that these key parts exist:
```bash
grep -n "export function PricingRulesTab" src/app/pricing/pricing-rules-tab.tsx
grep -n "openAddPricingRule" src/app/pricing/pricing-rules-tab.tsx
grep -n "PricingSimulator" src/app/pricing/pricing-rules-tab.tsx
grep -n "CouponPackageSection" src/app/pricing/pricing-rules-tab.tsx
```

Expected: First three should match, last one should NOT match.

- [ ] **Step 3: Commit**

```bash
git add src/app/pricing/pricing-rules-tab.tsx
git commit -m "feat(pricing): extract pricing-rules-tab component from pricing-panel"
```

---

### Task 3: Create `pricing-coupon-tab.tsx` — Coupon Management

**Files:**
- Create: `src/app/pricing/pricing-coupon-tab.tsx`
- Reference: `src/app/pricing/pricing-panel.tsx` lines 734-846 (CouponPackageSection)
- Reference: `src/app/coupon-packages/page.tsx` (for table layout with status badges)

This merges the best of both sources: the typed API client from `CouponPackageSection` + the polished table with status badges from `coupon-packages/page.tsx`.

- [ ] **Step 1: Create pricing-coupon-tab.tsx with full content**

Write the complete file:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { get, post } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiResponseType } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Clock, DollarSign, Package } from 'lucide-react';

export function PricingCouponTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const storeId = currentStore?.id || '';

  const [packages, setPackages] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', duration_hours: 2, price: 0, original_price: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storeId) loadPackages();
  }, [storeId]);

  // Listen for external open-add-dialog event
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingId(null);
      setForm({ name: '', duration_hours: 2, price: 0, original_price: 0 });
      setShowForm(true);
    };
    window.addEventListener('openAddCouponPackage', handleOpenAdd);
    return () => window.removeEventListener('openAddCouponPackage', handleOpenAdd);
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await get<any[]>(
        API_ENDPOINTS.couponPackageList,
        { store_id: storeId, page_size: 100 },
        ApiResponseType.LIST,
      );
      const list = (data as any)?.lists || data || [];
      setPackages(Array.isArray(list) ? list.filter((p: any) => p.platform === 'internal') : []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.duration_hours) {
      toast.error('请填写套餐名称和时长');
      return;
    }
    setSaving(true);
    try {
      await post(API_ENDPOINTS.couponPackageSave, {
        ...form,
        id: editingId,
        store_id: storeId,
      });
      toast.success(editingId ? '套餐已更新' : '套餐已添加');
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', duration_hours: 2, price: 0, original_price: 0 });
      loadPackages();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pkg: Record<string, any>) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      duration_hours: Number(pkg.duration_hours) || 2,
      price: Number(pkg.price) || 0,
      original_price: Number(pkg.original_price) || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该套餐券？')) return;
    try {
      await post(API_ENDPOINTS.couponPackageDelete, { id });
      toast.success('已删除');
      loadPackages();
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">套餐券管理</h3>
          <p className="text-sm text-slate-500">管理验券开台套餐，套餐时长内台费不计费</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', duration_hours: 2, price: 0, original_price: 0 });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> 新建套餐
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">套餐名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：2小时畅打券"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">时长(小时)</Label>
              <Input
                type="number"
                value={form.duration_hours}
                onChange={(e) =>
                  setForm({ ...form, duration_hours: Number(e.target.value) || 1 })
                }
                min={0.5}
                step={0.5}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">售价(元)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) || 0 })
                }
                min={0}
                step={0.01}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">原价(元)</Label>
              <Input
                type="number"
                value={form.original_price}
                onChange={(e) =>
                  setForm({ ...form, original_price: Number(e.target.value) || 0 })
                }
                min={0}
                step={0.01}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? '保存中...' : '保存'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {/* Package List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>暂无套餐券</p>
          <p className="text-sm">点击「新建套餐」创建门店套餐券</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-slate-500">
                <th className="pb-3 font-medium w-[200px]">套餐名称</th>
                <th className="pb-3 font-medium">时长</th>
                <th className="pb-3 font-medium">售价</th>
                <th className="pb-3 font-medium">原价</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium w-[100px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg: Record<string, any>) => (
                <tr key={pkg.id} className="border-b">
                  <td className="py-3 font-medium">{pkg.name}</td>
                  <td className="py-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <Clock className="w-3.5 h-3.5" /> {pkg.duration_hours}小时
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-amber-600">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {pkg.price}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-slate-400 line-through">
                    ¥{pkg.original_price}
                  </td>
                  <td className="py-3">
                    <Badge variant={pkg.status === 1 ? 'default' : 'secondary'}>
                      {pkg.status === 1 ? '启用' : '禁用'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(pkg)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file**

Run: `wc -l src/app/pricing/pricing-coupon-tab.tsx`
Expected: ~230 lines

Check for required imports and patterns:
```bash
grep -c "openAddCouponPackage" src/app/pricing/pricing-coupon-tab.tsx
grep -c "PricingCouponTab" src/app/pricing/pricing-coupon-tab.tsx
```

Expected: at least 1 match for each.

- [ ] **Step 3: Commit**

```bash
git add src/app/pricing/pricing-coupon-tab.tsx
git commit -m "feat(pricing): create pricing-coupon-tab with typed API client and status badges"
```

---

### Task 4: Delete Old Files

**Files:**
- Delete: `src/app/pricing/pricing-panel.tsx`
- Delete: `src/app/coupon-packages/page.tsx`

- [ ] **Step 1: Verify no imports reference the files to be deleted**

```bash
grep -r "pricing-panel" src/ --include="*.ts" --include="*.tsx"
grep -r "coupon-packages/page" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*coupon-packages" src/ --include="*.ts" --include="*.tsx"
```

Expected: No matches (or matches only in the files being deleted).

- [ ] **Step 2: Delete the old files**

```bash
git rm src/app/pricing/pricing-panel.tsx
git rm src/app/coupon-packages/page.tsx
```

- [ ] **Step 3: Check if coupon-packages directory has any remaining files**

```bash
ls -la src/app/coupon-packages/
```

If the directory is empty (no files remaining), remove it:
```bash
rmdir src/app/coupon-packages/ 2>/dev/null || echo "Directory not empty or already removed"
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(pricing): remove old pricing-panel and coupon-packages page"
```

---

### Task 5: Build Verification

**Files:**
- Verify: All pricing files compile correctly

- [ ] **Step 1: Run TypeScript type check**

```bash
cd src/app/pricing && npx tsc --noEmit --pretty 2>&1 | head -50
```

Expected: No errors from pricing files. If there are pre-existing errors from other files, that's OK (they're hidden by `ignoreBuildErrors` in next.config).

- [ ] **Step 2: Run Next.js build**

```bash
npx next build 2>&1 | tail -30
```

Expected: Build succeeds (TypeScript errors are ignored by config). Look for "✓ Compiled successfully" or successful build output.

- [ ] **Step 3: Verify final file structure**

```bash
ls -la src/app/pricing/
```

Expected:
```
page.tsx                    (~105 lines)
pricing-rules-tab.tsx       (~740 lines)
pricing-coupon-tab.tsx      (~230 lines)
pricing-simulator.tsx       (preserved, unchanged)
```

`pricing-panel.tsx` should NOT exist.

- [ ] **Step 4: Verify coupon-packages route is gone**

```bash
ls src/app/coupon-packages/ 2>&1
```

Expected: "No such file or directory"

- [ ] **Step 5: Final commit (if any cleanup was needed)**

```bash
git status
```

If clean, skip. If there are cleanup changes:

```bash
git add -A
git commit -m "chore(pricing): final cleanup after tab refactor"
```

---

## Verification Checklist

After all tasks complete, manually verify:

1. **Tab bar matches employees page** — compare `src/app/employees/page.tsx` and `src/app/pricing/page.tsx` tab bar `<div>` and `<Button>` elements
2. **Content container matches employees page** — same `rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden` class
3. **Rules tab works** — search, filter, create, edit, delete rules
4. **Coupon tab works** — list, create, edit, delete coupon packages
5. **Simulator visible** — appears at bottom of rules tab
6. **No broken imports** — `grep -r "pricing-panel" src/ --include="*.ts" --include="*.tsx"` returns nothing
7. **No orphan coupon-packages route** — `/coupon-packages` URL is no longer accessible
