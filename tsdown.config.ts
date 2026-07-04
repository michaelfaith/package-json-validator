import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.*'],
  outDir: 'lib',
  unbundle: true,
});

export default config;
