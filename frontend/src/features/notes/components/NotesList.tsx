'use client'

import { NotebookPen } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useNotes } from '@/features/notes/hooks/useNotes'
import { NoteItem } from './NoteItem'

export function NotesList() {
  const { notes, loading, error } = useNotes()

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
        <p className="font-medium">Could not load notes</p>
        <p className="mt-1 text-xs">{error.message}</p>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Add your first note using the form above."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} />
      ))}
    </ul>
  )
}
