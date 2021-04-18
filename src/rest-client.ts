import got, { Options as RequestOptions, Headers } from 'got'
import { delay, logDebug, logError, stringify } from './util'
import { AuthTokenResponse } from './somfy-types'

const defaultRequestOptions: RequestOptions = {
    http2: true,
    responseType: 'json',
    method: 'GET',
  },
  apiBaseUrl = 'https://api.somfyconnect.com/'

export function apiPath(path: string) {
  return apiBaseUrl + path
}

export interface AuthOptions {
  deviceId: string
  pin: number
}

async function requestWithRetry<T>(
  requestOptions: RequestOptions & { url: string }
): Promise<T> {
  try {
    const options = {
        ...defaultRequestOptions,
        ...requestOptions,
      },
      { headers, body } = (await got(options)) as {
        headers: Headers
        body: any
      },
      data = body as T

    if (
      (headers[':status'] as any) === 302 &&
      typeof headers.location === 'string'
    ) {
      return ({ location: headers.location } as any) as T
    }

    return data
  } catch (e) {
    if (!e.response) {
      logError(
        `Failed to reach Somfy server at ${requestOptions.url}.  ${e.message}.  Trying again in 5 seconds...`
      )
      logDebug(e)

      await delay(5000)
      return requestWithRetry(requestOptions)
    }
    throw e
  }
}

export class SomfyRestClient {
  private authPromise = this.getAuth()

  // TODO: handle bad pin
  constructor(public readonly authOptions: AuthOptions) {}

  async getAuth(): Promise<AuthTokenResponse> {
    const { location } = await requestWithRetry<{ location: string }>({
        url: apiPath('mylink/oauth/auth'),
        json: {
          device_id: this.authOptions.deviceId,
          pin: this.authOptions.pin,
          client_id: 'phone_app_client_id',
          response_type: 'code',
          redirect_uri: 'https://api.somfyconnect.com',
        },
        method: 'POST',
        followRedirect: false,
      }),
      tokenResponse = await requestWithRetry<AuthTokenResponse>({
        url: apiPath('mylink/oauth/token'),
        body:
          'grant_type=authorization_code&client_id=phone_app_client_id&client_secret=23A1500D-73F0-4BA1-9031-F119DB301568&redirect_uri=' +
          location.replace('/?', '&'),
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        followRedirect: false,
      })

    return tokenResponse
  }

  private refreshAuth() {
    this.authPromise = this.getAuth()
  }

  async request<T = void>(
    options: RequestOptions & { url: string }
  ): Promise<T> {
    const { url } = options

    try {
      const authTokenResponse = await this.authPromise

      return await requestWithRetry<T>({
        ...options,
        headers: {
          ...options.headers,
          authorization: `Bearer ${authTokenResponse.access_token}`,
        },
      })
    } catch (e) {
      const response = e.response || {}

      if (response.statusCode === 401) {
        this.refreshAuth()
        return this.request(options)
      }

      if (response.statusCode) {
        logError(
          `Request to ${url} failed with status ${
            response.statusCode
          }. Response body: ${stringify(response.body)}`
        )
      } else {
        logError(`Request to ${url} failed:`)
        logError(e)
      }

      throw e
    }
  }

  getCurrentAuth() {
    return this.authPromise
  }
}
