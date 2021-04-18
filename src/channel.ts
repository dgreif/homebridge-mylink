import { apiPath, SomfyRestClient } from './rest-client'
import { ChannelInfo, RpcResponse } from './somfy-types'

export class Channel {
  public readonly channelId = `${this.restClient.authOptions.deviceId}.${
    this.info.idx + 1
  }`
  public readonly pin = this.restClient.authOptions.pin

  get name() {
    return this.info.name
  }

  constructor(
    public readonly info: ChannelInfo,
    private restClient: SomfyRestClient
  ) {}

  send(method: string) {
    return this.restClient.request<RpcResponse>({
      method: 'POST',
      url: apiPath('mylink/iapi'),
      json: {
        id: '86ff5b5a-02df-4d24-8352-b5ffd50fc29c',
        method,
        params: [this.channelId],
        pin: this.pin,
      },
    })
  }

  move(direction: 'up' | 'down' | 'stop') {
    return this.send(`move.${direction}`)
  }

  moveUp() {
    return this.move('up')
  }

  moveDown() {
    return this.move('down')
  }

  stop() {
    return this.move('stop')
  }
}
