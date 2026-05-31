import { defineConfig } from 'orval';

export default defineConfig({
  msocial: {
    input: './schema.yaml',
    output: {
      mode: 'tags-split',
      target: './src/msocial.ts',
      client: 'axios',
      mock: true,
    },
  },
});

