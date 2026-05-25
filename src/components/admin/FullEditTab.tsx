import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, Music, Video, FileText, Image as ImageIcon, BookOpen, FolderOpen } from "lucide-react";

type Module = {
  id: string;
  slug: string;
  name_fr: string;
  name_shk: string;
  description_fr?: string | null;
  description_shk?: string | null;
};

type Content = {
  id: string;
  title_fr: string;
  title_shk: string;
  description_fr?: string | null;
  description_shk?: string | null;
  type: string;
  module_slug?: string | null;
  duration?: number | null;
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
};

const moduleSchema = z.object({
  name_fr: z.string().trim().min(1, "Nom FR requis").max(120),
  name_shk: z.string().trim().min(1, "Nom ShK requis").max(120),
  description_fr: z.string().max(2000).optional().nullable(),
  description_shk: z.string().max(2000).optional().nullable(),
});

const contentSchema = z.object({
  title_fr: z.string().trim().min(1, "Titre FR requis").max(200),
  title_shk: z.string().trim().min(1, "Titre ShK requis").max(200),
  description_fr: z.string().max(20000).optional().nullable(),
  description_shk: z.string().max(20000).optional().nullable(),
  duration: z
    .number({ invalid_type_error: "Durée invalide" })
    .int("Entier requis")
    .min(0, "≥ 0")
    .max(86400, "≤ 86400s")
    .nullable()
    .optional(),
});

const quizSchema = z.object({
  question_fr: z.string().trim().min(1, "Question FR requise").max(500),
  question_shk: z.string().trim().min(1, "Question ShK requise").max(500),
  option_a_fr: z.string().trim().min(1, "A FR requis").max(200),
  option_a_shk: z.string().trim().min(1, "A ShK requis").max(200),
  option_b_fr: z.string().trim().min(1, "B FR requis").max(200),
  option_b_shk: z.string().trim().min(1, "B ShK requis").max(200),
  option_c_fr: z.string().max(200).optional().nullable(),
  option_c_shk: z.string().max(200).optional().nullable(),
  option_d_fr: z.string().max(200).optional().nullable(),
  option_d_shk: z.string().max(200).optional().nullable(),
  explanation_fr: z.string().max(2000).optional().nullable(),
  explanation_shk: z.string().max(2000).optional().nullable(),
  correct_index: z.number().int().min(0).max(3),
});

const TYPE_META: Record<string, { label: string; icon: any }> = {
  audio: { label: "Audio", icon: Music },
  video: { label: "Vidéo", icon: Video },
  text: { label: "Récit / Texte", icon: FileText },
  image: { label: "Photo", icon: ImageIcon },
  gallery_subject: { label: "Sujets galerie", icon: FolderOpen },
};

const HAS_DURATION = new Set(["audio", "video"]);

function RowCard({
  title,
  badge,
  children,
  onSave,
  saving,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
        </div>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Enregistrer
        </Button>
      </div>
      {children}
    </div>
  );
}

