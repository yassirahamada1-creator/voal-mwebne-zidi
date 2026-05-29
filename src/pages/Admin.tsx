import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { matchesAllTokens } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Lock, LogOut, Eye, EyeOff, Save, RotateCcw, Search, Music, Video, FileText, Image as ImageIcon, Images, FolderPlus, LayoutDashboard, Languages, BookOpen, Upload, Loader2, X } from "lucide-react";
import MediaInput from "@/components/admin/MediaInput";
import MultiImageInput, { type BulkPhoto } from "@/components/admin/MultiImageInput";
import RichText from "@/components/admin/RichText";
import { setPreviewTranslation, clearPreviewTranslations } from "@/contexts/I18nContext";
import { uploadFile } from "@/lib/adminUpload";
import FullEditTab from "@/components/admin/FullEditTab";
import GalleryAdminTab from "@/components/admin/GalleryTab";
import { ConfirmDeleteProvider, confirmDelete } from "@/components/admin/ConfirmDeleteDialog";

type Module = {
  id: string;
  slug: string;
  name_fr: string;
  name_shk: string;
  description_fr?: string | null;
  description_shk?: string | null;
  cover_image_url?: string | null;
  order_index: number;
  is_active: boolean;
};

type Content = {
  id: string;
  title_fr: string;
  title_shk: string;
  description_fr?: string | null;
  description_shk?: string | null;
  type: string;
  module_slug?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  is_published: boolean;
  parent_id?: string | null;
};

type GalleryItem = {
  id: string;
  image_url: string;
  caption_fr?: string | null;
  caption_shk?: string | null;
  module_slug?: string | null;
  order_index: number;
  is_published: boolean;
};

type QuizQuestion = {
  id: string;
  question_fr: string;
  question_shk: string;
  option_a_fr: string;
  option_a_shk: string;
  option_b_fr: string;
  option_b_shk: string;
  option_c_fr?: string | null;
  option_c_shk?: string | null;
  option_d_fr?: string | null;
  option_d_shk?: string | null;
  correct_index: number;
  explanation_fr?: string | null;
  explanation_shk?: string | null;
  module_slug?: string | null;
  order_index: number;
  is_published: boolean;
};

type Translation = {
  id: string;
  key: string;
  value_fr: string;
  value_shk: string;
  screen?: string | null;
};

const CONTENT_TYPES = ["audio", "video", "text", "image"];
// Conservé pour rétrocompatibilité d'import (Dashboard.tsx) — n'est plus utilisé.
export const AUTH_KEY = "admin_authed";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const REMEMBER_KEY = "vdl-admin-remember";

