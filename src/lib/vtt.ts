/**
 * Génère un data: URL VTT à partir d'un texte unique (utile quand on n'a pas
 * de fichier .vtt mais juste une légende/résumé bilingue).
 */
export function buildSimpleVtt(text: string, durationSec = 600): string {
  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return `${h}:${m}:${sec}.000`;
  };
  const safe = (text || "").replace(/\r?\n/g, " ").trim();
  const vtt = `WEBVTT\n\n1\n${fmt(0)} --> ${fmt(durationSec)}\n${safe}\n`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

export type VideoSubtitle = {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
};
