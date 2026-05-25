/**
 * HowlerAudioPlayer — lecteur audio basé sur Howler.js avec UI personnalisée.
 * Palette terreuse & dorée, responsive, optimisé mobile bas de gamme.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Howl } from "howler";
import "@/styles/howler-player.css";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Repeat,
} from "lucide-react";
import { biStr } from "@/lib/bilingual";

export type HowlerAudioPlayerProps = {
  src: string;
  format?: string; // ex: "mp3", "m4a"
  ariaLabel?: string;
  className?: string;
};

const fmtTime = (s: number): string => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const guessFormat = (src: string): string | undefined => {
  const m = src.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return m?.[1]?.toLowerCase();
};

const HowlerAudioPlayer = ({
  src,
  format,
  ariaLabel,
  className = "",
}: HowlerAudioPlayerProps) => {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise Howl à chaque changement de source
  useEffect(() => {
    if (!src) return;
    setReady(false);
    setError(null);
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);

    const fmt = format ?? guessFormat(src);
    // Pour les blob:/data: sans extension, on fournit une liste de formats à essayer
    const formats = fmt ? [fmt] : ["mp3", "m4a", "aac", "wav", "ogg", "webm"];
    const howl = new Howl({
      src: [src],
      format: formats,
      html5: true, // streaming + supporte blob: et gros fichiers
      preload: true,
      volume,
      loop,
      onload: () => {
        setDuration(howl.duration());
        setReady(true);
      },
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => {
        setIsPlaying(false);
        setPosition(0);
      },
      onend: () => {
        if (!howl.loop()) {
          setIsPlaying(false);
          setPosition(0);
        }
      },
      onloaderror: () => setError(biStr("Lecture impossible.", "Haiwezekani kusikiliza.")),
      onplayerror: () => setError(biStr("Lecture impossible.", "Haiwezekani kusikiliza.")),
    });
    howlRef.current = howl;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        howl.stop();
        howl.unload();
      } catch {
        /* noop */
      }
      howlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, format]);

  // Boucle de mise à jour de la position
  useEffect(() => {
    const tick = () => {
      const h = howlRef.current;
      if (h && h.playing()) {
        setPosition(h.seek() as number);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying]);

  // Sync volume / mute / loop
  useEffect(() => {
    howlRef.current?.volume(muted ? 0 : volume);
  }, [volume, muted]);
  useEffect(() => {
    howlRef.current?.loop(loop);
  }, [loop]);

  const togglePlay = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    if (h.playing()) h.pause();
    else h.play();
  }, []);

  const stop = useCallback(() => {
    howlRef.current?.stop();
  }, []);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    howlRef.current?.seek(v);
    setPosition(v);
  }, []);

  const onVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (v > 0 && muted) setMuted(false);
  }, [muted]);

  const progressPct = duration > 0 ? (position / duration) * 100 : 0;
  const volumePct = (muted ? 0 : volume) * 100;

  return (
    <div
      className={`howler-player rounded-2xl border border-secondary/30 p-4 sm:p-5 shadow-md ${className}`}
      style={{
        background:
          "linear-gradient(135deg, hsl(28 35% 14%) 0%, hsl(30 40% 18%) 60%, hsl(35 45% 22%) 100%)",
        color: "hsl(40 60% 92%)",
      }}
      role="region"
      aria-label={ariaLabel ?? biStr("Lecteur audio", "Kichezeo cha sauti")}
    >
      {error ? (
        <p className="text-sm text-center py-2" style={{ color: "hsl(20 80% 75%)" }}>
          {error}
        </p>
      ) : null}

      {/* Barre de progression */}
      <div className="flex items-center gap-3">
        <span
          className="text-[11px] tabular-nums w-10 text-right opacity-80"
          aria-hidden="true"
        >
          {fmtTime(position)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={position}
          onChange={onSeek}
          disabled={!ready}
          aria-label={biStr("Position de lecture", "Nafasi ya kusikiliza")}
          className="howler-range flex-1"
          style={{
            background: `linear-gradient(to right, hsl(40 75% 55%) 0%, hsl(40 75% 55%) ${progressPct}%, hsl(30 25% 35%) ${progressPct}%, hsl(30 25% 35%) 100%)`,
          }}
        />
        <span
          className="text-[11px] tabular-nums w-10 opacity-80"
          aria-hidden="true"
        >
          {fmtTime(duration)}
        </span>
      </div>

      {/* Contrôles */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={
              isPlaying
                ? biStr("Pause", "Simamisha")
                : biStr("Lecture", "Sikiliza")
            }
            className="inline-flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
            style={{
              backgroundColor: "hsl(40 75% 55%)",
              color: "hsl(28 50% 12%)",
            }}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={stop}
            disabled={!ready}
            aria-label={biStr("Arrêter", "Komesha")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
            style={{
              borderColor: "hsl(40 60% 60% / 0.4)",
              color: "hsl(40 60% 90%)",
              backgroundColor: "hsl(30 30% 18% / 0.6)",
            }}
          >
            <Square className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setLoop((v) => !v)}
            aria-pressed={loop}
            aria-label={biStr("Lecture en boucle", "Rudia kusikiliza")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              borderColor: loop
                ? "hsl(40 75% 55%)"
                : "hsl(40 60% 60% / 0.4)",
              color: loop ? "hsl(40 75% 60%)" : "hsl(40 60% 90%)",
              backgroundColor: loop
                ? "hsl(40 75% 55% / 0.15)"
                : "hsl(30 30% 18% / 0.6)",
            }}
          >
            <Repeat className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 min-w-[140px] flex-1 justify-end">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={
              muted
                ? biStr("Activer le son", "Washa sauti")
                : biStr("Couper le son", "Zima sauti")
            }
            aria-pressed={muted}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: "hsl(40 60% 90%)" }}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={onVolume}
            aria-label={biStr("Volume", "Kiwango cha sauti")}
            className="howler-range howler-range--small flex-1 max-w-[140px]"
            style={{
              background: `linear-gradient(to right, hsl(40 75% 55%) 0%, hsl(40 75% 55%) ${volumePct}%, hsl(30 25% 35%) ${volumePct}%, hsl(30 25% 35%) 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HowlerAudioPlayer;
