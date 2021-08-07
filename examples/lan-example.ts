import 'dotenv/config'
import { MyLink } from '../src/my-link'
import { delay } from '../src/util'

async function example() {
  const { env } = process,
    myLink = new MyLink(env.MYLINK_SYSTEM_ID!, env.MYLINK_HOST!),
    target1 = myLink.target(env.MYLINK_DEVICE_ID + '.3'),
    target2 = myLink.target(env.MYLINK_DEVICE_ID + '.6')

  // eslint-disable-next-line no-console
  console.log('Channels:', await myLink.getChannels())

  await Promise.all([target1.up(), target2.up()])
  await delay(3000)
  await Promise.all([target1.stop(), target2.stop()])
}

void example()
