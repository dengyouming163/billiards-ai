export function isApp(): boolean {
  // #ifdef APP-PLUS
  return true
  // #endif
  return false
}

export function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif
  return false
}

export function isMp(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  return false
}

export function isMpAlipay(): boolean {
  // #ifdef MP-ALIPAY
  return true
  // #endif
  return false
}

export function getPlatform(): 'app' | 'h5' | 'mp-weixin' | 'mp-alipay' | 'unknown' {
  if (isApp()) return 'app'
  if (isH5()) return 'h5'
  if (isMp()) return 'mp-weixin'
  if (isMpAlipay()) return 'mp-alipay'
  return 'unknown'
}
