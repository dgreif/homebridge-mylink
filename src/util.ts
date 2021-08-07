interface Logger {
  logInfo: (message: string) => void
  logError: (message: string) => void
  logDebug: (message: string) => void
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
  logDebug(message) {
    // eslint-disable-next-line no-console
    console.log(message)
  },
}

export function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

export function logDebug(message: any) {
  logger.logDebug(message)
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
