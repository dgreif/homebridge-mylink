import { platformName, pluginName, setHap } from './hap'
import { SomfyMyLinkPlatform } from './platform'
import { migrateV1Config } from './config'

export default function (homebridge: any) {
  setHap(homebridge.hap)

  migrateV1Config(homebridge)

  homebridge.registerPlatform(pluginName, platformName, SomfyMyLinkPlatform)
}
