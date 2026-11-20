import type {
  Table, Zone, Assistant, Product, ProductCategory,
  Member, Order, Shift, Payment,
} from '@/types';

export interface InitialData {
  tables: Table[];
  zones: Zone[];
  assistants: Assistant[];
  products: Product[];
  categories: ProductCategory[];
  members: Member[];
  currentShift: Shift | null;
}

export interface AppService {
  loadInitialData(): Promise<InitialData>;

  table: {
    getTables(): Promise<Table[]>;
    getDetail(id: string): Promise<Table>;
    update(id: string, data: Partial<Table>): Promise<Table>;
  };

  order: {
    getLists(params?: Record<string, unknown>): Promise<Order[]>;
    getDetail(id: string): Promise<Order>;
    open(params: Record<string, unknown>): Promise<Order>;
    close(id: string): Promise<void>;
    checkout(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
    extend(id: string, params: Record<string, unknown>): Promise<void>;
    pause(id: string): Promise<void>;
    resume(id: string): Promise<void>;
    cancel(id: string, params?: Record<string, unknown>): Promise<void>;
    merge(params: Record<string, unknown>): Promise<void>;
    changeTable(id: string, params: Record<string, unknown>): Promise<void>;
    inProgress(): Promise<Order[]>;
    getByTable(tableId: string): Promise<Order[]>;
  };

  member: {
    getLists(params?: Record<string, unknown>): Promise<Member[]>;
    search(keyword: string): Promise<Member[]>;
    getDetail(id: string): Promise<Member>;
    create(data: { phone: string; name: string; level: string }): Promise<Member>;
    update(id: string, data: Record<string, unknown>): Promise<Member>;
    recharge(id: string, params: Record<string, unknown>): Promise<Member>;
    consume(id: string, params: Record<string, unknown>): Promise<void>;
    getLevels(): Promise<Record<string, unknown>[]>;
  };

  product: {
    getAll(): Promise<Product[]>;
    getCategories(): Promise<ProductCategory[]>;
  };

  assistant: {
    getLists(): Promise<Assistant[]>;
    getLevels(): Promise<Record<string, unknown>[]>;
  };

  shift: {
    checkIn(params: Record<string, unknown>): Promise<Shift>;
    checkOut(params: Record<string, unknown>): Promise<Shift>;
    getCurrent(): Promise<Shift | null>;
    getRecords(params?: Record<string, unknown>): Promise<Shift[]>;
  };
}
