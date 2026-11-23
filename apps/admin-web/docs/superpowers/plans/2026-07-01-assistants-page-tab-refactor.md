# Assistants Page Tab Refactor — Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement. Steps use checkbox syntax.

**Goal:** Refactor `/assistants` page: unify tab style with employees, add content container, migrate "助教薪资" from `/reports/assistant-salary` as a 4th tab, remove from sidebar.

**Tech Stack:** Next.js 16, React 19, shadcn/ui, TypeScript

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Rewrite** | `src/app/assistants/page.tsx` | Tab shell with employees-style tabs + content container + salary tab |
| **Create** | `src/app/assistants/components/assistants-salary-tab.tsx` | Extracted from reports/assistant-salary/page.tsx |
| **Edit** | `src/components/layout/app-shell.tsx` | Remove "助教薪资" sidebar nav item |
| **Delete** | `src/app/reports/assistant-salary/page.tsx` | Migrated to assistants tab |

---

### Task 1: Create assistants-salary-tab.tsx

**Files:**
- Create: `src/app/assistants/components/assistants-salary-tab.tsx`
- Source: `src/app/reports/assistant-salary/page.tsx`

- [ ] **Step 1: Create directory and copy**
```bash
mkdir -p src/app/assistants/components
cp src/app/reports/assistant-salary/page.tsx src/app/assistants/components/assistants-salary-tab.tsx
```

- [ ] **Step 2: Edit — remove auth guard**

Read the file, then:

**Edit A:** Remove `useRouter` import and `useAuth` import (if present).
**Edit B:** Remove permission check code block (the useEffect that redirects without `report:list`).
**Edit C:** Change from `export default function` to `export function AssistantsSalaryTab`.
**Edit D:** Remove `PageHeader` import and JSX. Replace with simple header row:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h2 className="text-lg font-semibold text-slate-900">助教薪资</h2>
    <p className="text-sm text-slate-500">查看和导出助教月度工资报表</p>
  </div>
  <div className="flex items-center gap-2">
    {/* keep the existing month picker and export button here */}
  </div>
</div>
```
**Edit E:** Add `p-4` to outer div.

- [ ] **Step 3: Verify**
```bash
grep "useAuth\|useRouter\|permissionCodes\|export default" src/app/assistants/components/assistants-salary-tab.tsx
# Should return NO matches

grep "AssistantsSalaryTab" src/app/assistants/components/assistants-salary-tab.tsx
# Should match

