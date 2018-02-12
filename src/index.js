'use strict';

const SomfySynergy = require('somfy-synergy');

module.exports = homebridge => {
  const Accessory = homebridge.platformAccessory;
  const Characteristic = homebridge.hap.Characteristic;
  const Service = homebridge.hap.Service;
  const UUIDGen = homebridge.hap.uuid;

  /**
   * Platform "Somfy myLink"
   */

  class SomfyMyLinkPlatform {
    constructor(log, config) {
      this.log = log;

      const {ipAddress, systemID, targets} = normalizeConfiguration(config);

      this.synergy = new SomfySynergy(systemID, ipAddress);
      this.targets = targets;
    }

    accessories(callback) {
      callback(
        this.targets.map(
          (target, index) => new SomfyMyLinkTargetAccessory(this, target),
        ),
      );
    }
  }

  const normalizeConfiguration = ({ipAddress, systemID, targets}) => {
    const normalConfig = {
      ipAddress: 'undefined',
      systemID: 'undefined',
      targets: [],
    };
    if (typeof ipAddress === 'string') {
      normalConfig.ipAddress = ipAddress;
    } else {
      this.log('Bad `config.ipAddress` value, must be a string.');
    }
    if (typeof systemID === 'string') {
      normalConfig.systemID = systemID;
    } else {
      this.log('Bad `config.systemID` value, must be a string.');
    }
    if (Array.isArray(targets)) {
      targets.forEach((target, index) => {
        if (typeof target !== 'object' || target == null) {
          this.log('Bad `config.targets[' + index + ']`, must be an object.');
          return null;
        }
        const normalTarget = normalizeTarget(target, index);
        if (normalTarget != null) {
          normalConfig.targets.push(normalTarget);
        }
      });
    } else {
      this.log('Bad `config.targets` value, must be an array.');
    }
    return normalConfig;
  };

  const normalizeTarget = ({name, orientation, targetID}, index) => {
    if (typeof name !== 'string') {
      this.log('Bad `config.targets[' + index + '].name`, must be a string.');
      return null;
    }
    if (typeof targetID !== 'string') {
      this.log(
        'Bad `config.targets[' + index + '].targetID`, must be a string.',
      );
      return null;
    }
    const normalOrientation = orientation || {
      closed: 'down',
      middle: 'stop',
      opened: 'up',
    };
    if (
      !(typeof normalOrientation === 'object' && normalOrientation != null) ||
      ['closed', 'middle', 'opened'].some(
        state => !['down', 'stop', 'up'].includes(normalOrientation[state]),
      )
    ) {
      this.log('Bad `config.targets[' + index + '].orientation`.');
      return null;
    }
    return {
      name,
      orientation: normalOrientation,
      targetID,
    };
  };

  /**
   * Accessory "Somfy myLink Target"
   */

  class SomfyMyLinkTargetAccessory extends Accessory {
    constructor(platform, {name, orientation, targetID}) {
      const displayName = `Somfy ${name}`;
      const uuid = UUIDGen.generate(`mylink.target.${targetID}`);
      super(displayName, uuid);

      // Homebridge requires these.
      this.name = displayName;
      this.uuid_base = uuid;

      this.log = platform.log;
      this.synergy = platform.synergy;

      this.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, 'Somfy')
        .setCharacteristic(Characteristic.Model, 'myLink');

      this.addService(
        this.createWindowCoveringService(name, orientation, targetID),
      );
    }

    createWindowCoveringService(name, orientation, targetID) {
      const service = new Service.WindowCovering(name);

      const currentPosition = service.getCharacteristic(
        Characteristic.CurrentPosition,
      );
      const positionState = service.getCharacteristic(
        Characteristic.PositionState,
      );
      const targetPosition = service.getCharacteristic(
        Characteristic.TargetPosition,
      );

      targetPosition.on('set', (targetValue, callback) => {
        const logError = error => {
          this.log(
            'Encountered an error setting target position of %s: %s',
            `target ${targetID} (${name})`,
            error.message,
          );
        };

        currentPosition.getValue((error, currentValue) => {
          if (error) {
            logError(error);
            callback(error);
            return;
          }

          this.log(
            'Setting position of %s from %s to %s.',
            `target ${targetID} (${name})`,
            `${currentValue}%`,
            `${targetValue}%`,
          );
          positionState.setValue(
            targetValue < currentValue
              ? Characteristic.PositionState.DECREASING
              : targetValue > currentValue
                ? Characteristic.PositionState.INCREASING
                : Characteristic.PositionState.STOPPED,
          );
          callback();

          const target = this.synergy.target(targetID);
          const promise =
            targetValue === 0
              ? target[orientation.closed]()
              : targetValue === 100
                ? target[orientation.opened]()
                : target[orientation.middle]();

          promise.then(() => {
            currentPosition.setValue(targetValue);
            positionState.setValue(Characteristic.PositionState.STOPPED);
          }, logError);
        });
      });

      // Set a more sane default value for the current position.
      currentPosition.setValue(currentPosition.getDefaultValue());

      return service;
    }

    getServices() {
      return this.services;
    }
  }

  homebridge.registerPlatform(
    'homebridge-mylink',
    'Somfy myLink',
    SomfyMyLinkPlatform,
  );
};
