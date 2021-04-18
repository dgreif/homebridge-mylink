import { PlatformConfig } from 'homebridge'
import { readFileSync, writeFileSync } from 'fs'
import { HomebridgeAPI } from 'homebridge/lib/api'
import { MyLinkPlatformConfig } from './platform'
import { platformName } from './hap'

type MyLinkAction = 'up' | 'down' | 'stop'
interface MyLinkOrientationConfig {
  closed: MyLinkAction
  middle: MyLinkAction
  opened: MyLinkAction
}

export interface MyLinkTargetConfig {
  targetID: string
  name: string
  orientation: MyLinkOrientationConfig
}

export interface MyLinkConfigV1 {
  ipAddress: string
  systemID: string
  targets: MyLinkTargetConfig[]
  compositeTargets: { [target: string]: string[] }
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
        // no rest targets to migrate
        return
      }

      // grab device id from the first target
      const targetId = myLinkPlatform.targets[0].targetID,
        deviceId = targetId.split('.')[0],
        newPlatform: MyLinkPlatformConfig = {
          platform: platformName,
          deviceId,
          pin: 0,
        },
        reverseAll = myLinkPlatform.targets.every(
          (target) => target.orientation?.closed === 'up'
        )

      if (reverseAll) {
        newPlatform.reverseAll = reverseAll
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
