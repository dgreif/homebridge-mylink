import 'dotenv/config'
import { MyLink } from '../src/my-link'
import { delay } from '../src/util'

async function example() {
  const { env } = process,
    myLink = new MyLink(env.MYLINK_SYSTEM_ID!, env.MYLINK_HOST!),
    channels = await myLink.getChannels(),
    target1 = channels[2],
    target2 = channels[5]

  // eslint-disable-next-line no-console
  console.log(
    'Channels:',
    channels.map((channel) => {
      return {
        channelId: channel.channelId,
        name: channel.name,
      }
    })
  )

  await Promise.all([target1.up(), target2.up()])
  await delay(3000)
  await Promise.all([target1.stop(), target2.stop()])
}

void example()
