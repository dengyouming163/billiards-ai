/**
 * API 数据 Hook
 * 前后端分离项目 - 方便组件使用 API 数据
 */

import { useState, useEffect, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ApiActions<T> {
  create: (data: unknown) => Promise<T>;
  update: (id: string, data: unknown) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

/**
 * 使用 API 数据的 Hook
 */
export function useApiData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 使用带分页的 API 数据
 */
export function usePaginatedApiData<T>(
  fetchFn: (params: { page: number; pageSize: number }) => Promise<{ list: T[]; total: number }>,
  initialParams: { page: number; pageSize: number } = { page: 1, pageSize: 10 }
): ApiState<{ list: T[]; total: number }> & {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
} {
  const [params, setParams] = useState(initialParams);
  const [state, setState] = useState<ApiState<{ list: T[]; total: number }>>({
    data: null,
    loading: true,
    error: null,
    refetch: () => {},
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetchFn(params);
      setState(prev => ({
        data: result,
        loading: false,
        error: null,
        refetch: prev.refetch,
      }));
    } catch (err) {
      setState(prev => ({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
        refetch: prev.refetch,
      }));
    }
  }, [fetchFn, params]);

  // 更新 refetch 引用
  useEffect(() => {
    setState(prev => ({ ...prev, refetch: fetchData }));
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  return { ...state, page: params.page, pageSize: params.pageSize, setPage, setPageSize };
}

/**
 * 使用 CRUD 操作的 Hook
 */
export function useApiActions<T>(
  createFn: (data: unknown) => Promise<T>,
  updateFn: (id: string, data: unknown) => Promise<T>,
  deleteFn: (id: string) => Promise<void>
): ApiActions<T> & { loading: boolean } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (data: unknown): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await createFn(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Create failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createFn]);

  const update = useCallback(async (id: string, data: unknown): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateFn(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateFn]);

  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await deleteFn(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Delete failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteFn]);

  return { create, update, remove, loading };
}

/**
 * 处理 API 错误的工具函数
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '操作失败，请稍后重试';
}
