import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Providers } from '@/components/providers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const payload = await getPayload({ config })
  const headersList = await headers()

  // Check authentication
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <Providers>
      <AppShell
        user={{
          email: user.email,
          name: (user as any).name || user.email,
        }}
      >
        {children}
      </AppShell>
    </Providers>
  )
}
