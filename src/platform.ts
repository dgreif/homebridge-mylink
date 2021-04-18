import {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge'
import { ChannelAccessory } from './channel-accessory'
import { Api, ApiOptions } from './api'
import { logError, useLogger } from './util'
import { hap, platformName, pluginName } from './hap'

export interface MyLinkPlatformConfig extends ApiOptions, PlatformConfig {
  reverseAll?: boolean
}

export class SomfyMyLinkPlatform implements DynamicPlatformPlugin {
  private readonly homebridgeAccessories: {
    [uuid: string]: PlatformAccessory
  } = {}

  constructor(
    public log: Logging,
    public config: MyLinkPlatformConfig,
    public api: API
  ) {
    useLogger({
      logInfo(message) {
        log.info(message)
      },
      logError(message) {
        log.error(message)
      },
    })

    if (!config) {
      this.log.info(`No configuration found for platform ${platformName}`)
      return
    }

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching')
      this.connectToApi().catch((e) => {
        this.log.error('Error connecting to API')
        this.log.error(e)
      })
    })
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info(
      `Configuring cached accessory ${accessory.UUID} ${accessory.displayName}`
    )
    this.log.debug('%j', accessory)
    this.homebridgeAccessories[accessory.UUID] = accessory
  }

  async connectToApi() {
    const config = this.config
    if (!config.deviceId || !config.pin) {
      // TODO: wiki
      logError('MyLink deviceId and pin must be set.  See wiki')
      return
    }

    const mylinkApi = new Api(config),
      channels = await mylinkApi.getChannels(),
      { api } = this,
      cachedAccessoryIds = Object.keys(this.homebridgeAccessories),
      platformAccessories: PlatformAccessory[] = [],
      activeAccessoryIds: string[] = [],
      // debugPrefix = isTestHomebridge ? 'TEST ' : '',
      debugPrefix = ''

    this.log.info(
      `Configuring ${channels.length} MyLink Channel${
        channels.length === 1 ? '' : 's'
      }`
    )

    channels.forEach((channel) => {
      const uuid = hap.uuid.generate(
          debugPrefix + `mylink.target.${channel.channelId}`
        ),
        displayName = debugPrefix + channel.name,
        reverse = Boolean(config.reverseAll),
        createHomebridgeAccessory = () => {
          const accessory = new api.platformAccessory(
            displayName,
            uuid,
            hap.Categories.WINDOW_COVERING
          )

          this.log.info(`Adding new MyLink Channel - ${displayName}`)
          platformAccessories.push(accessory)

          return accessory
        },
        homebridgeAccessory =
          this.homebridgeAccessories[uuid] || createHomebridgeAccessory()

      new ChannelAccessory(channel, reverse, homebridgeAccessory)

      this.homebridgeAccessories[uuid] = homebridgeAccessory
      activeAccessoryIds.push(uuid)
    })

    if (platformAccessories.length) {
      api.registerPlatformAccessories(
        pluginName,
        platformName,
        platformAccessories
      )
    }

    const staleAccessories = cachedAccessoryIds
      .filter((cachedId) => !activeAccessoryIds.includes(cachedId))
      .map((id) => this.homebridgeAccessories[id])

    staleAccessories.forEach((staleAccessory) => {
      this.log.info(
        `Removing stale cached accessory ${staleAccessory.UUID} ${staleAccessory.displayName}`
      )
    })

    if (staleAccessories.length) {
      this.api.unregisterPlatformAccessories(
        pluginName,
        platformName,
        staleAccessories
      )
    }
  }
}
