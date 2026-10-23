import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  test: {
    environment: "happy-dom",

    globals: true,

    setupFiles: ["./vitest.setup.ts"],

    // Keep the existing project behavior. Some of the app's integration
    // tests intentionally share mocked module state.
    isolate: false,

    clearMocks: true,

    restoreMocks: false,

    mockReset: false,

    unstubGlobals: true,

    unstubEnvs: true,
  },
});