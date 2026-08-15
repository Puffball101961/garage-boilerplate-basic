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

## `team` collection

**Path:** `/team/{memberId}` (document ID is a slug of the member's name, e.g. `ada-lovelace`)
**Access:** Public read — anyone, signed in or not, can read live members. Writes are admin-only.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Member's full name, 1–100 characters |
| `role` | `string` | Yes | Job title shown under the name, 1–100 characters |
| `blurb` | `string` | Yes | Short bio, up to 500 characters (may be empty) |
| `photoUrl` | `string \| null` | Yes | Absolute `https://` URL or a `/public` path such as `/images/team/ada.jpg`. `null` renders an initials fallback |
| `order` | `number` | Yes | Ascending display order on `/team`; ties break by `name` |
| `createdAt` | `Timestamp` | Yes | When the document was created — immutable |
| `updatedAt` | `Timestamp` | Yes | When the document was last updated |
| `deletedAt` | `Timestamp \| null` | Yes | Soft-delete marker — `null` while the member is live |
| `_schemaVersion` | `1` | Yes | Schema version for lazy migration |

**Why public read:** a team roster is published content — only the name, role, blurb and photo URL the team chose to show. Public read means the same collection can back an unauthenticated marketing page later without a rules change. The `/team` page itself currently sits in the `(dashboard)` route group behind `requireAuth()`; moving it out is a one-file change, with no rules change needed.

**Photos:** Firebase Cloud Storage is not part of this boilerplate (it requires the paid Blaze plan), so there is no upload path. `photoUrl` points at an image hosted elsewhere or committed under `frontend/public/`. `TeamMemberCard` renders it with `next/image` and `unoptimized`, which bypasses the Next image optimizer and therefore needs no `images.remotePatterns` entry in `next.config.ts` for each new host.

**Creation:** No in-app write path. Edit `scripts/team.seed.json` and run `pnpm run seed:team` (Admin SDK), or add documents by hand in the Firebase console. Because the document ID is derived from the name, re-seeding updates existing members rather than duplicating them, and preserves their original `createdAt`. Renaming a member creates a new document — soft-delete the old one.

**Deletion:** Hard-delete is disabled in security rules (`allow delete: if false`). Set `deletedAt` instead — both the rules' `notDeleted()` guard and the `useTeam` query filter soft-deleted members out.

**Required index:** `deletedAt ASC, order ASC, name ASC` — defined in `firebase/firestore.indexes.json`. The `useTeam` realtime query fails with `failed-precondition` until it is deployed.

---

<!-- Add new collection schemas below using the /firebase-collection skill -->
