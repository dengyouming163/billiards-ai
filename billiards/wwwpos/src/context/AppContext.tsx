'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Table,
  Assistant,
  Product,
  ProductCategory,
  Member,
  Shift,
  Operator,
  Order,
  Payment,
  Session,
  OrderItem,
  OfflineOperation,
  NetworkStatus,
  MemberLevel,
  Technician,
  Package,
  Promotion,
  Reservation,
  TimeSlot,
  BillingMode,
  Zone,
} from '@/types';
import { appService } from '@/services';
import type { AppService } from '@/services/types';
import { replayAll, enqueue } from '@/utils/offline-queue';
import { calculateFee, cacheBillingData, getCachedBillingData, removeBillingData, type PricingPeriod } from '@/utils/offline-billing';
import { initCache, updateCache, getCachedProducts, getCachedAssistants } from '@/utils/offline-cache';

// ============================================================
// State Types
// ============================================================

interface AppState {
  // Data
  tables: Table[];
  zones: Zone[];
  assistants: Assistant[];
  products: Product[];
  categories: ProductCategory[];
  members: Member[];
  orders: Order[];
  payments: Payment[];
  
  // Session
  currentShift?: Shift;
  currentOperator?: Operator;
  
  // Network
  networkStatus: NetworkStatus;
  offlineQueue: OfflineOperation[];
  
  // UI State
  selectedTableId?: string;
  viewMode: 'grid' | 'list';
  filterStatus: 'all' | Table['status'];
  searchQuery: string;
  
  // Cart State
  currentCart: {
    tableId?: string;
    items: OrderItem[];
    remarks?: string;
  };
  
  // Loading
  isLoading: boolean;
  
  // 增强功能数据
  technicians: Technician[];
  packages: Package[];
  promotions: Promotion[];
  reservations: Reservation[];
  timeSlots: TimeSlot[];
  currentBillingMode: BillingMode;
}