export function AdminLogin({ onSuccess }: { onSuccess?: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    try { return localStorage.getItem(REMEMBER_KEY) !== "0"; } catch { return true; }
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast.error("Identifiants incorrects");
      return;
    }
    try { localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0"); } catch {}
    onSuccess?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 border rounded-lg p-6 bg-card shadow-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Administration</h1>
          <p className="text-xs text-muted-foreground">Accès protégé</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd">Mot de passe</Label>
          <div className="relative">
            <Input
              id="pwd"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
            className="min-w-4"
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">
            Rester connecté
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Vérification…" : "Se connecter"}
        </Button>
        <Link to="/home" className="block text-center text-xs text-muted-foreground hover:underline">
          Retour à l'accueil
        </Link>
      </form>
    </div>
  );
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);

  const loadAll = async () => {
    const [m, c, g, q, t] = await Promise.all([
      supabase.from("modules").select("*").order("order_index"),
      supabase.from("contents").select("*").order("created_at", { ascending: false }),
      supabase.from("gallery_items").select("*").order("order_index"),
      supabase.from("quiz_questions").select("*").order("order_index"),
      supabase.from("translations").select("*").order("key"),
    ]);
    if (m.data) setModules(m.data as Module[]);
    if (c.data) setContents(c.data as Content[]);
    if (g.data) setGallery(g.data as GalleryItem[]);
    if (q.data) setQuiz(q.data as QuizQuestion[]);
    if (t.data) setTranslations(t.data as Translation[]);
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

  return (
    <div className="min-h-screen bg-background">
      <ConfirmDeleteProvider />
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Administration</h1>
              <p className="text-xs text-muted-foreground">
                Voix de la Lune — Gestion du contenu
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid grid-cols-6 w-full mb-6">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="contents">Contenus</TabsTrigger>
            <TabsTrigger value="full-edit">Édition complète</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="translations">Traductions</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              modules={modules}
              contents={contents}
              gallery={gallery}
              quiz={quiz}
              translations={translations}
            />
          </TabsContent>
          <TabsContent value="modules">
            <ModulesTab modules={modules} reload={loadAll} />
          </TabsContent>
          <TabsContent value="contents">
            <ContentsTab contents={contents} modules={modules} reload={loadAll} />
          </TabsContent>
          <TabsContent value="full-edit">
            <FullEditTab modules={modules} contents={contents} quiz={quiz} reload={loadAll} />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTab items={quiz} modules={modules} reload={loadAll} />
          </TabsContent>
          <TabsContent value="translations">
            <TranslationsTab items={translations} reload={loadAll} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- MODULES ---------------- */
export function ModulesTab({ modules, reload }: { modules: Module[]; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Module> | null>(null);

  const save = async () => {
    const nameFr = (editing?.name_fr || "").trim();
    const nameShk = (editing?.name_shk || "").trim();
    if (!nameFr && !nameShk) {
      toast.error("Nom requis");
      return;
    }
    const slug = editing?.slug || slugify(nameFr || nameShk);
    const payload = {
      slug,
      name_fr: nameFr || nameShk,
      name_shk: nameShk || nameFr,
      description_fr: editing?.description_fr || null,
      description_shk: editing?.description_shk || editing?.description_fr || null,
      cover_image_url: editing?.cover_image_url || null,
      order_index: editing?.order_index ?? modules.length,
      is_active: true,
    };
    const res = editing?.id
      ? await supabase.from("modules").update(payload).eq("id", editing.id)
      : await supabase.from("modules").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Module appliqué à l'application");
    setOpen(false);
    setEditing(null);
    reload();
  };

  const toggleActive = async (m: Module, value: boolean) => {
    const { error } = await supabase.from("modules").update({ is_active: value }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Module activé" : "Module désactivé");
    reload();
  };

  const del = async (id: string) => {
    if (!(await confirmDelete({ itemLabel: "ce module" }))) return;
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Modules ({modules.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({})}>
              <Plus className="w-4 h-4 mr-1" /> Nouveau module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Modifier" : "Nouveau"} module</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label>Nom (Français)</Label>
                    <Input
                      value={editing.name_fr || ""}
                      onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })}
                      placeholder="Grand Mariage"
                    />
                  </div>
                  <div>
                    <Label>Nom (Shikomori)</Label>
                    <Input
                      value={editing.name_shk || ""}
                      onChange={(e) => setEditing({ ...editing, name_shk: e.target.value })}
                      placeholder="Ndola Nkuu"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label>Description (Français)</Label>
                    <Textarea
                      value={editing.description_fr || ""}
                      onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })}
                      placeholder="Courte description"
                    />
                  </div>
                  <div>
                    <Label>Description (Shikomori)</Label>
                    <Textarea
                      value={editing.description_shk || ""}
                      onChange={(e) => setEditing({ ...editing, description_shk: e.target.value })}
                      placeholder="Maelezo mafupi"
                    />
                  </div>
                </div>
                <MediaInput
                  label="Image de couverture"
                  folder="modules"
                  accept="image/*"
                  value={editing.cover_image_url || ""}
                  onChange={(url) => setEditing({ ...editing, cover_image_url: url })}
                />
              </div>
            )}
            <DialogFooter>
              <Button onClick={save}>Appliquer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name_fr}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={m.is_active}
                      onCheckedChange={(v) => toggleActive(m, v)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {m.is_active ? "Visible" : "Masqué"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="flex gap-1 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(m);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Modifier
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(m.id)} aria-label="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
export function DashboardTab({
  modules,
  contents,
  gallery,
  quiz,
  translations,
}: {
  modules: Module[];
  contents: Content[];
  gallery: GalleryItem[];
  quiz: QuizQuestion[];
  translations: Translation[];
}) {
  const byType = (t: string) => contents.filter((c) => c.type === t);
  const published = contents.filter((c) => c.is_published).length;
  const drafts = contents.length - published;
  const missingShk = contents.filter((c) => !c.title_shk || !c.description_shk).length;
  const missingMedia = contents.filter((c) => !c.media_url && c.type !== "text").length;

  const byModule = modules.map((m) => ({
    name: m.name_fr,
    count: contents.filter((c) => c.module_slug === m.slug).length,
  }));
  const orphan = contents.filter((c) => !c.module_slug).length;

  const recent = [...contents]
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .slice(0, 5);

  const stats = [
    { label: "Modules", value: modules.length, icon: LayoutDashboard, gradient: "from-indigo-500 to-violet-500" },
    { label: "Contenus", value: contents.length, icon: FileText, gradient: "from-sky-500 to-cyan-500" },
    { label: "Vidéos", value: byType("video").length, icon: Video, gradient: "from-rose-500 to-orange-500" },
    { label: "Audios", value: byType("audio").length, icon: Music, gradient: "from-emerald-500 to-teal-500" },
    { label: "Textes", value: byType("text").length, icon: FileText, gradient: "from-amber-500 to-yellow-500" },
    { label: "Images", value: byType("image").length, icon: ImageIcon, gradient: "from-fuchsia-500 to-pink-500" },
    { label: "Quiz", value: quiz.length, icon: FileText, gradient: "from-violet-500 to-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vue d'ensemble</h2>
        <p className="text-sm text-slate-500 mt-1">
          Pilotage des contenus multimédias bilingues (français / shikomori)
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.gradient} shadow-sm`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-tight text-slate-900">{s.value}</p>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Publication</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">{published}</span>
            <span className="text-sm text-slate-500">publiés</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{drafts} brouillon(s)</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Languages className="w-3 h-3" /> Bilingue
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${missingShk ? "text-rose-500" : "text-emerald-600"}`}>
              {missingShk}
            </span>
            <span className="text-sm text-slate-500">sans shikomori complet</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Médias</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${missingMedia ? "text-rose-500" : "text-emerald-600"}`}>
              {missingMedia}
            </span>
            <span className="text-sm text-slate-500">sans fichier joint</span>
          </div>
        </div>
      </div>

      {/* Modules distribution */}
      <div className="rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Répartition par module</h3>
        <div className="space-y-3">
          {byModule.map((m) => {
            const max = Math.max(1, ...byModule.map((x) => x.count));
            return (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-sm w-44 truncate text-slate-700">{m.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${(m.count / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 w-10 text-right">{m.count}</span>
              </div>
            );
          })}
          {orphan > 0 && (
            <p className="text-xs text-rose-500 mt-2">
              ⚠ {orphan} contenu(s) sans module assigné
            </p>
          )}
        </div>
      </div>

      {/* Recent */}
      <div className="rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Derniers contenus ajoutés</h3>
        <div className="space-y-1">
          {recent.length === 0 && (
            <p className="text-sm text-slate-400">Aucun contenu pour l'instant.</p>
          )}
          {recent.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">{c.type}</Badge>
                <span className="text-sm truncate text-slate-700">{c.title_fr}</span>
              </div>
              <Badge
                className={`text-[10px] ${
                  c.is_published
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {c.is_published ? "Publié" : "Brouillon"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {translations.length} clés de traduction · {quiz.length} questions
      </p>
    </div>
  );
}

/* ---------------- CONTENTS ---------------- */
export function ContentsTab({
  contents,
  modules,
  reload,
}: {
  contents: Content[];
  modules: Module[];
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [chooserStep, setChooserStep] = useState<"module" | "type">("module");
  const [chosenModule, setChosenModule] = useState<string>("");
  const [editing, setEditing] = useState<Partial<Content> | null>(null);
  const [bulkImages, setBulkImages] = useState<BulkPhoto[]>([]);
  // Galerie : upload simple sans titres ni descriptions par photo.
  const [galleryPhotoUrls, setGalleryPhotoUrls] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = contents.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterModule !== "all" && (c.module_slug || "") !== filterModule) return false;
    if (filterStatus === "published" && !c.is_published) return false;
    if (filterStatus === "draft" && c.is_published) return false;
    if (filterStatus === "missing_shk" && c.title_shk && c.description_shk) return false;
    if (search && !matchesAllTokens([c.title_fr, c.title_shk], search)) return false;
    return true;
  });

  const startNew = (type: string) => {
    setEditing({ type, is_published: true, module_slug: chosenModule || undefined });
    setBulkImages([]);
    setGalleryPhotoUrls([]);
    setChooserOpen(false);
    setOpen(true);
  };

  const openChooser = () => {
    // Conserve l'étape courante (module/type) telle qu'elle était à la fermeture
    setChooserOpen(true);
  };

  const save = async () => {
    if (!editing?.type) return;

    // ============ GALERIE — Sujet (+ photos liées) ============
    if (editing.type === "gallery_subject") {
      if (!editing.title_fr?.trim() || !editing.title_shk?.trim()) {
        toast.error("Nom du sujet requis en français et en shikomori");
        return;
      }
      const payload = {
        title_fr: editing.title_fr.trim(),
        title_shk: editing.title_shk.trim(),
        type: "gallery_subject",
        module_slug: "galerie",
        is_published: true,
      };
      let subjectId = editing.id;
      if (subjectId) {
        const { error } = await supabase.from("contents").update(payload).eq("id", subjectId);
        if (error) return toast.error(error.message);
      } else {
        const { data, error } = await supabase
          .from("contents")
          .insert(payload)
          .select("id")
          .single();
        if (error) return toast.error(error.message);
        subjectId = data!.id;
      }
      // Photos nouvellement ajoutées (toujours rattachées à ce sujet)
      if (galleryPhotoUrls.length > 0) {
        const rows = galleryPhotoUrls.map((url, idx) => ({
          title_fr: `Photo ${idx + 1}`,
          title_shk: `Picha ${idx + 1}`,
          type: "image",
          module_slug: "galerie",
          parent_id: subjectId!,
          media_url: url,
          thumbnail_url: url,
          is_published: true,
        }));
        const { error } = await supabase.from("contents").insert(rows);
        if (error) return toast.error(error.message);
      }
      toast.success(
        galleryPhotoUrls.length > 0
          ? `Sujet enregistré (+${galleryPhotoUrls.length} photo(s))`
          : "Sujet enregistré",
      );
      setOpen(false); setEditing(null); setGalleryPhotoUrls([]); reload();
      return;
    }


    // Multi-upload PHOTO : crée 1 ligne par image (avec titres et descriptions individuels)
    if (!editing.id && editing.type === "image" && bulkImages.length > 0) {
      if (!editing.parent_id) {
        toast.error("Associer à une vidéo : ce champ est obligatoire pour les photos");
        return;
      }
      const missingTitle = bulkImages.findIndex((p) => !p.title_fr.trim());
      if (missingTitle !== -1) {
        toast.error(`Photo n°${missingTitle + 1} : un titre en français est requis`);
        return;
      }
      const rows = bulkImages.map((p) => ({
        title_fr: p.title_fr.trim(),
        title_shk: p.title_shk.trim() || p.title_fr.trim(),
        description_fr: p.description_fr.trim() || null,
        description_shk: p.description_shk.trim() || null,
        type: "image",
        module_slug: editing.module_slug || null,
        parent_id: editing.parent_id!,
        media_url: p.url,
        thumbnail_url: p.url,
        is_published: editing.is_published ?? true,
      }));
      const { error } = await supabase.from("contents").insert(rows);
      if (error) return toast.error(error.message);
      toast.success(`${rows.length} photo(s) appliquée(s) à l'application`);
      const wasNew = !editing.id;
      const keepModule = editing.module_slug || chosenModule;
      setOpen(false);
      setEditing(null);
      setBulkImages([]);
      reload();
      if (wasNew && keepModule) {
        setChosenModule(keepModule);
        setChooserStep("type");
        setChooserOpen(true);
      }
      return;
    }

    // Récit (text), témoignage (audio), photo (image) : parent_id obligatoire
    if (editing.type !== "video" && !editing.parent_id) {
      const labelByType: Record<string, string> = {
        image: "photo",
        text: "récit",
        audio: "témoignage",
      };
      const label = labelByType[editing.type] ?? "ce contenu";
      toast.error(`Associer à une vidéo : ce champ est obligatoire pour ${label === "récit" ? "un récit" : label === "témoignage" ? "un témoignage" : "une photo"}`);
      return;
    }

    if (!editing.title_fr || !editing.title_shk) {
      toast.error("Titres FR + Shikomori requis");
      return;
    }
    const payload = {
      title_fr: editing.title_fr,
      title_shk: editing.title_shk,
      description_fr: editing.description_fr || null,
      description_shk: editing.description_shk || null,
      type: editing.type,
      module_slug: editing.module_slug || null,
      media_url: editing.media_url || null,
      thumbnail_url: editing.thumbnail_url || null,
      duration: editing.duration || null,
      is_published: editing.is_published ?? true,
      parent_id: editing.type !== "video" ? (editing.parent_id || null) : null,
    };
    const res = editing.id
      ? await supabase.from("contents").update(payload).eq("id", editing.id)
      : await supabase.from("contents").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Contenu appliqué à l'application");
    const wasNew = !editing.id;
    const keepModule = editing.module_slug || chosenModule;
    setOpen(false);
    setEditing(null);
    reload();
    if (wasNew && keepModule) {
      setChosenModule(keepModule);
      setChooserStep("type");
      setChooserOpen(true);
    }
  };

  const togglePublish = async (c: Content, value: boolean) => {
    const { error } = await supabase
      .from("contents")
      .update({ is_published: value })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Publié dans l'application" : "Retiré de l'application");
    reload();
  };

  const del = async (id: string) => {
    if (!(await confirmDelete({ itemLabel: "ce contenu" }))) return;
    const { error } = await supabase.from("contents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const acceptByType = (t?: string) =>
    t === "audio"
      ? "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/x-m4a"
      : t === "video"
      ? "video/*"
      : t === "image"
      ? "image/jpeg,image/jpg,image/png,image/webp"
      : undefined;

  const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
    video: { label: "Vidéo", icon: Video, color: "text-terracotta" },
    text: { label: "Récit", icon: BookOpen, color: "text-gold" },
    audio: { label: "Témoignage", icon: Music, color: "text-deep-blue" },
    image: { label: "Photo", icon: ImageIcon, color: "text-secondary" },
    gallery_subject: { label: "Sujet", icon: FolderPlus, color: "text-secondary" },
    gallery_photos: { label: "Ajouter des photos", icon: Images, color: "text-gold" },
  };

  const FILTER_CHIPS: { value: string; label: string; icon?: any }[] = [
    { value: "all", label: "Tous" },
    { value: "video", label: "Vidéos", icon: Video },
    { value: "text", label: "Récits", icon: BookOpen },
    { value: "audio", label: "Témoignages", icon: Music },
    { value: "image", label: "Photos", icon: ImageIcon },
  ];

  const deleteAllOfType = async (type: string, label: string) => {
    const items = contents.filter((c) => c.type === type);
    if (items.length === 0) return;
    const ok = await confirmDelete({
      title: `Supprimer tous les ${label.toLowerCase()}`,
      itemLabel: label.toLowerCase(),
      itemCount: items.length,
      description: `Tous les contenus de type "${label}" seront retirés de l'application.`,
      confirmLabel: `Supprimer ${items.length} ${label.toLowerCase()}`,
    });
    if (!ok) return;
    const ids = items.map((c) => c.id);
    const { error } = await supabase.from("contents").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${items.length} ${label.toLowerCase()} supprimés`);
    reload();
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Contenus ({contents.length})</h2>

        {/* Modal de choix de type */}
        <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
          <DialogTrigger asChild>
            <Button onClick={openChooser}>
              <Plus className="w-4 h-4 mr-1" /> Nouveau contenu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {chooserStep === "module" ? "1. Choisir le module" : "2. Quel type de contenu ?"}
              </DialogTitle>
            </DialogHeader>

            {chooserStep === "module" ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
                  {modules.map((m) => (
                    <button
                      key={m.slug}
                      type="button"
                      onClick={() => {
                        setChosenModule(m.slug);
                        // Galerie : un seul type possible (Sujet) — on saute l'étape "type".
                        if (m.slug === "galerie") {
                          startNew("gallery_subject");
                        } else {
                          setChooserStep("type");
                        }
                      }}
                      className="flex items-center justify-between rounded-lg border-2 border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="font-semibold text-sm">{m.name_fr}</span>
                      <span className="text-xs text-muted-foreground">{m.name_shk}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Module :{" "}
                    <span className="font-medium text-foreground">
                      {modules.find((m) => m.slug === chosenModule)?.name_fr ?? "—"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setChooserStep("module")}
                    className="text-primary hover:underline"
                  >
                    Changer
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(chosenModule === "galerie"
                    ? (["gallery_subject"] as const)
                    : (["video", "text", "audio", "image"] as const)
                  ).map((t) => {
                    const meta = TYPE_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => startNew(t)}
                        className="flex flex-col items-center gap-2 rounded-lg border-2 border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className={`p-3 rounded-full bg-muted ${meta.color}`}>
                          <meta.icon className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-sm">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal d'édition (formulaire conditionnel par type) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Modifier" : "Nouveau"} {editing?.type ? TYPE_META[editing.type]?.label.toLowerCase() : "contenu"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              {/* ============ GALERIE — Sujet (avec photos liées) ============ */}
              {editing.type === "gallery_subject" && (
                <>
                  <div>
                    <Label>Nom du sujet (Français) *</Label>
                    <Input
                      autoFocus
                      value={editing.title_fr || ""}
                      onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })}
                      placeholder="Ex. Mariage, Marché, Plantes…"
                    />
                  </div>
                  <div>
                    <Label>Nom du sujet (Shikomori) *</Label>
                    <Input
                      value={editing.title_shk || ""}
                      onChange={(e) => setEditing({ ...editing, title_shk: e.target.value })}
                      placeholder="Jina la mada kwa Shikomori"
                    />
                  </div>

                  {/* Photos existantes — uniquement en mode édition */}
                  {editing.id && (
                    <div className="space-y-2">
                      <Label>Photos déjà publiées</Label>
                      {(() => {
                        const existing = contents.filter(
                          (c) => c.type === "image" && c.parent_id === editing.id,
                        );
                        if (existing.length === 0) {
                          return (
                            <p className="text-[11px] text-muted-foreground">
                              Aucune photo pour ce sujet.
                            </p>
                          );
                        }
                        return (
                          <div className="grid grid-cols-4 gap-2">
                            {existing.map((p) => (
                              <div key={p.id} className="relative">
                                <img
                                  src={p.thumbnail_url || p.media_url || ""}
                                  alt=""
                                  className="aspect-square w-full object-cover rounded-md border border-border"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!(await confirmDelete({ itemLabel: "cette photo" }))) return;
                                    const { error } = await supabase
                                      .from("contents")
                                      .delete()
                                      .eq("id", p.id);
                                    if (error) return toast.error(error.message);
                                    toast.success("Photo supprimée");
                                    reload();
                                  }}
                                  className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-1 text-foreground shadow"
                                  aria-label="Supprimer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Ajouter de nouvelles photos */}
                  <div className="space-y-2">
                    <Label>Ajouter des photos (jpg, png, webp)</Label>
                    <input
                      id="gallery-photos-input"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setGalleryUploading(true);
                        try {
                          const urls: string[] = [];
                          for (const f of Array.from(files)) {
                            urls.push(await uploadFile(f, "contents"));
                          }
                          setGalleryPhotoUrls((prev) => [...prev, ...urls]);
                          toast.success(`${urls.length} image(s) téléversée(s)`);
                        } catch (err: any) {
                          toast.error(err?.message || "Erreur upload");
                        } finally {
                          setGalleryUploading(false);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("gallery-photos-input")?.click()}
                      disabled={galleryUploading}
                      className="w-full"
                    >
                      {galleryUploading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1" />
                      )}
                      Sélectionner les images
                    </Button>

                    {galleryPhotoUrls.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {galleryPhotoUrls.map((url, i) => (
                          <div key={i} className="relative">
                            <img
                              src={url}
                              alt=""
                              className="aspect-square w-full object-cover rounded-md border border-border"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryPhotoUrls((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-1 text-foreground shadow"
                              aria-label="Retirer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Les photos seront automatiquement liées à ce sujet.
                    </p>
                  </div>
                </>
              )}


              {/* Module + Vidéo parente (commun aux types standards uniquement) */}
              {editing.type !== "gallery_subject" && editing.type !== "gallery_photos" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Module</Label>
                  <Select
                    value={editing.module_slug || ""}
                    onValueChange={(v) => setEditing({ ...editing, module_slug: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((m) => (
                        <SelectItem key={m.slug} value={m.slug}>
                          {m.name_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editing.type !== "video" && (
                  <div>
                    <Label>
                      {editing.type === "image"
                        ? "Associer à une vidéo *"
                        : editing.type === "text"
                        ? "Vidéo parente du récit *"
                        : editing.type === "audio"
                        ? "Vidéo parente du témoignage *"
                        : "Vidéo parente *"}
                    </Label>
                    <Select
                      value={editing.parent_id || "none"}
                      onValueChange={(v) =>
                        setEditing({ ...editing, parent_id: v === "none" ? null : v })
                      }
                    >
                      <SelectTrigger
                        className={!editing.parent_id ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Choisir une vidéo (obligatoire)" />
                      </SelectTrigger>
                      <SelectContent>
                        {contents
                          .filter(
                            (c) =>
                              c.type === "video" &&
                              (!editing.module_slug || c.module_slug === editing.module_slug),
                          )
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title_fr}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {editing.type === "image"
                        ? "Une photo doit toujours être liée à une vidéo. Sans association, la publication est bloquée."
                        : editing.type === "text"
                        ? "Un récit doit toujours être rattaché à une vidéo. Sans association, la publication est bloquée."
                        : "Un témoignage doit toujours être rattaché à une vidéo. Sans association, la publication est bloquée."}
                    </p>
                    {contents.filter(
                      (c) => c.type === "video" && (!editing.module_slug || c.module_slug === editing.module_slug)
                    ).length === 0 && (
                      <p className="mt-1 text-[11px] text-destructive">
                        Aucune vidéo disponible {editing.module_slug ? "dans ce module" : ""}. Ajoutez d'abord une vidéo.
                      </p>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* ============ VIDÉO (paramètres existants conservés) ============ */}
              {editing.type === "video" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Titre (FR)</Label>
                      <Input
                        value={editing.title_fr || ""}
                        onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Titre (Shikomori)</Label>
                      <Input
                        value={editing.title_shk || ""}
                        onChange={(e) => setEditing({ ...editing, title_shk: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Description (FR)</Label>
                      <Textarea
                        value={editing.description_fr || ""}
                        onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description (Shikomori)</Label>
                      <Textarea
                        value={editing.description_shk || ""}
                        onChange={(e) => setEditing({ ...editing, description_shk: e.target.value })}
                      />
                    </div>
                  </div>
                  <MediaInput
                    label="Fichier vidéo"
                    folder="contents"
                    accept="video/*"
                    value={editing.media_url || ""}
                    onChange={(url) => setEditing({ ...editing, media_url: url })}
                  />
                  <MediaInput
                    label="Miniature (optionnel)"
                    folder="thumbnails"
                    accept="image/*"
                    value={editing.thumbnail_url || ""}
                    onChange={(url) => setEditing({ ...editing, thumbnail_url: url })}
                  />
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <Label>Durée (secondes)</Label>
                      <Input
                        type="number"
                        value={editing.duration ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, duration: parseInt(e.target.value) || null })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editing.is_published ?? true}
                        onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                      />
                      <Label>Publié</Label>
                    </div>
                  </div>
                </>
              )}

              {/* ============ RÉCIT (texte) avec éditeur riche ============ */}
              {editing.type === "text" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Titre (FR)</Label>
                      <Input
                        value={editing.title_fr || ""}
                        onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Titre (Shikomori)</Label>
                      <Input
                        value={editing.title_shk || ""}
                        onChange={(e) => setEditing({ ...editing, title_shk: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Contenu (Français)</Label>
                    <RichText
                      value={editing.description_fr || ""}
                      onChange={(html) => setEditing({ ...editing, description_fr: html })}
                      placeholder="Rédigez le récit en français…"
                    />
                  </div>
                  <div>
                    <Label>Contenu (Shikomori)</Label>
                    <RichText
                      value={editing.description_shk || ""}
                      onChange={(html) => setEditing({ ...editing, description_shk: html })}
                      placeholder="Andika kwa Shikomori…"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.is_published ?? true}
                      onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                    />
                    <Label>Publié</Label>
                  </div>
                </>
              )}

              {/* ============ TÉMOIGNAGE (audio uniquement) ============ */}
              {editing.type === "audio" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Titre (FR)</Label>
                      <Input
                        value={editing.title_fr || ""}
                        onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Titre (Shikomori)</Label>
                      <Input
                        value={editing.title_shk || ""}
                        onChange={(e) => setEditing({ ...editing, title_shk: e.target.value })}
                      />
                    </div>
                  </div>
                  <MediaInput
                    label="Fichier audio (mp3, wav, ogg, m4a)"
                    folder="contents"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/x-m4a"
                    value={editing.media_url || ""}
                    onChange={(url) => setEditing({ ...editing, media_url: url })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Description (FR)</Label>
                      <Textarea
                        value={editing.description_fr || ""}
                        onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description (Shikomori)</Label>
                      <Textarea
                        value={editing.description_shk || ""}
                        onChange={(e) => setEditing({ ...editing, description_shk: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.is_published ?? true}
                      onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                    />
                    <Label>Publié</Label>
                  </div>
                </>
              )}

              {/* ============ PHOTO (image, multi-upload en création) ============ */}
              {editing.type === "image" && (
                <>
                  {editing.id ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Titre (FR) *</Label>
                          <Input
                            value={editing.title_fr || ""}
                            onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })}
                            placeholder="Titre en français"
                          />
                        </div>
                        <div>
                          <Label>Titre (Shikomori)</Label>
                          <Input
                            value={editing.title_shk || ""}
                            onChange={(e) => setEditing({ ...editing, title_shk: e.target.value })}
                            placeholder="Titre en shikomori"
                          />
                        </div>
                      </div>
                      <MediaInput
                        label="Image (jpg, png, webp)"
                        folder="contents"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        value={editing.media_url || ""}
                        onChange={(url) =>
                          setEditing({ ...editing, media_url: url, thumbnail_url: url })
                        }
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Description (FR)</Label>
                          <Textarea
                            value={editing.description_fr || ""}
                            onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Description (Shikomori)</Label>
                          <Textarea
                            value={editing.description_shk || ""}
                            onChange={(e) => setEditing({ ...editing, description_shk: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <MultiImageInput
                      label="Photos (chaque photo a son propre titre et sa propre description)"
                      folder="contents"
                      values={bulkImages}
                      onChange={setBulkImages}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.is_published ?? true}
                      onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                    />
                    <Label>Publié</Label>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={save}>
              {editing?.type === "image" && !editing?.id && bulkImages.length > 1
                ? `Publier ${bulkImages.length} photos`
                : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filtres : chips type + recherche + module + statut */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((c) => {
            const active = filterType === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilterType(c.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {c.icon && <c.icon className="w-3.5 h-3.5" />}
                {c.label}
                <span className={`ml-1 rounded-full px-1.5 text-[10px] ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  {c.value === "all" ? contents.length : contents.filter((x) => x.type === c.value).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border border-dashed border-destructive/30 rounded-lg p-2 bg-destructive/5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Suppression en masse :</span>
          {FILTER_CHIPS.filter((c) => c.value !== "all").map((c) => {
            const count = contents.filter((x) => x.type === c.value).length;
            return (
              <Button
                key={c.value}
                size="sm"
                variant="destructive"
                disabled={count === 0}
                onClick={() => deleteAllOfType(c.value, c.label)}
                className="h-8"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Tout supprimer ({count}) — {c.label}
              </Button>
            );
          })}
        </div>




        <div className="border rounded-lg bg-card p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un titre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {modules.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name_fr}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="published">Publiés</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="missing_shk">Shikomori incomplet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} / {contents.length} contenus affichés</p>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Publié</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const meta = TYPE_META[c.type] ?? { label: c.type, icon: FileText, color: "text-muted-foreground" };
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title_fr}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="inline-flex items-center gap-1">
                      <meta.icon className={`w-3 h-3 ${meta.color}`} />
                      {meta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.module_slug || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.is_published}
                        onCheckedChange={(v) => togglePublish(c, v)}
                      />
                      <Badge variant={c.is_published ? "default" : "secondary"} className="text-[10px]">
                        {c.is_published ? "En ligne" : "Brouillon"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setBulkImages([]); setGalleryPhotoUrls([]); setOpen(true); }}>
                      <Pencil className="w-4 h-4 mr-1" /> Modifier
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del(c.id)} aria-label="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------------- GALLERY ---------------- */
export function GalleryTab({
  items,
  modules,
  reload,
}: {
  items: GalleryItem[];
  modules: Module[];
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<GalleryItem> | null>(null);

  const save = async () => {
    if (!editing?.image_url) {
      toast.error("Image requise");
      return;
    }
    const payload = {
      image_url: editing.image_url,
      caption_fr: editing.caption_fr || null,
      caption_shk: editing.caption_shk || null,
      module_slug: editing.module_slug || null,
      order_index: editing.order_index ?? items.length,
      is_published: editing.is_published ?? true,
    };
    const res = editing.id
      ? await supabase.from("gallery_items").update(payload).eq("id", editing.id)
      : await supabase.from("gallery_items").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Photo appliquée à l'application");
    setOpen(false);
    setEditing(null);
    reload();
  };

  const togglePublish = async (g: GalleryItem, value: boolean) => {
    const { error } = await supabase
      .from("gallery_items")
      .update({ is_published: value })
      .eq("id", g.id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Photo visible" : "Photo masquée");
    reload();
  };

  const del = async (id: string) => {
    if (!(await confirmDelete({ itemLabel: "cette photo" }))) return;
    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Galerie ({items.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_published: true })}>
              <Plus className="w-4 h-4 mr-1" /> Nouvelle photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Modifier" : "Nouvelle"} photo</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <MediaInput
                  label="Image"
                  folder="gallery"
                  accept="image/*"
                  value={editing.image_url || ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                />
                <div>
                  <Label>Légende (FR)</Label>
                  <Input
                    value={editing.caption_fr || ""}
                    onChange={(e) => setEditing({ ...editing, caption_fr: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Légende (Shikomori)</Label>
                  <Input
                    value={editing.caption_shk || ""}
                    onChange={(e) => setEditing({ ...editing, caption_shk: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Module (optionnel)</Label>
                  <Select
                    value={editing.module_slug || ""}
                    onValueChange={(v) => setEditing({ ...editing, module_slug: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((m) => (
                        <SelectItem key={m.slug} value={m.slug}>
                          {m.name_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={save}>Appliquer à l'application</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((g) => (
          <div key={g.id} className="border rounded-lg overflow-hidden bg-card">
            <img src={g.image_url} alt="" className="w-full h-32 object-cover" />
            <div className="p-2 space-y-2">
              <p className="text-xs truncate">{g.caption_fr || "—"}</p>
              <div className="flex items-center gap-2">
                <Switch
                  checked={g.is_published}
                  onCheckedChange={(v) => togglePublish(g, v)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {g.is_published ? "Visible" : "Masqué"}
                </span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setEditing(g); setOpen(true); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Modifier
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(g.id)} aria-label="Supprimer">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- QUIZ ---------------- */
export function QuizTab({
  items,
  modules,
  reload,
}: {
  items: QuizQuestion[];
  modules: Module[];
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<QuizQuestion> | null>(null);

  const save = async () => {
    if (!editing?.question_fr || !editing.question_shk || !editing.option_a_fr || !editing.option_b_fr) {
      toast.error("Question + 2 options minimum requis");
      return;
    }
    const payload = {
      question_fr: editing.question_fr,
      question_shk: editing.question_shk,
      option_a_fr: editing.option_a_fr,
      option_a_shk: editing.option_a_shk || editing.option_a_fr,
      option_b_fr: editing.option_b_fr,
      option_b_shk: editing.option_b_shk || editing.option_b_fr,
      option_c_fr: editing.option_c_fr || null,
      option_c_shk: editing.option_c_shk || null,
      option_d_fr: editing.option_d_fr || null,
      option_d_shk: editing.option_d_shk || null,
      correct_index: editing.correct_index ?? 0,
      explanation_fr: editing.explanation_fr || null,
      explanation_shk: editing.explanation_shk || null,
      module_slug: editing.module_slug || null,
      order_index: editing.order_index ?? items.length,
      is_published: editing.is_published ?? true,
    };
    const res = editing.id
      ? await supabase.from("quiz_questions").update(payload).eq("id", editing.id)
      : await supabase.from("quiz_questions").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Question appliquée à l'application");
    setOpen(false);
    setEditing(null);
    reload();
  };

  const togglePublish = async (q: QuizQuestion, value: boolean) => {
    const { error } = await supabase
      .from("quiz_questions")
      .update({ is_published: value })
      .eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Question publiée" : "Question retirée");
    reload();
  };

  const del = async (id: string) => {
    if (!(await confirmDelete({ itemLabel: "cette question" }))) return;
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const visibleModules = modules.filter((m) => m.slug !== "galerie");
  const selectedModule = visibleModules.find((m) => m.slug === selectedSlug) || null;
  const moduleItems = selectedSlug
    ? items.filter((q) => q.module_slug === selectedSlug)
    : [];
  const countBySlug = (slug: string) =>
    items.filter((q) => q.module_slug === slug).length;

  const toggleModuleActive = async (m: Module, value: boolean) => {
    setTogglingId(m.id);
    const { error } = await supabase
      .from("modules")
      .update({ is_active: value })
      .eq("id", m.id);
    setTogglingId(null);
    if (error) return toast.error(error.message);
    toast.success(
      value
        ? `Module « ${m.name_fr} » rendu visible`
        : `Module « ${m.name_fr} » masqué dans l'application`,
    );
    reload();
  };

  const clearModuleQuizzes = async (m: Module) => {
    const count = countBySlug(m.slug);
    if (count === 0) {
      toast.info("Aucun quiz à supprimer pour ce module");
      return;
    }
    if (
      !(await confirmDelete({
        itemLabel: `les ${count} quiz du module « ${m.name_fr} »`,
      }))
    )
      return;
    const { error } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("module_slug", m.slug);
    if (error) return toast.error(error.message);
    toast.success(`Quiz du module « ${m.name_fr} » supprimés`);
    reload();
  };

  // Vue 1 : sélection du module
  if (!selectedModule) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Quiz par module</h2>
          <p className="text-xs text-muted-foreground">
            Choisissez un module pour gérer ses questions. Utilisez l'interrupteur pour masquer
            un module dans l'application (il restera modifiable ici).
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((m) => {
            const count = countBySlug(m.slug);
            const inactive = !m.is_active;
            return (
              <div
                key={m.id}
                className={`text-left rounded-lg border bg-card p-4 transition group ${
                  inactive ? "opacity-60 border-dashed" : "hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => setSelectedSlug(m.slug)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="font-medium text-sm truncate">{m.name_fr}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.name_shk}</p>
                  </button>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {count} quiz
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedSlug(m.slug)}
                    className="text-xs text-indigo-600 group-hover:underline"
                  >
                    Gérer les quiz →
                  </button>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                      <span>{inactive ? "Masqué" : "Visible"}</span>
                      <Switch
                        checked={m.is_active}
                        disabled={togglingId === m.id}
                        onCheckedChange={(v) => toggleModuleActive(m, v)}
                        aria-label={`Rendre ${m.name_fr} ${m.is_active ? "invisible" : "visible"} dans l'application`}
                      />
                    </label>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => clearModuleQuizzes(m)}
                      disabled={count === 0}
                      title={
                        count === 0
                          ? "Aucun quiz à supprimer"
                          : `Supprimer les ${count} quiz du module`
                      }
                      aria-label={`Supprimer les quiz du module ${m.name_fr}`}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {visibleModules.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              Aucun module disponible. Créez d'abord un module.
            </p>
          )}
        </div>
      </div>
    );
  }


  // Vue 2 : quiz du module sélectionné
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSlug(null)}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Modules
          </Button>
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{selectedModule.name_fr}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {moduleItems.length} quiz
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setEditing({
                  correct_index: 0,
                  is_published: true,
                  module_slug: selectedSlug,
                })
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Créer un quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Modifier" : "Nouvelle"} question</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Question (FR)</Label>
                    <Textarea
                      value={editing.question_fr || ""}
                      onChange={(e) => setEditing({ ...editing, question_fr: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Question (Shikomori)</Label>
                    <Textarea
                      value={editing.question_shk || ""}
                      onChange={(e) => setEditing({ ...editing, question_shk: e.target.value })}
                    />
                  </div>
                </div>
                {(["a", "b", "c", "d"] as const).map((k, idx) => (
                  <div key={k} className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <Label>Option {k.toUpperCase()} (FR)</Label>
                      <Input
                        value={(editing as any)[`option_${k}_fr`] || ""}
                        onChange={(e) => setEditing({ ...editing, [`option_${k}_fr`]: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Option {k.toUpperCase()} (Shk)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={(editing as any)[`option_${k}_shk`] || ""}
                          onChange={(e) => setEditing({ ...editing, [`option_${k}_shk`]: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant={editing.correct_index === idx ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditing({ ...editing, correct_index: idx })}
                        >
                          ✓
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <Label>Module</Label>
                  <Select
                    value={editing.module_slug || ""}
                    onValueChange={(v) => setEditing({ ...editing, module_slug: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleModules.map((m) => (
                        <SelectItem key={m.slug} value={m.slug}>
                          {m.name_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={save}>Appliquer à l'application</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Publié</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moduleItems.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="max-w-md truncate">{q.question_fr}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={q.is_published}
                      onCheckedChange={(v) => togglePublish(q, v)}
                    />
                    <Badge variant={q.is_published ? "default" : "secondary"} className="text-[10px]">
                      {q.is_published ? "En ligne" : "Brouillon"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="flex gap-1 justify-end">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(q); setOpen(true); }}>
                    <Pencil className="w-4 h-4 mr-1" /> Modifier
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(q.id)} aria-label="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {moduleItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                  Aucun quiz pour ce module. Cliquez sur « Créer un quiz » pour commencer.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------------- TRANSLATIONS ---------------- */
export function TranslationsTab({ items, reload }: { items: Translation[]; reload: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, { value_fr: string; value_shk: string }>>({});
  const [previewing, setPreviewing] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Sync drafts when items change (keep unsaved edits).
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const t of items) {
        if (!next[t.id]) next[t.id] = { value_fr: t.value_fr, value_shk: t.value_shk };
      }
      return next;
    });
  }, [items]);

  // Clear all previews when leaving the tab/page.
  useEffect(() => {
    return () => {
      clearPreviewTranslations();
    };
  }, []);

  const isDirty = (t: Translation) => {
    const d = drafts[t.id];
    return d && (d.value_fr !== t.value_fr || d.value_shk !== t.value_shk);
  };

  const applyPreview = (t: Translation) => {
    const d = drafts[t.id];
    if (!d) return;
    setPreviewTranslation(t.key, d.value_fr, d.value_shk);
    setPreviewing((p) => ({ ...p, [t.id]: true }));
    toast.success("Aperçu activé — visible dans l'application");
  };

  const removePreview = (t: Translation) => {
    setPreviewTranslation(t.key, undefined, undefined);
    setPreviewing((p) => {
      const next = { ...p };
      delete next[t.id];
      return next;
    });
  };

  const save = async (t: Translation) => {
    const d = drafts[t.id];
    if (!d) return;
    setSavingId(t.id);
    const { error } = await supabase
      .from("translations")
      .update({ value_fr: d.value_fr, value_shk: d.value_shk })
      .eq("id", t.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    // Clear the preview override since the DB now has the new value.
    setPreviewTranslation(t.key, undefined, undefined);
    setPreviewing((p) => {
      const next = { ...p };
      delete next[t.id];
      return next;
    });
    toast.success("Modifications enregistrées");
    reload();
  };

  const reset = (t: Translation) => {
    setDrafts((prev) => ({
      ...prev,
      [t.id]: { value_fr: t.value_fr, value_shk: t.value_shk },
    }));
    if (previewing[t.id]) removePreview(t);
  };

  const clearAllPreviews = () => {
    clearPreviewTranslations();
    setPreviewing({});
    toast.success("Aperçus réinitialisés");
  };

  // Filter + group by screen.
  const filtered = items.filter((t) => {
    if (!filter) return true;
    return matchesAllTokens([t.key, t.value_fr, t.value_shk, t.screen], filter);
  });

  const SCREEN_LABELS: Record<string, string> = {
    splash: "Écran d'accueil (Splash)",
    nav: "Barre du bas",
    home: "Page d'accueil",
    category: "Page d'une catégorie",
    gallery: "Galerie photo",
    media: "Lecteur d'un contenu",
    pedagogical: "Espace pédagogique",
    downloads: "Téléchargements",
    favorites: "Favoris",
    settings: "Paramètres",
    foreword: "Avant-propos",
    licenses: "Licences",
    quiz: "Quiz",
    autre: "Autres",
  };

  const SECTION_LABELS: Record<string, string> = {
    splash: "Écran de démarrage",
    nav: "Onglets de navigation",
    pages: "Textes des pages",
  };

  const sectionLabel = (prefix: string) =>
    SECTION_LABELS[prefix] ??
    prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/([A-Z])/g, " $1");

  const friendlyLabel = (t: Translation) => {
    const suffix = t.key.includes(".") ? t.key.split(".").slice(-1)[0] : t.key;
    const human = suffix
      .replace(/[._-]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase();
    return human.charAt(0).toUpperCase() + human.slice(1);
  };

  const grouped = filtered.reduce<Record<string, Translation[]>>((acc, t) => {
    const k = t.screen || "autre";
    (acc[k] = acc[k] || []).push(t);
    return acc;
  }, {});

  const SCREEN_ORDER = [
    "splash",
    "nav",
    "home",
    "category",
    "gallery",
    "media",
    "pedagogical",
    "downloads",
    "favorites",
    "settings",
    "foreword",
    "licenses",
    "quiz",
  ];
  const groupOrder = Object.keys(grouped).sort((a, b) => {
    const ia = SCREEN_ORDER.indexOf(a);
    const ib = SCREEN_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const previewCount = Object.values(previewing).filter(Boolean).length;



  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold">Textes de l'interface</h2>
          <p className="text-xs text-muted-foreground">
            Modifiez un texte, cliquez sur <strong>Aperçu</strong> pour le voir dans l'application,
            puis sur <strong>Appliquer</strong> pour le diffuser dans l'application.
          </p>
        </div>
        <Input
          placeholder="Rechercher une clé ou un texte…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {previewCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span>
            <Eye className="inline w-4 h-4 mr-1 text-primary" />
            {previewCount} aperçu{previewCount > 1 ? "s" : ""} actif
            {previewCount > 1 ? "s" : ""} (non enregistré{previewCount > 1 ? "s" : ""})
          </span>
          <Button size="sm" variant="ghost" onClick={clearAllPreviews}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Tout réinitialiser
          </Button>
        </div>
      )}

      {groupOrder.length === 0 && (
        <p className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
          Aucune traduction trouvée.
        </p>
      )}

      {groupOrder.map((screen) => {
        // Sub-group rows by key prefix (the part before the first dot).
        const rows = grouped[screen];
        const sections = rows.reduce<Record<string, Translation[]>>((acc, t) => {
          const prefix = t.key.includes(".") ? t.key.split(".")[0] : t.key;
          (acc[prefix] = acc[prefix] || []).push(t);
          return acc;
        }, {});
        const sectionKeys = Object.keys(sections).sort();
        return (
          <div key={screen} className="border rounded-lg overflow-hidden bg-card">
            <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-medium text-sm">{SCREEN_LABELS[screen] ?? screen}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Textes affichés sur cette page de l'application
                </p>
              </div>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>
            {sectionKeys.map((prefix) => (
              <div key={prefix} className="border-t first:border-t-0">
                {sectionKeys.length > 1 && (
                  <div className="px-4 py-1.5 bg-muted/20 border-b">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {sectionLabel(prefix)}
                    </p>
                  </div>
                )}
                <div className="divide-y">
                  {sections[prefix].map((t) => {
                    const d = drafts[t.id] || { value_fr: t.value_fr, value_shk: t.value_shk };
                    const dirty = isDirty(t);
                    const isPreviewing = !!previewing[t.id];
                    return (
                      <div key={t.id} className="p-3 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {friendlyLabel(t)}
                          </p>
                          <div className="flex items-center gap-1">
                            {isPreviewing && (
                              <Badge className="text-[10px] bg-primary/15 text-primary hover:bg-primary/15">
                                <Eye className="w-3 h-3 mr-1" /> Aperçu
                              </Badge>
                            )}
                            {dirty && !isPreviewing && (
                              <Badge variant="outline" className="text-[10px]">
                                Modifié
                              </Badge>
                            )}
                          </div>
                        </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Français</Label>
                      <Textarea
                        value={d.value_fr}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [t.id]: { ...d, value_fr: e.target.value },
                          }))
                        }
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Shikomori</Label>
                      <Textarea
                        value={d.value_shk}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [t.id]: { ...d, value_shk: e.target.value },
                          }))
                        }
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  {(dirty || isPreviewing) && (
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => reset(t)}>
                        Annuler
                      </Button>
                      {isPreviewing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePreview(t)}
                        >
                          <EyeOff className="w-3.5 h-3.5 mr-1" /> Masquer l'aperçu
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyPreview(t)}
                          disabled={!dirty}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Aperçu
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => save(t)}
                        disabled={savingId === t.id || !dirty}
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        {savingId === t.id ? "Application…" : "Appliquer"}
                      </Button>
                    </div>
                  )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}

    </div>
  );
}
