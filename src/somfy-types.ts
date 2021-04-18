export interface AuthTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
}

export interface ChannelInfo {
  idx: number
  name: string
  type: number
}

export interface MyLinkInfo {
  location: {
    latitude: number
    longitude: number
  }
  deviceConfigLastModifiedTimestamp: number
  scenes: []
  timedEventsLastModifiedTimestamp: number
  scenesLastModifiedTimestamp: number
  fw: {
    major: number
    minor: number
  }
  deviceName: string
  deviceID: number
  events: []
  pin: number
  channels: ChannelInfo[]
  deviceIcon: string
}

export interface RpcResponse {
  jsonrpc: '2.0'
  result: boolean | string
  id: string
}
