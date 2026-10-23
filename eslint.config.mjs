import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `_`-prefixed names are the conventional "intentionally unused" marker
      // (e.g. `({ node: _node, ...props })` in react-markdown component maps).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // public/sw.js runs in ServiceWorkerGlobalScope, not the DOM/React
    // scope the rest of this config's type-aware (@typescript-eslint)
    // rules assume. It's also outside tsconfig.json's `include` (which
    // only matches .ts/.tsx/.mts/.mjs), so typescript-eslint's
    // projectService falls back to an inferred default project for it,
    // one that doesn't know about ServiceWorkerGlobalScope's `push` /
    // `pushsubscriptionchange` events, producing false-positive type
    // errors (e.g. "Property 'data' does not exist on type 'Event'")
    // that a plain `// @ts-nocheck` in the file itself cannot suppress,
    // since those come from ESLint's own type querying, not from `tsc`.
    "public/sw.js",
  ]),
]);

export default eslintConfig;