# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0-beta.1](https://github.com/yungsters/homebridge-mylink/compare/v2.0.0-beta.0...v2.0.0-beta.1) (2021-08-07)


### ⚠ BREAKING CHANGES

* Channels (shades/awnings) are now detected automatically, but this required a change that will disassociate all previous channels.  This means any HomeKit automations you had previously configured will need to be set up again, and the accessories will all be reset back to the default room
* Accessory names will be reset to the value stored in the MyLink app.  Consider double checking that they are correct before updating
* The 'orientation' option has been removed in favor of simpler config for reversing all or individual channels.  This setting will get migrated for you automatically. You may need to restart homebridge twice after updating if the settings don't take effect after a single restart

### Features

* automatically detect channels ([1eee2b0](https://github.com/yungsters/homebridge-mylink/commit/1eee2b06507c76309cc014c8e7206af70eabdd07))

## [2.0.0-beta.0](https://github.com/yungsters/homebridge-mylink/compare/v1.3.0...v2.0.0-beta.0) (2021-08-07)


### ⚠ BREAKING CHANGES

* `compositeTargets` is no longer supported.  You can achieve this same behavior by grouping accessories within the Home app

### Bug Fixes

* more reliable connection with windows support ([2f0e1f0](https://github.com/yungsters/homebridge-mylink/commit/2f0e1f054536cca1dc95f41dec1d600923435d24))

## 1.3.0 (2021-01-02)


### Features

* config schema, typescript, release tools ([98cf5c6](https://github.com/yungsters/homebridge-mylink/commit/98cf5c621599184dee1e92bb74a1475767a1f74f))
