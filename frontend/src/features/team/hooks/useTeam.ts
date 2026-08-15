'use client'

import { useMemo } from 'react'
import { orderBy, where } from 'firebase/firestore'
import { useCollection } from '@/hooks/useFirestore'
import { getTeamCollection } from '@/lib/firebase/firestore'
import type { TeamMember } from '@/types/firestore'

/**
 * Realtime subscription to the live team roster, in display order.
 *
 * Requires the composite index in firebase/firestore.indexes.json
 * (deletedAt ASC, order ASC, name ASC) — deploy it before first use or the
 * subscription errors with `failed-precondition`.
 *
 * Unlike useNotes this takes no dependency on the signed-in user: the team
 * collection is publicly readable and the query is the same for everyone, so
 * the collection reference is memoised once and never rebuilt.
 */
export function useTeam() {
  // getTeamCollection() builds a fresh CollectionReference on every call, and
  // useCollection re-subscribes whenever that reference changes identity —
  // which would re-subscribe on every render without this.
  const teamRef = useMemo(() => getTeamCollection(), [])

  const { data, loading, error } = useCollection<TeamMember>(
    teamRef,
    where('deletedAt', '==', null),
    orderBy('order', 'asc'),
    orderBy('name', 'asc')
  )

  return { members: data, loading, error }
}
