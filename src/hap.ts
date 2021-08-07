import { HAP } from 'homebridge'

export let hap: HAP
export function setHap(hapInstance: HAP) {
  hap = hapInstance
}

export const isTestHomebridge = process.argv
  .join(' ')
  .includes('-P . -U ./.homebridge')

export const pluginName = 'homebridge-mylink'
export const platformName = 'Somfy myLink'
