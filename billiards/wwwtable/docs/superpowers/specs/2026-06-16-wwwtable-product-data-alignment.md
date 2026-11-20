# wwwtable 商品点单 — 数据层对齐 wwwstoreapp

> 日期: 2026-06-16 | 目标: 商品数据结构/校验/处理与 wwwstoreapp 收银端一致

---

## 一、对齐范围

后端 `OrderLogic` 已共用，无需改动。对齐仅涉及前端数据处理层：

| # | 位置 | 修复 |
|---|------|------|
| 1 | `addToCart()` / `addToCartWithQty()` | 加库存 `stock` 校验，≤0 时禁止添加 |
| 2 | `cartItem` 构造 | `unit_price` 统一取 `product.price` |
| 3 | 错误提示 | 加商品时统一 Toast 格式 |
| 4 | `loadProducts()` | 失败时不显示空 Toast，维持已有静默处理 |

---

## 二、不纳入

- 后端 `OrderLogic` — 已一致
- 预下单 vs 直接添加的业务模型差异 — 权限设计，不需改
- UI/样式 — 已重构完成
