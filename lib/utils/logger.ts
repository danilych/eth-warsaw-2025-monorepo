interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

export const createLogger = (prefix: string): Logger => ({
  info: (...args: unknown[]) => {
    console.info(`[${prefix.toUpperCase()}]`, ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn(`[${prefix.toUpperCase()}]`, ...args)
  },
  error: (...args: unknown[]) => {
    console.error(`[${prefix.toUpperCase()}]`, ...args)
  },
  debug: (...args: unknown[]) => {
    console.debug(`[${prefix.toUpperCase()}]`, ...args)
  },
})
