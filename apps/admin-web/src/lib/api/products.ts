/**
 * 商品与库存 API 服务
 * 前后端分离项目
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { ListParams } from './types';
import type { Product, ProductCategory, InventoryRecord } from '@/lib/types';

/**
 * ==================== 商品管理 ====================
 */

/**
 * 获取商品统计数据
 */
export async function fetchProductStats() {
  return get<{
    total: number;
    active: number;
    inactive: number;
    total_value: number;
    total_sales_value: number;
    potential_profit: number;
    low_stock: number;
    out_of_stock: number;
  }>(API_ENDPOINTS.productStats);
}

/**
 * 获取商品列表（分页）
 */
export async function fetchProducts(params?: ListParams & { categoryId?: string; keyword?: string; status?: string }) {
  const query: Record<string, unknown> = {
    ...params,
  };
  if (params?.categoryId) {
    query.category_id = params.categoryId;
  }
  return get<{ data: Product[]; pagination: any }>(API_ENDPOINTS.products, query);
}

/**
 * 获取所有商品（不分页）
 */
export async function fetchAllProducts(params?: { categoryId?: string; status?: string }) {
  const query: Record<string, unknown> = {
    ...params,
  };
  if (params?.categoryId) {
    query.category_id = params.categoryId;
  }
  return get<Product[]>(API_ENDPOINTS.productAll, query);
}

/**
 * 获取单个商品详情
 */
export async function fetchProduct(id: string) {
  return get<Product>(API_ENDPOINTS.productDetail, { id });
}

/**
 * 创建商品
 */
export async function createProduct(data: { [key: string]: unknown }) {
  const payload: Record<string, unknown> = { ...data };
  if (data.categoryId !== undefined) payload.category_id = data.categoryId;
  if (data.storeId !== undefined) payload.store_id = data.storeId;
  if (data.salePrice !== undefined) payload.sale_price = data.salePrice;
  if (data.purchasePrice !== undefined) payload.purchase_price = data.purchasePrice;
  if (data.lowStockThreshold !== undefined) payload.low_stock_threshold = data.lowStockThreshold;
  return post<Product>(API_ENDPOINTS.productCreate, payload);
}

/**
 * 更新商品
 */
export async function updateProduct(id: string, data: { [key: string]: unknown }) {
  const payload: Record<string, unknown> = { ...data, id };
  if (data.categoryId !== undefined) payload.category_id = data.categoryId;
  if (data.salePrice !== undefined) payload.sale_price = data.salePrice;
  if (data.purchasePrice !== undefined) payload.purchase_price = data.purchasePrice;
  if (data.lowStockThreshold !== undefined) payload.low_stock_threshold = data.lowStockThreshold;
  return put<Product>(API_ENDPOINTS.productUpdate, payload);
}

/**
 * 删除商品
 */
export async function deleteProduct(id: string) {
  return del<void>(API_ENDPOINTS.productDelete, { id });
}

/**
 * 切换商品状态
 */
export async function toggleProductStatus(id: string) {
  return post<{ id: string; status: string }>(API_ENDPOINTS.productToggle, { id });
}

/**
 * ==================== 商品分类管理 ====================
 */

/**
 * 获取商品分类列表
 */
export async function fetchProductCategories() {
  return get<ProductCategory[]>(API_ENDPOINTS.productCategories);
}

/**
 * 获取所有分类（新接口）
 */
export async function fetchAllProductCategories() {
  return get<ProductCategory[]>(API_ENDPOINTS.productCategoryLists);
}

/**
 * 获取单个分类详情
 */
export async function fetchProductCategory(id: string) {
  return get<ProductCategory>(API_ENDPOINTS.productCategoryDetail, { id });
}

/**
 * 创建商品分类
 */
export async function createProductCategory(data: { [key: string]: unknown }) {
  const payload: Record<string, unknown> = { ...data };
  if (data.storeId !== undefined) payload.store_id = data.storeId;
  if (data.sort !== undefined) payload.sort_order = data.sort;
  return post<ProductCategory>(API_ENDPOINTS.productCategoryCreate, payload);
}

/**
 * 更新商品分类
 */
export async function updateProductCategory(id: string, data: Partial<ProductCategory>) {
  const payload = {
    ...data,
    id,
    sort_order: data.sort,
  };
  return put<ProductCategory>(API_ENDPOINTS.productCategoryUpdate, payload);
}

/**
 * 删除商品分类
 */
export async function deleteProductCategory(id: string) {
  return del<void>(API_ENDPOINTS.productCategoryDelete, { id });
}

/**
 * ==================== 库存管理 ====================
 */

/**
 * 获取库存统计数据
 */
export async function fetchInventoryStats() {
  return get<{
    total_products: number;
    total_stock: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    inbound_today: number;
    outbound_today: number;
  }>(API_ENDPOINTS.inventoryStats);
}

/**
 * 获取库存记录列表
 */
export async function fetchInventoryRecords(params?: ListParams & { type?: 'inbound' | 'outbound'; productId?: string }) {
  const query: Record<string, unknown> = {
    ...params,
  };
  if (params?.productId) {
    query.product_id = params.productId;
  }
  return get<{ data: InventoryRecord[]; pagination: any }>(API_ENDPOINTS.inventoryRecords, query);
}

/**
 * 获取商品库存详情
 */
export async function fetchProductInventory(productId: string) {
  return get<{
    productId: string;
    productName: string;
    quantity: number;
    minStock: number;
    totalInbound: number;
    totalOutbound: number;
    lastInbound: string | null;
    lastOutbound: string | null;
  }>(API_ENDPOINTS.inventoryProduct, { product_id: productId });
}

/**
 * 库存入库
 */
export async function inbound(
  productId: string,
  quantity: number,
  remark?: string
) {
  return post<InventoryRecord>(API_ENDPOINTS.inventoryInbound, {
    product_id: productId,
    quantity,
    remark,
  });
}

/**
 * 库存出库
 */
export async function outbound(
  productId: string,
  quantity: number,
  remark?: string
) {
  return post<InventoryRecord>(API_ENDPOINTS.inventoryOutbound, {
    product_id: productId,
    quantity,
    remark,
  });
}

/**
 * 库存调整
 */
export async function adjustStock(
  productId: string,
  quantity: number,
  remark?: string,
  targetStock?: number
) {
  const body: Record<string, any> = {
    product_id: productId,
    remark,
  };
  if (targetStock !== undefined && targetStock !== null) {
    body.target_stock = targetStock;
    body.quantity = 0;
  } else {
    body.quantity = quantity;
  }
  return post<InventoryRecord>(API_ENDPOINTS.inventoryAdjust, body);
}
