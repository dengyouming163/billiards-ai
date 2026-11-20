import { computed } from 'vue'
import { authStore } from '@/stores/auth'

export interface WorkCard {
  code: string
  iconName: string
  name: string
  path: string
}

const ALL_WORK_CARDS: WorkCard[] = [
  { code: 'mobile:orders', iconName: 'orders', name: '订单管理', path: '/pages/orders/index' },
  { code: 'mobile:employee', iconName: 'employee', name: '员工管理', path: '/pages/employee/list' },
  { code: 'mobile:schedule', iconName: 'schedule', name: '排班管理', path: '/pages/schedule/index' },
  { code: 'mobile:device', iconName: 'device', name: '设备管理', path: '/pages/device/bind' },
  { code: 'mobile:approval', iconName: 'approval', name: '审批管理', path: '/pages/approval/index' },
  { code: 'mobile:checkin', iconName: 'checkin', name: '打卡签到', path: '/pages/checkin/index' },
  { code: 'mobile:report', iconName: 'report', name: '考勤打卡', path: '/pages/checkin/report' },
  { code: 'mobile:apply', iconName: 'apply', name: '申请中心', path: '/pages/approval/my-records' },
  { code: 'mobile:performance', iconName: 'performance', name: '我的业绩', path: '/pages/performance/index' },
  { code: 'mobile:settings', iconName: 'settings', name: '门店设置', path: '/pages/settings/index' },
  { code: 'mobile:table', iconName: 'table', name: '台桌管理', path: '/pages/table/index' },
  { code: 'mobile:recharge', iconName: 'recharge', name: '会员充值', path: '/pages/recharge/index' },
  { code: 'mobile:report', iconName: 'finance', name: '充值报表', path: '/pages/recharge-report/index' },
  { code: 'mobile:report', iconName: 'sales', name: '商品销售', path: '/pages/assistant-sales/index' },
]

const excludedFromWork = new Set(['mobile:table', 'mobile:apply', 'mobile:settings', 'mobile:performance'])

export function usePermission() {
  const canAccessModule = (code: string): boolean => {
    return authStore.permissionCodes.includes(code)
  }

  const workCards = computed<WorkCard[]>(() => {
    const perms = new Set(authStore.permissionCodes)
    return ALL_WORK_CARDS.filter(card => perms.has(card.code) && !excludedFromWork.has(card.code))
  })

  return { canAccessModule, workCards, ALL_WORK_CARDS }
}
