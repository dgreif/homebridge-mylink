import { hap, isTestHomebridge } from './hap'
import {
  CharacteristicEventTypes,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service as ServiceClass,
  WithUUID,
} from 'homebridge'
import { Channel } from './channel'
import { logError, logInfo } from './util'

export class ChannelAccessory {
  constructor(
    private channel: Channel,
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
      { channelId, name } = channel,
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
            `Setting position of ${name} (${channelId}) from ${context.currentValue}% to ${targetValue}%.`
          )

          positionState.setValue(
            targetValue < context.currentValue
              ? Characteristic.PositionState.DECREASING
              : targetValue > context.currentValue
              ? Characteristic.PositionState.INCREASING
              : Characteristic.PositionState.STOPPED
          )

          if (targetValue === 0) {
            await (reverse ? channel.moveUp() : channel.moveDown())
          } else if (targetValue === 100) {
            await (reverse ? channel.moveDown() : channel.moveUp())
          } else {
            await channel.stop()
          }

          context.currentValue = targetValue as number
        } catch (e) {
          targetPosition.updateValue(context.currentValue)

          logError(
            `Encountered an error setting position of ${name} (${channelId}) from ${context.currentValue}% to ${targetValue}%: ${e.message}`
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
      .updateValue(channel.channelId)
    accessoryInfoService
      .getCharacteristic(Characteristic.Name)
      .updateValue(channel.name)
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
