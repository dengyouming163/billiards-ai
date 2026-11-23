/**
 * API通用响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  show: 0 | 1;
  msg: string;
  data: T;
}

/**
 * 分页列表数据格式
 */
export interface ApiListData<T> {
  lists: T[];
  count: number;
  page_no: number;
  page_size: number;
}

/**
 * API响应类型枚举
 */
export enum ApiResponseType {
  NORMAL = 'normal',
  LIST = 'list',
  ARRAY = 'array',
  /** Return data as-is — skip snake_case→camelCase conversion. For external-service endpoints. */
  RAW = 'raw',
}

/**
 * 列表查询参数
 */
export interface ListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  // 索引签名允许扩展参数 (store_id, status 等)
  // TODO: 收敛为显式联合类型 { store_id?: string; status?: string; start_date?: string; end_date?: string }
  [key: string]: unknown;
}
