import { Sidebar } from '@/components/layout/sidebar'
import { UserMenu } from '@/components/layout/user-menu'
import { Toaster } from '@/components/ui/sonner'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, error } = await getAuthenticatedUser()

  if (error) redirect('/login')

  // Send users who haven't finished onboarding back to the wizard
  if (dbUser && !dbUser.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar subscriptionTier={dbUser?.subscriptionTier ?? 'free'} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-end border-b bg-card px-4">
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster richColors />
    </div>
  )
}
