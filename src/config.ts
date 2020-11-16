import { Logging } from 'homebridge'

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

export interface MyLinkConfig {
  ipAddress: string
  systemID: string
  targets: MyLinkTargetConfig[]
  compositeTargets: { [target: string]: string[] }
}

function normalizeTarget(
  { name, orientation, targetID }: any,
  index: number,
  log: Logging
) {
  if (typeof name !== 'string') {
    log('Bad `config.targets[' + index + '].name`, must be a string.')
    return null
  }
  if (typeof targetID !== 'string') {
    log('Bad `config.targets[' + index + '].targetID`, must be a string.')
    return null
  }
  const normalOrientation: MyLinkOrientationConfig = orientation || {
    closed: 'down',
    middle: 'stop',
    opened: 'up',
  }
  if (
    !(typeof normalOrientation === 'object') ||
    (['closed', 'middle', 'opened'] as const).some(
      (state) => !['down', 'stop', 'up'].includes(normalOrientation[state])
    )
  ) {
    log('Bad `config.targets[' + index + '].orientation`.')
    return null
  }
  return {
    name,
    orientation: normalOrientation,
    targetID,
  }
}

export function normalizeConfiguration(
  { ipAddress, systemID, targets, compositeTargets }: any,
  log: Logging
) {
  const normalConfig = {
    ipAddress: 'undefined',
    systemID: 'undefined',
    targets: [],
    compositeTargets: {},
  } as MyLinkConfig

  if (typeof ipAddress === 'string') {
    normalConfig.ipAddress = ipAddress
  } else {
    log('Bad `config.ipAddress` value, must be a string.')
  }
  if (typeof systemID === 'string') {
    normalConfig.systemID = systemID
  } else {
    log('Bad `config.systemID` value, must be a string.')
  }
  if (Array.isArray(targets)) {
    targets.forEach((target, index) => {
      if (typeof target !== 'object') {
        log('Bad `config.targets[' + index + ']`, must be an object.')
        return null
      }
      const normalTarget = normalizeTarget(target, index, log)
      if (normalTarget !== null) {
        normalConfig.targets.push(normalTarget)
      }
    })
  } else {
    log('Bad `config.targets` value, must be an array.')
  }
  if (compositeTargets) {
    if (typeof compositeTargets === 'object') {
      for (const [targetID, composedIDs] of Object.entries(compositeTargets)) {
        if (Array.isArray(composedIDs)) {
          normalConfig.compositeTargets[targetID] = []
          for (const composedID of composedIDs) {
            if (typeof composedID === 'string') {
              normalConfig.compositeTargets[targetID].push(composedID)
            } else {
              log(
                'Bad `config.compositeTargets[' +
                  targetID +
                  ']` value, `' +
                  String(composedID) +
                  ' ` must be a string.'
              )
            }
          }
        } else {
          log(
            'Bad `config.compositeTargets[' +
              targetID +
              ']` value, must be an array.'
          )
        }
      }
    } else {
      log('Bad `config.compositeTargets` value, must be an object.')
    }
  }
  return normalConfig
}
