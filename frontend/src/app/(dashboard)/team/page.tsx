import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { TeamList } from '@/features/team/components/TeamList'

export const metadata: Metadata = {
  title: 'Team',
  description: 'The people behind the project.',
}

export default async function TeamPage() {
  await requireAuth()

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Team" description="The people behind the project." />
      <TeamList />
    </div>
  )
}
