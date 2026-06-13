import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/adminUpload";

interface Props {
  label: string;
  folder: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
}

export default function MediaInput({ label, folder, accept, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadFile(file, folder, (loaded, total) => {
        setProgress(total > 0 ? Math.round((loaded / total) * 100) : 0);
      });
      onChange(url);
      toast.success("Fichier téléversé");
    } catch (e: any) {
      toast.error(e.message || "Erreur upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Tabs defaultValue="upload">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="upload">
            <Upload className="w-3 h-3 mr-1" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="w-3 h-3 mr-1" /> URL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
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
            {uploading ? `Téléversement… ${progress}%` : "Choisir un fichier"}
          </Button>
          {uploading && (
            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="url">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
          />
        </TabsContent>
      </Tabs>
      {value && (
        <p className="text-xs text-muted-foreground truncate">📎 {value}</p>
      )}
    </div>
  );
}
