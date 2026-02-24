// This file configures the Sentry SDK on the Edge runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { sentryConfig } from './src/lib/sentry'

Sentry.init(sentryConfig)
