import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Fallbacks publics (publishable keys) pour que le build APK fonctionne
// même si le fichier .env est absent (ex: après git pull, car .env est gitignore).
// Ces valeurs sont publiques côté client — aucun risque de sécurité.
const SUPABASE_URL_FALLBACK = "https://vgakulafrptoirrpqppu.supabase.co";
const SUPABASE_KEY_FALLBACK =
  "sb_publishable_slyLUuO7gCdL2eS8MFReng_O2waSRri";
const SUPABASE_PROJECT_ID_FALLBACK = "vgakulafrptoirrpqppu";

export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK,
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_KEY_FALLBACK,
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_PROJECT_ID_FALLBACK,
    ),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Sépare les gros vendors pour qu'ils soient mis en cache long-terme
        // et n'alourdissent pas le bundle initial des routes principales.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
          ],
          "supabase": ["@supabase/supabase-js"],
          "query": ["@tanstack/react-query"],
        },
      },
    },
  },
}));
