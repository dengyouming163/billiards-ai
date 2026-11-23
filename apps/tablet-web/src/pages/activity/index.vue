<template>
  <view class="container">
    <PageHeader
      icon="🎉"
      title="精彩活动"
      subtitle="限时优惠，不容错过"
    />

    <!-- 加载中 -->
    <view class="empty-state" v-if="isLoading">
      <view class="empty-icon">⏳</view>
      <text class="empty-title">加载中...</text>
      <text class="empty-desc">正在获取最新活动信息</text>
    </view>

    <!-- 加载失败 -->
    <view class="empty-state" v-else-if="loadError">
      <view class="empty-icon">📡</view>
      <text class="empty-title">加载失败</text>
      <text class="empty-desc">网络连接异常，请检查网络</text>
      <view class="retry-btn" @click="loadActivities">
        <text>点击重试</text>
      </view>
    </view>

    <!-- 暂无活动 -->
    <view class="empty-state" v-else-if="!featuredActivity && activities.length === 0">
      <view class="empty-icon">🎉</view>
      <text class="empty-title">暂无活动</text>
      <text class="empty-desc">敬请期待更多精彩活动</text>
    </view>

    <scroll-view v-else class="activity-list" scroll-y>
      <view
        class="activity-card featured"
        v-if="featuredActivity"
        @click="showActivityDetail(featuredActivity)"
      >
        <view class="featured-badge">
          <text>精选推荐</text>
        </view>
        <view class="card-image">
          <text class="image-icon">🎉</text>
        </view>
        <view class="card-content">
          <text class="activity-title">{{ featuredActivity.title }}</text>
          <text class="activity-desc">{{ featuredActivity.description }}</text>
          <view class="activity-info">
            <view class="info-item">
              <text class="info-label">活动时间</text>
              <text class="info-value">{{ featuredActivity.start_time }} - {{ featuredActivity.end_time }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">优惠力度</text>
              <text class="info-value highlight">{{ featuredActivity.discount }}</text>
            </view>
          </view>
          <view class="activity-action">
            <view class="action-btn">
              <text>立即参与</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section-divider">
        <text class="divider-title">更多活动</text>
      </view>

      <view 
        class="activity-card" 
        v-for="activity in activities" 
        :key="activity.id"
        @click="showActivityDetail(activity)"
      >
        <view class="card-image small">
          <text class="image-icon">{{ activity.icon }}</text>
        </view>
        <view class="card-content">
          <view class="activity-header">
            <text class="activity-title">{{ activity.title }}</text>
            <text class="activity-tag" :class="activity.tag_class">{{ activity.tag }}</text>
          </view>
          <text class="activity-desc">{{ activity.description }}</text>
          <view class="activity-footer">
            <text class="activity-date">{{ activity.start_time }} ~ {{ activity.end_time }}</text>
            <text class="activity-price">{{ activity.price }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <ContentModal
      :visible="!!selectedActivity"
      :title="selectedActivity?.title || '活动详情'"
      @close="closeModal"
    >
        <view class="modal-body" v-if="selectedActivity">
          <view class="detail-image">
            <text class="detail-icon">{{ selectedActivity.icon }}</text>
          </view>
          
          <view class="detail-section">
            <text class="detail-title">活动详情</text>
            <text class="detail-content">{{ selectedActivity.detail }}</text>
          </view>
          
          <view class="detail-section">
            <text class="detail-title">活动时间</text>
            <text class="detail-content">{{ selectedActivity.start_time }} 至 {{ selectedActivity.end_time }}</text>
          </view>
          
          <view class="detail-section">
            <text class="detail-title">参与方式</text>
            <text class="detail-content">{{ selectedActivity.participation }}</text>
          </view>
          
          <view class="detail-section">
            <text class="detail-title">优惠信息</text>
            <view class="discount-info">
              <text class="discount-label">{{ selectedActivity.discount }}</text>
            </view>
          </view>
        </view>
        
        <template #footer>
          <view class="confirm-btn" @click="participateActivity">
            <text>立即参与</text>
          </view>
        </template>
      </ContentModal>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tabletApi } from '@/api'
import ContentModal from '@/components/standard/ContentModal.vue'
import PageHeader from '@/components/standard/PageHeader.vue'

interface Activity {
  id: string
  title: string
  description: string
  detail: string
  start_time: string
  end_time: string
  discount: string
  price: string
  tag: string
  tag_class: string
  icon: string
  participation: string
}

const featuredActivity = ref<Activity | null>(null)
const activities = ref<Activity[]>([])
const selectedActivity = ref<Activity | null>(null)

const isLoading = ref(true)
const loadError = ref(false)

async function loadActivities() {
  isLoading.value = true
  loadError.value = false
  try {
    const res: any = await tabletApi.getActivities()
    if (res && res.code === 1) {
      const data = res.data
      if (data && data.featured) {
        featuredActivity.value = data.featured
      }
      if (data && data.list) {
        activities.value = data.list
      } else if (Array.isArray(data)) {
        activities.value = data
      }
    } else if (Array.isArray(res)) {
      activities.value = res
    }
  } catch (e) {
    console.error("load error", e)
    featuredActivity.value = null
    activities.value = []
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}


function showActivityDetail(activity: Activity) {
  selectedActivity.value = activity
}

function closeModal() {
  selectedActivity.value = null
}

function participateActivity() {
  if (!selectedActivity.value) return
  
  uni.showToast({
    title: '请前往前台咨询参与',
    icon: 'none',
    duration: 2000
  })

  closeModal()
}

onMounted(() => {
  loadActivities()
})
</script>

<style lang="scss" scoped>
@use '@/styles/layout-system.scss';

.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f16 0%, #12121a 30%, #16213e 70%, #0f0f16 100%);
  padding: 40rpx;
  padding-bottom: 180rpx;
  position: relative;
  overflow: hidden;
  
  /* 动态背景光效 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse at 15% 15%, rgba(201, 169, 98, 0.08) 0%, transparent 40%),
      radial-gradient(ellipse at 85% 85%, rgba(165, 94, 234, 0.06) 0%, transparent 40%);
    pointer-events: none;
    animation: bgPulse 8s ease-in-out infinite;
  }
  
  /* 网格背景 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(201, 169, 98, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201, 169, 98, 0.02) 1px, transparent 1px);
    background-size: 80rpx 80rpx;
    pointer-events: none;
    animation: gridFade 4s ease-in-out infinite;
  }
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes gridFade {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.activity-list {
  height: calc(100vh - 200rpx);
  padding-top: 20rpx;
  
  .activity-card {
    position: relative;
    background: linear-gradient(135deg, #1a1a2e, #252542);
    border-radius: 48rpx;
    padding: 48rpx;
    margin-bottom: 48rpx;
    border: 2rpx solid #374151;
    display: flex;
    overflow: hidden;
    transition: all 0.35s ease;
    min-height: 240rpx;
    
    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 40%,
        rgba(201, 169, 98, 0.05) 50%,
        transparent 60%
      );
      transform: rotate(45deg);
      animation: shimmer 3s infinite;
    }
    
    &:active {
      border-color: rgba(201, 169, 98, 0.6);
      background: rgba(201, 169, 98, 0.1);
      transform: scale(0.97);
      box-shadow: 0 0 50rpx rgba(201, 169, 98, 0.4);
    }
    
    &.featured {
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.25), rgba(168, 139, 98, 0.12));
      border-color: rgba(201, 169, 98, 0.5);
      box-shadow: 0 0 60rpx rgba(201, 169, 98, 0.25);
      flex-direction: column;
      padding: 0;
      
      .featured-badge {
        position: absolute;
        top: 0;
        right: 0;
        padding: 16rpx 40rpx;
        background: linear-gradient(135deg, #c9a962, #a88562);
        border-radius: 0 48rpx 0 28rpx;
        box-shadow: 0 6rpx 24rpx rgba(201, 169, 98, 0.5);
        z-index: 2;
        
        text {
          font-size: 48rpx;
          color: #fff;
          font-weight: 700;
        }
      }
      
      .card-image {
        width: 100%;
        height: 360rpx;
        border-radius: 48rpx 48rpx 0 0;
        background: linear-gradient(135deg, rgba(201, 169, 98, 0.35), rgba(168, 139, 98, 0.25));
        border: none;
        border-bottom: 2rpx solid rgba(201, 169, 98, 0.3);
        margin-right: 0;
        
        .image-icon {
          font-size: 240rpx;
          filter: drop-shadow(0 8rpx 32rpx rgba(201, 169, 98, 0.4));
        }
      }
      
      .card-content {
        padding: 48rpx;
      }
      
      .activity-title {
        font-size: 84rpx;
        margin-bottom: 24rpx;
      }
      
      .activity-desc {
        font-size: 54rpx;
        margin-bottom: 36rpx;
      }
      
      .activity-info {
        margin-bottom: 36rpx;
        
        .info-item {
          margin-bottom: 20rpx;
          
          .info-label {
            font-size: 48rpx;
          }
          
          .info-value {
            font-size: 48rpx;
            
            &.highlight {
              font-size: 60rpx;
              text-shadow: 0 0 20rpx rgba(201, 169, 98, 0.6);
            }
          }
        }
      }
      
      .activity-action {
        margin-top: 36rpx;
        
        .action-btn {
          background: linear-gradient(135deg, #c9a962, #a88562);
          padding: 28rpx 56rpx;
          border-radius: 36rpx;
          display: inline-flex;
          box-shadow: 0 12rpx 36rpx rgba(201, 169, 98, 0.4);
          transition: all 0.3s ease;
          min-height: 96rpx;
          align-items: center;
          
          &:active {
            transform: scale(0.95);
          }
          
          text {
            font-size: 56rpx;
            color: #fff;
            font-weight: 700;
          }
        }
      }
    }
    
    .card-image {
      position: relative;
      width: 220rpx;
      height: 220rpx;
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.3), rgba(168, 139, 98, 0.2));
      border-radius: 36rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 40rpx;
      flex-shrink: 0;
      border: 2rpx solid rgba(201, 169, 98, 0.25);
      
      &.small {
        width: 200rpx;
        height: 200rpx;
        
        .image-icon {
          font-size: 144rpx;
        }
      }
      
      .image-icon {
        font-size: 160rpx;
        filter: drop-shadow(0 4rpx 16rpx rgba(201, 169, 98, 0.3));
      }
    }
    
    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      .activity-header {
        display: flex;
        align-items: center;
        gap: 24rpx;
        margin-bottom: 20rpx;
        flex-wrap: wrap;
        
        .activity-title {
          font-size: 66rpx;
          font-weight: 700;
          color: #fff;
        }
        
        .activity-tag {
          padding: 12rpx 24rpx;
          border-radius: 16rpx;
          font-size: 42rpx;
          font-weight: 600;
          
          &.new {
            background: linear-gradient(135deg, #c9a962, #a88562);
            color: #fff;
          }
          &.hot {
            background: linear-gradient(135deg, #c9a962, #a88562);
            color: #fff;
            animation: pulse 2s infinite;
          }
          &.vip {
            background: linear-gradient(135deg, #c9a962, #a88562);
            color: #fff;
          }
          &.match {
            background: linear-gradient(135deg, #c9a962, #a88562);
            color: #fff;
          }
          &.student {
            background: linear-gradient(135deg, #c9a962, #a88562);
            color: #fff;
          }
        }
      }
      
      .activity-desc {
        font-size: 48rpx;
        color: #8a8a9a;
        margin-bottom: auto;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.6;
      }
      
      .activity-info {
        margin-bottom: 24rpx;
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16rpx;
          
          .info-label {
            font-size: 45rpx;
            color: #6b7280;
          }
          
          .info-value {
            font-size: 45rpx;
            color: #fff;
            
            &.highlight {
              color: #c9a962;
              font-weight: 700;
              font-size: 54rpx;
              text-shadow: 0 0 16rpx rgba(201, 169, 98, 0.5);
            }
          }
        }
      }
      
      .activity-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        
        .activity-date {
          font-size: 42rpx;
          color: #8a8a9a;
        }
        
        .activity-price {
          font-size: 66rpx;
          font-weight: 700;
          color: #c9a962;
          text-shadow: 0 0 16rpx rgba(201, 169, 98, 0.5);
        }
      }
    }
  }
  
  .section-divider {
    margin: 60rpx 0;
    text-align: center;
    
    .divider-title {
      font-size: 54rpx;
      color: #6b7280;
      padding: 0 40rpx;
      background: #1a1a2e;
      position: relative;
      font-weight: 600;
      
      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 180rpx;
        height: 2rpx;
        background: linear-gradient(90deg, transparent, rgba(201, 169, 98, 0.3), transparent);
      }
      
      &::before {
        left: -200rpx;
      }
      
      &::after {
        right: -200rpx;
      }
    }
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.modal-body {
  .detail-image {
    width: 320rpx;
    height: 320rpx;
    background: linear-gradient(135deg, rgba(201, 169, 98, 0.35), rgba(168, 139, 98, 0.25));
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 48rpx;
    border: 3rpx solid rgba(201, 169, 98, 0.4);
    box-shadow: 0 8rpx 40rpx rgba(201, 169, 98, 0.2);
    
    .detail-icon {
      font-size: 240rpx;
      filter: drop-shadow(0 8rpx 32rpx rgba(201, 169, 98, 0.4));
    }
  }
  
  .detail-section {
    margin-bottom: 48rpx;
    
    .detail-title {
      display: block;
      font-size: 54rpx;
      color: #8a8a9a;
      margin-bottom: 20rpx;
      font-weight: 600;
    }
    
    .detail-content {
      font-size: 54rpx;
      color: #fff;
      line-height: 1.8;
    }
    
    .discount-info {
      .discount-label {
        font-size: 96rpx;
        font-weight: 800;
        color: #feca57;
        text-shadow: 0 0 40rpx rgba(254, 202, 87, 0.6);
      }
    }
  }
}

.confirm-btn {
  height: 128rpx;
  background: linear-gradient(135deg, #c9a962, #8a6d3b);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(201, 169, 98, 0.4);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.97);
    box-shadow: 0 8rpx 24rpx rgba(201, 169, 98, 0.5);
  }
  
  text {
    font-size: 60rpx;
    font-weight: 700;
    color: #fff;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 240rpx 60rpx;
  text-align: center;

  .empty-icon {
    font-size: 240rpx;
    margin-bottom: 48rpx;
    opacity: 0.9;
    filter: drop-shadow(0 8rpx 32rpx rgba(201, 169, 98, 0.3));
  }

  .empty-title {
    display: block;
    font-size: 72rpx;
    font-weight: 700;
    color: #fff;
    margin-bottom: 24rpx;
  }

  .empty-desc {
    font-size: 54rpx;
    color: #8a8a9a;
    margin-bottom: 60rpx;
  }

  .retry-btn {
    padding: 32rpx 80rpx;
    background: linear-gradient(135deg, #c9a962, #8a6d3b);
    border-radius: 36rpx;
    transition: all 0.3s;
    min-height: 96rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 12rpx 36rpx rgba(201, 169, 98, 0.35);

    &:active {
      transform: scale(0.95);
      opacity: 0.85;
    }

    text {
      font-size: 56rpx;
      font-weight: 700;
      color: #fff;
    }
  }
}
</style>