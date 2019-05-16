# homebridge-mylink

Somfy myLink plugin for [Homebridge](https://github.com/nfarina/homebridge)

This plugin makes use of the [node-somfy-synergy](https://github.com/yungsters/node-somfy-synergy) package.

# Configuration

```json
{
  "platform": "Somfy myLink",
  "ipAddress": "192.168.1.123",
  "systemID": "mySystem",
  "targets": [
    {
      "targetID": "AB123C45.1",
      "name": "Family Room Window"
    },
    {
      "targetID": "AB123C45.2",
      "name": "Dining Room Window"
    },
    {
      "targetID": "AB123C45.4",
      "name": "Master Bedroom Window",
      "orientation": {
        "closed": "stop",
        "middle": "down",
        "opened": "up"
      }
    }
  ]
}
```

# Setup

You will need to use the Somfy myLink mobile app to configure the System ID and find the IP address and Target IDs. 

* Go to "Integration", choose one of the options that isn't Alexa or IFTTT, then choose "Change System ID"
* With a System ID set, choose "Get Integration report"
