import { API, Logging, PlatformConfig, StaticPlatformPlugin } from 'homebridge'
import { MyLinkConfig, normalizeConfiguration } from './config'
import { AccessoryPlugin } from 'homebridge/lib/api'
import { SomfyMyLinkTargetAccessory } from './accessory'
import { useLogger } from './util'
import { MyLink } from './my-link'

export class SomfyMyLinkPlatform implements StaticPlatformPlugin {
  private options = normalizeConfiguration(this.config, this.log)
  private myLink = new MyLink(
    this.options.systemID,
    this.options.ipAddress,
    this.options.port
  )

  constructor(
    public log: Logging,
    public config: PlatformConfig & MyLinkConfig,
    public api: API
  ) {
    useLogger({
      logInfo(message) {
        log.info(message)
      },
      logError(message) {
        log.error(message)
      },
      logDebug(message) {
        if (config.debug) {
          log.info(message)
        } else {
          log.debug(message)
        }
      },
    })
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void) {
    callback(
      this.options.targets.map(
        (target) => new SomfyMyLinkTargetAccessory(this.myLink, target)
      )
    )
  }
}