type AppAction =
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'UPDATE_TABLE'; payload: Table }
  | { type: 'OPEN_TABLE'; payload: { tableId: string; session: Session } }
  | { type: 'CLOSE_TABLE'; payload: string }
  | { type: 'SET_ASSISTANTS'; payload: Assistant[] }
  | { type: 'UPDATE_ASSISTANT'; payload: Assistant }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: ProductCategory[] }
  | { type: 'SET_MEMBERS'; payload: Member[] }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_PAYMENTS'; payload: Payment[] }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'SET_CURRENT_SHIFT'; payload?: Shift }
  | { type: 'SET_CURRENT_OPERATOR'; payload?: Operator }
  | { type: 'SET_NETWORK_STATUS'; payload: NetworkStatus }
  | { type: 'ADD_OFFLINE_OPERATION'; payload: OfflineOperation }
  | { type: 'CLEAR_OFFLINE_QUEUE' }
  | { type: 'SET_SELECTED_TABLE'; payload?: string }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_FILTER_STATUS'; payload: 'all' | Table['status'] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_TO_CART'; payload: OrderItem }
  | { type: 'UPDATE_CART_ITEM'; payload: { itemId: string; quantity: number; remarks?: string } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'SET_CART_TABLE'; payload?: string }
  | { type: 'SET_CART_REMARKS'; payload?: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  // 增强功能
  | { type: 'SET_TECHNICIANS'; payload: Technician[] }
  | { type: 'UPDATE_TECHNICIAN'; payload: Technician }
  | { type: 'SET_PACKAGES'; payload: Package[] }
  | { type: 'SET_PROMOTIONS'; payload: Promotion[] }
  | { type: 'SET_RESERVATIONS'; payload: Reservation[] }
  | { type: 'ADD_RESERVATION'; payload: Reservation }
  | { type: 'UPDATE_RESERVATION'; payload: Reservation }
  | { type: 'CANCEL_RESERVATION'; payload: string }
  | { type: 'SET_TIME_SLOTS'; payload: TimeSlot[] }
  | { type: 'SET_BILLING_MODE'; payload: BillingMode }
  | { type: 'APPLY_PROMOTION'; payload: { promotionId: string; amount: number } }
  | { type: 'TRANSFER_TABLE'; payload: { fromTableId: string; toTableId: string } }
  | { type: 'MERGE_TABLES'; payload: { sourceTableId: string; targetTableId: string } }
  | { type: 'SET_ZONES'; payload: Zone[] }
  | { type: 'INIT_DATA'; payload: Partial<AppState> }
  | { type: 'PAUSE_TABLE_FEE'; payload: string }
  | { type: 'RESUME_TABLE_FEE'; payload: string };

// ============================================================
// Initial State（空壳，数据从 Service 加载）
// ============================================================

const initialState: AppState = {
  tables: [],
  zones: [],
  assistants: [],
  products: [],
  categories: [],
  members: [],
  orders: [],
  payments: [],
  networkStatus: 'online',
  offlineQueue: [],
  selectedTableId: undefined,
  viewMode: 'grid',
  filterStatus: 'all',
  searchQuery: '',
  currentCart: {
    tableId: undefined,
    items: [],
    remarks: undefined,
  },
  isLoading: false,
  technicians: [],
  packages: [],
  promotions: [],
  reservations: [],
  timeSlots: [],
  currentBillingMode: 'hourly',
};

// ============================================================
// Reducer
// ============================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TABLES':
      return { ...state, tables: action.payload };
      
    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
      
    case 'OPEN_TABLE':
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload.tableId
            ? { ...t, status: 'occupied' as const, currentSession: action.payload.session }
            : t
        ),
      };
      
    case 'CLOSE_TABLE':
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload
            ? { ...t, status: 'idle' as const, currentSession: undefined }
            : t
        ),
      };
      
    case 'SET_ASSISTANTS':
      return { ...state, assistants: action.payload };
      
    case 'UPDATE_ASSISTANT':
      return {
        ...state,
        assistants: state.assistants.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
      
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
      
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
      
    case 'SET_MEMBERS':
      return { ...state, members: action.payload };
      
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
      
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
      
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
      
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
      
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
      
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload };
      
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
      
    case 'SET_CURRENT_SHIFT':
      return { ...state, currentShift: action.payload };
      
    case 'SET_CURRENT_OPERATOR':
      return { ...state, currentOperator: action.payload };
      
    case 'SET_NETWORK_STATUS':
      return { ...state, networkStatus: action.payload };
      
    case 'ADD_OFFLINE_OPERATION':
      return {
        ...state,
        offlineQueue: [...state.offlineQueue, action.payload],
      };
      
    case 'CLEAR_OFFLINE_QUEUE':
      return { ...state, offlineQueue: [] };
      
    case 'SET_SELECTED_TABLE':
      return { ...state, selectedTableId: action.payload };
      
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
      
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload };
      
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
      
    case 'ADD_TO_CART': {
      const existingIndex = state.currentCart.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingIndex >= 0) {
        const updatedItems = [...state.currentCart.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + action.payload.quantity,
          subtotal: (updatedItems[existingIndex].quantity + action.payload.quantity) * updatedItems[existingIndex].unitPrice,
        };
        return {
          ...state,
          currentCart: { ...state.currentCart, items: updatedItems },
        };
      }
      return {
        ...state,
        currentCart: {
          ...state.currentCart,
          items: [...state.currentCart.items, action.payload],
        },
      };
    }
    
    case 'UPDATE_CART_ITEM': {
      const updatedItems = state.currentCart.items.map((item) =>
        item.id === action.payload.itemId
          ? {
              ...item,
              quantity: action.payload.quantity,
              subtotal: action.payload.quantity * item.unitPrice,
              remarks: action.payload.remarks ?? item.remarks,
            }
          : item
      );
      return {
        ...state,
        currentCart: { ...state.currentCart, items: updatedItems },
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        currentCart: {
          ...state.currentCart,
          items: state.currentCart.items.filter((i) => i.id !== action.payload),
        },
      };
      
    case 'SET_CART_TABLE':
      return {
        ...state,
        currentCart: { ...state.currentCart, tableId: action.payload },
      };
      
    case 'SET_CART_REMARKS':
      return {
        ...state,
        currentCart: { ...state.currentCart, remarks: action.payload },
      };
      
    case 'CLEAR_CART':
      return {
        ...state,
        currentCart: { tableId: undefined, items: [], remarks: undefined },
      };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_TECHNICIANS':
      return { ...state, technicians: action.payload };
      
    case 'UPDATE_TECHNICIAN':
      return {
        ...state,
        technicians: state.technicians.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
      
    case 'SET_PACKAGES':
      return { ...state, packages: action.payload };
      
    case 'SET_PROMOTIONS':
      return { ...state, promotions: action.payload };
      
    case 'SET_RESERVATIONS':
      return { ...state, reservations: action.payload };
      
    case 'ADD_RESERVATION':
      return { ...state, reservations: [...state.reservations, action.payload] };
      
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
      
    case 'CANCEL_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map((r) =>
          r.id === action.payload ? { ...r, status: 'cancelled' as const } : r
        ),
      };
      
    case 'SET_TIME_SLOTS':
      return { ...state, timeSlots: action.payload };
      
    case 'SET_BILLING_MODE':
      return { ...state, currentBillingMode: action.payload };
      
    case 'TRANSFER_TABLE': {
      const { fromTableId, toTableId } = action.payload;
      const fromTable = state.tables.find((t) => t.id === fromTableId);
      const toTable = state.tables.find((t) => t.id === toTableId);
      
      if (!fromTable || !toTable || toTable.status !== 'idle') {
        return state;
      }
      
      return {
        ...state,
        tables: state.tables.map((t) => {
          if (t.id === fromTableId) {
            return { ...t, status: 'idle' as const, currentSession: undefined };
          }
          if (t.id === toTableId) {
            return {
              ...t,
              status: 'occupied' as const,
              currentSession: fromTable.currentSession
                ? { ...fromTable.currentSession, tableId: toTableId }
                : undefined,
            };
          }
          return t;
        }),
      };
    }
    
    case 'MERGE_TABLES': {
      const { sourceTableId, targetTableId } = action.payload;
      const sourceTable = state.tables.find((t) => t.id === sourceTableId);
      const targetTable = state.tables.find((t) => t.id === targetTableId);
      
      if (!sourceTable?.currentSession || !targetTable?.currentSession) {
        return state;
      }
      
      return {
        ...state,
        tables: state.tables.map((t) => {
          if (t.id === sourceTableId) {
            return { ...t, status: 'idle' as const, currentSession: undefined };
          }
          if (t.id === targetTableId) {
            const mergedSession = {
              ...targetTable.currentSession!,
              customerCount: targetTable.currentSession!.customerCount + sourceTable.currentSession!.customerCount,
            };
            return { ...t, currentSession: mergedSession };
          }
          return t;
        }),
      };
    }

    case 'SET_ZONES':
      return { ...state, zones: action.payload };

    case 'PAUSE_TABLE_FEE':
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload && t.currentSession
            ? { ...t, currentSession: { ...t.currentSession, tableFeePaused: true } }
            : t
        ),
      };

    case 'RESUME_TABLE_FEE':
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload && t.currentSession
            ? { ...t, currentSession: { ...t.currentSession, tableFeePaused: false } }
            : t
        ),
      };

    case 'INIT_DATA':
      return { ...state, ...action.payload, isLoading: false };

    default:
      return state;
  }
}

