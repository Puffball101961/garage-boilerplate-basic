'use client'

import { useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteNote, updateNote } from '@/features/notes/actions/notes.actions'
import { formatDatetime } from '@/lib/utils'
import type { Note } from '@/types/firestore'

interface NoteItemProps {
  note: Note
}

export function NoteItem({ note }: NoteItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [pending, setPending] = useState(false)

  async function handleSave() {
    setPending(true)
    const result = await updateNote(note.id, { title, body })
    setPending(false)

    if (result.success) {
      toast.success('Note updated')
      setEditing(false)
    } else {
      toast.error(result.error ?? 'Failed to update note')
    }
  }

  function handleCancel() {
    setTitle(note.title)
    setBody(note.body)
    setEditing(false)
  }

  async function handleDelete() {
    setPending(true)
    const result = await deleteNote(note.id)
    setPending(false)

    if (result.success) {
      toast.success('Note deleted')
    } else {
      toast.error(result.error ?? 'Failed to delete note')
    }
  }

  if (editing) {
    return (
      <li className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Body"
          rows={3}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group flex items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium">{note.title}</p>
        {note.body && (
          <p className="text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{note.body}</p>
        )}
        <p className="text-xs text-zinc-400">
          {note.updatedAt ? formatDatetime(note.updatedAt.toDate()) : '—'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={pending}
          aria-label={`Edit ${note.title}`}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Delete ${note.title}`}
          className="rounded-md p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}
