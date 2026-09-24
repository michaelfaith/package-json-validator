import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = defineConfig({
  attw: {
    enabled: 'ci-only',
    level: 'error',
  },
});

export default config;