// ============================================================
// Context Types
// ============================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  service: AppService;
  
  // Computed values
  filteredTables: Table[];
  selectedTable?: Table;
  cartTotal: number;
  cartItemCount: number;
  pendingCheckoutCount: number;
  pendingReservationCount: number;
  availableTechnicians: Technician[];
  activePromotions: Promotion[];
  upcomingReservations: Reservation[];
  
  // Actions
  openTable: (tableId: string, playerCount: number) => Promise<Order>;
  closeTable: (tableId: string) => void;
  assignAssistant: (tableId: string, assistantId: string, assistantName: string) => void;
  removeAssistant: (tableId: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  submitOrder: () => void;
  setCartTable: (tableId: string) => void;
  findMember: (phone: string) => Member | undefined;
  rechargeMember: (memberId: string, amount: number, tier: { bonus: number; points: number }) => void;
  deductMemberBalance: (memberId: string, amount: number) => void;
  deductMemberPoints: (memberId: string, points: number) => void;
  createMember: (data: { phone: string; name: string; level: MemberLevel }) => Member;
  startShift: (operatorId: string, operatorName: string, openingCash: number) => void;
  endShift: (closingCash: number) => void;
  syncOfflineData: () => Promise<void>;
  
  // 增强功能方法
  transferTable: (fromTableId: string, toTableId: string) => void;
  mergeTables: (sourceTableId: string, targetTableId: string) => void;
  addReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  cancelReservation: (reservationId: string) => void;
  checkInReservation: (reservationId: string, tableId: string) => void;
  getTableRate: (tableId: string) => number;
  calculateSessionFee: (tableId: string, startTime: string) => number;
  applyPromotion: (promotionId: string, amount: number) => { discountedAmount: number; promotion: Promotion };
  setBillingMode: (mode: BillingMode) => void;
}

