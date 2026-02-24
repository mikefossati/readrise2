/**
 * Structured JSON logger for server-side use.
 *
 * In production (Vercel) logs are written as JSON to stdout/stderr and
 * captured by Vercel's log infrastructure. In development they are
 * pretty-printed for readability.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const isDev = process.env.NODE_ENV !== 'production'

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (isDev) {
    // Human-readable in development
    const prefix = { debug: '🔍', info: '📋', warn: '⚠️ ', error: '🔴' }[level]
    const extra = context ? ' ' + JSON.stringify(context) : ''
    const out = `${prefix} [${level.toUpperCase()}] ${message}${extra}`
    level === 'error' || level === 'warn' ? console.error(out) : console.log(out)
  } else {
    // Structured JSON in production — Vercel parses this
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    }
    level === 'error' || level === 'warn'
      ? console.error(JSON.stringify(entry))
      : console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info:  (message: string, context?: LogContext) => write('info',  message, context),
  warn:  (message: string, context?: LogContext) => write('warn',  message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
}
