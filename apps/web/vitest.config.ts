import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'unit',
          include: ['src/lib/**/*.test.ts'],
          exclude: ['src/lib/queries/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: 'components',
          include: ['src/components/**/*.test.tsx', 'src/app/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['src/tests/setup.ts'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'integration',
          include: ['src/app/api/**/*.test.ts', 'src/lib/queries/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['src/tests/integration/setup.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
