import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

const BUCKET = "voix-de-la-lune-media";
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Au-delà de ce seuil, on bascule sur un upload résumable (TUS) qui
// supporte les gros fichiers (vidéos > 50 Mo) sans timeout de proxy.
const TUS_THRESHOLD = 6 * 1024 * 1024; // 6 Mo

export type UploadProgress = (loaded: number, total: number) => void;

function buildPath(file: File, folder: string) {
  const ext = file.name.split(".").pop() || "bin";
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function uploadResumable(file: File, path: string, onProgress?: UploadProgress): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Session expirée, reconnectez-vous.");

  return new Promise<string>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${PROJECT_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000, 20000, 30000],
      headers: {
        authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      // 6 Mo : valeur recommandée par Supabase pour le TUS resumable.
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError: (err) => reject(err),
      onProgress: (loaded, total) => onProgress?.(loaded, total),
      onSuccess: () => resolve(publicUrl(path)),
    });

    upload.findPreviousUploads().then((prev) => {
      if (prev.length > 0) upload.resumeFromPreviousUpload(prev[0]);
      upload.start();
    });
  });
}

export async function uploadFile(file: File, folder: string, onProgress?: UploadProgress): Promise<string> {
  const path = buildPath(file, folder);
  // Upload résumable TUS pour toutes les tailles : reprend automatiquement
  // en cas de coupure réseau et évite les timeouts de proxy.
  return uploadResumable(file, path, onProgress);
}
