// src/tests/unit/services/MultiplayerService.test.ts
import { describe, it, expect } from 'vitest'

describe('VITE_API_BASE env var', () => {
  it('is defined', () => {
    expect(import.meta.env.VITE_API_BASE).toBeDefined()
  })
})
