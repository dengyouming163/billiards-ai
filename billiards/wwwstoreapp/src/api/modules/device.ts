import { get, post } from '@/api/request'

export interface LightDevice {
  id: string
  device_sn: string
  device_name: string
  channel_count: number
  status: number       // 0=offline, 1=online
  addr: string
}

export interface LightChannel {
  id: string
  device_id: string
  channel_no: number
  channel_name: string
  status: number       // 0=off, 1=on
  table_id: string
  table_name?: string
  table_number?: string
}

export interface TableItem {
  id: string
  number: string
  name: string
  status: string
}

export const deviceApi = {
  getDevices: () => get<LightDevice[]>('/light.Channel/listDevices'),

  getChannels: (deviceId: string) =>
    get<LightChannel[]>('/light.Channel/listByDevice', { device_id: deviceId }),

  getTables: () => get<TableItem[]>('/mobile.Table/lists'),

  bindTable: (channelId: string, tableId: string) =>
    post('/light.Channel/bindTable', { channel_id: channelId, table_id: tableId }),

  unbindTable: (channelId: string) =>
    post('/light.Channel/unbindTable', { channel_id: channelId }),

  renameChannel: (channelId: string, channelName: string) =>
    post('/light.Channel/rename', { channel_id: channelId, channel_name: channelName }),

  toggleChannel: (channelId: string, deviceId: string, action: 'on' | 'off') =>
    post('/light.Channel/toggle', { channel_id: channelId, device_id: deviceId, action }),

  toggleAll: (deviceId: string, action: 'on' | 'off') =>
    post('/light.Channel/toggleAll', { device_id: deviceId, action }),
}
