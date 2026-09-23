import { defineConfig } from 'vitest/config'

// Vitest at the repository root, so that running it here means the same thing as
// running it in the package it belongs to.
//
// There was no config here. `vitest` found none, fell back to its defaults, and ran the
// frontend's tests with `environment: 'node'`: no jsdom, so no `document` and no
// `localStorage`, so twenty of the twenty-one frontend test files died in `beforeEach`
// before asserting anything. Run from `apps/frontend`, where `vitest.config.ts` sets
// `environment: 'jsdom'`, the same tests all passed. The suite was never broken; the
// invocation was, and it was reported as a zustand-versus-vitest problem because the
// loudest line in the noise came from zustand's persist middleware saying its storage
// was unavailable, which is what a persisted store says when there is no localStorage.
//
// `projects` is the fix: a root run now loads each package's own config, so nobody can
// get a red suite by standing in the wrong folder.
export default defineConfig({
  test: {
    projects: ['apps/frontend'],
  },
})
