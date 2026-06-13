import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader as Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/adminUpload";

export interface BulkPhoto {
  url: string;
  title_fr: string;
  title_shk: string;
  description_fr: string;
  description_shk: string;
}

interface Props {
  label: string;
  folder: string;
  values: BulkPhoto[];
  onChange: (photos: BulkPhoto[]) => void;
  /** Valeurs pré-remplies pour les nouvelles photos téléversées */
  defaults?: Partial<Omit<BulkPhoto, "url">>;
}

export default function MultiImageInput({ label, folder, values, onChange, defaults }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const uploaded: BulkPhoto[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadFile(f, folder);
        uploaded.push({
          url,
          title_fr: defaults?.title_fr ?? "",
          title_shk: defaults?.title_shk ?? "",
          description_fr: defaults?.description_fr ?? "",
          description_shk: defaults?.description_shk ?? "",
        });
      }
      onChange([...values, ...uploaded]);
      toast.success(`${uploaded.length} photo(s) téléversée(s)`);
    } catch (e: any) {
      toast.error(e.message || "Erreur upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const update = (i: number, patch: Partial<BulkPhoto>) =>
    onChange(values.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-1" />
        )}
        Choisir une ou plusieurs photos (jpg, png, webp)
      </Button>

      {values.length > 0 && (
        <div className="space-y-3">
          {values.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-3 space-y-2"
            >
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={p.url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-1 text-foreground shadow"
                    aria-label="Retirer cette photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Titre (FR) *</Label>
                    <Input
                      value={p.title_fr}
                      onChange={(e) => update(i, { title_fr: e.target.value })}
                      placeholder="Titre en français"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Titre (Shikomori)</Label>
                    <Input
                      value={p.title_shk}
                      onChange={(e) => update(i, { title_shk: e.target.value })}
                      placeholder="Titre en shikomori"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Description (FR)</Label>
                  <Textarea
                    rows={2}
                    value={p.description_fr}
                    onChange={(e) => update(i, { description_fr: e.target.value })}
                    placeholder="Description en français"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description (Shikomori)</Label>
                  <Textarea
                    rows={2}
                    value={p.description_shk}
                    onChange={(e) => update(i, { description_shk: e.target.value })}
                    placeholder="Description en shikomori"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
