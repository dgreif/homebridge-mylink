interface Logger {
  logInfo: (message: string) => void
  logError: (message: string) => void
}

let logger: Logger = {
    logInfo(message) {
      // eslint-disable-next-line no-console
      console.log(message)
    },
    logError(message) {
      // eslint-disable-next-line no-console
      console.error(message)
    },
  },
  debugEnabled = false

export function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

export function logDebug(message: any) {
  if (debugEnabled) {
    logger.logInfo(message)
  }
}

export function logInfo(message: any) {
  logger.logInfo(message)
}

export function logError(message: any) {
  logger.logError(message)
}

export function useLogger(newLogger: Logger) {
  logger = newLogger
}

export function enableDebug() {
  debugEnabled = true
}

export function stringify(data: any) {
  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'object' && Buffer.isBuffer(data)) {
    return data.toString()
  }

  return JSON.stringify(data) + ''
}