wc -l src/app/assistants/components/assistants-salary-tab.tsx
# Expected: ~360 lines
```

- [ ] **Step 4: Commit**
```bash
git add src/app/assistants/components/assistants-salary-tab.tsx
git commit -m "feat(assistants): extract salary tab component from reports"
```

---

### Task 2: Rewrite assistants/page.tsx

**Files:**
- Rewrite: `src/app/assistants/page.tsx`

This is the main change. The new page.tsx:
1. Tab bar matches employees CSS exactly
2. Content wrapped in employees-style container
3. 4 tabs: list, schedule, commission, salary
4. Existing list/schedule/commission content preserved inline

**Key CSS changes from current to employees pattern:**

| Element | Current | New (employees) |
|---------|---------|-----------------|
| Tab bar container | `flex gap-2 p-1 bg-slate-100 rounded-xl w-fit` | `flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl` |
| Active tab | `from-[#00D4AA] via-[#00B894] to-[#00A08A] text-white hover:text-white shadow-md` | `from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl` |
| Inactive tab | `""` (no hover) | `hover:bg-white/80` |
| Tab button extra | `rounded-lg transition-all` | `rounded-xl transition-all duration-200 px-4` |
| Content area | No container | `rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden` |

- [ ] **Step 1: Read current page.tsx** to understand exact structure

- [ ] **Step 2: Apply edits**

**Edit A — Fix tab bar container (around line 423):**
Find: `<div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">`
Replace with: `<div className="flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">`

**Edit B — Fix all active tab buttons (4 tab buttons):**

Replace this pattern on ALL tab buttons:
```
className={`rounded-lg transition-all ${
  activeTab === "list" 
    ? "bg-gradient-to-r from-[#00D4AA] via-[#00B894] to-[#00A08A] text-white hover:text-white shadow-md" 
    : ""
}`}
```

With:
```
className={`rounded-xl transition-all duration-200 px-4 ${
  activeTab === "list"
    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl"
    : "hover:bg-white/80"
}`}
```

Do this for ALL active tab buttons: list, schedule, commission.

**Edit C — Add salary tab button (after commission tab button):**
```tsx
<Button
  variant={activeTab === "salary" ? "default" : "ghost"}
  size="sm"
  className={`rounded-xl transition-all duration-200 px-4 ${
    activeTab === "salary"
      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl"
      : "hover:bg-white/80"
  }`}
  onClick={() => setActiveTab("salary")}
>
  <DollarSign className="w-4 h-4 mr-2" />
  助教薪资
</Button>
```

**Edit D — Update activeTab type:**
Find: `useState<"list" | "schedule" | "review" | "commission" | "services">("list")`
Replace with: `useState<"list" | "schedule" | "commission" | "salary">("list")`

**Edit E — Add import for AssistantsSalaryTab:**
```tsx
import { AssistantsSalaryTab } from './components/assistants-salary-tab';
```

**Edit F — Wrap EACH tab content in content container:**

For the list tab, find:
```tsx
{activeTab === "list" && (
  <>
    {/* stats, cards, dialogs... */}
  </>
)}
```
Wrap the content (between `<>` and `</>`) in:
```tsx
{activeTab === "list" && (
  <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
    <div className="p-4">
      {/* stats, cards, dialogs... */}
    </div>
  </div>
)}
```

For schedule tab:
```tsx
{activeTab === "schedule" && (
  <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
    <div className="p-4 space-y-4">
      {/* sub-tabs + ScheduleManager/ShiftConfigPanel */}
    </div>
  </div>
)}
```

For commission tab:
```tsx
{activeTab === "commission" && (
  <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
    <CommissionConfigPanel assistants={assistants} />
  </div>
)}
```

**Edit G — Add salary tab content:**
```tsx
{activeTab === "salary" && (
  <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
    <AssistantsSalaryTab />
  </div>
)}
```

**Edit H — Remove commented-out review and services tabs** (clean up dead code)

- [ ] **Step 3: Verify**
```bash
grep "from-emerald-500 to-teal-500" src/app/assistants/page.tsx | wc -l
# Expected: 4 (one per tab button)

grep "rounded-2xl border border-slate-200/60" src/app/assistants/page.tsx | wc -l
# Expected: 4 (one per tab content)

grep "AssistantsSalaryTab" src/app/assistants/page.tsx
# Should match
```

- [ ] **Step 4: Commit**
```bash
git add src/app/assistants/page.tsx
git commit -m "feat(assistants): unify tab style with employees, add salary tab, add content containers"
```

---

### Task 3: Remove salary from sidebar + delete old page

**Files:**
- Edit: `src/components/layout/app-shell.tsx`
- Delete: `src/app/reports/assistant-salary/page.tsx`

- [ ] **Step 1: Remove nav item from app-shell.tsx**

Find and delete this line in the `navItems` array:
```tsx
{ icon: DollarSign, label: '助教薪资', href: '/reports/assistant-salary', permission: 'report:list' },
```

- [ ] **Step 2: If `DollarSign` is no longer used elsewhere in app-shell.tsx, remove from imports**

Check if `DollarSign` appears anywhere else in the file.

- [ ] **Step 3: Delete the old salary page**
```bash
git rm src/app/reports/assistant-salary/page.tsx
```

- [ ] **Step 4: Clean up empty directory if needed**
```bash
ls src/app/reports/assistant-salary/ 2>&1
# If empty, rmdir src/app/reports/assistant-salary/
```

- [ ] **Step 5: Verify no stale references**
```bash
grep -r "assistant-salary" src/ --include="*.ts" --include="*.tsx"
# Expected: No matches (except the new tab import)
```

- [ ] **Step 6: Commit**
```bash
git add src/components/layout/app-shell.tsx
git commit -m "refactor(assistants): remove salary from sidebar, delete standalone salary page"
```

---

### Task 4: Build verification

- [ ] **Step 1: Verify file structure**
```bash
ls src/app/assistants/
ls src/app/assistants/components/ 2>/dev/null
ls src/app/reports/assistant-salary/ 2>&1
```
Expected: assistants/components/ has salary tab, reports/assistant-salary/ gone

- [ ] **Step 2: Check no stale references**
```bash
grep -r "reports/assistant-salary" src/ --include="*.ts" --include="*.tsx"
```
Expected: No matches

- [ ] **Step 3: Git log**
```bash
git log --oneline master~4..master
```

- [ ] **Step 4: Commit any remaining cleanup**
