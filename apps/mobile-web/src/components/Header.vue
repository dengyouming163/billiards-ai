<template>
    <view class="header-wrapper">
        <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="header-inner">
                <view class="store-selector" @click="handleStoreSelect">
                    <svg class="store-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>
                    <text class="store-name">{{ storeName || '选择门店' }}</text>
                    <svg class="store-arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </view>
            </view>
        </view>

        <StoreSelector
            :visible="showStoreSelector"
            :currentStoreId="currentStoreId"
            @close="showStoreSelector = false"
            @select="handleStoreSelected"
        />
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { authStore, storeStore } from '@/stores'
import StoreSelector from '@/components/StoreSelector.vue'
import { type Store, switchStore } from '@/api/modules/store'

const showStoreSelector = ref(false)
const statusBarHeight = ref(0)
const storeName = ref('')

const currentStoreId = ref<string | number>('')

uni.getSystemInfo({
    success: (res) => {
        statusBarHeight.value = res.statusBarHeight || 20
    }
})

function loadStoreName() {
    const cached = uni.getStorageSync('storeName')
    if (cached) {
        storeName.value = cached
    }
    // Read directly from storage for consistency
    const cachedId = uni.getStorageSync('storeId')
    if (cachedId) currentStoreId.value = cachedId
}

function handleStoreSelect() {
    showStoreSelector.value = true
}

async function handleStoreSelected(store: Store) {
    // Call backend to switch store context, save new token
    try {
        const res = await switchStore(store.id)
        if (res?.token) {
            uni.setStorageSync('token', res.token)
            authStore.token = res.token
        }
    } catch {}
    authStore.setStore(store.id, store.name)
    storeName.value = store.name
    currentStoreId.value = store.id
    showStoreSelector.value = false
    uni.$emit('storeChange')
    uni.showToast({
        title: `已切换到 ${store.name}`,
        icon: 'success'
    })
    // Reload current page after store switch
    setTimeout(() => {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page) {
            const route = (page as any).route || (page as any).$page?.fullPath || ''
            if (route) uni.reLaunch({ url: '/' + route.replace(/^\//, '') })
        }
    }, 800)
}

onMounted(() => {
    loadStoreName()
    uni.$on('storeChange', loadStoreName)
})

onUnmounted(() => {
    uni.$off('storeChange', loadStoreName)
})
</script>

<style lang="scss" scoped>
.header-wrapper {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
}

.header {
    background: linear-gradient(180deg, rgba(240, 253, 244, 0.96) 0%, rgba(248, 250, 252, 0.9) 100%);
    padding-top: var(--status-bar-height);
    min-height: calc(112rpx + env(safe-area-inset-top));
    padding-bottom: 18rpx;
    backdrop-filter: blur(18rpx);
    -webkit-backdrop-filter: blur(18rpx);
}

.header-inner {
    display: flex;
    align-items: center;
    height: 112rpx;
    padding: 0 24rpx;
}

.store-selector {
    display: flex;
    align-items: center;
    gap: 14rpx;
    min-height: 84rpx;
    padding: 16rpx 26rpx;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 30rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.06);
    transition: all 0.25s ease;

    &:active {
        background: rgba(255, 255, 255, 0.96);
        transform: scale(0.98);
    }
}

.store-icon {
    width: 36rpx;
    height: 36rpx;
    color: #059669;
    flex-shrink: 0;
}

.store-name {
    font-size: 30rpx;
    font-weight: 700;
    color: #0f172a;
    max-width: 320rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.store-arrow {
    width: 24rpx;
    height: 24rpx;
    color: #94a3b8;
    flex-shrink: 0;
}
</style>
