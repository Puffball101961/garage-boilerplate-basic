import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { initials, TeamMemberCard } from '@/features/team/components/TeamMemberCard'
import type { TeamMember } from '@/types/firestore'

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'ada-lovelace',
    name: 'Ada Lovelace',
    role: 'Project Lead',
    blurb: 'Keeps the roadmap honest and the standups short.',
    photoUrl: null,
    order: 1,
    createdAt: null as unknown as TeamMember['createdAt'],
    updatedAt: null as unknown as TeamMember['updatedAt'],
    deletedAt: null,
    _schemaVersion: 1,
    ...overrides,
  }
}

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
  })

  it('ignores words beyond the second', () => {
    expect(initials('Ada King Lovelace')).toBe('AK')
  })

  it('handles a single-word name', () => {
    expect(initials('Prince')).toBe('P')
  })

  it('collapses extra whitespace rather than emitting blanks', () => {
    expect(initials('  Ada   Lovelace  ')).toBe('AL')
  })

  it('returns an empty string for a blank name', () => {
    expect(initials('   ')).toBe('')
  })
})

describe('TeamMemberCard', () => {
  it('renders the name, role and blurb', () => {
    render(<TeamMemberCard member={member()} />)

    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByText('Project Lead')).toBeInTheDocument()
    expect(screen.getByText(/Keeps the roadmap honest/)).toBeInTheDocument()
  })

  it('renders the photo when photoUrl is set', () => {
    render(<TeamMemberCard member={member({ photoUrl: 'https://example.com/ada.jpg' })} />)

    const img = document.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toContain('example.com/ada.jpg')
    // The heading below already announces the name — labelling the portrait
    // too would read it twice.
    expect(img?.getAttribute('alt')).toBe('')
  })

  it('shows initials instead of an image when photoUrl is null', () => {
    render(<TeamMemberCard member={member({ photoUrl: null })} />)

    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('falls back to initials when the photo fails to load', () => {
    render(<TeamMemberCard member={member({ photoUrl: 'https://example.com/gone.jpg' })} />)

    const img = document.querySelector('img')
    expect(img).not.toBeNull()
    fireEvent.error(img!)

    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('omits the blurb paragraph when the blurb is empty', () => {
    const { container } = render(<TeamMemberCard member={member({ blurb: '' })} />)

    expect(container.querySelectorAll('p')).toHaveLength(1) // role only
  })
})
