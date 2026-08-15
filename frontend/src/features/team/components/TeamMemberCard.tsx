'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { TeamMember } from '@/types/firestore'

const PHOTO_SIZE = 96

/** "Ada Lovelace" → "AL". Falls back to "" for a blank name. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

interface TeamMemberCardProps {
  member: TeamMember
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  // photoUrl points at an arbitrary host (see docs/FIRESTORE-SCHEMA.md), so a
  // dead link is a normal state rather than a bug — degrade to the initials.
  const [photoFailed, setPhotoFailed] = useState(false)
  const photoUrl = photoFailed ? null : member.photoUrl

  return (
    // Structure follows the design; the rounded/shadowed surface is the card
    // treatment from docs/DESIGN.md rather than the wireframe's plain box.
    <li className="flex w-56 flex-col items-center rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {photoUrl ? (
        <Image
          src={photoUrl}
          // The name is announced from the heading directly below, so labelling
          // the portrait too would read it twice.
          alt=""
          width={PHOTO_SIZE}
          height={PHOTO_SIZE}
          // Bypasses the Next image optimizer, so an arbitrary photo host needs
          // no images.remotePatterns entry in next.config.ts.
          unoptimized
          onError={() => setPhotoFailed(true)}
          className="h-24 w-24 rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-24 w-24 items-center justify-center rounded-md bg-zinc-200 text-lg font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        >
          {initials(member.name)}
        </div>
      )}

      <h2 className="mt-4 text-center text-sm font-medium">{member.name}</h2>
      <p className="mt-1 text-center text-sm text-zinc-600 dark:text-zinc-400">{member.role}</p>
      {member.blurb && (
        <p className="mt-3 w-full text-sm text-zinc-600 dark:text-zinc-300">{member.blurb}</p>
      )}
    </li>
  )
}
