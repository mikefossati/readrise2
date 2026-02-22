import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export const metadata = { title: 'Privacy Policy — ReadRise' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            ReadRise
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: February 2026</p>

        <h2>What we collect</h2>
        <p>
          ReadRise collects only the information necessary to provide the service: your email address,
          display name, and the reading data you enter (books, sessions, progress, reviews, goals).
          We do not sell your data to third parties.
        </p>

        <h2>How we use your data</h2>
        <ul>
          <li>To authenticate you and secure your account.</li>
          <li>To store and display your reading library, sessions, and stats.</li>
          <li>To send transactional emails (welcome, weekly summary) if you have not opted out.</li>
          <li>To process payments securely through Stripe.</li>
        </ul>

        <h2>Third-party services</h2>
        <ul>
          <li>
            <strong>Supabase</strong> — authentication and database hosting. Your data is stored
            on Supabase infrastructure in the US. See{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              Supabase&apos;s privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Stripe</strong> — payment processing. ReadRise never stores your card details.
            See{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              Stripe&apos;s privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Sentry</strong> — error monitoring. Crash reports may include anonymised
            metadata (browser, OS). No personal reading data is included.
          </li>
          <li>
            <strong>Resend</strong> — transactional email delivery.
          </li>
        </ul>

        <h2>Data retention</h2>
        <p>
          Your data is retained as long as your account is active. You may request deletion of your
          account and all associated data at any time by emailing{' '}
          <a href="mailto:privacy@readrise.app">privacy@readrise.app</a>.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on your jurisdiction you may have the right to access, correct, or erase your
          personal data. To exercise these rights, contact us at{' '}
          <a href="mailto:privacy@readrise.app">privacy@readrise.app</a>.
        </p>

        <h2>Cookies</h2>
        <p>
          ReadRise uses a single session cookie to keep you signed in. No advertising or tracking
          cookies are used.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be communicated via
          email to registered users.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href="mailto:privacy@readrise.app">privacy@readrise.app</a>.
        </p>
      </main>

      <footer className="border-t mt-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} ReadRise</span>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
