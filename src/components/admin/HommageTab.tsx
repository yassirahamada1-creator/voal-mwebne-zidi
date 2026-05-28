import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Flower2, Eye, EyeOff } from "lucide-react";
import MediaInput from "./MediaInput";

type Hommage = {
  id: string;
  is_visible: boolean;
  title: string;
  subtitle: string;
  photo_url: string | null;
  photo_caption: string;
  display_name: string;
  birth_date: string;
  parcours: string;
  engagement: string;
  talents: string;
  liens: string;
  derniers_mots: string;
  derniers_mots_note: string;
  famille_retient: string;
  hommage_global: string;
  invocation_ar: string;
  invocation_translit: string;
  invocation_fr: string;
  footer_note: string;
};

const FIELDS: { key: keyof Hommage; label: string; type: "input" | "textarea"; rows?: number }[] = [
  { key: "title", label: "Titre de la page", type: "input" },
  { key: "subtitle", label: "Sous-titre", type: "input" },
  { key: "photo_caption", label: "Légende sous la photo", type: "input" },
  { key: "display_name", label: "Nom affiché", type: "input" },
  { key: "birth_date", label: "Date (de naissance)", type: "input" },
  { key: "parcours", label: "Parcours", type: "textarea", rows: 4 },
  { key: "engagement", label: "Son engagement professionnel", type: "textarea", rows: 4 },
  { key: "talents", label: "Talents & savoir-faire", type: "textarea", rows: 4 },
  { key: "liens", label: "Ses liens", type: "textarea", rows: 4 },
  { key: "derniers_mots", label: "Ses derniers mots", type: "textarea", rows: 3 },
  { key: "derniers_mots_note", label: "Note sous les derniers mots", type: "textarea", rows: 2 },
  { key: "famille_retient", label: "Ce que la famille retient d'elle", type: "textarea", rows: 4 },
  { key: "hommage_global", label: "Hommage à toutes les victimes (encadré violet)", type: "textarea", rows: 5 },
  { key: "invocation_ar", label: "Invocation (arabe)", type: "input" },
  { key: "invocation_translit", label: "Translittération", type: "input" },
  { key: "invocation_fr", label: "Traduction française", type: "input" },
  { key: "footer_note", label: "Note de bas de page", type: "input" },
];

export default function HommageTab() {
  const [data, setData] = useState<Hommage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hommage_content")
      .select("*")
      .eq("id", "main")
      .maybeSingle();
    if (error) toast.error(error.message);
    if (data) setData(data as Hommage);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase
      .from("hommage_content")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", "main");
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Hommage mis à jour");
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const update = <K extends keyof Hommage>(k: K, v: Hommage[K]) =>
    setData((prev) => (prev ? { ...prev, [k]: v } : prev));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2.5 shadow-sm">
          <Flower2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Page Hommage</h2>
          <p className="text-xs text-slate-500">
            Modifiez le contenu affiché aux utilisateurs. Les sections restent fixes.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.is_visible ? (
            <Eye className="w-5 h-5 text-emerald-600" />
          ) : (
            <EyeOff className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <div className="text-sm font-medium text-slate-900">
              Visibilité de la page
            </div>
            <div className="text-xs text-slate-500">
              {data.is_visible
                ? "Page visible dans l'application"
                : "Page masquée dans l'application"}
            </div>
          </div>
        </div>
        <Switch
          checked={data.is_visible}
          onCheckedChange={(c) => update("is_visible", c)}
        />
      </div>


      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <MediaInput
          label="Photo"
          folder="hommage"
          accept="image/*"
          value={data.photo_url ?? ""}
          onChange={(url) => update("photo_url", url)}
        />
        {data.photo_url && (
          <div className="mx-auto w-40 aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={data.photo_url} alt="Aperçu" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.type === "input" ? (
              <Input
                id={f.key}
                value={(data[f.key] as string) ?? ""}
                onChange={(e) => update(f.key, e.target.value as never)}
                dir={f.key === "invocation_ar" ? "rtl" : "ltr"}
              />
            ) : (
              <Textarea
                id={f.key}
                rows={f.rows ?? 4}
                value={(data[f.key] as string) ?? ""}
                onChange={(e) => update(f.key, e.target.value as never)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
