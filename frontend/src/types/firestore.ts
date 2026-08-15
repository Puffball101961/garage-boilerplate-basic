import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore collection type definitions.
 *
 * Keep in sync with:
 *   - src/lib/firebase/firestore.ts  (typed collection exports)
 *   - firebase/firestore.rules       (security rules)
 *   - docs/FIRESTORE-SCHEMA.md       (schema documentation)
 *
 * When adding a new collection, use the /firebase-collection skill.
 */

export interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: 'user'
  createdAt: Timestamp
  updatedAt: Timestamp
  _schemaVersion: 1
}

export type CreateUserProfileInput = Omit<UserProfile, 'createdAt' | 'updatedAt'>

export interface Note {
  id: string
  uid: string
  title: string
  body: string
  createdAt: Timestamp
  updatedAt: Timestamp
  /** Soft-delete marker — null while the note is live. See docs/FIRESTORE-SCHEMA.md */
  deletedAt: Timestamp | null
  _schemaVersion: 1
}

/**
 * Client-supplied fields only. `uid` is taken from the verified session in the
 * Server Action, never from the caller — see features/notes/actions.
 */
export type CreateNoteInput = Pick<Note, 'title' | 'body'>

export type UpdateNoteInput = Partial<Pick<Note, 'title' | 'body'>>

export interface TeamMember {
  id: string
  name: string
  /** Job title shown under the name, e.g. "Backend Engineer" */
  role: string
  /** Short bio paragraph rendered on the card */
  blurb: string
  /**
   * Absolute URL (https://…) or a repo-relative path under /public
   * (e.g. /images/team/ada.jpg). null renders the initials fallback —
   * Cloud Storage is not available on the Spark plan, so photos are never
   * uploaded through the app.
   */
  photoUrl: string | null
  /** Ascending display order on the team page; ties break by name */
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
  /** Soft-delete marker — null while the member is live. See docs/FIRESTORE-SCHEMA.md */
  deletedAt: Timestamp | null
  _schemaVersion: 1
}

/**
 * Fields supplied when seeding a member. There is no in-app write path —
 * documents are created with the Admin SDK via scripts/seed-team.mjs, which
 * stamps the timestamps and `_schemaVersion`.
 */
export type CreateTeamMemberInput = Pick<
  TeamMember,
  'name' | 'role' | 'blurb' | 'photoUrl' | 'order'
>
