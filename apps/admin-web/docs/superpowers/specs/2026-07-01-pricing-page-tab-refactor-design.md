# Pricing Page Tab Refactor — Design Spec

**Date:** 2026-07-01  
**Scope:** wwwstore `/pricing` page refactoring  
**Design decision:** Use tab-based layout consistent with `/employees` page

---

## Problem Summary

The pricing page (`/pricing`) currently consists of:

| File | Lines | Issue |
|------|-------|-------|
| `pricing/page.tsx` | 64 | Thin shell, no tab structure |
| `pricing/pricing-panel.tsx` | 846 | Monolithic: pricing rules + coupon section all inline |
| `pricing/pricing-simulator.tsx` | 180 | Built but not integrated into the page |
| `coupon-packages/page.tsx` | 207 | Duplicate functionality as a separate route |

The `pricing-panel.tsx` stacks the coupon section (`CouponPackageSection`, lines 736-846) below the pricing rules list with no tab switching, no full-width container, and no visual hierarchy. The coupon packages also exist as a standalone `/coupon-packages` route, which is redundant.

---

## Design Goals

1. **Tab-based layout** — Use the same Button-based tab switching pattern as the `/employees` page
2. **Code splitting** — Extract pricing rules and coupon management into separate tab components
3. **Visual consistency** — Match exact CSS classes and gradient styles from employees page
4. **Eliminate duplication** — Merge standalone `/coupon-packages` route into the pricing tab
5. **Integrate simulator** — Include the existing `pricing-simulator.tsx` in the rules tab

---

## Tab Style Specification (from employees page)

### Tab Bar Container
```
className="flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl"
```

### Tab Button — Active State
```
variant="default"
size="sm"
className="rounded-xl transition-all duration-200 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl"
```

### Tab Button — Inactive State
```
variant="ghost"
size="sm"
className="rounded-xl transition-all duration-200 px-4 hover:bg-white/80"
```

### Content Container
```
className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden"
```

### Conditional Rendering
```
{activeTab === 'rules' && <PricingRulesTab />}
{activeTab === 'coupon' && <PricingCouponTab />}
```

---

## File Changes

| Action | File | Description |
|--------|------|-------------|
| **Rewrite** | `src/app/pricing/page.tsx` | Tab switching shell following employees pattern |
| **Create** | `src/app/pricing/pricing-rules-tab.tsx` | Extracted from `pricing-panel.tsx` — rules management logic |
| **Create** | `src/app/pricing/pricing-coupon-tab.tsx` | Extracted from `pricing-panel.tsx` + migrated from `coupon-packages/page.tsx` |
| **Delete** | `src/app/pricing/pricing-panel.tsx` | Content split into the two tab files |
| **Preserve** | `src/app/pricing/pricing-simulator.tsx` | Integrated into rules tab as collapsible bottom section |
| **Delete** | `src/app/coupon-packages/page.tsx` | Functionality consolidated into pricing tab |

---

## Component Structure

```
page.tsx
├── PageHeader
│   ├── title: "计费规则"
│   ├── icon: DollarSign
│   └── actions: Refresh + New Rule buttons
├── Tab Bar (Button-based, emerald gradient active state)
│   ├── Tab: standard-rules (icon: Table / DollarSign)
│   └── Tab: coupon (icon: Package)
└── Content Container (white, rounded-2xl, shadow)
    ├── {activeTab === 'rules' && <PricingRulesTab />}
    │   ├── Filter bar (search + stats badges + type filter)
    │   ├── Rule cards grid
    │   ├── Empty state
    │   ├── Create/Edit dialog (FormSection pattern)
    │   ├── Delete confirmation dialog
    │   └── PricingSimulator (collapsible, at bottom)
    └── {activeTab === 'coupon' && <PricingCouponTab />}
        ├── Header bar (title + new coupon button)
        ├── Create/Edit form (inline, collapsible)
        └── Coupon table
```

---

## Key Implementation Details

### Page Header Actions
- The "新增规则" button in PageHeader currently uses `window.dispatchEvent(new CustomEvent('openAddDialog'))` to communicate with `PricingPanel`. After refactoring, it should use a callback prop or a shared state lifted to the page level.
- **Solution:** Lift the dialog state to `page.tsx` and pass `onAddRule` as prop to `PricingRulesTab`.

### API Client Consistency
- `pricing-panel.tsx` uses the typed API client (`get`, `put`, `post`, `del` from `@/lib/api/client`)
- `CouponPackageSection` (inline) also uses the typed API client
- `coupon-packages/page.tsx` uses raw `fetch()` — this will be replaced with the typed client
- **Unified approach:** All API calls use `@/lib/api/client` and `@/lib/api/config`

### Toast Consistency
- `pricing-panel.tsx` uses `sonner` toast
- `coupon-packages/page.tsx` uses `useToast()` from `@/lib/toast-context`
- **Unified approach:** Use `sonner` toast (matching the pricing panel's current pattern, which is simpler)

### Pricing Simulator Integration
- The simulator accepts `rules: PricingRule[]` as a prop
- Place it as a collapsible section at the bottom of the rules tab
- Reusing the existing `FormSection` collapsible pattern from `pricing-panel.tsx`

### Coupon Tab Recovery
- The standalone `/coupon-packages` route will be deleted
- If other code links to `/coupon-packages`, update to `/pricing` (with `tab=coupon` query param or just let it default to first tab)

---

## Non-Goals (Out of Scope)

- No changes to the API layer or backend
- No changes to the sidebar navigation structure
- No changes to other pages' tab styles
- No new npm dependencies

---

## Style Consistency Checklist

| Property | employees page | pricing page (target) | Match? |
|----------|---------------|----------------------|--------|
| Page background | `min-h-screen bg-gradient-to-br from-slate-50 to-slate-100` | Same (already present) | ✓ |
| Tab bar container | `flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl` | Same | ✓ |
| Active tab gradient | `from-emerald-500 to-teal-500` + shadow | Same | ✓ |
| Inactive tab | `hover:bg-white/80` | Same | ✓ |
| Content container | `rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden` | Same | ✓ |
| Tab switching | `{activeTab === 'x' && <Component />}` | Same | ✓ |
| Component per tab | Separate files per tab | Same (`pricing-rules-tab.tsx`, `pricing-coupon-tab.tsx`) | ✓ |
