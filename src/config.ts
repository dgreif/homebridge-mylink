import { PlatformConfig } from 'homebridge'
import { readFileSync, writeFileSync } from 'fs'
import { HomebridgeAPI } from 'homebridge/lib/api'
import { platformName } from './hap'
import { splitTargetId } from './my-link'

type MyLinkAction = 'up' | 'down' | 'stop'
interface MyLinkOrientationConfig {
  closed: MyLinkAction
  middle: MyLinkAction
  opened: MyLinkAction
}

export interface MyLinkTargetConfigV1 {
  targetID: string
  name: string
  orientation?: MyLinkOrientationConfig
}

export interface MyLinkConfigV1 {
  ipAddress: string
  systemID: string
  targets: MyLinkTargetConfigV1[]
  compositeTargets: { [target: string]: string[] }
}

export interface MyLinkPlatformConfig extends PlatformConfig {
  ipAddress: string
  systemID: string
  port?: number
  hideChannels?: number[]
  reverseChannels?: number[]
  reverseAll?: boolean
  channelRetryDelay?: number
  debug?: boolean
}

function isTargetReveresed(target: MyLinkTargetConfigV1) {
  return target.orientation?.closed === 'up'
}

export function updateHomebridgeConfig(
  homebridge: HomebridgeAPI,
  update: (config: string) => string | void
) {
  const configPath = homebridge.user.configPath(),
    config = readFileSync(configPath).toString(),
    updatedConfig = update(config)

  if (updatedConfig) {
    writeFileSync(configPath, updatedConfig)
  }
}

export function migrateV1Config(homebridge: HomebridgeAPI) {
  updateHomebridgeConfig(homebridge, (originalConfig) => {
    try {
      const config = JSON.parse(originalConfig),
        { platforms } = config,
        myLinkPlatform: MyLinkConfigV1 = platforms?.find(
          (platform: PlatformConfig) => platform.platform === platformName
        )

      if (!myLinkPlatform?.targets?.length) {
        // no targets to migrate
        return
      }

      const newPlatform: MyLinkPlatformConfig = {
        platform: platformName,
        systemID: myLinkPlatform.systemID,
        ipAddress: myLinkPlatform.ipAddress,
        reverseChannels: myLinkPlatform.targets
          .filter(isTargetReveresed)
          .map((target) => splitTargetId(target.targetID).channelId),
        reverseAll:
          myLinkPlatform.targets?.every(isTargetReveresed) || undefined,
      }

      if (newPlatform.reverseAll || newPlatform.reverseChannels?.length === 0) {
        delete newPlatform.reverseChannels
      }

      platforms[platforms.indexOf(myLinkPlatform)] = newPlatform

      // save the migrated config
      return JSON.stringify(config, null, 4)
    } catch (_) {
      // return with no changes if anything goes wrong
      return
    }
  })
}
