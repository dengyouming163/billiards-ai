# Tables Page Tab Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the `/tables` page with 4 tabs (台桌管理/分区配置/台型配置/时段配置) matching the `/employees` page Button-based tab pattern. Migrate 3 settings tabs (zones, tableTypes, periods) into the tables page.

**Architecture:** Tab shell (`page.tsx`) with Button switching matching employees. Four tab components in `tables/components/`. Migrated settings tabs keep their props pattern; cross-import `SettingsCard`/`SettingsCardGrid`/`SettingsEmpty` from `../../settings/settings-card`. Settings page updated to remove migrated tabs.

**Tech Stack:** Next.js 16, React 19, shadcn/ui, TypeScript, Tailwind CSS

**Reference Files:**
- Tab pattern: `src/app/employees/page.tsx`
- Tables page (source): `src/app/tables/page.tsx` (1111 lines, to be split)
- Settings tabs (sources): `src/app/settings/settings-{zones,table-types,periods}-tab.tsx` (to be migrated)
- Settings card shared: `src/app/settings/settings-card.tsx` (preserved, cross-imported)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Create dir** | `src/app/tables/components/` | Tab components directory |
| **Create** | `src/app/tables/components/tables-management-tab.tsx` | Extracted from tables/page.tsx |
| **Copy+edit** | `src/app/tables/components/tables-zones-tab.tsx` | From settings/settings-zones-tab.tsx |
| **Copy+edit** | `src/app/tables/components/tables-table-types-tab.tsx` | From settings/settings-table-types-tab.tsx |
| **Copy+edit** | `src/app/tables/components/tables-periods-tab.tsx` | From settings/settings-periods-tab.tsx |
| **Rewrite** | `src/app/tables/page.tsx` | Tab shell (matching employees) |
| **Edit** | `src/app/settings/page.tsx` | Remove zones/tableTypes/periods tabs |
| **Delete** | `src/app/settings/settings-zones-tab.tsx` | Migrated |
| **Delete** | `src/app/settings/settings-table-types-tab.tsx` | Migrated |
| **Delete** | `src/app/settings/settings-periods-tab.tsx` | Migrated |

---

### Task 1: Create tab components directory + migrate 3 settings tabs

**Files:**
- Create: `src/app/tables/components/tables-zones-tab.tsx`
- Create: `src/app/tables/components/tables-table-types-tab.tsx`
- Create: `src/app/tables/components/tables-periods-tab.tsx`

- [ ] **Step 1: Create components directory**

```bash
mkdir -p src/app/tables/components
```

- [ ] **Step 2: Copy the 3 settings tab files**

```bash
cp src/app/settings/settings-zones-tab.tsx src/app/tables/components/tables-zones-tab.tsx
cp src/app/settings/settings-table-types-tab.tsx src/app/tables/components/tables-table-types-tab.tsx
cp src/app/settings/settings-periods-tab.tsx src/app/tables/components/tables-periods-tab.tsx
```

- [ ] **Step 3: Fix imports in tables-zones-tab.tsx**

Read the file and change the settings-card import:

Find:
```tsx
import { SettingsCard, SettingsCardGrid, SettingsEmpty } from './settings-card';
```
Replace with:
```tsx
import { SettingsCard, SettingsCardGrid, SettingsEmpty } from '../../settings/settings-card';
```

Change the component export name:
Find: `export function SettingsZonesTab`
Replace with: `export function TablesZonesTab`

Update the props interface name:
Find: `SettingsZonesTabProps`
Replace with: `TablesZonesTabProps`

- [ ] **Step 4: Fix imports in tables-table-types-tab.tsx**

Same changes as Step 3:
- Import path: `'./settings-card'` → `'../../settings/settings-card'`
- Component name: `SettingsTableTypesTab` → `TablesTableTypesTab`
- Props interface: `SettingsTableTypesTabProps` → `TablesTableTypesTabProps`

- [ ] **Step 5: Fix imports in tables-periods-tab.tsx**

Same changes as Step 3:
- Import path: `'./settings-card'` → `'../../settings/settings-card'`
- Component name: `SettingsPeriodsTab` → `TablesPeriodsTab`
- Props interface: `SettingsPeriodsTabProps` → `TablesPeriodsTabProps`

- [ ] **Step 6: Verify the migrated files compile**

```bash
npx tsc --noEmit src/app/tables/components/tables-zones-tab.tsx src/app/tables/components/tables-table-types-tab.tsx src/app/tables/components/tables-periods-tab.tsx 2>&1 | head -20
```

Expected: No new errors (pre-existing errors in unrelated files are OK).

- [ ] **Step 7: Commit**

```bash
git add src/app/tables/components/
git commit -m "feat(tables): migrate zones, table-types, periods tabs from settings"
```

---

### Task 2: Create tables-management-tab.tsx

