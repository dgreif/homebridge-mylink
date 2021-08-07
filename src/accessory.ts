import { hap } from './hap'
import { MyLinkTargetConfig } from './config'
import {
  AccessoryPlugin,
  CharacteristicEventTypes,
  CharacteristicSetCallback,
  CharacteristicValue,
  Service as HapService,
} from 'homebridge'
import { logError, logInfo } from './util'
import { MyLink } from './my-link'

export class SomfyMyLinkTargetAccessory implements AccessoryPlugin {
  public name = `Somfy ${this.target.name}`
  public uuid_base = hap.uuid.generate(`mylink.target.${this.target.targetID}`)
  private currentValue = 0
  private services: HapService[] = []

  constructor(private myLink: MyLink, private target: MyLinkTargetConfig) {
    const { Service, Characteristic } = hap,
      accessoryInformationService = new Service.AccessoryInformation()

    accessoryInformationService
      .setCharacteristic(Characteristic.Manufacturer, 'Somfy')
      .setCharacteristic(Characteristic.Model, 'myLink')

    this.services.push(accessoryInformationService)
    this.createWindowCoveringService()
  }

  createWindowCoveringService() {
    const { Service, Characteristic } = hap,
      { name, orientation, targetID } = this.target,
      service = new Service.WindowCovering(name),
      currentPosition = service.getCharacteristic(
        Characteristic.CurrentPosition
      ),
      positionState = service.getCharacteristic(Characteristic.PositionState),
      targetPosition = service.getCharacteristic(Characteristic.TargetPosition),
      target = this.myLink.target(targetID)

    targetPosition.on(
      CharacteristicEventTypes.SET,
      async (
        targetValue: CharacteristicValue,
        callback: CharacteristicSetCallback
      ) => {
        try {
          callback()

          logInfo(
            `Setting position of target ${targetID} (${name}) from ${this.currentValue}% to ${targetValue}%.`
          )

          positionState.setValue(
            targetValue < this.currentValue
              ? Characteristic.PositionState.DECREASING
              : targetValue > this.currentValue
              ? Characteristic.PositionState.INCREASING
              : Characteristic.PositionState.STOPPED
          )

          if (targetValue === 0) {
            await target[orientation.closed]()
          } else if (targetValue === 100) {
            await target[orientation.opened]()
          } else {
            await target[orientation.middle]()
          }

          this.currentValue = targetValue as number
        } catch (error) {
          targetPosition.updateValue(this.currentValue)

          logError(
            `Encountered an error setting target position of target ${targetID} (${name}): ${error.message}`
          )
        } finally {
          currentPosition.updateValue(this.currentValue)
          positionState.updateValue(Characteristic.PositionState.STOPPED)
        }
      }
    )

    // Set a more sane default value for the current position.
    this.currentValue = 0
    currentPosition.updateValue(this.currentValue)
    targetPosition.updateValue(this.currentValue)

    this.services.push(service)
  }

  getServices() {
    return this.services
  }

  getControllers() {
    return []
  }
}
