// Hook d'observation de la file de téléchargement globale.
import { useEffect, useState } from "react";
import {
  DownloadJob,
  QUEUE_CHANGED_EVENT,
  listJobs,
  getJob,
} from "@/lib/downloadQueue";

export function useDownloadQueue(): DownloadJob[] {
  const [jobs, setJobs] = useState<DownloadJob[]>(() => listJobs());
  useEffect(() => {
    const refresh = () => setJobs([...listJobs()]);
    window.addEventListener(QUEUE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, refresh);
  }, []);
  return jobs;
}

export function useDownloadJob(id: string | null | undefined): DownloadJob | null {
  const [job, setJob] = useState<DownloadJob | null>(() => (id ? getJob(id) : null));
  useEffect(() => {
    if (!id) { setJob(null); return; }
    const refresh = () => setJob(getJob(id));
    refresh();
    window.addEventListener(QUEUE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, refresh);
  }, [id]);
  return job;
}
