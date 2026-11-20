<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { authStore } from '@/stores/auth'

onLaunch(async () => {
  // 隐藏状态栏 + 导航栏（kiosk 沉浸模式）
  // #ifdef APP-PLUS
  plus.navigator.setFullscreen(true)
  // #endif

  // 从本地存储恢复登录态
  const hasCached = authStore.initFromStorage()
  if (!hasCached) {
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/index' })
    }, 100)
    return
  }

  // 验证 token 是否仍然有效（后端持久化 session）
  // clearOnFail: false - 验证失败时不清除本地存储，保留登录态以便下次使用
  const valid = await authStore.validateToken(0, false)
  if (!valid) {
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/index' })
    }, 100)
  }
})

onShow(() => {
})

onHide(() => {
})
</script>

<style lang="scss">
@use './styles/global.scss';
</style>