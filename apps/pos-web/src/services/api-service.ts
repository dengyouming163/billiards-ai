import { get } from '@/lib/api/client';
import { ApiResponseType } from '@/lib/api/types';
import {
  tableApi, orderApi, memberApi, productApi, assistantApi, shiftApi,
} from '@/lib/api/pos';
import type {
  Table, Zone, Assistant, Product, ProductCategory,
  Member, Order, Shift,
} from '@/types';
import type { AppService, InitialData } from './types';

export const apiAppService: AppService = {
  async loadInitialData(): Promise<InitialData> {
    const [tables, zones, assistants, products, categories, members, shiftResult] = await Promise.all([
      tableApi.lists().catch(() => [] as Table[]),
      get<Zone[]>('/pos.Zone/lists', undefined, ApiResponseType.ARRAY).catch(() => [] as Zone[]),
      assistantApi.lists().catch(() => [] as Assistant[]),
      productApi.all().catch(() => [] as Product[]),
      productApi.categories().catch(() => [] as ProductCategory[]),
      memberApi.lists().catch(() => [] as Member[]),
      shiftApi.current().catch(() => null),
    ]);

    const currentShift = shiftResult && 'id' in shiftResult ? (shiftResult as Shift) : null;

    return { tables, zones, assistants, products, categories, members, currentShift };
  },

  table: {
    getTables: () => tableApi.lists(),
    getDetail: (id) => tableApi.detail(id),
    update: (id, data) => tableApi.update(id, data),
  },

  order: {
    getLists: (params) => orderApi.lists(params),
    getDetail: (id) => orderApi.detail(id),
    open: (params) => orderApi.open(params),
    close: (id) => orderApi.close(id),
    checkout: (id, params) => orderApi.checkout(id, params),
    extend: (id, params) => orderApi.extend(id, params),
    pause: (id) => orderApi.pause(id),
    resume: (id) => orderApi.resume(id),
    cancel: (id, params) => orderApi.cancel(id, params),
    merge: (params) => orderApi.merge(params),
    changeTable: (id, params) => orderApi.changeTable({ ...params, id }),
    inProgress: () => orderApi.inProgress(),
    getByTable: (tableId) => orderApi.tableOrders(tableId),
  },

  member: {
    getLists: (params) => memberApi.lists(params),
    search: (keyword) => memberApi.search(keyword),
    getDetail: (id) => memberApi.detail(id),
    create: (data) => memberApi.create(data as unknown as Record<string, unknown>),
    update: (id, data) => memberApi.update(id, data),
    recharge: (id, params) => memberApi.recharge(id, params),
    consume: (id, params) => memberApi.consume(id, params),
    getLevels: () => memberApi.levels(),
  },

  product: {
    getAll: () => productApi.all(),
    getCategories: () => productApi.categories(),
  },

  assistant: {
    getLists: () => assistantApi.lists(),
    getLevels: () => assistantApi.levels(),
  },

  shift: {
    checkIn: (params) => shiftApi.checkIn(params),
    checkOut: (params) => shiftApi.checkOut(params),
    getCurrent: async () => {
      const result = await shiftApi.current();
      return result && 'id' in result ? (result as Shift) : null;
    },
    getRecords: (params) => shiftApi.records(params),
  },
};
