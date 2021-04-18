import 'dotenv/config'
import { Api } from '../src/api'
import { delay } from '../src/util'

async function example() {
  const { env } = process,
    api = new Api({
      // Replace with your device id
      deviceId: env.MYLINK_DEVICE_ID!,
      // Replace with your mobile pin
      pin: +env.MYLINK_PIN!,
      debug: true,
    }),
    channels = await api.getChannels(),
    channel = channels[3]

  await channel.moveDown()
  await delay(1000)
  await channel.stop()
  await delay(1000)
  await channel.moveUp()
}

void example()
