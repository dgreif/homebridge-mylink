import { PlatformConfig } from 'homebridge'
import { readFileSync, writeFileSync } from 'fs'
import { HomebridgeAPI } from 'homebridge/lib/api'
import { platformName } from './hap'

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

export interface MyLinkChannelConfig {
  targetID: string
  name: string
  reverse?: boolean
}

export interface MyLinkPlatformConfig extends PlatformConfig {
  ipAddress: string
  systemID: string
  reverseAll?: boolean
  port?: number
  channels?: MyLinkChannelConfig[]
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
          channels: myLinkPlatform.targets.map((target) => {
            return {
              targetID: target.targetID,
              name: target.name,
              reverse: target.orientation?.closed === 'up' ? true : undefined,
            }
          }),
        },
        reverseAll = newPlatform.channels?.every((target) => target.reverse)

      if (reverseAll) {
        newPlatform.reverseAll = reverseAll
        newPlatform.channels?.forEach((target) => delete target.reverse)
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
