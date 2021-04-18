import { apiPath, AuthOptions, SomfyRestClient } from './rest-client'
import { MyLinkInfo } from './somfy-types'
import { enableDebug } from './util'
import { Channel } from './channel'

export interface ApiOptions extends AuthOptions {
  debug?: boolean
}

export class Api {
  public readonly restClient = new SomfyRestClient(this.options)
  public readonly mylinkInfoPromise = this.getMyLinkInfo()

  constructor(public readonly options: ApiOptions) {
    if (options.debug) {
      enableDebug()
    }
  }

  async getMyLinkInfo() {
    const [info] = await this.restClient.request<[MyLinkInfo]>({
      method: 'GET',
      url: apiPath('mylink/info'),
    })

    return info
  }

  async getChannels() {
    const info = await this.mylinkInfoPromise

    return info.channels.map(
      (channelInfo) => new Channel(channelInfo, this.restClient)
    )
  }
}