// ============================================================
// Context
// ============================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [service] = useState<AppService>(appService);

  // ============================================================
  // 客户端 hydration 后从 localStorage 恢复 session 数据
  // ============================================================
  useEffect(() => {
    try {
      const rawShift = localStorage.getItem('currentShift');
      if (rawShift) {
        dispatch({ type: 'SET_CURRENT_SHIFT', payload: JSON.parse(rawShift) as Shift });
      }
    } catch {
      localStorage.removeItem('currentShift');
    }
    try {
      const rawOp = localStorage.getItem('currentOperator');
      if (rawOp) {
        dispatch({ type: 'SET_CURRENT_OPERATOR', payload: JSON.parse(rawOp) as Operator });
      }
    } catch {
      localStorage.removeItem('currentOperator');
    }
  }, []);

  // ============================================================
  // 初始数据加载
  // ============================================================
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await service.loadInitialData();
        if (mounted) {
          dispatch({
            type: 'INIT_DATA',
            payload: {
              tables: data.tables,
              zones: data.zones,
              assistants: data.assistants,
              products: data.products,
              categories: data.categories,
              members: data.members,
            },
          });
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
        // 离线时从本地缓存恢复
        const cached = initCache()
        if (mounted && cached) {
          dispatch({
            type: 'INIT_DATA',
            payload: {
              tables: cached.zones.map(z => ({ id: z.id, name: z.name, status: 'idle' as const })) as any,
              zones: cached.zones.map(z => ({ id: z.id, name: z.name, color: '#6b7280' })) as any,
              assistants: cached.assistants.map(a => ({
                id: a.id, name: a.name, level: a.level_name || '', hourlyRate: a.hourly_rate,
                status: 'available', phone: '', avatar: '',
              })) as any,
              products: cached.products.map(p => ({
                id: p.id, name: p.name, price: p.price, categoryId: p.category_id || '',
                unit: '', image: '', stock: 0, status: 'active', emoji: '',
              })) as any,
              categories: [],
              members: [],
            },
          } as any)
        }
        if (mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [service]);

  // 在线时定期缓存基础数据（每5分钟）
  useEffect(() => {
    if (state.networkStatus !== 'online') return
    const interval = setInterval(() => {
      try {
        updateCache({
          products: state.products.map(p => ({ id: p.id, name: p.name, price: p.price || 0, category_id: p.categoryId })),
          assistants: state.assistants.map(a => ({ id: a.id, name: a.name, hourly_rate: a.hourlyRate || 0, level_name: a.level })),
        })
      } catch {}
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [state.networkStatus, state.products, state.assistants])

  // 多台桌离线计时器：遍历所有占用台桌，每60秒更新台费
  useEffect(() => {
    if (state.networkStatus === 'online') return
    const interval = setInterval(() => {
      dispatch({ type: 'SET_TABLES', payload: state.tables.map(t => {
        if (t.status === 'occupied' && t.currentSession?.startTime) {
          const cache = getCachedBillingData(t.id)
          if (cache) {
            const startMs = new Date(t.currentSession.startTime).getTime()
            const durationMin = Math.floor((Date.now() - startMs) / 60000)
            const fee = calculateFee(cache, durationMin)
            return { ...t, currentSession: { ...t.currentSession, tableFee: fee } }
          }
        }
        return t
      })})
    }, 60000)
    return () => clearInterval(interval)
  }, [state.networkStatus, state.tables])

  // ============================================================
  // currentOperator 持久化（同步到 localStorage）
  // ============================================================
  useEffect(() => {
    if (state.currentOperator) {
      localStorage.setItem('currentOperator', JSON.stringify(state.currentOperator));
    } else {
      localStorage.removeItem('currentOperator');
    }
  }, [state.currentOperator]);

  useEffect(() => {
    if (state.currentShift) {
      localStorage.setItem('currentShift', JSON.stringify(state.currentShift));
    } else {
      localStorage.removeItem('currentShift');
    }
  }, [state.currentShift]);

  // ============================================================
  // Computed values
  // ============================================================

  const filteredTables = state.tables.filter((table) => {
    if (state.filterStatus !== 'all' && table.status !== state.filterStatus) {
      return false;
    }
    if (state.searchQuery) {
      return table.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    }
    return true;
  });

  const selectedTable = state.tables.find((t) => t.id === state.selectedTableId);
  
  const cartTotal = state.currentCart.items.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = state.currentCart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  const pendingCheckoutCount = state.tables.filter(
    (t) => t.status === 'occupied' && t.currentSession
  ).length;
  
  const pendingReservationCount = state.tables.filter((t) => t.status === 'reserved').length;
  
  const availableTechnicians = state.technicians.filter((t) => t.status === 'available');
  
  const activePromotions = state.promotions.filter((p) => {
    const now = new Date();
    const start = new Date(p.startTime);
    const end = new Date(p.endTime);
    return p.status === 'active' && now >= start && now <= end;
  });
  
  const upcomingReservations = state.reservations
    .filter((r) => {
      const resTime = new Date(r.reservationTime);
      const now = new Date();
      const hoursDiff = (resTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return r.status !== 'cancelled' && r.status !== 'no_show' && hoursDiff <= 24 && hoursDiff >= -2;
    })
    .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());

  // ============================================================
  // Actions - 委托给 Service 层
  // ============================================================

  const openTable = useCallback(
    async (tableId: string, playerCount: number) => {
      try {
        const op = stateRef.current.currentOperator;
        const result = await service.order.open({
          table_id: tableId,
          player_count: playerCount,
          operator_id: op?.id || '',
          operator_name: op?.name || '',
        });

        const session: Session = {
          id: (result as any)?.order_id || (result as any)?.id || `s_${Date.now()}`,
          tableId,
          orderId: (result as any)?.order_id || undefined,
          orderNo: (result as any)?.order_no || undefined,
          startTime: (result as any)?.start_time || new Date().toISOString(),
          customerCount: playerCount,
          pricingType: 'hourly',
          status: 'active',
          tableFee: 0,
          createdAt: new Date().toISOString(),
        };

        dispatch({ type: 'OPEN_TABLE', payload: { tableId, session } });

        return result;
      } catch (err) {
        // 离线时入队
        if (stateRef.current.networkStatus === 'offline') {
          const tempOrderId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const session: Session = {
            id: tempOrderId,
            tableId,
            orderId: tempOrderId,
            orderNo: `OFFLINE_${Date.now()}`,
            startTime: new Date().toISOString(),
            customerCount: playerCount,
            pricingType: 'hourly',
            status: 'active',
            tableFee: 0,
            createdAt: new Date().toISOString(),
          };
          dispatch({ type: 'OPEN_TABLE', payload: { tableId, session } });
          enqueue('open_table', { table_id: tableId, player_count: playerCount, client_order_id: tempOrderId });
          return null;
        }
        console.error('开台失败:', err);
        throw err;
      }
    },
    [service, dispatch]
  );

  const closeTable = useCallback(
    (tableId: string) => {
      dispatch({ type: 'CLOSE_TABLE', payload: tableId });

      if (state.networkStatus === 'offline') {
        dispatch({
          type: 'ADD_OFFLINE_OPERATION',
          payload: {
            id: `op_${Date.now()}`,
            type: 'close_table',
            data: { tableId },
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        });
      }
    },
    [state.networkStatus, service]
  );

  const assignAssistant = useCallback(
    (tableId: string, assistantId: string, assistantName: string) => {
      const table = state.tables.find((t) => t.id === tableId);
      if (!table?.currentSession) return;

      const updatedSession = {
        ...table.currentSession,
        assistantId,
        assistantName,
      };

      dispatch({
        type: 'UPDATE_TABLE',
        payload: { ...table, currentSession: updatedSession },
      });

      dispatch({
        type: 'UPDATE_ASSISTANT',
        payload: state.assistants.find((a) => a.id === assistantId)!,
      });
    },
    [state.tables, state.assistants, service]
  );

  const removeAssistant = useCallback(
    (tableId: string) => {
      const table = state.tables.find((t) => t.id === tableId);
      if (!table?.currentSession) return;

      const updatedSession = {
        ...table.currentSession,
        assistantId: undefined,
        assistantName: undefined,
      };

      dispatch({
        type: 'UPDATE_TABLE',
        payload: { ...table, currentSession: updatedSession },
      });

    },
    [state.tables, service]
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const item: OrderItem = {
        id: `oi_${Date.now()}_${product.id}`,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        status: 'pending',
      };
      dispatch({ type: 'ADD_TO_CART', payload: item });
    },
    []
  );

  const submitOrder = useCallback(() => {
    if (!state.currentCart.tableId || state.currentCart.items.length === 0) return;

    const order: Order = {
      id: `o_${Date.now()}`,
      tableId: state.currentCart.tableId,
      sessionId: state.tables.find((t) => t.id === state.currentCart.tableId)?.currentSession?.id || '',
      items: state.currentCart.items,
      totalAmount: cartTotal,
      status: 'completed',
      remarks: state.currentCart.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: state.networkStatus === 'offline' ? 'pending' : 'synced',
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'CLEAR_CART' });

    service.order.open({
      table_id: order.tableId,
      items: order.items,
      total_amount: order.totalAmount,
      remarks: order.remarks,
    }).catch((err) => {
      console.error('Failed to submit order on service:', err);
    });

    if (state.networkStatus === 'offline') {
      dispatch({
        type: 'ADD_OFFLINE_OPERATION',
        payload: {
          id: `op_${Date.now()}`,
          type: 'create_order',
          data: order,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        },
      });
    }
  }, [state.currentCart, state.tables, cartTotal, state.networkStatus, service]);

  const setCartTable = useCallback((tableId: string) => {
    dispatch({ type: 'SET_CART_TABLE', payload: tableId });
  }, []);

  const findMember = useCallback(
    (phone: string): Member | undefined => {
      return state.members.find((m) => m.phone.includes(phone.replace(/\*/g, '')));
    },
    [state.members]
  );

  const rechargeMember = useCallback(
    (memberId: string, amount: number, tier: { bonus: number; points: number }) => {
      const mems = stateRef.current.members;
      const member = mems.find((m) => m.id === memberId);
      if (!member) return;

      const original = { ...member };
      const updated: Member = {
        ...member,
        balance: member.balance + amount + tier.bonus,
        points: member.points + tier.points,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_MEMBER', payload: updated });

      service.member.recharge(memberId, { amount, bonus: tier.bonus, points: tier.points }).catch((err) => {
        console.error('Failed to recharge member, rolling back:', err);
        dispatch({ type: 'UPDATE_MEMBER', payload: original });
      });
    },
    [service]
  );

  const deductMemberBalance = useCallback(
    (memberId: string, amount: number) => {
      const mems = stateRef.current.members;
      const member = mems.find((m) => m.id === memberId);
      if (!member) return;

      const original = { ...member };
      const updated: Member = {
        ...member,
        balance: member.balance - amount,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_MEMBER', payload: updated });

      service.member.consume(memberId, { amount }).catch((err) => {
        console.error('Failed to deduct member balance, rolling back:', err);
        dispatch({ type: 'UPDATE_MEMBER', payload: original });
      });
    },
    [service]
  );

  const deductMemberPoints = useCallback(
    (memberId: string, points: number) => {
      const member = stateRef.current.members.find((m) => m.id === memberId);
      if (!member) return;

      const updated: Member = {
        ...member,
        points: member.points - points,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_MEMBER', payload: updated });
    },
    [dispatch]
  );

  const createMember = useCallback(
    (data: { phone: string; name: string; level: MemberLevel }): Member => {
      const member: Member = {
        id: `m_${Date.now()}`,
        ...data,
        balance: 0,
        points: 0,
        totalConsume: 0,
        totalRecharge: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MEMBER', payload: member });

      service.member.create(data as { phone: string; name: string; level: string }).catch((err) => {
        console.error('Failed to create member on service:', err);
      });

      return member;
    },
    [service]
  );

  const startShift = useCallback(
    (operatorId: string, operatorName: string, openingCash: number) => {
      const shift: Shift = {
        id: `sh_${Date.now()}`,
        operatorId,
        operatorName,
        startTime: new Date().toISOString(),
        openingCash,
        totalSales: 0,
        totalOrders: 0,
        totalAmount: 0,
        cashSales: 0,
        electronicSales: 0,
        memberRecharge: 0,
        couponCount: 0,
        openTables: 0,
        closeTables: 0,
        payments: [],
        status: 'open',
      };
      dispatch({ type: 'SET_CURRENT_SHIFT', payload: shift });
      const operator = { id: operatorId, name: operatorName, role: 'cashier' as const };
      dispatch({
        type: 'SET_CURRENT_OPERATOR',
        payload: operator,
      });
      localStorage.setItem('currentOperator', JSON.stringify(operator));
      localStorage.setItem('currentShift', JSON.stringify(shift));
    },
    []
  );

  const endShift = useCallback(
    (closingCash: number) => {
      const currentShift = stateRef.current.currentShift;
      if (!currentShift) return;

      const completedShift: Shift = {
        ...currentShift,
        endTime: new Date().toISOString(),
        closingCash,
        cashDifference: closingCash - currentShift.openingCash,
        status: 'closed',
      };
      dispatch({ type: 'SET_CURRENT_SHIFT', payload: undefined });
      dispatch({ type: 'SET_CURRENT_OPERATOR', payload: undefined });

      service.shift.checkOut({ shift_id: currentShift.id, closing_cash: closingCash }).catch((err) => {
        console.error('Failed to end shift on service:', err);
      });

      console.log('Shift completed:', completedShift);
    },
    [service]
  );

  const syncOfflineData = useCallback(async () => {
    if (state.offlineQueue.length === 0) return

    dispatch({ type: 'SET_NETWORK_STATUS', payload: 'syncing' })

    // 动态导入 POS API（避免循环依赖）
    const { orderApi } = await import('@/lib/api/pos')

    const { done, failed } = await replayAll(async (op) => {
      try {
        switch (op.type) {
          case 'open_table':
            await service.order.open(op.data as Parameters<typeof service.order.open>[0])
            return true
          case 'close_table':
            await service.order.close(op.data.tableId as string)
            return true
          case 'create_order':
            await service.order.open(op.data as Parameters<typeof service.order.open>[0])
            return true
          case 'add_product':
            await orderApi.addProductItem(op.data as Record<string, unknown>)
            return true
          case 'remove_product':
            await orderApi.removeItem(op.data as Record<string, unknown>)
            return true
          case 'book_assistant':
            await orderApi.addAssistantItem(op.data as Record<string, unknown>)
            return true
          case 'checkout':
            await service.order.checkout(
              (op.data as any).orderId,
              (op.data as any).params
            )
            return true
          case 'extend_time':
            await service.order.extend(
              (op.data as any).orderId,
              (op.data as any).params
            )
            return true
          default:
            console.warn('[Offline] Unknown operation type:', op.type)
            return false
        }
      } catch {
        return false
      }
    })

    if (done > 0) {
      // 同步成功后重新加载数据
      service.loadInitialData().then(data => {
        dispatch({
          type: 'INIT_DATA',
          payload: {
            tables: data.tables,
            zones: data.zones,
            assistants: data.assistants,
            products: data.products,
            categories: data.categories,
            members: data.members,
          },
        })
      }).catch(() => {})
    }

    if (failed > 0) {
      console.warn(`[Offline] ${failed} operations failed to sync`)
    }

    dispatch({ type: 'SET_NETWORK_STATUS', payload: 'online' })
  }, [state.offlineQueue, service])

  const transferTable = useCallback(
    (fromTableId: string, toTableId: string) => {
      dispatch({ type: 'TRANSFER_TABLE', payload: { fromTableId, toTableId } });
    },
    []
  );

  const mergeTables = useCallback(
    (sourceTableId: string, targetTableId: string) => {
      dispatch({ type: 'MERGE_TABLES', payload: { sourceTableId, targetTableId } });
    },
    []
  );

  const addReservation = useCallback(
    (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) => {
      const reservation: Reservation = {
        ...data,
        id: `res_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_RESERVATION', payload: reservation });
      
      if (reservation.tableId) {
        const table = state.tables.find((t) => t.id === reservation.tableId);
        if (table && table.status === 'idle') {
          dispatch({
            type: 'UPDATE_TABLE',
            payload: { ...table, status: 'reserved' as const },
          });
        }
      }

    },
    [state.tables]
  );

  const cancelReservation = useCallback(
    (reservationId: string) => {
      const reservation = state.reservations.find((r) => r.id === reservationId);
      if (reservation?.tableId) {
        const table = state.tables.find((t) => t.id === reservation.tableId);
        if (table && table.status === 'reserved') {
          dispatch({
            type: 'UPDATE_TABLE',
            payload: { ...table, status: 'idle' as const },
          });
        }
      }
      dispatch({ type: 'CANCEL_RESERVATION', payload: reservationId });
    },
    [state.reservations, state.tables]
  );

  const checkInReservation = useCallback(
    (reservationId: string, tableId: string) => {
      const reservation = state.reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      dispatch({
        type: 'UPDATE_RESERVATION',
        payload: { ...reservation, status: 'checked_in' as const, tableId, updatedAt: new Date().toISOString() },
      });

      const session: Session = {
        id: `s_${Date.now()}`,
        tableId,
        startTime: new Date().toISOString(),
        customerCount: reservation.customerCount,
        pricingType: 'hourly',
        status: 'active',
        tableFee: 0,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'OPEN_TABLE', payload: { tableId, session } });
    },
    [state.reservations]
  );

  const getTableRate = useCallback(
    (tableId: string): number => {
      const table = state.tables.find((t) => t.id === tableId);
      if (!table) return 40;
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const matchingSlot = state.timeSlots.find((slot) => {
        const isMatch = hour >= slot.startHour && hour < slot.endHour;
        const typeMatch = isWeekend ? slot.isWeekend : !slot.isHoliday && !slot.isWeekend;
        return isMatch && typeMatch;
      });
      if (matchingSlot) {
        return table.type === 'vip' ? matchingSlot.rates.vip : matchingSlot.rates.standard;
      }
      return table.hourlyRate;
    },
    [state.tables, state.timeSlots]
  );

  const calculateSessionFee = useCallback(
    (tableId: string, startTime: string): number => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const minutes = Math.floor((now - start) / (1000 * 60));
      const rate = getTableRate(tableId);
      return Math.ceil(minutes / 15) * Math.round(rate / 4);
    },
    [getTableRate]
  );

  const applyPromotion = useCallback(
    (promotionId: string, amount: number): { discountedAmount: number; promotion: Promotion } => {
      const promotion = state.promotions.find((p) => p.id === promotionId);
      if (!promotion) {
        return { discountedAmount: amount, promotion: promotion! };
      }

      let discountedAmount = amount;
      
      if (promotion.discountType === 'rate') {
        discountedAmount = amount * promotion.discountValue;
      } else {
        discountedAmount = Math.max(0, amount - promotion.discountValue);
      }

      if (promotion.maxDiscount) {
        discountedAmount = Math.max(amount - promotion.maxDiscount, discountedAmount);
      }

      return { discountedAmount, promotion };
    },
    [state.promotions]
  );

  const setBillingMode = useCallback(
    (mode: BillingMode) => {
      dispatch({ type: 'SET_BILLING_MODE', payload: mode });
    },
    []
  );

  // ============================================================
  // Network status detection
  // ============================================================
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_NETWORK_STATUS', payload: 'online' });
      syncOfflineData();
    };
    const handleOffline = () => {
      dispatch({ type: 'SET_NETWORK_STATUS', payload: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      dispatch({ type: 'SET_NETWORK_STATUS', payload: 'offline' });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  // ============================================================
  // Context Value
  // ============================================================

  const value: AppContextType = {
    state,
    dispatch,
    service,
    filteredTables,
    selectedTable,
    cartTotal,
    cartItemCount,
    pendingCheckoutCount,
    pendingReservationCount,
    availableTechnicians,
    activePromotions,
    upcomingReservations,
    openTable,
    closeTable,
    assignAssistant,
    removeAssistant,
    addToCart,
    submitOrder,
    setCartTable,
    findMember,
    rechargeMember,
    deductMemberBalance,
    deductMemberPoints,
    createMember,
    startShift,
    endShift,
    syncOfflineData,
    transferTable,
    mergeTables,
    addReservation,
    cancelReservation,
    checkInReservation,
    getTableRate,
    calculateSessionFee,
    applyPromotion,
    setBillingMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
