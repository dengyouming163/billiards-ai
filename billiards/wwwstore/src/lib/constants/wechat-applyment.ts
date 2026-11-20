/**
 * 微信支付特约商户进件状态常量
 * 与后端 WechatApplyment::STATE_* 和微信 API 保持一致
 */
export const APPLYMENT_STATE = {
  /** 编辑中 */
  EDITTING: 'APPLYMENT_STATE_EDITTING',
  /** 审核中 */
  AUDITING: 'APPLYMENT_STATE_AUDITING',
  /** 已驳回 */
  REJECTED: 'APPLYMENT_STATE_REJECTED',
  /** 待签约 */
  TO_BE_SIGNED: 'APPLYMENT_STATE_TO_BE_SIGNED',
  /** 签约中 */
  SIGNING: 'APPLYMENT_STATE_SIGNING',
  /** 已完成 */
  FINISHED: 'APPLYMENT_STATE_FINISHED',
  /** 已取消 */
  CANCELED: 'APPLYMENT_STATE_CANCELED',
} as const;

export type ApplymentState = (typeof APPLYMENT_STATE)[keyof typeof APPLYMENT_STATE];

/** 需要展示驳回原因的终态 */
export const TERMINAL_STATES: ApplymentState[] = [
  APPLYMENT_STATE.REJECTED,
  APPLYMENT_STATE.FINISHED,
];
