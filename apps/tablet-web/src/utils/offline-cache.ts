import { tabletApi } from '@/api/modules/tablet'

// ---- 类型定义 ----
export interface ProductCache {
  id: string; name: string; price: number
  image?: string; category_id: string; unit: string
  stock?: number; emoji?: string
}
export interface AssistantCache {
  id: string; name: string; avatar?: string
  level_id: string; level_name: string
  hourly_rate: number; is_online: boolean
}
export interface TableCache {
  id: string; number: string; name: string
  type_name: string; hourly_rate: number
  zone_id?: string; status: string
}
export interface CategoryCache { id: string; name: string; icon?: string }
export interface MemberCache { id: string; name: string; level: string; balance: number }

const STORAGE_KEY = 'offline_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000

// ---- 内存状态 ----
let products = new Map<string, ProductCache>()
let categories: CategoryCache[] = []
let assistants = new Map<string, AssistantCache>()
let assistantLevels: { id: string; name: string; code: string }[] = []
let tables = new Map<string, TableCache>()
let member: MemberCache | null = null

// ---- 持久化 ----
function saveToStorage(): void {
  try {
    const data = {
      version: 1,
      updatedAt: Date.now(),
      products: Array.from(products.entries()),
      categories,
      assistants: Array.from(assistants.entries()),
      assistantLevels,
      tables: Array.from(tables.entries()),
      member,
    }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage full, ignore */ }
}

function loadFromStorage(): boolean {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (Date.now() - data.updatedAt > CACHE_TTL) {
      uni.removeStorageSync(STORAGE_KEY)
      return false
    }
    products = new Map(data.products || [])
    categories = data.categories || []
    assistants = new Map(data.assistants || [])
    assistantLevels = data.assistantLevels || []
    tables = new Map(data.tables || [])
    member = data.member || null
    return true
  } catch { return false }
}

// ---- 全量刷新 ----
async function refreshAll(): Promise<void> {
  try {
    const [prodRes, catRes, asstRes, levelRes] = await Promise.all([
      tabletApi.getProducts({} as any).catch(() => []),
      tabletApi.getCategories().catch(() => []),
      tabletApi.getAssistants().catch(() => []),
      tabletApi.getAssistantLevels().catch(() => []),
    ])

    const prodList = Array.isArray(prodRes) ? prodRes : ((prodRes as any)?.data || (prodRes as any)?.list || [])
    const catList = Array.isArray(catRes) ? catRes : ((catRes as any)?.data || (catRes as any)?.list || [])
    const asstList = Array.isArray(asstRes) ? asstRes : ((asstRes as any)?.data || (asstRes as any)?.list || [])
    const levelList = Array.isArray(levelRes) ? levelRes : ((levelRes as any)?.data || (levelRes as any)?.list || [])

    products.clear()
    for (const p of prodList) {
      products.set(String(p.id || p.product_id), {
        id: String(p.id || p.product_id),
        name: p.name || p.item_name || '',
        price: p.price || p.sale_price || p.unit_price || 0,
        image: p.image || '',
        category_id: String(p.category_id || ''),
        unit: p.unit || '份',
        stock: p.stock,
        emoji: p.emoji,
      })
    }

    categories = catList.map((c: any) => ({
      id: String(c.id), name: c.name, icon: c.icon || c.emoji
    }))

    assistants.clear()
    for (const a of asstList) {
      assistants.set(String(a.id || a.assistant_id), {
        id: String(a.id || a.assistant_id),
        name: a.name || '',
        avatar: a.avatar || '',
        level_id: String(a.level_id || ''),
        level_name: a.level_name || '',
        hourly_rate: a.hourly_rate || 0,
        is_online: !!a.is_online,
      })
    }

    assistantLevels = levelList.map((l: any) => ({
      id: String(l.id), name: l.name, code: l.code || ''
    }))

    saveToStorage()
  } catch { /* offline, keep existing cache */ }
}

// ---- 单条查询 ----
function getProduct(id: string): ProductCache | undefined { return products.get(String(id)) }
function getAssistant(id: string): AssistantCache | undefined { return assistants.get(String(id)) }
function getTable(id: string): TableCache | undefined { return tables.get(String(id)) }
function getAllProducts(): ProductCache[] { return Array.from(products.values()) }
function getAllAssistants(): AssistantCache[] { return Array.from(assistants.values()) }
function getAllCategories(): CategoryCache[] { return categories }
function getAssistantLevels(): typeof assistantLevels { return assistantLevels }

// ---- 会员 ----
function setMemberInfo(m: MemberCache): void { member = m; saveToStorage() }
function getMemberInfo(): MemberCache | null { return member }
function getMemberDiscount(): number {
  const map: Record<string, number> = { level_vip: 0.85, level_gold: 0.90, level_silver: 0.95 }
  return map[member?.level || ''] || 1.0
}

// ---- 台桌缓存 ----
function setCachedTable(t: TableCache): void { tables.set(String(t.id), t); saveToStorage() }
function getAllTables(): TableCache[] { return Array.from(tables.values()) }

// ---- 初始化 ----
function init(): void { loadFromStorage() }

export const offlineCache = {
  init, refreshAll,
  getProduct, getAssistant, getTable,
  getAllProducts, getAllAssistants, getAllCategories, getAssistantLevels, getAllTables,
  setMemberInfo, getMemberInfo, getMemberDiscount,
  setCachedTable,
}
