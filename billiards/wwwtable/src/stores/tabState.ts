/**
 * Tab 页状态缓存 — 解决 H5 下 switchTab 页面重载导致的骨架屏闪烁
 *
 * 首次进入→显示骨架屏加载
 * 二次进入→直接展示上一次数据，同时后台静默刷新
 */
import { reactive } from 'vue'

interface TabCache {
  loaded: boolean
  /** 各 tab 页自定义数据快照 */
  data: Record<string, any>
}

const state = reactive<Record<string, TabCache>>({
  index:   { loaded: false, data: {} },
  product: { loaded: false, data: {} },
  assistant: { loaded: false, data: {} },
  score:   { loaded: false, data: {} },
})

export function useTabState(key: string) {
  if (!state[key]) {
    state[key] = { loaded: false, data: {} }
  }

  return {
    /** 是否已加载过（用于跳过骨架屏） */
    get loaded() { return state[key].loaded },
    set loaded(v: boolean) { state[key].loaded = v },

    /** 自定义缓存数据 */
    get data() { return state[key].data },
    set data(v: Record<string, any>) { state[key].data = v },

    /** 完整标记一次成功加载 */
    markLoaded() {
      state[key].loaded = true
    },
  }
}
