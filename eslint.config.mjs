import coreWebVitals from 'eslint-config-next/core-web-vitals'

// Flat config (ESLint 9). `next lint` was removed in Next 16, so linting now runs
// through the ESLint CLI (`eslint .`) using next's flat-config preset.
//
// Scope matches the project's long-standing baseline: `next/core-web-vitals`.
// The stricter `next/typescript` preset (no-explicit-any, etc.) was never used
// here and is left as a separate opt-in cleanup rather than a new gate.
export default [
  ...coreWebVitals,
  {
    // eslint-config-next 16 bundles react-hooks v6 (React Compiler era), which
    // adds rules that didn't exist when this code was written. Surface them as
    // warnings (visible tech debt) rather than a hard gate on a dependency bump;
    // the long-standing hook rules (exhaustive-deps, rules-of-hooks) stay as-is.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'data/**',
      'next-env.d.ts',
      // App source only, matching `next lint`'s historical scope. Test fixtures
      // and one-off scripts intentionally use patterns (mock hooks, raw <a>) that
      // the Next rules flag; they run under jest/ts-node, not the Next build.
      'tests/**',
      'scripts/**',
    ],
  },
]
