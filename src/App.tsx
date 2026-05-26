import { lazy, Suspense, memo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import SwipeBackGesture from "@/components/SwipeBackGesture";
// GlobalBackButton retiré : la navigation arrière se fait par le geste swipe
// global et par le bouton retour natif Android (NativeBackHandler).
import NativeBackHandler from "@/components/NativeBackHandler";

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

const importDownloads = () => import("@/pages/DownloadsScreen");
const DownloadsScreen = lazy(importDownloads);


const LicensesScreen = lazy(() => import("@/pages/LicensesScreen"));
const TermsScreen = lazy(() => import("@/pages/TermsScreen"));
const PrivacyScreen = lazy(() => import("@/pages/PrivacyScreen"));
const ForewordScreen = lazy(() => import("@/pages/ForewordScreen"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));

// Préchargement des écrans de la bottom nav dès que possible
if (typeof window !== "undefined") {
  const preload = () => {
    importSettings();
    importFavorites();
    importDownloads();
  };
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 1500);
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

const isDashboardHost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.startsWith("dashboard.") || host.startsWith("admin.");
};

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center" aria-busy="true" aria-live="polite">
    <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const MemoBottomNav = memo(BottomNav);
const MemoConnectionStatus = memo(ConnectionStatus);

const AppShell = () => {
  const { pathname } = useLocation();
  const dashboardHost = isDashboardHost();

  if (dashboardHost || pathname.startsWith("/dashboard")) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          {dashboardHost && <Route path="/" element={<Dashboard />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }
  const hideBottomNav = pathname === "/" || pathname.startsWith("/splash");
  return (
    <div
      className="mx-auto max-w-md min-h-screen bg-background shadow-2xl relative"
      style={{
  // Pas de paddingTop : les headers gèrent eux-mêmes la safe-area
  // pour que le dégradé se prolonge sous la status bar.
  paddingLeft: "env(safe-area-inset-left, 0px)",
  paddingRight: "env(safe-area-inset-right, 0px)",
  paddingBottom: hideBottomNav
    ? "env(safe-area-inset-bottom, 0px)"
    : "calc(4rem + env(safe-area-inset-bottom, 0px))",
}}
    >
      <Suspense fallback={<RouteFallback />}>
        <Routes>
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
          
          <Route path="/downloads" element={<DownloadsScreen />} />
          
          
          <Route path="/licenses" element={<LicensesScreen />} />
          <Route path="/terms" element={<TermsScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="/foreword" element={<ForewordScreen />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <SwipeBackGesture />
      <NativeBackHandler />
      <MemoBottomNav />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