**Files:**
- Create: `src/app/tables/components/tables-management-tab.tsx`
- Source: `src/app/tables/page.tsx` (extract business logic, leave shell)

**Important:** This is the largest task. The current `page.tsx` is 1111 lines. We extract everything EXCEPT the auth guard and page wrapper into this tab component.

- [ ] **Step 1: Copy page.tsx as the base**

```bash
cp src/app/tables/page.tsx src/app/tables/components/tables-management-tab.tsx
```

- [ ] **Step 2: Edit tables-management-tab.tsx — remove page-level concerns**

**Edit A — Remove auth-related imports and logic:**
Delete these lines:
```tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
```

Delete the auth guard block:
```tsx
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('settings:table')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);
```

**Edit B — Remove PageHeader import:**
Delete: `import { PageHeader } from '@/components/layout/page-header';`

**Edit C — Change the function signature:**

Find:
```tsx
export default function TablesPage() {
```
Replace with:
```tsx
export function TablesManagementTab() {
```

**Edit D — Remove PageHeader JSX:**

Find the PageHeader block (lines 387-399 after extraction):
```tsx
      <PageHeader
        title="台桌管理"
        description="管理和配置球房台桌信息"
        icon={Gamepad2}
      >
        <Button
          onClick={() => setAddTableOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增台桌
        </Button>
      </PageHeader>
```
Replace with the "新增台桌" button inline (as a header row):
```tsx
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">台桌管理</h2>
          <p className="text-sm text-slate-500">管理和配置球房台桌信息</p>
        </div>
        <Button
          onClick={() => setAddTableOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增台桌
        </Button>
      </div>
```

**Edit E — Remove the outer wrapper div:**

Find the outermost return div:
```tsx
    <div className="space-y-6">
```
And the closing `</div>` at the very end before the export.

Since this component renders inside the content container (which has no padding), add padding:
Change the outer div to:
```tsx
    <div className="space-y-6 p-4">
```

**Edit F — Remove re-export at bottom:**
Delete: `export type { TableData };` (if present)

- [ ] **Step 3: Verify the extracted file**

```bash
wc -l src/app/tables/components/tables-management-tab.tsx
```
Expected: ~1080 lines (original 1111 minus ~35 lines of auth/PageHeader/export)

```bash
grep -c "TablesManagementTab" src/app/tables/components/tables-management-tab.tsx
grep -c "useAuth\|useRouter" src/app/tables/components/tables-management-tab.tsx
```
Expected: TablesManagementTab = 1, useAuth/useRouter = 0

- [ ] **Step 4: Commit**

```bash
git add src/app/tables/components/tables-management-tab.tsx
git commit -m "feat(tables): extract tables-management-tab component from page.tsx"
```

---

### Task 3: Rewrite tables/page.tsx — Tab Shell

**Files:**
- Rewrite: `src/app/tables/page.tsx`

- [ ] **Step 1: Write the new page.tsx**

Replace the entire file with:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Gamepad2, LayoutGrid, Coffee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { TablesManagementTab } from './components/tables-management-tab';
import { TablesZonesTab } from './components/tables-zones-tab';
import { TablesTableTypesTab } from './components/tables-table-types-tab';
import { TablesPeriodsTab } from './components/tables-periods-tab';

type TabKey = 'management' | 'zones' | 'tableTypes' | 'periods';

