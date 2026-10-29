import { defineConfig } from 'vitest/config';
import path from 'path';

// Keep API integration tests isolated from the local or deployed application database.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

export default defineConfig({
  root: path.resolve(__dirname),
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    environment: 'node',
    globals: true,
    globalSetup: [path.resolve(__dirname, 'tests/globalSetup.cjs')],
  },
});
