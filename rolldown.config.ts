import type { ConfigExport } from 'rolldown';

export default {
   external: /^(node:|bun)/,
   input: {
      //main: './src/main.ts',
      cli: "./src/cli/main.ts",
   },
   treeshake: true,
   output: { dir: './dist', cleanDir: true, minify: true }
} satisfies ConfigExport;