export default function TablesPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();
  const { state } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('settings:table')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>('management');

  return (
    <div className="space-y-6">
      <PageHeader
        title="台桌管理"
        description="管理球房台桌、分区、台型和时段配置"
        icon={Gamepad2}
      />

      {/* Tab bar — exact match with employees/page.tsx */}
      <div className="flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === 'management' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'management'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('management')}
        >
          <Gamepad2 className="w-4 h-4 mr-2" />
          台桌管理
        </Button>
        <Button
          variant={activeTab === 'zones' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'zones'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('zones')}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          分区配置
        </Button>
        <Button
          variant={activeTab === 'tableTypes' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'tableTypes'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('tableTypes')}
        >
          <Coffee className="w-4 h-4 mr-2" />
          台型配置
        </Button>
        <Button
          variant={activeTab === 'periods' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'periods'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('periods')}
        >
          <Clock className="w-4 h-4 mr-2" />
          时段配置
        </Button>
      </div>

      {/* Content container — exact match with employees/page.tsx */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
        {activeTab === 'management' && <TablesManagementTab />}
        {activeTab === 'zones' && (
          <TablesZonesTab
            currentStoreId={currentStore?.id}
            visible={activeTab === 'zones'}
            success={success}
            warning={warning}
          />
        )}
        {activeTab === 'tableTypes' && (
          <TablesTableTypesTab
            currentStoreId={currentStore?.id}
            visible={activeTab === 'tableTypes'}
            success={success}
            warning={warning}
          />
        )}
        {activeTab === 'periods' && (
          <TablesPeriodsTab
            currentStoreId={currentStore?.id}
            visible={activeTab === 'periods'}
            success={success}
            warning={warning}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify line count**

```bash
wc -l src/app/tables/page.tsx
```
Expected: ~125 lines

- [ ] **Step 3: Commit**

```bash
git add src/app/tables/page.tsx
git commit -m "feat(tables): rewrite page.tsx as 4-tab shell matching employees pattern"
```

---

### Task 4: Update settings/page.tsx — Remove migrated tabs

**Files:**
- Edit: `src/app/settings/page.tsx`
- Delete: `src/app/settings/settings-zones-tab.tsx`
- Delete: `src/app/settings/settings-table-types-tab.tsx`
- Delete: `src/app/settings/settings-periods-tab.tsx`

- [ ] **Step 1: Remove imports of migrated tabs from settings/page.tsx**

Delete these three import lines (lines 35, 36, 42):
```tsx
import { SettingsZonesTab } from './settings-zones-tab';
import { SettingsTableTypesTab } from './settings-table-types-tab';
import { SettingsPeriodsTab } from './settings-periods-tab';
```

Also remove unused icon imports: `LayoutGrid`, `Coffee`, `Calendar` from the lucide-react import on lines 10, 11, 14.

- [ ] **Step 2: Remove tab triggers from TabsList**

Delete these three TabsTrigger blocks (lines 141-168):
- zones TabsTrigger (LayoutGrid icon, "分区配置")
- tableTypes TabsTrigger (Coffee icon, "台型配置")
- periods TabsTrigger (Calendar icon, "时段配置")

- [ ] **Step 3: Remove TabsContent blocks for migrated tabs**

Delete these three TabsContent blocks (lines 189-226):
- TabsContent value="zones" with SettingsZonesTab
- TabsContent value="tableTypes" with SettingsTableTypesTab
- TabsContent value="periods" with SettingsPeriodsTab

- [ ] **Step 4: Delete the old settings tab files**

```bash
git rm src/app/settings/settings-zones-tab.tsx
git rm src/app/settings/settings-table-types-tab.tsx
git rm src/app/settings/settings-periods-tab.tsx
```

- [ ] **Step 5: Verify no references remain**

```bash
grep -r "SettingsZonesTab\|SettingsTableTypesTab\|SettingsPeriodsTab" src/ --include="*.ts" --include="*.tsx"
```
Expected: No matches (except in deleted files which aren't in the tree).

- [ ] **Step 6: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "refactor(settings): remove zones, table-types, periods tabs — migrated to tables"
```

---

### Task 5: Build Verification

**Files:**
- Verify: All tables and settings files compile

- [ ] **Step 1: Verify final directory structure**

```bash
ls -la src/app/tables/
ls -la src/app/tables/components/
```
Expected tables/: page.tsx + components/
Expected components/: 4 files (management, zones, table-types, periods)

- [ ] **Step 2: Check no residual references**

```bash
grep -r "from.*settings-zones-tab\|from.*settings-table-types-tab\|from.*settings-periods-tab" src/ --include="*.ts" --include="*.tsx"
```
Expected: No matches.

- [ ] **Step 3: Check settings page still has correct tabs**

```bash
grep "TabsTrigger\|TabsContent" src/app/settings/page.tsx
```
Expected: store, business, wechat, discount, coupon (5 tabs, no zones/tableTypes/periods)

- [ ] **Step 4: TypeScript check on tables files**

```bash
npx tsc --noEmit src/app/tables/page.tsx src/app/tables/components/*.tsx 2>&1 | head -30
```
Expected: No new errors from tables files.

- [ ] **Step 5: TypeScript check on settings page**

```bash
npx tsc --noEmit src/app/settings/page.tsx 2>&1 | head -20
```
Expected: No new errors.

- [ ] **Step 6: Final commit if needed**

```bash
git status
```
If clean, done. Otherwise commit any remaining cleanup.

---

## Verification Checklist

After all tasks complete:

1. **Tables page has 4 tabs** — 台桌管理 / 分区配置 / 台型配置 / 时段配置
2. **Tab bar matches employees page** — exact CSS classes
3. **Tab content container matches employees** — same classes, no padding
4. **台桌管理 tab** — all original functionality preserved (search, filter, card/list view, CRUD dialogs)
5. **分区配置 tab** — loads zones, CRUD works
6. **台型配置 tab** — loads table types, CRUD works
7. **时段配置 tab** — loads time periods, CRUD works
8. **Settings page** — 5 tabs: 门店信息 / 营业设置 / 微信支付 / 折扣配置 / 优惠券
9. **Sidebar** — "台桌管理" → `/tables`, no change needed
10. **No broken imports** — all cross-references resolve
