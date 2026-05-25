import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.comorian.heritage",
  appName: "voal-mwebne-zidi",
  webDir: "dist",
  // IMPORTANT : ne PAS définir `server.url` pour les builds de production.
  // Avec `server.url`, l'APK charge l'app depuis le sandbox distant et :
  //   - le mode hors-ligne ne fonctionne plus (aucun asset embarqué),
  //   - localStorage (favoris) peut être effacé/sandboxé,
  //   - le plein écran vidéo peut être bloqué.
  // Pour du hot-reload pendant le dev sur device, dé-commenter TEMPORAIREMENT
  // puis re-commenter avant de générer l'APK final.
  // server: {
  //   url: "https://5d8e9533-f82f-4fb4-8b52-e88da6a94899.lovableproject.com?forceHideBadge=true",
  //   cleartext: true,
  // },
  ios: {
    allowsBackForwardNavigationGestures: true,
    // L'app ne recouvre PAS la status bar (heure/batterie restent visibles).
    contentInset: "always",
  },
  android: {
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      // Le WebView ne s'étend PAS sous la status bar :
      // batterie, heure et notifications restent toujours visibles.
      overlaysWebView: false,
      // Fond vert de marque + icônes claires lisibles dessus.
      backgroundColor: "#2d6a4f",
      style: "DARK", // contenu sombre → icônes claires
    },
  },
};

export default config;
