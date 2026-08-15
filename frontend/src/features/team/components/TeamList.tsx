'use client'

import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useTeam } from '@/features/team/hooks/useTeam'
import { TeamMemberCard } from './TeamMemberCard'

export function TeamList() {
  const { members, loading, error } = useTeam()

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        <p className="font-medium">Could not load the team</p>
        <p className="mt-1 text-xs">{error.message}</p>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No team members yet"
        description="Seed the roster with `node scripts/seed-team.mjs`, or add documents to the team collection in the Firebase console."
      />
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <TeamMemberCard key={member.id} member={member} />
      ))}
    </ul>
  )
}
