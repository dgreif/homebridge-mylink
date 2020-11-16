import { API, Logging, PlatformConfig, StaticPlatformPlugin } from 'homebridge'
import { MyLinkConfig, normalizeConfiguration } from './config'
import { AccessoryPlugin } from 'homebridge/lib/api'
import { SomfyMyLinkTargetAccessory } from './accessory'

const SomfySynergy = require('somfy-synergy')

export class SomfyMyLinkPlatform implements StaticPlatformPlugin {
  private options = normalizeConfiguration(this.config, this.log)
  private client = new SomfySynergy(
    this.options.systemID,
    this.options.ipAddress
  )
  public synergy = new SomfySynergy.Platform(
    this.client,
    this.options.compositeTargets
  )

  constructor(
    public log: Logging,
    public config: PlatformConfig & MyLinkConfig,
    public api: API
  ) {}

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void) {
    callback(
      this.options.targets.map(
        (target) => new SomfyMyLinkTargetAccessory(this, target)
      )
    )
  }
}
