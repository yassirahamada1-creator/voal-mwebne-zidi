/**
 * GalleryTab — page dédiée à la gestion du module "Galerie".
 * Permet uniquement de gérer des SUJETS et leurs PHOTOS (pas de vidéo).
 * Chaque sujet peut être rendu visible/invisible (cascade sur ses photos).
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader as Loader2, X, Images, Eye, EyeOff, Search } from "lucide-react";
import { uploadFile } from "@/lib/adminUpload";
import { confirmDelete } from "@/components/admin/ConfirmDeleteDialog";

type Content = {
  id: string;
  title_fr: string;
  title_shk: string;
  type: string;
  module_slug?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  parent_id?: string | null;
  is_published: boolean;
  created_at?: string;
};

type Subject = {
  id: string;
  title_fr: string;
  title_shk: string;
  is_published: boolean;
  photos: Content[];
};

interface Props {
  contents: Content[];
  reload: () => void;
}

export default function GalleryTab({ contents, reload }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Subject> | null>(null);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const subjects: Subject[] = useMemo(() => {
    const subs = contents.filter(
      (c) => c.type === "gallery_subject" && c.module_slug === "galerie",
    );
    return subs
      .map((s) => ({
        id: s.id,
        title_fr: s.title_fr,
        title_shk: s.title_shk,
        is_published: s.is_published,
        photos: contents.filter(
          (c) => c.type === "image" && c.parent_id === s.id,
        ),
      }))
      .sort((a, b) => a.title_fr.localeCompare(b.title_fr, "fr"));
  }, [contents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.title_fr.toLowerCase().includes(q) ||
        s.title_shk.toLowerCase().includes(q),
    );
  }, [subjects, search]);

  const startNew = () => {
    setEditing({ is_published: true });
    setNewPhotoUrls([]);
    setOpen(true);
  };

  const startEdit = (s: Subject) => {
    setEditing(s);
    setNewPhotoUrls([]);
    setOpen(true);
  };

  const handlePickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadFile(f, "contents"));
      }
      setNewPhotoUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) téléversée(s)`);
    } catch (err: any) {
      toast.error(err?.message || "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    const titleFr = (editing.title_fr || "").trim();
    const titleShk = (editing.title_shk || "").trim();
    if (!titleFr || !titleShk) {
      toast.error("Nom du sujet requis en français et en shikomori");
      return;
    }
    setSaving(true);
    try {
      let subjectId = editing.id;
      const payload = {
        title_fr: titleFr,
        title_shk: titleShk,
        type: "gallery_subject",
        module_slug: "galerie",
        is_published: editing.is_published ?? true,
      };
      if (subjectId) {
        const { error } = await supabase
          .from("contents")
          .update(payload)
          .eq("id", subjectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("contents")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        subjectId = data!.id;
      }
      if (newPhotoUrls.length > 0) {
        const rows = newPhotoUrls.map((url, idx) => ({
          title_fr: `Photo ${idx + 1}`,
          title_shk: `Picha ${idx + 1}`,
          type: "image",
          module_slug: "galerie",
          parent_id: subjectId!,
          media_url: url,
          thumbnail_url: url,
          is_published: payload.is_published,
        }));
        const { error } = await supabase.from("contents").insert(rows);
        if (error) throw error;
      }
      toast.success(
        newPhotoUrls.length > 0
          ? `Sujet enregistré (+${newPhotoUrls.length} photo(s))`
          : "Sujet enregistré",
      );
      setOpen(false);
      setEditing(null);
      setNewPhotoUrls([]);
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (s: Subject, value: boolean) => {
    // Cascade : on bascule le sujet ET ses photos pour que l'app
    // masque tout en un seul geste.
    const [r1, r2] = await Promise.all([
      supabase.from("contents").update({ is_published: value }).eq("id", s.id),
      s.photos.length > 0
        ? supabase
            .from("contents")
            .update({ is_published: value })
            .in(
              "id",
              s.photos.map((p) => p.id),
            )
        : Promise.resolve({ error: null } as any),
    ]);
    if (r1.error || (r2 as any).error) {
      toast.error((r1.error || (r2 as any).error).message);
      return;
    }
    toast.success(value ? "Sujet visible" : "Sujet masqué");
    reload();
  };

  const deletePhoto = async (id: string) => {
    if (!(await confirmDelete({ itemLabel: "cette photo" }))) return;
    const { error } = await supabase.from("contents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Photo supprimée");
    reload();
  };

  const deleteSubject = async (s: Subject) => {
    if (
      !(await confirmDelete({
        itemLabel: `le sujet « ${s.title_fr} » et ses ${s.photos.length} photo(s)`,
      }))
    )
      return;
    // Supprime d'abord les photos enfants
    if (s.photos.length > 0) {
      const { error } = await supabase
        .from("contents")
        .delete()
        .in(
          "id",
          s.photos.map((p) => p.id),
        );
      if (error) return toast.error(error.message);
    }
    const { error } = await supabase.from("contents").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Sujet supprimé");
    reload();
  };

  // Photos déjà publiées pour le sujet en cours d'édition
  const existingPhotos = useMemo(() => {
    if (!editing?.id) return [];
    return contents.filter(
      (c) => c.type === "image" && c.parent_id === editing.id,
    );
  }, [contents, editing?.id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Images className="w-4 h-4 text-secondary" />
            Galerie — Sujets ({subjects.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cette page gère uniquement les sujets de la Galerie et leurs photos.
            Pas de vidéo : chaque sujet contient des images.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="w-4 h-4 mr-1" /> Nouveau sujet
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un sujet…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          {search.trim()
            ? "Aucun sujet ne correspond à votre recherche."
            : "Aucun sujet pour l'instant. Créez-en un !"}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const cover = s.photos[0];
            return (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
              >
                <div className="aspect-video w-full bg-muted relative">
                  {cover ? (
                    <img
                      src={cover.thumbnail_url || cover.media_url || ""}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Images className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium border border-border">
                    {s.photos.length} photo
                    {s.photos.length > 1 ? "s" : ""}
                  </span>
                  {!s.is_published && (
                    <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium border border-border flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Masqué
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2 flex-1 flex flex-col">
                  <div>
                    <p className="font-medium text-sm">{s.title_fr}</p>
                    <p className="text-xs text-muted-foreground">{s.title_shk}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={s.is_published}
                      onCheckedChange={(v) => toggleVisible(s, v)}
                      aria-label="Visibilité du sujet"
                    />
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      {s.is_published ? (
                        <>
                          <Eye className="w-3 h-3" /> Visible dans l'app
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Masqué
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => startEdit(s)}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Modifier
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSubject(s)}
                      aria-label="Supprimer le sujet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Modifier le sujet" : "Nouveau sujet"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nom du sujet (Français) *</Label>
                <Input
                  autoFocus
                  value={editing.title_fr || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title_fr: e.target.value })
                  }
                  placeholder="Ex. Mariage, Marché, Plantes…"
                />
              </div>
              <div>
                <Label>Nom du sujet (Shikomori) *</Label>
                <Input
                  value={editing.title_shk || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title_shk: e.target.value })
                  }
                  placeholder="Jina la mada kwa Shikomori"
                />
              </div>

              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
                <Switch
                  checked={editing.is_published ?? true}
                  onCheckedChange={(v) =>
                    setEditing({ ...editing, is_published: v })
                  }
                />
                <div className="text-sm">
                  <p className="font-medium">
                    {editing.is_published ?? true
                      ? "Sujet visible"
                      : "Sujet masqué"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Désactivez pour cacher ce sujet (et ses photos) dans l'app.
                  </p>
                </div>
              </div>

              {editing.id && (
                <div className="space-y-2">
                  <Label>
                    Photos déjà publiées ({existingPhotos.length})
                  </Label>
                  {existingPhotos.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Aucune photo pour ce sujet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {existingPhotos.map((p) => (
                        <div key={p.id} className="relative">
                          <img
                            src={p.thumbnail_url || p.media_url || ""}
                            alt=""
                            className="aspect-square w-full object-cover rounded-md border border-border"
                            loading="lazy"
                          />
                          <button
                            type="button"
                            onClick={() => deletePhoto(p.id)}
                            className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-1 text-foreground shadow"
                            aria-label="Supprimer cette photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Ajouter des photos (jpg, png, webp)</Label>
                <input
                  id="gallery-tab-photos-input"
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handlePickFiles(e.target.files);
                    (e.target as HTMLInputElement).value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("gallery-tab-photos-input")
                      ?.click()
                  }
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-1" />
                  )}
                  Sélectionner les images
                </Button>

                {newPhotoUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {newPhotoUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img
                          src={url}
                          alt=""
                          className="aspect-square w-full object-cover rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewPhotoUrls((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-1 text-foreground shadow"
                          aria-label="Retirer cette photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Les photos seront automatiquement liées à ce sujet et
                  synchronisées avec l'application.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={save} disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Appliquer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
