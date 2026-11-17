// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { memberBackend } from "./src/lib/member-backend";

// Keep browser builds and authenticated server functions on the same project,
// including previews whose hosting environment still contains the old backend.
const memberEnvironment = {
  SUPABASE_PROJECT_ID: memberBackend.projectId,
  SUPABASE_URL: memberBackend.url,
  SUPABASE_PUBLISHABLE_KEY: memberBackend.publishableKey,
};
const memberDefinitions: Record<string, string> = {};
for (const [name, value] of Object.entries(memberEnvironment)) {
  process.env[name] = value;
  process.env[`VITE_${name}`] = value;
  memberDefinitions[`process.env.${name}`] = JSON.stringify(value);
  memberDefinitions[`import.meta.env.VITE_${name}`] = JSON.stringify(value);
}

export default defineConfig({
  vite: { define: memberDefinitions },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
