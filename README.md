# homebridge-mylink

Somfy myLink plugin for [Homebridge](https://github.com/nfarina/homebridge)

# Configuration

The easiest way to set up this plugin is by installing it with [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x).  If you prefer to edit your config manually, see the examples below.

## Setup

You will need to use the Somfy myLink mobile app to configure the System ID and find the IP address and Target IDs.

* Go to "Integration", choose one of the options that isn't Alexa or IFTTT, then choose "Change System ID"
* With a System ID set, go to "Info" in the menu to find the IP address

## Simple Config

```json
{
  "platform": "Somfy myLink",
  "ipAddress": "192.168.1.123",
  "systemID": "mySystem"
}
```

## Full Config

`platform`, `ipAddress` and `systemID` are the only required values.  Everything else is optional.

```json
{
  "platform": "Somfy myLink",
  "ipAddress": "192.168.1.123",
  "systemID": "mySystem",
  "port": 44100,
  "reverseAll": false,
  "reverseChannels": [1, 2],
  "hideChannels": [3, 4]
}
```
