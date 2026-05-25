import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  HelpCircle,
  Languages,
  LogOut,
  Moon,
  ExternalLink,
} from "lucide-react";
import {
  AdminLogin,
  DashboardTab,
  ModulesTab,
  ContentsTab,
  QuizTab,
  TranslationsTab,
} from "./Admin";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";

type View = "overview" | "modules" | "contents" | "quiz" | "translations";

const NAV: { key: View; label: string; icon: any }[] = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: "modules", label: "Modules", icon: FolderKanban },
  { key: "contents", label: "Contenus", icon: FileText },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "translations", label: "Traductions", icon: Languages },
];

function DashboardSidebar({
  view,
  setView,
  onLogout,
}: {
  view: View;
  setView: (v: View) => void;
  onLogout: () => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200/70 [&>div]:bg-white [&_[data-sidebar=sidebar]]:bg-white"
    >
      <SidebarContent className="bg-white text-slate-700">
        <div className="px-3 py-4 flex items-center gap-2.5 border-b border-slate-200/70">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-sm">
            <Moon className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900">Voix de la Lune</p>
              <p className="text-[10px] text-slate-500">Tableau de bord</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = view === item.key;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => setView(item.key)}
                      className={
                        active
                          ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-medium hover:bg-indigo-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-indigo-50 data-[active=true]:to-violet-50 data-[active=true]:text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Application
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  <NavLink to="/home" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {!collapsed && <span>Voir l'app</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLogout}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Déconnexion</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function Dashboard() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>("overview");

  const [modules, setModules] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);

  const loadAll = async () => {
    const [m, c, g, q, t] = await Promise.all([
      supabase.from("modules").select("*").order("order_index"),
      supabase.from("contents").select("*").order("created_at", { ascending: false }),
      supabase.from("gallery_items").select("*").order("order_index"),
      supabase.from("quiz_questions").select("*").order("order_index"),
      supabase.from("translations").select("*").order("key"),
    ]);
    if (m.data) setModules(m.data);
    if (c.data) setContents(c.data);
    if (g.data) setGallery(g.data);
    if (q.data) setQuiz(q.data);
    if (t.data) setTranslations(t.data);
  };

  useEffect(() => {
    if (user && isAdmin) loadAll();
  }, [user, isAdmin]);

  const logout = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!user) return <AdminLogin />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Lock className="w-6 h-6 text-muted-foreground" />
        <p className="text-sm">Votre compte n'a pas les droits administrateur.</p>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-1" /> Se déconnecter
        </Button>
      </div>
    );
  }

  const currentLabel = NAV.find((n) => n.key === view)?.label ?? "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
        <DashboardSidebar view={view} setView={setView} onLogout={logout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-3 border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-5 sticky top-0 z-10">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900" />
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold truncate text-slate-900">{currentLabel}</h1>
            </div>
            <Link to="/home">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-200 shadow-sm"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                App publique
              </Button>
            </Link>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {view === "overview" && (
                <DashboardTab
                  modules={modules}
                  contents={contents}
                  gallery={gallery}
                  quiz={quiz}
                  translations={translations}
                />
              )}
              {view === "modules" && <ModulesTab modules={modules} reload={loadAll} />}
              {view === "contents" && (
                <ContentsTab contents={contents} modules={modules} reload={loadAll} />
              )}
              {view === "quiz" && (
                <QuizTab items={quiz} modules={modules} reload={loadAll} />
              )}
              {view === "translations" && (
                <TranslationsTab items={translations} reload={loadAll} />
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
