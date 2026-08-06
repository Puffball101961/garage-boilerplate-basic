'use client'

import { useMemo } from 'react'
import { orderBy, where } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useFirestore'
import { getNotesCollection } from '@/lib/firebase/firestore'
import type { Note } from '@/types/firestore'

/**
 * Realtime subscription to the signed-in user's notes, newest first.
 *
 * Requires the composite index in firebase/firestore.indexes.json
 * (uid ASC, deletedAt ASC, updatedAt DESC) — deploy it before first use or
 * the subscription errors with `failed-precondition`.
 */
export function useNotes() {
  const { user } = useAuth()
  const uid = user?.uid

  // getNotesCollection() builds a fresh CollectionReference on every call, and
  // useCollection re-subscribes whenever that reference changes identity — which
  // would re-subscribe on every render. Memoise it, keyed on uid so that signing
  // in or out still rebuilds the query with the correct owner.
  // uid is intentionally a cache key rather than a value read inside the factory:
  // changing it must produce a new reference so useCollection tears down the old
  // subscription and re-queries. ESLint sees it as unused, hence the disable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notesRef = useMemo(() => getNotesCollection(), [uid])

  const { data, loading, error } = useCollection<Note>(
    notesRef,
    where('uid', '==', uid ?? ''),
    where('deletedAt', '==', null),
    orderBy('updatedAt', 'desc')
  )

  // Signed out there is nothing to show, and the rules would reject the read
  // anyway — report an idle state rather than surfacing a permission error.
  if (!uid) {
    return { notes: [] as Note[], loading: false, error: null }
  }

  return { notes: data, loading, error }
}
