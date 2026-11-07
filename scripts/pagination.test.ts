import { describe, expect, it } from 'vitest'
import { pageRange } from '../server/utils/pagination'

describe('pageRange', () => {
  it('returns the first page of rows', () => {
    expect(pageRange(43, 1, 12)).toEqual({ page: 1, lastPage: 4, from: 0, to: 11 })
  })
  it('returns a later page of rows', () => {
    expect(pageRange(43, 2, 12)).toEqual({ page: 2, lastPage: 4, from: 12, to: 23 })
  })
  it('does not add an empty page after an exact multiple', () => {
    expect(pageRange(24, 2, 12)).toEqual({ page: 2, lastPage: 2, from: 12, to: 23 })
  })
  it('turns a page past the end into the last page', () => {
    expect(pageRange(43, 999, 12)).toEqual({ page: 4, lastPage: 4, from: 36, to: 47 })
  })
  it('handles having no rows at all', () => {
    expect(pageRange(0, 1, 12)).toEqual({ page: 1, lastPage: 1, from: 0, to: 11 })
  })
})
