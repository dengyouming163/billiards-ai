'use client';

import { useState, useReducer, createContext, useContext, useEffect, ReactNode } from 'react';
import { User, Store, Table, Order, EmployeeRole } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { get } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiResponseType } from '@/lib/api/types';
import { switchStore as switchStoreApi } from '@/lib/api/stores';

interface AppState {
  user: User | null;
  currentStore: Store | null;
  stores: Store[];
  tables: Table[];
  activeOrders: Order[];
  isLoading: boolean;
  sidebarCollapsed: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_CURRENT_STORE'; payload: Store | null }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'UPDATE_TABLE'; payload: Table }
  | { type: 'SET_ACTIVE_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' };

const initialState: AppState = {
  user: null,
  currentStore: null,
  stores: [],
  tables: [],
  activeOrders: [],
  isLoading: true,
  sidebarCollapsed: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'SET_TABLES':
      return { ...state, tables: action.payload };
    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'SET_ACTIVE_ORDERS':
      return { ...state, activeOrders: action.payload };
    case 'ADD_ORDER':
      return { ...state, activeOrders: [...state.activeOrders, action.payload] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        activeOrders: state.activeOrders.map(o => o.id === action.payload.id ? action.payload : o),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  toggleSidebar: () => void;
  switchStore: (store: Store) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user: authUser, loading: authLoading } = useAuth();

  useEffect(() => {
    const initData = async () => {
      if (authLoading || !authUser) {
        if (!authLoading && !authUser) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // auth-context persists the store under `storeId` (camelCase) while the
        // StoreUser type declares `store_id` (snake_case); tolerate either so
        // the default current store is the logged-in employee's own store
        // instead of silently falling back to stores[0].
        const userStoreId =
          (authUser as { store_id?: string; storeId?: string }).store_id ||
          (authUser as { store_id?: string; storeId?: string }).storeId ||
          '';

        const user: User = {
          id: authUser.id || '',
          name: authUser.name || '',
          phone: authUser.phone || '',
          avatar: authUser.avatar || '',
          role: (authUser.role as EmployeeRole) || ('' as EmployeeRole),
          storeIds: userStoreId ? [userStoreId] : [],
          currentStoreId: userStoreId,
        };
        dispatch({ type: 'SET_USER', payload: user });

        // 获取门店列表 - 接口返回格式为 { data: [...], pagination: {...} }
        const storeResponse = await get<{ data: Store[]; pagination: any }>(
          API_ENDPOINTS.stores, 
          undefined, 
          ApiResponseType.NORMAL
        );
        
        // 从响应中提取门店数组
        const stores = storeResponse?.data || storeResponse || [];
        dispatch({ type: 'SET_STORES', payload: stores });

        // 设置当前门店 - 优先使用用户关联的门店，否则使用第一个门店
        const currentStore = stores.find(s => s.id === userStoreId) || stores[0];
        if (currentStore) {
          dispatch({ type: 'SET_CURRENT_STORE', payload: currentStore });
          
          // 关键：将当前门店的 store_id 保存到 localStorage
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) {
            try {
              const parsed = JSON.parse(userInfo);
              parsed.storeId = currentStore.id;
              parsed.store_id = currentStore.id;
              parsed.storeName = currentStore.name;
              localStorage.setItem('userInfo', JSON.stringify(parsed));
              console.log('[useApp] 保存默认门店到 localStorage:', currentStore.id, currentStore.name);
            } catch (e) {
              console.error('[useApp] 保存门店信息失败:', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to init data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initData();
  }, [authUser, authLoading]);

  useEffect(() => {
    const loadTablesAndOrders = async () => {
      if (!state.currentStore) return;

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const tables = await get<Table[]>(API_ENDPOINTS.tables, { store_id: state.currentStore.id }, ApiResponseType.ARRAY);
        dispatch({ type: 'SET_TABLES', payload: tables });

        const orders = await get<Order[]>(API_ENDPOINTS.orders, { store_id: state.currentStore.id, status: 'in_progress' }, ApiResponseType.ARRAY);
        dispatch({ type: 'SET_ACTIVE_ORDERS', payload: orders });
      } catch (error) {
        console.error('Failed to load tables/orders:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadTablesAndOrders();
  }, [state.currentStore]);

  const handleSetCurrentStore = async (store: Store) => {
    try {
      const result = await switchStoreApi(store.id);

      if (result.token) {
        localStorage.setItem('token', result.token);
      }

      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        if (result.user) {
          parsed.storeId = result.user.store_id || store.id;
          parsed.store_id = result.user.store_id || store.id;
          parsed.storeName = result.user.store_name || store.name;
        } else {
          parsed.storeId = store.id;
          parsed.store_id = store.id;
          parsed.storeName = store.name;
        }
        localStorage.setItem('userInfo', JSON.stringify(parsed));
      }

      dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    } catch (error) {
      console.error('Failed to switch store:', error);
      dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    }
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, toggleSidebar, switchStore: handleSetCurrentStore }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function useSwitchStore() {
  const { switchStore } = useApp();
  return (store: Store) => switchStore(store);
}