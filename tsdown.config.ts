import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = defineConfig({
  attw: {
    enabled: 'ci-only',
    level: 'error',
    profile: 'esm-only',
  },
  exports: true,
});

export default config;
