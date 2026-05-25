// Téléchargement individuel via la file d'attente globale (pause/cancel possible).
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CACHE_CHANGED_EVENT,
  hasAllMedia,
  removeMediaUrls,
} from "@/lib/offlineStore";
import {
  enqueueJob,
  QUEUE_CHANGED_EVENT,
  getJob,
} from "@/lib/downloadQueue";

interface Options {
  /** Identifiant stable du contenu (ex: content.id). Requis pour la file. */
  id?: string;
  titleFr?: string;
  titleShi?: string;
  thumbnailUrl?: string;
}

export function useContentDownload(
  urls: (string | null | undefined)[],
  opts: Options = {},
) {
  const list = urls.filter(Boolean) as string[];
  const key = list.join("|");
  const jobId = opts.id ?? key;
  const [cached, setCached] = useState(false);
  const [tick, setTick] = useState(0);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  const refresh = useCallback(async () => {
    const ok = await hasAllMedia(list);
    if (alive.current) setCached(ok);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refresh(); }, [refresh]);

  // Suivi du job dans la file
  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(QUEUE_CHANGED_EVENT, onChange);
    window.addEventListener(CACHE_CHANGED_EVENT, () => { refresh(); onChange(); });
    return () => {
      window.removeEventListener(QUEUE_CHANGED_EVENT, onChange);
    };
  }, [refresh]);

  const job = getJob(jobId);
  const downloading = job?.status === "downloading" || job?.status === "queued";
  const paused = job?.status === "paused";
  const progress = job ? (job.total ? job.done / job.total : 0) : 0;

  const download = useCallback(async () => {
    if (!list.length) return { ok: 0, failed: 0 };
    enqueueJob({
      id: jobId,
      titleFr: opts.titleFr ?? "",
      titleShi: opts.titleShi ?? "",
      thumbnailUrl: opts.thumbnailUrl,
      urls: list,
    });
    return { ok: 0, failed: 0 };
  }, [key, jobId, opts.titleFr, opts.titleShi, opts.thumbnailUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = useCallback(async () => {
    await removeMediaUrls(list);
    await refresh();
  }, [key, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // tick is referenced to keep state subscription
  void tick;

  return {
    cached,
    downloading,
    paused,
    progress,
    download,
    remove,
    hasMedia: list.length > 0,
    job,
  };
}
