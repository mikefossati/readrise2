import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export const metadata = { title: 'Terms of Service — ReadRise' }

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated: February 2026</p>

        <h2>Acceptance</h2>
        <p>
          By creating a ReadRise account you agree to these Terms of Service. If you do not agree,
          do not use the service.
        </p>

        <h2>Service description</h2>
        <p>
          ReadRise provides a personal reading tracking service that lets you log books, track
          reading sessions, record progress, and view reading statistics. The service is provided
          on a subscription basis with a free tier.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You must be at least 13 years old to use ReadRise.</li>
          <li>You may not use the service for unlawful purposes.</li>
          <li>One account per person. Sharing accounts is not permitted.</li>
        </ul>

        <h2>Subscription and payments</h2>
        <ul>
          <li>
            Free accounts are provided at no cost and include up to 50 books in your library.
          </li>
          <li>
            Paid subscriptions (Reader, Bibliophile) are billed monthly or annually as selected at
            checkout. Prices are shown in USD.
          </li>
          <li>
            Payments are processed by Stripe. By subscribing you agree to Stripe&apos;s terms of
            service.
          </li>
          <li>
            Subscriptions renew automatically at the end of each billing period unless cancelled
            before the renewal date.
          </li>
        </ul>

        <h2>Cancellation and refunds</h2>
        <p>
          You may cancel your subscription at any time via the Billing page. Cancellation takes
          effect at the end of the current billing period — you retain access until then. We do
          not offer pro-rated refunds for partial periods.
        </p>

        <h2>Your data</h2>
        <p>
          You own the reading data you enter into ReadRise. We do not claim any intellectual
          property rights over it. See our <Link href="/privacy">Privacy Policy</Link> for details
          on how your data is stored and used.
        </p>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Attempt to gain unauthorised access to other users&apos; accounts or data.</li>
          <li>Use automated tools to scrape or bulk-extract data from the service.</li>
          <li>Interfere with the availability or security of the service.</li>
        </ul>

        <h2>Service availability</h2>
        <p>
          We aim for high availability but do not guarantee uninterrupted access. Planned
          maintenance and unexpected outages may occur.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          ReadRise is provided &quot;as is&quot; without warranty of any kind. To the maximum extent
          permitted by law, we are not liable for any indirect, incidental, or consequential
          damages arising from your use of the service.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may update these terms. Continued use of the service after changes are posted
          constitutes acceptance of the updated terms. Material changes will be communicated via
          email.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href="mailto:hello@readrise.app">hello@readrise.app</a>.
        </p>
      </main>

      <footer className="border-t mt-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} ReadRise</span>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
