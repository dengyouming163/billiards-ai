// API 标准类型定义
// 所有新开发的模块必须使用此标准

/**
 * API通用响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  show: number;
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
 * API响应处理器类型
 */
export type ApiResponseHandler<T> = (response: ApiResponse<T>) => T;

/**
 * API响应类型枚举
 */
export enum ApiResponseType {
  /** 普通数据 */
  NORMAL = 'normal',
  /** 列表数据（带分页） */
  LIST = 'list',
  /** 直接数组（旧格式兼容） */
  ARRAY = 'array',
}

/**
 * 列表查询参数
 */
export interface ListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  [key: string]: unknown;
}
