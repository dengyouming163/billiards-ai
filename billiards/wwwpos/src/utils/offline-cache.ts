const CACHE_KEY = 'pos_offline_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000

export interface CacheData {
  version: number
  updatedAt: number
  products: Array<{ id: string; name: string; price: number; category_id?: string }>
  assistants: Array<{ id: string; name: string; hourly_rate: number; level_name?: string }>
  zones: Array<{ id: string; name: string }>
}

let cache: CacheData | null = null

function load(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CacheData
    if (Date.now() - data.updatedAt > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch { return null }
}

function save(data: CacheData): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export function initCache(): CacheData | null {
  cache = load()
  return cache
}

export function getCachedProducts() { return cache?.products || [] }
export function getCachedAssistants() { return cache?.assistants || [] }
export function getCachedZones() { return cache?.zones || [] }

export function getCachedProduct(id: string) {
  return cache?.products.find(p => p.id === id)
}

export function updateCache(partial: Partial<CacheData>): void {
  if (!cache) cache = { version: 1, updatedAt: Date.now(), products: [], assistants: [], zones: [] }
  if (partial.products) cache.products = partial.products
  if (partial.assistants) cache.assistants = partial.assistants
  if (partial.zones) cache.zones = partial.zones
  cache.updatedAt = Date.now()
  save(cache)
}
