export const ICON_MAP: Record<string, string> = {
  home: 'home-filled',
  dashboard: 'bars',
  table: 'calendar',
  orders: 'list-check',
  employee: 'person',
  approval: 'checkbox-filled',
  checkin: 'location',
  schedule: 'calendar',
  performance: 'chart',
  notification: 'notification',
  profile: 'person',
  settings: 'gear',
  work: 'home',
  logout: 'exit',
  add: 'plus',
  search: 'search',
  close: 'close',
  back: 'left',
  edit: 'compose',
  delete: 'trash',
  phone: 'phone',
  location: 'location',
  clock: 'clock',
  member: 'vip',
  product: 'cart',
  assistant: 'staff',
  money: 'wallet',
  chart: 'chart',
}

export function getIcon(name: string): string {
  return ICON_MAP[name] || 'circle'
}
