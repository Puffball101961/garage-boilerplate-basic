import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import { useTeam } from '@/features/team/hooks/useTeam'
import { useCollection } from '@/hooks/useFirestore'
import { getTeamCollection } from '@/lib/firebase/firestore'
import type { TeamMember } from '@/types/firestore'

// Constraint builders return opaque SDK objects, so stub them with plain
// descriptors the assertions below can read.
vi.mock('firebase/firestore', () => ({
  where: (field: string, op: string, value: unknown) => ({ kind: 'where', field, op, value }),
  orderBy: (field: string, direction: string) => ({ kind: 'orderBy', field, direction }),
  Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
}))

vi.mock('@/hooks/useFirestore', () => ({ useCollection: vi.fn() }))

const TEAM_REF = { path: 'team' }
vi.mock('@/lib/firebase/firestore', () => ({ getTeamCollection: vi.fn(() => TEAM_REF) }))

const mockUseCollection = vi.mocked(useCollection)

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'ada-lovelace',
    name: 'Ada Lovelace',
    role: 'Project Lead',
    blurb: 'Keeps the roadmap honest.',
    photoUrl: null,
    order: 1,
    createdAt: Timestamp.now() as unknown as TeamMember['createdAt'],
    updatedAt: Timestamp.now() as unknown as TeamMember['updatedAt'],
    deletedAt: null,
    _schemaVersion: 1,
    ...overrides,
  }
}

describe('useTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCollection.mockReturnValue({ data: [], loading: false, error: null })
  })

  it('queries live members ordered by order then name', () => {
    renderHook(() => useTeam())

    expect(mockUseCollection).toHaveBeenCalledWith(
      TEAM_REF,
      { kind: 'where', field: 'deletedAt', op: '==', value: null },
      { kind: 'orderBy', field: 'order', direction: 'asc' },
      { kind: 'orderBy', field: 'name', direction: 'asc' }
    )
  })

  it('returns the subscribed members', () => {
    const members = [member(), member({ id: 'grace-hopper', name: 'Grace Hopper', order: 2 })]
    mockUseCollection.mockReturnValue({ data: members, loading: false, error: null })

    const { result } = renderHook(() => useTeam())

    expect(result.current.members).toEqual(members)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('passes loading and error straight through', () => {
    const error = new Error('failed-precondition: index not deployed')
    mockUseCollection.mockReturnValue({ data: [], loading: true, error })

    const { result } = renderHook(() => useTeam())

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(error)
  })

  it('reuses one collection reference across re-renders so it does not re-subscribe', () => {
    const { rerender } = renderHook(() => useTeam())
    rerender()
    rerender()

    expect(vi.mocked(getTeamCollection)).toHaveBeenCalledTimes(1)
  })
})
