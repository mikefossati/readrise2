// This file configures the Sentry SDK on the server side (Node.js runtime).
// The config here runs for every server-side request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { sentryConfig } from './src/lib/sentry'

Sentry.init(sentryConfig)
