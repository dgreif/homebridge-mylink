import {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
} from 'homebridge'
import { ChannelAccessory } from './channel-accessory'
import { logError, useLogger } from './util'
import { hap, isTestHomebridge, platformName, pluginName } from './hap'
import { MyLink } from './my-link'
import { MyLinkPlatformConfig } from './config'

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
      logDebug(message) {
        if (config.debug) {
          log.info(message)
        } else {
          log.debug(message)
        }
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
    if (!config.systemID || !config.ipAddress) {
      logError('MyLink systemID and ipAddress must be set')
      return
    }

    const myLink = new MyLink(config.systemID, config.ipAddress, config.port),
      channels = await myLink.getChannels(),
      { api } = this,
      cachedAccessoryIds = Object.keys(this.homebridgeAccessories),
      platformAccessories: PlatformAccessory[] = [],
      activeAccessoryIds: string[] = [],
      debugPrefix = isTestHomebridge ? 'TEST ' : ''

    this.log.info(
      `Configuring ${channels.length} MyLink Channel${
        channels.length === 1 ? '' : 's'
      }`
    )

    channels.forEach((channel) => {
      if (config.hideChannels?.includes(channel.channelId)) {
        // Channel is hidden.  Let it get cleaned up by "stale" check if it already exists
        return
      }

      const uuid = hap.uuid.generate(
          debugPrefix + `mylink.target.${channel.targetId}`
        ),
        displayName = debugPrefix + channel.name,
        reverse = Boolean(
          config.reverseChannels?.includes(channel.channelId) ||
            config.reverseAll
        ),
        createHomebridgeAccessory = () => {
          const accessory = new api.platformAccessory(
            displayName,
            uuid,
            hap.Categories.WINDOW_COVERING
          )

          this.log.info(
            `Adding new MyLink Channel - ${displayName} (${channel.targetId})`
          )
          platformAccessories.push(accessory)

          return accessory
        },
        homebridgeAccessory =
          this.homebridgeAccessories[uuid] || createHomebridgeAccessory()

      new ChannelAccessory(channel, myLink, reverse, homebridgeAccessory)

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
