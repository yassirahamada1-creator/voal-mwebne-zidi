import { lazy, Suspense, memo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { FontProvider } from "@/contexts/FontContext";
import { OfflineSyncProvider } from "@/hooks/useOfflineSync";
import { OfflineAvailabilityProvider } from "@/hooks/useOfflineAvailability";
import { AccessibilityApplier } from "@/components/AccessibilityApplier";
import BottomNav from "@/components/BottomNav";
import ConnectionStatus from "@/components/ConnectionStatus";
import OfflineBanner from "@/components/OfflineBanner";
import OfflineDevTool from "@/components/dev/OfflineDevTool";
import NativeBackHandler from "@/components/NativeBackHandler";
import StatusBarController from "@/components/StatusBarController";
import TabSwiper, { TAB_PATHS } from "@/components/TabSwiper";


import SplashScreen from "@/pages/SplashScreen";
import HomeScreen from "@/pages/HomeScreen";

const CategoryScreen = lazy(() => import("@/pages/CategoryScreen"));
const GalleryScreen = lazy(() => import("@/pages/GalleryScreen"));
const GallerySubjectScreen = lazy(() => import("@/pages/GallerySubjectScreen"));
const MediaPlayerScreen = lazy(() => import("@/pages/MediaPlayerScreen"));
const PedagogicalScreen = lazy(() => import("@/pages/PedagogicalScreen"));
const QuizScreen = lazy(() => import("@/pages/QuizScreen"));
const importSettings = () => import("@/pages/SettingsScreen");
const SettingsScreen = lazy(importSettings);
const importFavorites = () => import("@/pages/FavoritesScreen");
const FavoritesScreen = lazy(importFavorites);
const LicensesScreen = lazy(() => import("@/pages/LicensesScreen"));
const TermsScreen = lazy(() => import("@/pages/TermsScreen"));
const PrivacyScreen = lazy(() => import("@/pages/PrivacyScreen"));
const ForewordScreen = lazy(() => import("@/pages/ForewordScreen"));
const HommageScreen = lazy(() => import("@/pages/HommageScreen"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CorsTestScreen = lazy(() => import("@/pages/CorsTestScreen"));

if (typeof window !== "undefined") {
  const preload = () => {
    import("@/pages/CategoryScreen");
    import("@/pages/GalleryScreen");
    import("@/pages/GallerySubjectScreen");
    import("@/pages/MediaPlayerScreen");
    import("@/pages/PedagogicalScreen");
    import("@/pages/QuizScreen");
    importSettings();
    importFavorites();
    import("@/pages/ForewordScreen");
    import("@/pages/HommageScreen");
  };
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 1000);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const IS_DASHBOARD_HOST = (() => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.startsWith("dashboard.") || host.startsWith("admin.");
})();

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center" aria-busy="true" aria-live="polite">
    <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const SilentFallback = () => <div className="min-h-[40vh]" aria-hidden="true" />;

const MemoBottomNav = memo(BottomNav);
const MemoConnectionStatus = memo(ConnectionStatus);

// ─── Variantes style WhatsApp ────────────────────────────────────────────────
// Page entrante  : vient de la droite (x: 100% → 0)
// Page sortante  : recule légèrement à gauche (x: 0 → -30%) = effet parallaxe
const pageVariants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-30%", opacity: 0.6 },
};

const pageTransition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1] as const,
};
// ─────────────────────────────────────────────────────────────────────────────

const AppShell = () => {
  const location = useLocation();
  const { pathname } = location;

  // ── Dashboard (hôte séparé ou /dashboard) ──
  if (IS_DASHBOARD_HOST || pathname.startsWith("/dashboard")) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          {IS_DASHBOARD_HOST && <Route path="/" element={<Dashboard />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }

  const isSplash = pathname === "/" || pathname.startsWith("/splash");
  const hideBottomNav = isSplash;

  return (
    <div
      className={`${isSplash ? "" : "mx-auto max-w-md"} h-dvh bg-background shadow-2xl relative flex flex-col`}
      style={{
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {/*
        Zone de contenu :
        - Sur un onglet principal (TAB_PATHS) → TabSwiper horizontal (peek + slide style WhatsApp)
        - Sur une sous-page (détail, lecteur, etc.) → Routes classiques, scroll vertical
      */}
      {(TAB_PATHS as readonly string[]).includes(pathname) ? (
        <TabSwiper activePath={pathname as (typeof TAB_PATHS)[number]} />
      ) : (
        <div className="relative flex-1 overflow-y-auto overscroll-contain pb-16">
          <Suspense fallback={<SilentFallback />}>
            <Routes location={location}>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/category/:categoryKey" element={<CategoryScreen />} />
              <Route path="/gallery" element={<GalleryScreen />} />
              <Route path="/gallery/:subjectId" element={<GallerySubjectScreen />} />
              <Route path="/media/:mediaId" element={<MediaPlayerScreen />} />
              <Route path="/pedagogical" element={<PedagogicalScreen />} />
              <Route path="/quiz" element={<QuizScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/favorites" element={<FavoritesScreen />} />
              
              <Route path="/licenses" element={<LicensesScreen />} />
              <Route path="/terms" element={<TermsScreen />} />
              <Route path="/privacy" element={<PrivacyScreen />} />
              <Route path="/foreword" element={<ForewordScreen />} />
              <Route path="/hommage" element={<HommageScreen />} />
              <Route path="/dev/cors-test" element={<CorsTestScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      )}

      {/* BottomNav fixe en bas */}
      {!hideBottomNav && (
        <div className="flex-none" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <MemoBottomNav />
        </div>
      )}

      <NativeBackHandler />
      <StatusBarController />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <I18nProvider>
        <AppSettingsProvider>
          <FontProvider>
            <OfflineSyncProvider>
              <OfflineAvailabilityProvider>
                <AccessibilityApplier />
                <MemoConnectionStatus />
                <OfflineBanner />
                {import.meta.env.DEV && <OfflineDevTool />}
                <Sonner />
                <BrowserRouter>
                  <AppShell />
                </BrowserRouter>
              </OfflineAvailabilityProvider>
            </OfflineSyncProvider>
          </FontProvider>
        </AppSettingsProvider>
      </I18nProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
