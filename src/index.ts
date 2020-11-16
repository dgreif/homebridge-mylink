import { setHap } from './hap'
import { SomfyMyLinkPlatform } from './platform'

export default function (homebridge: any) {
  setHap(homebridge.hap)

  homebridge.registerPlatform(
    'homebridge-mylink',
    'Somfy myLink',
    SomfyMyLinkPlatform
  )
}