function ModuleEditor({ m, reload }: { m: Module; reload: () => void }) {
  const [draft, setDraft] = useState(m);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Module, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    const parsed = moduleSchema.safeParse(draft);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSaving(true);
    const { error } = await supabase
      .from("modules")
      .update({
        name_fr: parsed.data.name_fr,
        name_shk: parsed.data.name_shk,
        description_fr: parsed.data.description_fr || null,
        description_shk: parsed.data.description_shk || null,
      })
      .eq("id", m.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Module enregistré");
    reload();
  };

  return (
    <RowCard title="Module" badge={m.slug} onSave={save} saving={saving}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nom (Français)</Label>
          <Input value={draft.name_fr || ""} onChange={(e) => set("name_fr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nom (Shikomori)</Label>
          <Input value={draft.name_shk || ""} onChange={(e) => set("name_shk", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description (Français)</Label>
          <Textarea value={draft.description_fr || ""} onChange={(e) => set("description_fr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description (Shikomori)</Label>
          <Textarea value={draft.description_shk || ""} onChange={(e) => set("description_shk", e.target.value)} />
        </div>
      </div>
    </RowCard>
  );
}

function ContentEditor({ c, reload }: { c: Content; reload: () => void }) {
  const [draft, setDraft] = useState(c);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Content, v: any) => setDraft((d) => ({ ...d, [k]: v }));
  const hasDuration = HAS_DURATION.has(c.type);
  const descLabel = c.type === "audio" || c.type === "video" ? "Transcription" : "Description";

  const save = async () => {
    const parsed = contentSchema.safeParse({
      title_fr: draft.title_fr,
      title_shk: draft.title_shk,
      description_fr: draft.description_fr,
      description_shk: draft.description_shk,
      duration: draft.duration === null || draft.duration === undefined ? null : Number(draft.duration),
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSaving(true);
    const payload: any = {
      title_fr: parsed.data.title_fr,
      title_shk: parsed.data.title_shk,
      description_fr: parsed.data.description_fr || null,
      description_shk: parsed.data.description_shk || null,
    };
    if (hasDuration) payload.duration = parsed.data.duration ?? null;
    const { error } = await supabase.from("contents").update(payload).eq("id", c.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Contenu enregistré");
    reload();
  };

  return (
    <RowCard
      title={draft.title_fr || draft.title_shk || "(sans titre)"}
      badge={TYPE_META[c.type]?.label || c.type}
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Titre (Français)</Label>
          <Input value={draft.title_fr || ""} onChange={(e) => set("title_fr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Titre (Shikomori)</Label>
          <Input value={draft.title_shk || ""} onChange={(e) => set("title_shk", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{descLabel} (Français)</Label>
          <Textarea
            rows={5}
            value={draft.description_fr || ""}
            onChange={(e) => set("description_fr", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{descLabel} (Shikomori)</Label>
          <Textarea
            rows={5}
            value={draft.description_shk || ""}
            onChange={(e) => set("description_shk", e.target.value)}
          />
        </div>
        {hasDuration && (
          <div className="space-y-1">
            <Label className="text-xs">Durée (secondes)</Label>
            <Input
              type="number"
              min={0}
              value={draft.duration ?? ""}
              onChange={(e) => set("duration", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        )}
      </div>
    </RowCard>
  );
}

function QuizEditor({ q, reload }: { q: QuizQuestion; reload: () => void }) {
  const [draft, setDraft] = useState(q);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof QuizQuestion, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    const parsed = quizSchema.safeParse(draft);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSaving(true);
    const { error } = await supabase
      .from("quiz_questions")
      .update({
        question_fr: parsed.data.question_fr,
        question_shk: parsed.data.question_shk,
        option_a_fr: parsed.data.option_a_fr,
        option_a_shk: parsed.data.option_a_shk,
        option_b_fr: parsed.data.option_b_fr,
        option_b_shk: parsed.data.option_b_shk,
        option_c_fr: parsed.data.option_c_fr || null,
        option_c_shk: parsed.data.option_c_shk || null,
        option_d_fr: parsed.data.option_d_fr || null,
        option_d_shk: parsed.data.option_d_shk || null,
        explanation_fr: parsed.data.explanation_fr || null,
        explanation_shk: parsed.data.explanation_shk || null,
        correct_index: parsed.data.correct_index,
      })
      .eq("id", q.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Question enregistrée");
    reload();
  };

  return (
    <RowCard
      title={draft.question_fr || draft.question_shk || "(question)"}
      badge="Quiz"
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Question (Français)</Label>
          <Textarea rows={2} value={draft.question_fr || ""} onChange={(e) => set("question_fr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Question (Shikomori)</Label>
          <Textarea rows={2} value={draft.question_shk || ""} onChange={(e) => set("question_shk", e.target.value)} />
        </div>
        {(["a", "b", "c", "d"] as const).map((k, idx) => (
          <div key={k} className="grid grid-cols-2 gap-2 md:col-span-2">
            <div className="space-y-1">
              <Label className="text-xs">
                Option {k.toUpperCase()} (FR) {draft.correct_index === idx && <span className="text-primary">✓</span>}
              </Label>
              <Input
                value={(draft as any)[`option_${k}_fr`] || ""}
                onChange={(e) => set(`option_${k}_fr` as any, e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Option {k.toUpperCase()} (ShK)</Label>
              <Input
                value={(draft as any)[`option_${k}_shk`] || ""}
                onChange={(e) => set(`option_${k}_shk` as any, e.target.value)}
              />
            </div>
          </div>
        ))}
        <div className="space-y-1">
          <Label className="text-xs">Bonne réponse</Label>
          <Select
            value={String(draft.correct_index ?? 0)}
            onValueChange={(v) => set("correct_index", Number(v))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">A</SelectItem>
              <SelectItem value="1">B</SelectItem>
              <SelectItem value="2">C</SelectItem>
              <SelectItem value="3">D</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1" />
        <div className="space-y-1">
          <Label className="text-xs">Explication (Français)</Label>
          <Textarea
            rows={3}
            value={draft.explanation_fr || ""}
            onChange={(e) => set("explanation_fr", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Explication (Shikomori)</Label>
          <Textarea
            rows={3}
            value={draft.explanation_shk || ""}
            onChange={(e) => set("explanation_shk", e.target.value)}
          />
        </div>
      </div>
    </RowCard>
  );
}

export default function FullEditTab({
  modules,
  contents,
  quiz,
  reload,
}: {
  modules: Module[];
  contents: Content[];
  quiz: QuizQuestion[];
  reload: () => void;
}) {
  const [slug, setSlug] = useState<string>(modules[0]?.slug ?? "");
  const currentModule = useMemo(() => modules.find((m) => m.slug === slug), [modules, slug]);
  const moduleContents = useMemo(
    () => contents.filter((c) => c.module_slug === slug),
    [contents, slug],
  );
  const moduleQuiz = useMemo(
    () => quiz.filter((q) => q.module_slug === slug),
    [quiz, slug],
  );

  const grouped = useMemo(() => {
    const g: Record<string, Content[]> = {};
    moduleContents.forEach((c) => {
      (g[c.type] ||= []).push(c);
    });
    return g;
  }, [moduleContents]);

  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun module disponible.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h2 className="font-semibold">Édition complète</h2>
          <p className="text-xs text-muted-foreground">
            Tous les champs FR / Shikomori modifiables, sauvegarde immédiate avec validation.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Select value={slug} onValueChange={setSlug}>
            <SelectTrigger><SelectValue placeholder="Choisir un module" /></SelectTrigger>
            <SelectContent>
              {modules.map((m) => (
                <SelectItem key={m.id} value={m.slug}>{m.name_fr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentModule && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <BookOpen className="w-4 h-4" /> Informations du module
          </h3>
          <ModuleEditor key={currentModule.id} m={currentModule} reload={reload} />
        </section>
      )}

      {Object.keys(grouped).length > 0 &&
        Object.entries(grouped).map(([type, items]) => {
          const Meta = TYPE_META[type];
          const Icon = Meta?.icon || FileText;
          return (
            <section key={type} className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                <Icon className="w-4 h-4" /> {Meta?.label || type} ({items.length})
              </h3>
              <div className="space-y-3">
                {items.map((c) => (
                  <ContentEditor key={c.id} c={c} reload={reload} />
                ))}
              </div>
            </section>
          );
        })}

      {moduleQuiz.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <FileText className="w-4 h-4" /> Quiz ({moduleQuiz.length})
          </h3>
          <div className="space-y-3">
            {moduleQuiz.map((q) => (
              <QuizEditor key={q.id} q={q} reload={reload} />
            ))}
          </div>
        </section>
      )}

      {moduleContents.length === 0 && moduleQuiz.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun contenu pour ce module.</p>
      )}
    </div>
  );
}
