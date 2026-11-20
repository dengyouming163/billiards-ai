<template>
    <view class="header-wrapper">
        <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="header-inner">
                <view class="store-selector" @click="handleStoreSelect">
                    <view class="selector-icon-wrap">
                        <svg class="store-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>
                    </view>
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
    const cachedId = uni.getStorageSync('storeId')
    if (cachedId) currentStoreId.value = cachedId
}

function handleStoreSelect() {
    showStoreSelector.value = true
}

async function handleStoreSelected(store: Store) {
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
    background: #ffffff;
    padding-top: var(--status-bar-height);
    min-height: calc(96rpx + env(safe-area-inset-top));
    padding-bottom: 16rpx;
    position: relative;
}

.header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1rpx;
    background: #e5e5e5;
}

.header-inner {
    display: flex;
    align-items: center;
    height: 96rpx;
    padding: 0 24rpx;
}

.store-selector {
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-height: 68rpx;
    padding: 10rpx 24rpx;
    background: #f7f7f7;
    border-radius: 20rpx;
    border: 1rpx solid #e5e5e5;
    transition: all 0.2s ease;
    position: relative;
    
    &:active {
        background: #f0f0f0;
        transform: scale(0.98);
        border-color: #07C160;
    }
}

.selector-icon-wrap {
    width: 40rpx;
    height: 40rpx;
    border-radius: 12rpx;
    background: rgba(7, 193, 96, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.store-icon {
    width: 20rpx;
    height: 20rpx;
    color: #07C160;
}

.store-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #000000;
    max-width: 300rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.store-arrow {
    width: 22rpx;
    height: 22rpx;
    color: #999999;
    flex-shrink: 0;
    transition: transform 0.2s ease;
}

.store-selector:active .store-arrow {
    transform: rotate(180deg);
}
</style>