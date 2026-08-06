# Firestore Schema

## Overview

All collections use the typed collection pattern — see `frontend/src/lib/firebase/firestore.ts`.
Security rules are in `firebase/firestore.rules`.

When adding a new collection, use the `/firebase-collection` Claude Code skill.

## Schema versioning

Every document in every collection **must** include a `_schemaVersion` field:

```typescript
_schemaVersion: 1  // increment when doing a breaking schema change
```

This enables **lazy migration** — when a document is read, check `_schemaVersion` and migrate on the fly if it's behind current. See the `/evolve-schema` skill for the full migration workflow.

**Rules:**
- `_schemaVersion` is always `1` on creation
- Non-breaking changes (adding optional fields with defaults) keep the same version
- Breaking changes (rename, remove, type change) increment the version and require a migration function
- Never remove `_schemaVersion` from a schema

---

## `users` collection

**Path:** `/users/{userId}`
**Access:** Owner-only (user can read/write their own document; admins can read all)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | Yes | Firebase Auth UID (same as document ID) |
| `email` | `string` | Yes | User's email address |
| `displayName` | `string \| null` | Yes | Display name from Auth or profile |
| `photoURL` | `string \| null` | Yes | Profile photo URL |
| `role` | `'user' \| 'admin'` | Yes | User role — immutable by user after creation |
| `createdAt` | `Timestamp` | Yes | When the document was created |
| `updatedAt` | `Timestamp` | Yes | When the document was last updated |
| `_schemaVersion` | `1` | Yes | Schema version for lazy migration |

**Creation:** Auto-created by `AuthProvider` on first sign-in via `syncUserProfile()`.
**Deletion:** Hard-delete is disabled in security rules. Use `deletedAt` field for soft-delete.

---

## `notes` collection

**Path:** `/notes/{noteId}` (auto-generated document ID)
**Access:** Owner-only — a user can read and write only documents where `uid` matches their own

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | Yes | Owner's Firebase Auth UID — immutable after creation |
| `title` | `string` | Yes | Note title, 1–200 characters |
| `body` | `string` | Yes | Note content, up to 10,000 characters (may be empty) |
| `createdAt` | `Timestamp` | Yes | When the document was created — immutable |
| `updatedAt` | `Timestamp` | Yes | When the document was last updated |
| `deletedAt` | `Timestamp \| null` | Yes | Soft-delete marker — `null` while the note is live |
| `_schemaVersion` | `1` | Yes | Schema version for lazy migration |

**Ownership:** The document ID is auto-generated, so ownership lives in the `uid` field rather than the path. Security rules read `resource.data.uid` on every operation.

**Creation:** Via the `createNote` Server Action (`frontend/src/features/notes/actions/notes.actions.ts`). `uid` is taken from the verified session, never from client input.

**Deletion:** Hard-delete is disabled in security rules (`allow delete: if false`). `deleteNote` sets `deletedAt` instead, and both the rules' `notDeleted()` guard and the `useNotes` query filter soft-deleted notes out.

**Required index:** `uid ASC, deletedAt ASC, updatedAt DESC` — defined in `firebase/firestore.indexes.json`. The `useNotes` realtime query fails with `failed-precondition` until it is deployed.

**Admin SDK caveat:** Server Actions use `adminDb`, which bypasses security rules entirely. Ownership is re-checked in code in each action; the rules protect the client SDK path used by `useNotes`.

---

<!-- Add new collection schemas below using the /firebase-collection skill -->
