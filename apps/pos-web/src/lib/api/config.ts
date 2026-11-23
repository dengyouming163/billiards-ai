const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:10002/storeapi';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || '/storeapi';
};

export const API_TIMEOUT = 30000;
export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  // 认证
  login: '/pos.Auth/login',
  smsLogin: '/pos.Auth/smsLogin',
  sendSms: '/pos.Auth/sendSms',
  authInfo: '/pos.Auth/info',
  logout: '/pos.Auth/logout',
  resetPassword: '/pos.Auth/resetPassword',

  // 门店
  storeLists: '/pos.Store/lists',
  storeCurrent: '/pos.Store/current',
  storeSwitch: '/pos.Store/switch',

  // 台桌
  tableLists: '/pos.Table/lists',
  tableDetail: '/pos.Table/detail',
  tableStats: '/pos.Table/stats',
  tableUpdate: '/pos.Table/update',

  // 订单
  orderLists: '/pos.Order/lists',
  orderDetail: '/pos.Order/detail',
  orderOpen: '/pos.Order/open',
  orderClose: '/pos.Order/close',
  orderCheckout: '/pos.Order/checkout',
  orderExtend: '/pos.Order/extend',
  orderPause: '/pos.Order/pause',
  orderResume: '/pos.Order/resume',
  orderPauseTableFee: '/pos.Order/pauseTableFee',
  orderResumeTableFee: '/pos.Order/resumeTableFee',
  orderPauseAssistantFee: '/pos.Order/pauseAssistantFee',
  orderResumeAssistantFee: '/pos.Order/resumeAssistantFee',
  orderMerge: '/pos.Order/merge',
  orderChangeTable: '/pos.Order/changeTable',
  orderInProgress: '/pos.Order/inProgress',
  orderTableOrders: '/pos.Order/tableOrders',
  orderRemark: '/pos.Order/remark',
  orderCancel: '/pos.Order/cancel',

  // 会员
  memberLists: '/pos.Member/lists',
  memberSearch: '/pos.Member/search',
  memberDetail: '/pos.Member/detail',
  memberCreate: '/pos.Member/create',
  memberUpdate: '/pos.Member/update',
  memberDelete: '/pos.Member/delete',
  memberRecharge: '/pos.Member/recharge',
  memberRechargeCash: '/pos.Member/rechargeCash',
  memberPrepareRecharge: '/pos.Member/prepareRecharge',
  memberRechargeWechat: '/pos.Member/rechargeWechat',
  memberAdjustBalance: '/pos.Member/adjustBalance',
  memberConsume: '/pos.Member/consume',
  memberRecharges: '/pos.Member/recharges',
  memberRechargeRecords: '/pos.Member/rechargeRecords',
  memberConsumes: '/pos.Member/consumes',
  memberPointsExchange: '/pos.Member/pointsExchange',
  memberLevels: '/pos.Member/levels',

  // 商品
  productAll: '/pos.Product/all',
  productLists: '/pos.Product/lists',
  productDetail: '/pos.Product/detail',
  productCategories: '/pos.ProductCategory/lists',

  // 助教
  assistantLists: '/pos.Assistant/lists',
  assistantServices: '/pos.Assistant/services',
  assistantLevels: '/pos.Assistant/levels',
  assistantDetail: '/pos.Assistant/detail',

  // 班次
  shiftCheckIn: '/pos.Shift/checkIn',
  shiftCheckOut: '/pos.Shift/checkOut',
  shiftCurrent: '/pos.Shift/current',
  shiftRecords: '/pos.Shift/records',
  shiftConfigs: '/pos.Shift/configs',
  shiftSummary: '/pos.Shift/summary',
  shiftEmployees: '/pos.Shift/employees',
  shiftHandover: '/pos.Shift/handover',
  shiftStartWork: '/pos.Shift/startWork',

  // 预订单
  preOrderLists: '/pos.PreOrder/lists',
  preOrderByTable: '/pos.PreOrder/byTable',
  preOrderConfirm: '/pos.PreOrder/confirm',
  preOrderReject: '/pos.PreOrder/reject',

  // 通知
  notificationLists: '/pos.Notification/lists',
  notificationRead: '/pos.Notification/read',
  notificationReadAll: '/pos.Notification/readAll',
  notificationDelete: '/pos.Notification/delete',
  notificationUnreadCount: '/pos.Notification/unreadCount',
  notificationDetail: '/pos.Notification/detail',

  // 订单管理
  orderGetCurrent: '/pos.Order/getCurrentOrder',
  orderBill: '/pos.Order/bill',
  orderAddProductItem: '/pos.Order/addProductItem',
  orderAddAssistantItem: '/pos.Order/addAssistantItem',
  orderPrepayAssistant: '/pos.Order/prepayAssistant',
  orderRemoveItem: '/pos.Order/removeItem',
  orderCancelItem: '/pos.Order/cancelItem',
  orderBindMember: '/pos.Order/bindMember',
  orderAddGiftHours: '/pos.Order/addGiftHours',

  // 订单状态操作
  orderAcceptItem: '/pos.Order/acceptItem',
  orderDeliverItem: '/pos.Order/deliverItem',
  orderAcceptAssistant: '/pos.Order/acceptAssistant',
  orderStartAssistantService: '/pos.Order/startAssistantService',
  orderEndAssistantService: '/pos.Order/endAssistantService',
  orderCancelAssistant: '/pos.Order/cancelAssistant',

  // 提醒
  orderPendingDeliveries: '/pos.Order/pendingDeliveries',
  orderPendingAssistantBookings: '/pos.Order/pendingAssistantBookings',

  // 快速点单
  orderQuickOrder: '/pos.Order/quickOrder',

  // 临时开台
  orderTempOpen: '/pos.Order/tempOpen',
  orderTempClose: '/pos.Order/tempClose',

  // 预约
  reservationLists: '/pos.Reservation/lists',
  reservationCreate: '/pos.Reservation/create',
  reservationCancel: '/pos.Reservation/cancel',
  reservationCheckIn: '/pos.Reservation/checkIn',
  reservationConfirm: '/pos.Reservation/confirm',

  // 统计
  statisticsOverview: '/pos.Statistics/overview',
  statisticsTableUsage: '/pos.Statistics/tableUsage',
  statisticsProductRank: '/pos.Statistics/productRank',
  statisticsAssistantRank: '/pos.Statistics/assistantRank',
  statisticsChannelRevenue: '/pos.Statistics/channelRevenue',

  // 团购验券
  couponPrepare: '/pos.Coupon/prepare',
  couponConfirm: '/pos.Coupon/confirm',
  couponRevoke: '/pos.Coupon/revoke',
  couponRecords: '/pos.Coupon/records',
  couponInternalList: '/coupon.Package/list',
  couponInternalConfirm: '/pos.Coupon/confirmInternal',
  couponPayAndOpen: '/pos.Coupon/payAndOpen',

  // 外部渠道验券 (channel.Channel)
  channelVerifyCoupon: '/channel.Channel/verifyCoupon',

  // 设置 (setting.Setting)
  settingDiscountList: '/setting.Setting/getDiscountList',
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;
