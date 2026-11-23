/**
 * 小票打印工具
 * PWA/浏览器阶段: window.print() 弹出打印对话框
 * Electron 阶段 (后续): window.electronAPI?.print() 静默打印
 */

export interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

export interface ReceiptData {
  storeName: string
  orderNo: string
  tableName: string
  startTime: string
  endTime: string
  durationMinutes: number
  items: ReceiptItem[]
  tableFee: number
  productFee: number
  assistantFee: number
  chargingFee: number
  total: number
  paymentMethod: string
  cashier: string
  couponPackageName?: string
  memberInfo?: { name: string; level: string }
}

/**
 * 从结账 billData 提取小票数据
 */
export function extractReceiptData(
  billData: Record<string, unknown>,
  tableName: string,
  storeName: string,
  cashier: string,
  paymentMethod: string,
): ReceiptData {
  const items = (billData.items as any[]) || []

  return {
    storeName: storeName || '台球俱乐部',
    orderNo: (billData.id as string) || (billData.order_no as string) || '',
    tableName,
    startTime: (billData.startTime as string) || (billData.start_time as string) || '',
    endTime: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    durationMinutes: (billData.durationMinutes as number) || (billData.duration_minutes as number) || 0,
    items: items.map((item: any) => ({
      name: item.product_name || item.name || '',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price || item.unit_price) || 0,
    })),
    tableFee: Number(billData.tableFee || billData.table_fee) || 0,
    productFee: Number(billData.productFee || billData.product_fee) || 0,
    assistantFee: Number(billData.assistantFee || billData.assistant_fee) || 0,
    chargingFee: Number(billData.chargingFee || billData.charging_fee) || 0,
    total: 0, // 由上游计算后传入
    paymentMethod,
    cashier,
    couponPackageName: (billData.coupon_package_name as string) || (billData.couponPackageName as string) || undefined,
    memberInfo: billData.memberInfo
      ? { name: ((billData.memberInfo as any).name || ''), level: ((billData.memberInfo as any).level || '') }
      : undefined,
  }
}

/**
 * 格式化金额
 */
function rmb(n: unknown): string {
  const num = Number(n)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

/**
 * 格式化时长
 */
function fmtDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}小时${m}分`
  if (h > 0) return `${h}小时`
  return `${m}分`
}

/**
 * 生成小票 HTML 字符串
 */
function renderReceiptHTML(data: ReceiptData & { lines?: string[] }): string {
  // 充值小票: 直接渲染文本行
  if (data.lines && data.lines.length > 0) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:58mm;font-family:"PingFang SC","Microsoft YaHei",monospace;font-size:12px;color:#000;background:#fff;padding:4mm 3mm;margin:0 auto}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      .line{margin-bottom:1mm;font-size:12px}
      .center{text-align:center}
      .bold{font-weight:bold}
</style></head><body>
      ${data.lines.map(l => `<div class="line">${l}</div>`).join('')}
</body></html>`;
  }

  const dur = fmtDuration(data.durationMinutes)
  // 过滤已在独立区域展示的费用项（TODO: 用 item.type 替代硬编码中文名）
  const FEE_ITEM_NAMES = ['台费', '助教费', '充电费'] as readonly string[]
  const productItems = (data.items || []).filter(
    (item) => item.name && !FEE_ITEM_NAMES.includes(item.name),
  )

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 58mm;
    font-family: "PingFang SC", "Microsoft YaHei", monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    padding: 4mm 3mm;
    margin: 0 auto;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .title { font-size: 16px; font-weight: bold; margin-bottom: 2mm; }
  .divider {
    border: none;
    border-top: 1px dashed #999;
    margin: 3mm 0;
  }
  .row { display: flex; justify-content: space-between; margin-bottom: 1.5mm; }
  .row .label { color: #333; }
  .row .value { font-weight: bold; }
  .item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 1mm; padding-left: 2mm; }
  .total-row { font-size: 15px; font-weight: bold; }
  .footer { text-align: center; font-size: 11px; color: #666; margin-top: 3mm; }
</style>
</head>
<body>
  <div class="center title">${data.storeName}</div>
  <hr class="divider">
  <div class="row"><span class="label">订单号</span><span>${data.orderNo}</span></div>
  <div class="row"><span class="label">台桌</span><span>${data.tableName}</span></div>
  ${data.startTime ? `<div class="row"><span class="label">开台</span><span>${data.startTime}</span></div>` : ''}
  <div class="row"><span class="label">结账</span><span>${data.endTime}</span></div>
  ${dur ? `<div class="row"><span class="label">时长</span><span>${dur}</span></div>` : ''}
  ${data.couponPackageName ? `<div class="row"><span class="label">套餐券</span><span>${data.couponPackageName}</span></div>` : ''}
  <hr class="divider">
  <div class="row"><span class="label">台费</span><span class="value">¥${rmb(data.tableFee)}</span></div>
  ${productItems.map((p) => `
    <div class="item-row"><span>${p.name} ×${p.quantity}</span><span>¥${rmb(p.price * p.quantity)}</span></div>
  `).join('')}
  ${data.assistantFee > 0 ? `<div class="row"><span class="label">助教费</span><span class="value">¥${rmb(data.assistantFee)}</span></div>` : ''}
  ${data.chargingFee > 0 ? `<div class="row"><span class="label">充电费</span><span class="value">¥${rmb(data.chargingFee)}</span></div>` : ''}
  <hr class="divider">
  <div class="row total-row"><span>合计</span><span>¥${rmb(data.total)}</span></div>
  <div class="row"><span class="label">支付方式</span><span>${data.paymentMethod}</span></div>
  ${data.memberInfo ? `
  <hr class="divider">
  <div class="row"><span class="label">会员</span><span>${data.memberInfo.name}${data.memberInfo.level ? ` (${data.memberInfo.level})` : ''}</span></div>
  ` : ''}
  <hr class="divider">
  <div class="row"><span class="label">收款人</span><span>${data.cashier}</span></div>
  <div class="footer">谢谢惠顾！</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
</body>
</html>`
}

/**
 * 执行小票打印
 */
export function printReceipt(data: ReceiptData): void {
  try {
    if (typeof window === 'undefined') return

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.srcdoc = renderReceiptHTML(data)
    document.body.appendChild(iframe)

    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      try { document.body.removeChild(iframe) } catch {}
    }

    // 优先通过 afterprint 事件清理（打印对话框关闭时触发）
    const onAfterPrint = () => {
      cleanup()
      window.removeEventListener('afterprint', onAfterPrint)
    }
    window.addEventListener('afterprint', onAfterPrint)

    // 安全兜底：60s 后强制清理（防止 afterprint 事件未触发）
    setTimeout(cleanup, 60000)
  } catch (err) {
    console.error('[printer] 打印失败:', err)
  }
}
