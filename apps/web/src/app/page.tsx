import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Timer, Zap, BookOpen, BarChart2, Check, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const TESTIMONIALS = [
  { quote: 'The reading tracker I never knew I needed.', handle: '@bookclub_isa' },
  { quote: 'Finally quit Goodreads for this.', handle: '@readswith_roma' },
  { quote: 'My streak is at 47 days and I\'m not stopping.', handle: '@pageturnerpj' },
  { quote: 'Obsessed with the pages-per-hour stat.', handle: '@nightowlreads' },
  { quote: 'Imported 200+ books from Goodreads in 30 seconds.', handle: '@thebookwormclub' },
  { quote: 'Clean UI, no noise. Just your books.', handle: '@silentpagesco' },
]

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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
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
        <section className="space-y-8 text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl leading-tight">
            Your reading life,<br />
            <span className="text-primary">finally organised.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Track books. Measure your speed. Build a streak.
            ReadRise is the reading tracker for readers who actually care about books.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Start for free →</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          {/* Product mockup */}
          <div className="relative mx-auto mt-8 max-w-2xl">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl ring-1 ring-black/5">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 border-b bg-muted px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto rounded bg-background px-4 py-1 text-xs text-muted-foreground">
                  app.readrise.com/dashboard
                </div>
              </div>
              {/* Fake dashboard */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-14 shrink-0 bg-[#1a1a2e] flex flex-col items-center py-4 gap-5">
                  <div className="h-5 w-5 rounded-full bg-white/20" />
                  <div className="h-4 w-4 rounded bg-[#e8923a]/80" />
                  <div className="h-4 w-4 rounded bg-white/20" />
                  <div className="h-4 w-4 rounded bg-white/20" />
                  <div className="mt-auto flex flex-col items-center gap-1">
                    <div className="text-[#e8923a]">
                      <Flame className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] text-[#e8923a] font-bold">14</span>
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 p-5 space-y-4 bg-[#faf8f4]">
                  <div className="space-y-0.5">
                    <div className="h-5 w-40 rounded bg-[#1a1a2e]/80" style={{ fontFamily: 'serif' }} />
                    <div className="h-3 w-20 rounded bg-[#1a1a2e]/20 mt-1" />
                  </div>
                  {/* Streak hero */}
                  <div className="rounded-xl bg-[#fef3e2] px-4 py-3 flex items-center gap-3">
                    <Flame className="h-5 w-5 text-[#e8923a] shrink-0" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 rounded bg-[#1a1a2e]/70" />
                      <div className="h-2.5 w-40 rounded bg-[#1a1a2e]/30" />
                    </div>
                  </div>
                  {/* Stat row */}
                  <div className="grid grid-cols-4 gap-2">
                    {['12 books', '3,847 pg', '68 hrs', '42 p/hr'].map((label) => (
                      <div key={label} className="rounded-lg border bg-white px-2 py-2">
                        <div className="h-4 w-8 rounded bg-[#1a1a2e]/70 mb-1" />
                        <div className="h-2 w-full rounded bg-[#1a1a2e]/20" />
                      </div>
                    ))}
                  </div>
                  {/* Cards row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border bg-white p-3 space-y-2">
                      <div className="h-3 w-20 rounded bg-[#1a1a2e]/40" />
                      <div className="h-7 w-12 rounded bg-[#1a1a2e]/70" />
                      <div className="h-1.5 w-full rounded-full bg-[#e8923a]/30">
                        <div className="h-full w-1/2 rounded-full bg-[#e8923a]" />
                      </div>
                    </div>
                    <div className="rounded-xl border bg-white p-3 flex gap-2">
                      <div className="h-14 w-9 rounded bg-[#ddd5c8]" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3 w-full rounded bg-[#1a1a2e]/60" />
                        <div className="h-2.5 w-2/3 rounded bg-[#1a1a2e]/40" />
                        <div className="h-2.5 w-1/2 rounded bg-[#1a1a2e]/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </div>
        </section>

        {/* Social proof marquee */}
        <div className="overflow-hidden border-y py-5 -mx-6">
          <div className="flex animate-marquee gap-16 whitespace-nowrap">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-foreground">&ldquo;{t.quote}&rdquo;</span>
                <span className="text-xs text-muted-foreground">{t.handle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature strip */}
        <section className="space-y-6">
          <h2 className="font-display text-center text-2xl font-bold">Built different from Goodreads</h2>
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
                  <Icon className="h-6 w-6 text-primary" />
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
            <h2 className="font-display text-2xl font-bold">Simple, transparent pricing</h2>
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
              <Card key={tier.name} className={tier.highlighted ? 'border-primary shadow-md' : ''}>
                <CardContent className="pt-6 flex flex-col gap-4 h-full">
                  <div>
                    <p className="font-semibold text-base">{tier.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                    <p className="mt-3 font-display text-3xl font-bold">
                      {tier.price}
                      {tier.period && <span className="text-base font-normal text-muted-foreground">{tier.period}</span>}
                    </p>
                  </div>
                  <ul className="flex-1 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
