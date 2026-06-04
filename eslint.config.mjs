// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
  },
  dirs: {
    src: ['./app'],
  },
})
  .append(
    {
      ignores: ['dist', '.nuxt', '.output', 'node_modules', 'playground', 'src/runtime'],
    },
  )
