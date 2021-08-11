# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.3](https://github.com/dgreif/homebridge-mylink/compare/v2.0.2...v2.0.3) (2021-08-11)


### Bug Fixes

* close connection after 1 minute of inactivity ([92cafed](https://github.com/dgreif/homebridge-mylink/commit/92cafed82d023965c02b264026f187d31e1963e0))

### [2.0.2](https://github.com/dgreif/homebridge-mylink/compare/v2.0.1...v2.0.2) (2021-08-10)


### Bug Fixes

* handle destroyed socket connections ([751149f](https://github.com/dgreif/homebridge-mylink/commit/751149f606f9dc73afa6118f16e352ee98d2a41e)), closes [#32](https://github.com/dgreif/homebridge-mylink/issues/32)

### [2.0.1](https://github.com/dgreif/homebridge-mylink/compare/v2.0.0...v2.0.1) (2021-08-08)

## [2.0.0](https://github.com/dgreif/homebridge-mylink/compare/v1.3.0...v2.0.0) (2021-08-07)


### ⚠ BREAKING CHANGES

* Channels (shades/awnings) are now detected automatically, but this required a change that will disassociate all previous channels.  This means any HomeKit automations you had previously configured will need to be set up again, and the accessories will all be reset back to the default room
* Accessory names will be reset to the value stored in the MyLink app.  Consider double checking that they are correct before updating
* The 'orientation' option has been removed in favor of simpler config for reversing all or individual channels.  This setting will get migrated for you automatically. You may need to restart homebridge twice after updating if the settings don't take effect after a single restart
* `compositeTargets` is no longer supported.  You can achieve this same behavior by grouping accessories within the Home app

### Features

* automatically detect channels ([3cb7795](https://github.com/dgreif/homebridge-mylink/commit/3cb7795d93919fdab64f70b3693b0b05e66a2fa1))


### Bug Fixes

* more reliable connection with windows support ([2f0e1f0](https://github.com/dgreif/homebridge-mylink/commit/2f0e1f054536cca1dc95f41dec1d600923435d24))

## 1.3.0 (2021-01-02)


### Features

* config schema, typescript, release tools ([98cf5c6](https://github.com/dgreif/homebridge-mylink/commit/98cf5c621599184dee1e92bb74a1475767a1f74f))
