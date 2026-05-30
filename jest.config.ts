import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default createJestConfig(config)
