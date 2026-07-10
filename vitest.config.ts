import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const config: ReturnType<typeof defineConfig> = defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/index.ts',
        '**/*.types.ts',
      ],
      include: ['src'],
      reporter: ['html', 'lcov', 'text'],
    },
    exclude: ['dist', 'node_modules'],
    setupFiles: ['console-fail-test/setup'],
  },
});

export default config;
