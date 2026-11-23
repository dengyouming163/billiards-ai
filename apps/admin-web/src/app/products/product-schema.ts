import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, { error: "商品名称不能为空" }).max(100, { error: "商品名称不能超过100字" }),
  categoryId: z.string().min(1, { error: "请选择商品分类" }),
  unit: z.string().min(1, { error: "请输入单位" }).default("件"),
  purchasePrice: z.coerce.number().min(0, { error: "进价不能为负数" }),
  salePrice: z.coerce.number().min(0, { error: "售价不能为负数" }),
  stock: z.coerce.number().int().min(0, { error: "库存不能为负数" }),
  lowStockThreshold: z.coerce.number().int().min(0, { error: "预警阈值不能为负数" }).default(10),
  barcode: z.string().optional().default(""),
  image: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  tags: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(""),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, { error: "分类名称不能为空" }).max(50, { error: "分类名称不能超过50字" }),
  icon: z.string().default("box"),
  color: z.string().default("blue"),
  description: z.string().optional().default(""),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const inventoryFormSchema = z.object({
  quantity: z.coerce.number().int(),
  remark: z.string().optional().default(""),
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
