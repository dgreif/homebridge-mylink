import { hap, isTestHomebridge } from './hap'
import {
  CharacteristicEventTypes,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service as ServiceClass,
  WithUUID,
} from 'homebridge'
import { logError, logInfo } from './util'
import { ChannelInfo, MyLink } from './my-link'

export class ChannelAccessory {
  constructor(
    private channel: ChannelInfo,
    private myLink: MyLink,
    private reverse: boolean,
    protected accessory: PlatformAccessory
  ) {
    const { Service, Characteristic } = hap,
      accessoryInfoService = this.getService(Service.AccessoryInformation),
      windowCoveringService = this.getService(Service.WindowCovering),
      currentPosition = windowCoveringService.getCharacteristic(
        Characteristic.CurrentPosition
      ),
      positionState = windowCoveringService.getCharacteristic(
        Characteristic.PositionState
      ),
      targetPosition = windowCoveringService.getCharacteristic(
        Characteristic.TargetPosition
      ),
      { targetID, name } = channel,
      target = myLink.target(channel.targetID),
      { context } = accessory

    targetPosition.on(
      CharacteristicEventTypes.SET,
      async (
        targetValue: CharacteristicValue,
        callback: CharacteristicSetCallback
      ) => {
        try {
          callback()

          logInfo(
            `Setting position of ${name} (${targetID}) from ${context.currentValue}% to ${targetValue}%.`
          )

          positionState.setValue(
            targetValue < context.currentValue
              ? Characteristic.PositionState.DECREASING
              : targetValue > context.currentValue
              ? Characteristic.PositionState.INCREASING
              : Characteristic.PositionState.STOPPED
          )

          if (targetValue === 0) {
            await (reverse ? target.up() : target.down())
          } else if (targetValue === 100) {
            await (reverse ? target.down() : target.up())
          } else {
            await target.stop()
          }

          context.currentValue = targetValue as number
        } catch (e) {
          targetPosition.updateValue(context.currentValue)

          logError(
            `Encountered an error setting position of ${name} (${targetID}) from ${context.currentValue}% to ${targetValue}%: ${e.message}`
          )
        } finally {
          currentPosition.updateValue(context.currentValue)
          positionState.updateValue(Characteristic.PositionState.STOPPED)
        }
      }
    )

    // Set a default value for the current position.
    if (context.currentValue === undefined) {
      context.currentValue = 0
    }
    currentPosition.updateValue(context.currentValue)
    targetPosition.updateValue(context.currentValue)

    accessoryInfoService
      .getCharacteristic(Characteristic.Manufacturer)
      .updateValue('Somfy')
    accessoryInfoService
      .getCharacteristic(Characteristic.Model)
      .updateValue('myLink')
    accessoryInfoService
      .getCharacteristic(Characteristic.SerialNumber)
      .updateValue(targetID)
    accessoryInfoService
      .getCharacteristic(Characteristic.Name)
      .updateValue(name)
  }

  getService(serviceType: WithUUID<typeof ServiceClass>) {
    let name = this.channel.name

    if (isTestHomebridge) {
      name = 'TEST ' + name
    }

    const existingService = this.accessory.getService(serviceType)
    return existingService || this.accessory.addService(serviceType, name)
  }
}
