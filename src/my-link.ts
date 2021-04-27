export interface MyLinkOptions {
  deviceId: string
  pin: number
}

export class MyLink {
  constructor(public readonly options: MyLinkOptions) {}

  getChannels() {}
}

const { default: SocketPool } = require('socket-pool')

require('net-keepalive')

export class SomfySynergy {
  _nextId = 1
  _socketPool = new SocketPool({
    connect: { host: this.host, port: this.port },
  })

  constructor(
    private systemID: string,
    private host: string,
    private port = 44100
  ) {}

  send(targetID: string | undefined, method: string) {
    const id = this._nextId++
    const request = {
      id,
      method,
      params: {
        auth: this.systemID,
        targetID,
      },
    }
    return this._socketPool.acquire().then(
      (socket: any) =>
        new Promise((resolve, reject) => {
          socket._socket.setKeepAlive(true, 5000)
          console.log('WRITING', request)
          socket.write(JSON.stringify(request), (error: Error | null) => {
            if (error !== null) {
              reject(error)
            }
          })
          socket.on('data', (data: Buffer) => {
            console.log('RESP', data.toString())
            try {
              const response = JSON.parse(data.toString())
              if (response.id === id) {
                resolve(response.result)
                socket.release()
              }
            } catch (error) {
              reject(error)
              socket.release()
            }
          })
        })
    )
  }

  target(targetID: string) {
    return {
      down: () => this.send(targetID, 'mylink.move.down'),
      stop: () => this.send(targetID, 'mylink.move.stop'),
      up: () => this.send(targetID, 'mylink.move.up'),
      info: () => this.send(undefined, 'mylink.status.info'),
    }
  }
}
