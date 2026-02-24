import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// logger uses a module-level `isDev` constant so we need to reload it for
// each NODE_ENV scenario via dynamic import after stubbing the env.

describe('logger — dev mode', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
    log.mockClear()
    err.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test('debug writes human-readable line to console.log', async () => {
    const { logger } = await import('./logger')
    logger.debug('test-msg')
    expect(log).toHaveBeenCalledOnce()
    expect(log.mock.calls[0][0]).toMatch(/DEBUG.*test-msg/)
  })

  test('info writes human-readable line to console.log', async () => {
    const { logger } = await import('./logger')
    logger.info('test-msg', { key: 'val' })
    expect(log).toHaveBeenCalledOnce()
    expect(log.mock.calls[0][0]).toMatch(/INFO.*test-msg/)
    expect(log.mock.calls[0][0]).toContain('"key":"val"')
  })

  test('warn writes to console.error', async () => {
    const { logger } = await import('./logger')
    logger.warn('test-warn')
    expect(err).toHaveBeenCalledOnce()
    expect(log).not.toHaveBeenCalled()
    expect(err.mock.calls[0][0]).toMatch(/WARN.*test-warn/)
  })

  test('error writes to console.error', async () => {
    const { logger } = await import('./logger')
    logger.error('test-error', { code: 500 })
    expect(err).toHaveBeenCalledOnce()
    expect(log).not.toHaveBeenCalled()
    expect(err.mock.calls[0][0]).toMatch(/ERROR.*test-error/)
  })

  test('context is omitted when not provided', async () => {
    const { logger } = await import('./logger')
    logger.info('no-ctx')
    const output: string = log.mock.calls[0][0]
    expect(output.endsWith('no-ctx')).toBe(true)
  })
})

describe('logger — production mode', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    log.mockClear()
    err.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test('info emits valid JSON to console.log', async () => {
    const { logger } = await import('./logger')
    logger.info('prod-msg', { userId: 'u1' })
    expect(log).toHaveBeenCalledOnce()
    const parsed = JSON.parse(log.mock.calls[0][0])
    expect(parsed.level).toBe('info')
    expect(parsed.message).toBe('prod-msg')
    expect(parsed.userId).toBe('u1')
    expect(typeof parsed.timestamp).toBe('string')
  })

  test('debug emits valid JSON to console.log', async () => {
    const { logger } = await import('./logger')
    logger.debug('dbg')
    const parsed = JSON.parse(log.mock.calls[0][0])
    expect(parsed.level).toBe('debug')
  })

  test('warn emits valid JSON to console.error', async () => {
    const { logger } = await import('./logger')
    logger.warn('warnMsg')
    expect(err).toHaveBeenCalledOnce()
    expect(log).not.toHaveBeenCalled()
    const parsed = JSON.parse(err.mock.calls[0][0])
    expect(parsed.level).toBe('warn')
  })

  test('error emits valid JSON to console.error', async () => {
    const { logger } = await import('./logger')
    logger.error('errMsg', { detail: 'oops' })
    expect(err).toHaveBeenCalledOnce()
    const parsed = JSON.parse(err.mock.calls[0][0])
    expect(parsed.level).toBe('error')
    expect(parsed.detail).toBe('oops')
  })

  test('context fields are spread into the JSON entry', async () => {
    const { logger } = await import('./logger')
    logger.info('ctx-test', { a: 1, b: 'two' })
    const parsed = JSON.parse(log.mock.calls[0][0])
    expect(parsed.a).toBe(1)
    expect(parsed.b).toBe('two')
  })
})
