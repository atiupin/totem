import { execSync } from 'child_process';
import { defineConfig } from 'vite';

const gitCommitCount = execSync('git rev-list --count HEAD').toString().trim();

export default defineConfig({
  base: './',
  define: {
    __BUILD_VERSION__: JSON.stringify(`#${gitCommitCount}`),
  },
});
