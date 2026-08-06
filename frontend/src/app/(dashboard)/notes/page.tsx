import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreateNoteForm } from '@/features/notes/components/CreateNoteForm'
import { NotesList } from '@/features/notes/components/NotesList'

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Your personal notes.',
}

export default async function NotesPage() {
  await requireAuth()

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Notes" description="Everything you have jotted down." />
      <CreateNoteForm />
      <NotesList />
    </div>
  )
}
