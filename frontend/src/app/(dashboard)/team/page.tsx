import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { TeamList } from '@/features/team/components/TeamList'

export const metadata: Metadata = {
  title: 'Team Page',
  description: 'The people behind the project.',
}

export default async function TeamPage() {
  await requireAuth()

  return (
    // A centred title rather than the usual left-aligned PageHeader — this page
    // is a roster, not a dashboard view. PageHeader is left untouched so the
    // other pages that use it keep their layout.
    <div className="mx-auto max-w-4xl space-y-12 py-8">
      <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Team Page</h1>
      <TeamList />
    </div>
  )
}
