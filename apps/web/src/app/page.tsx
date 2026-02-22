import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Timer, Zap, BookOpen, BarChart2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function HomePage() {
  // Authenticated users go straight to their dashboard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            ReadRise
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 space-y-24">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Know what you&apos;ve read.<br />
            Understand how you read.<br />
            Read more.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            ReadRise is a clean, private reading tracker built for serious and casual readers alike.
            No social clutter — just your reading life, beautifully tracked.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Feature strip */}
        <section className="space-y-6">
          <h2 className="text-center text-2xl font-semibold">Built different from Goodreads</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Timer,
                title: 'Session timer',
                body: 'Start and stop a reading timer. Track exactly how long you spend with each book.',
              },
              {
                icon: Zap,
                title: 'Reading speed',
                body: 'See your pages-per-hour automatically calculated from your sessions.',
              },
              {
                icon: BookOpen,
                title: 'Goodreads import',
                body: 'Bring your entire library over from Goodreads in one CSV upload.',
              },
              {
                icon: BarChart2,
                title: 'Meaningful stats',
                body: 'Books this year, total pages, reading streaks, genre breakdown — data that motivates.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <CardContent className="pt-6 space-y-2">
                  <Icon className="h-6 w-6" />
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Simple, transparent pricing</h2>
            <p className="mt-2 text-muted-foreground">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Get started with reading tracking.',
                features: ['Up to 50 books', 'Basic stats', 'Goodreads import', 'Session timer'],
                cta: 'Get started',
                href: '/signup',
                highlighted: false,
              },
              {
                name: 'Reader',
                price: '$4',
                period: '/mo',
                description: 'For serious readers who want the full picture.',
                features: ['Unlimited books', 'Full stats & trends', 'All goal types', 'Priority support'],
                cta: 'Start Reader',
                href: '/signup',
                highlighted: true,
              },
              {
                name: 'Bibliophile',
                price: '$8',
                period: '/mo',
                description: 'Everything, for the most devoted readers.',
                features: ['Everything in Reader', 'Year-in-Review card', 'Social profile (coming soon)', 'Priority support'],
                cta: 'Start Bibliophile',
                href: '/signup',
                highlighted: false,
              },
            ].map((tier) => (
              <Card key={tier.name} className={tier.highlighted ? 'border-foreground shadow-md' : ''}>
                <CardContent className="pt-6 flex flex-col gap-4 h-full">
                  <div>
                    <p className="font-semibold text-base">{tier.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                    <p className="mt-3 text-3xl font-bold">
                      {tier.price}
                      {tier.period && <span className="text-base font-normal text-muted-foreground">{tier.period}</span>}
                    </p>
                  </div>
                  <ul className="flex-1 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} ReadRise</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
