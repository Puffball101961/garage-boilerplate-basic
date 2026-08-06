'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/actions/auth.actions'
import { adminDb } from '@/lib/firebase/admin'
import type { ActionResult } from '@/types'
import type { CreateNoteInput, UpdateNoteInput } from '@/types/firestore'
import { createNoteSchema, noteIdSchema, updateNoteSchema } from '../validations'

const NOTES_COLLECTION = 'notes'

/**
 * Server Actions for the notes collection.
 *
 * These run through the Admin SDK, which bypasses Firestore security rules —
 * so every ownership check below is enforced here in code, not by the rules.
 * The rules still protect the client SDK path used by useNotes().
 */

export async function createNote(
  input: CreateNoteInput
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth()

  const parsed = createNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const ref = await adminDb.collection(NOTES_COLLECTION).add({
      uid: session.uid,
      title: parsed.data.title,
      body: parsed.data.body,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
      _schemaVersion: 1,
    })

    revalidatePath('/notes')
    return { success: true, data: { id: ref.id } }
  } catch {
    return { success: false, error: 'Failed to create note' }
  }
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<ActionResult> {
  const session = await requireAuth()

  const parsedId = noteIdSchema.safeParse(id)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? 'Invalid note ID' }
  }

  const parsed = updateNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const docRef = adminDb.collection(NOTES_COLLECTION).doc(parsedId.data)
    const snap = await docRef.get()

    if (!snap.exists || snap.data()?.uid !== session.uid || snap.data()?.deletedAt !== null) {
      return { success: false, error: 'Note not found' }
    }

    await docRef.update({
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/notes')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update note' }
  }
}

/** Soft-delete — sets deletedAt rather than removing the document. */
export async function deleteNote(id: string): Promise<ActionResult> {
  const session = await requireAuth()

  const parsedId = noteIdSchema.safeParse(id)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? 'Invalid note ID' }
  }

  try {
    const docRef = adminDb.collection(NOTES_COLLECTION).doc(parsedId.data)
    const snap = await docRef.get()

    if (!snap.exists || snap.data()?.uid !== session.uid || snap.data()?.deletedAt !== null) {
      return { success: false, error: 'Note not found' }
    }

    await docRef.update({
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/notes')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete note' }
  }
}
