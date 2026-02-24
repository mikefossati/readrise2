/**
 * Next.js instrumentation hook — runs once on server startup.
 * This is the recommended way to initialise Sentry in Next.js App Router
 * (the sentry.server.config.ts approach alone misses some edge cases in
 * the App Router runtime).
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#create-initialization-config-files
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

/**
 * Capture unhandled errors thrown from React Server Components and
 * Server Actions — these would otherwise silently disappear in production.
 */
export const onRequestError = async (
  ...args: Parameters<Awaited<typeof import('@sentry/nextjs')>['captureRequestError']>
) => {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(...args)
}
