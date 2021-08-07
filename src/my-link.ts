import { createConnection, Socket } from 'net'
import { logDebug, logError } from './util'

class ConnectionManager {
  private socket?: Socket
  private previousRequestId = 0
  private previousRequest: Promise<unknown> = Promise.resolve()

  constructor(private host: string, private port: number) {}

  private socketPromise?: Promise<Socket>

  private openSocket() {
    if (this.socketPromise) {
      return this.socketPromise
    }

    this.socketPromise = new Promise<Socket>((resolve, reject) => {
      const socket: Socket = createConnection(
        {
          host: this.host,
          port: this.port,
        },
        () => {
          resolve(socket)
        }
      )
      socket.on('error', (e) => {
        logDebug('Socket Error')
        logDebug(e)
        reject(e)
      })
      socket.on('close', () => {
        logDebug('Socket Closed')
        this.socket = undefined
      })
      this.socket = socket
    })

    return this.socketPromise
  }

  send<T = any>(payload: Record<string, unknown>) {
    const request = this.previousRequest
      .catch(() => null)
      .then(async () => {
        const socket = await this.openSocket(),
          requestId = this.previousRequestId++

        return new Promise<T>((resolve, reject) => {
          function responseHandler(data: Buffer) {
            try {
              const response = JSON.parse(data.toString())
              if (response.id === requestId) {
                resolve(response)
              }
            } catch (e) {
              logError(e)
              reject(e)
            } finally {
              // eslint-disable-next-line no-use-before-define
              cleanUp()
            }
          }
          function cleanUp() {
            socket.off('data', responseHandler)
          }

          socket.on('data', responseHandler)

          setTimeout(() => {
            cleanUp()
            reject(new Error('Failed to send command after 1 second'))
          }, 1000)

          socket.write(
            JSON.stringify({
              id: requestId,
              ...payload,
            }),
            (error) => {
              if (error) {
                reject(error)
              }
            }
          )
        })
      })

    this.previousRequest = request
    return request
  }
}

interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0'
  result: T
}

export interface ChannelInfo {
  targetID: string
  name: string
  type: number
}

export class MyLink {
  private connectionManager = new ConnectionManager(this.host, this.port)

  constructor(
    private systemID: string,
    private host: string,
    private port = 44100
  ) {}

  getChannels() {
    return this.send<ChannelInfo[]>('*.*', 'mylink.status.info')
  }

  async send<T = any>(targetID: string | undefined, method: string) {
    const request = {
        method,
        params: {
          auth: this.systemID,
          targetID,
        },
      },
      { result } = await this.connectionManager.send<JsonRpcResponse<T>>(
        request
      )

    return result
  }

  target(targetID: string) {
    return {
      down: () => this.send<boolean>(targetID, 'mylink.move.down'),
      stop: () => this.send<boolean>(targetID, 'mylink.move.stop'),
      up: () => this.send<boolean>(targetID, 'mylink.move.up'),
      info: () => this.send<boolean>(targetID, 'mylink.status.info'),
    }
  }
}
