/**
 * VideoPlayer — Lecteur vidéo auto-contenu, élégant et ergonomique.
 *
 * Palette inspirée du drapeau de l'Union des Comores (scopée localement) :
 *   bg #0D2B1A · surface #1B3A28 · accent primaire #1B7A3E
 *   accent secondaire / progress #F5C518 · highlight #C0392B
 *   textes #FFFFFF / #A8C5B0 / #5C8A6A
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { StatusBar, Style } from "@capacitor/status-bar";

export type VideoSubtitle = {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
};

export type VideoPlayerProps = {
  src: string;
  poster?: string;
  ariaLabel?: string;
  subtitles?: VideoSubtitle[];
  className?: string;
};

/* ── Palette ─────────────────────────────────────────────────────────── */
const C = {
  bg: "#0D2B1A",
  surface: "#1B3A28",
  primary: "#1B7A3E",
  accent: "#F5C518",
  text: "#FFFFFF",
  text2: "#A8C5B0",
  text3: "#5C8A6A",
};

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const showToast = (msg: string) =>
  toast(msg, {
    style: {
      background: C.surface,
      color: C.accent,
      border: `1px solid ${C.accent}55`,
    },
  });

/* ===================================================================== *
 *  Composant principal
 * ===================================================================== */
const VideoPlayer = ({ src, poster, ariaLabel, subtitles = [], className = "" }: VideoPlayerProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoHostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const lastSaveRef = useRef(0);

  /* ── Persistance temps de lecture / volume ─────────────────────── */
  const storageKey = `vp:${src}`;
  const volKey = `vp:volume`;

  /* ── Création / destruction de la <video> ──────────────────────── */
  useLayoutEffect(() => {
    const host = videoHostRef.current!;

    const v = document.createElement("video");
    v.src = src;
    if (poster) v.poster = poster;
    v.playsInline = true;
    v.preload = "auto";
    v.controls = false;
    Object.assign(v.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      background: "#000",
      display: "block",
    });
    host.appendChild(v);
    videoRef.current = v;

    // Restauration volume
    try {
      const vol = parseFloat(localStorage.getItem(volKey) || "1");
      if (Number.isFinite(vol)) {
        v.volume = Math.max(0, Math.min(1, vol));
        setVolume(v.volume);
      }
    } catch {}

    // Restauration position exacte
    const restore = () => {
      try {
        const saved = parseFloat(localStorage.getItem(storageKey) || "");
        if (Number.isFinite(saved) && saved > 0 && (!v.duration || saved < v.duration - 0.5)) {
          v.currentTime = saved;
          setCurrentTime(saved);
        }
      } catch {}
    };
    if (v.readyState >= 1) restore();
    else v.addEventListener("loadedmetadata", restore, { once: true });

    setPlaying(!v.paused);
    setCurrentTime(v.currentTime || 0);
    setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    setMuted(v.muted);

    const persist = (t: number) => {
      try {
        localStorage.setItem(storageKey, String(t));
      } catch {}
    };

    const onTime = () => {
      const t = v.currentTime;
      if (Math.abs(t - lastSaveRef.current) >= 0.45) {
        lastSaveRef.current = t;
        setCurrentTime(t);
        persist(t);
      }
    };
    const onDur = () => setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      persist(v.currentTime);
    };
    const onVol = () => {
      setMuted(v.muted);
      setVolume(v.volume);
      try {
        localStorage.setItem(volKey, String(v.volume));
      } catch {}
    };
    const onEnded = () => {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("ended", onEnded);

    return () => {
      persist(v.currentTime);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("ended", onEnded);
      v.pause();
      v.src = "";
      host.innerHTML = "";
      videoRef.current = null;
    };
  }, [src, poster, storageKey, volKey]);

  /* ── Sauvegarde supplémentaire au déchargement page ────────────── */
  useEffect(() => {
    const onBeforeUnload = () => {
      const v = videoRef.current;
      if (!v) return;
      try {
        localStorage.setItem(storageKey, String(v.currentTime));
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onBeforeUnload);
    };
  }, [storageKey]);

  /* ── Auto-hide contrôles ────────────────────────────────────────── */
  const hideT = useRef<number | null>(null);
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideT.current) window.clearTimeout(hideT.current);
    hideT.current = window.setTimeout(() => setControlsVisible(false), 3000);
  }, []);
  useEffect(() => {
    showControls();
    return () => {
      if (hideT.current) window.clearTimeout(hideT.current);
    };
  }, [showControls]);

  /* ── Fullscreen + Orientation + StatusBar ───────────────────────── */
  useEffect(() => {
    const onFs = async () => {
      const isFs = !!document.fullscreenElement;
      setFullscreen(isFs);

      try {
        if (isFs) {
          // Plein écran : paysage + cacher la status bar
          await ScreenOrientation.lock({ orientation: "landscape" });
          await StatusBar.hide();
        } else {
          // Sortie plein écran : portrait + restaurer la status bar
          await ScreenOrientation.unlock();
          await StatusBar.show();
          await StatusBar.setStyle({ style: Style.Dark });
        }
      } catch {
        // Silencieux sur navigateur desktop
      }
    };

    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      // Nettoyage au démontage du composant
      ScreenOrientation.unlock().catch(() => {});
      StatusBar.show().catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  };

  /* ── Actions lecteur ────────────────────────────────────────────── */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
    showControls();
  };

  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    showToast(delta > 0 ? "+10 secondes" : "−10 secondes");
    showControls();
  };

  const seekTo = (frac: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration, frac * v.duration));
    showControls();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    showControls();
  };

  const setVol = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    const nv = Math.max(0, Math.min(1, val));
    v.volume = nv;
    if (nv > 0 && v.muted) v.muted = false;
    showControls();
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  /* ================================================================= */
  return (
    <div
      ref={wrapRef}
      className={`group ${className}`}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        background: C.bg,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        color: C.text,
        fontFamily: "inherit",
      }}
      onClick={showControls}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <div ref={videoHostRef} style={{ position: "absolute", inset: 0 }} />

      {/* Overlay sombre au hover pour lisibilité des contrôles */}
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          transition: "opacity 200ms ease",
          opacity: controlsVisible ? 1 : undefined,
          pointerEvents: "none",
        }}
      />

      {/* Bouton play/pause centré sur la vidéo */}
      <button
        aria-label={playing ? "Pause" : "Lecture"}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse" && !controlsVisible) {
            e.preventDefault();
            e.stopPropagation();
            showControls();
            return;
          }
          togglePlay();
          showControls();
        }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(1)",
          width: 72,
          height: 72,
          borderRadius: 999,
          border: "none",
          background: "rgba(0,0,0,0.5)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          touchAction: "manipulation",
          transition:
            "opacity 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 250ms cubic-bezier(0.4, 0, 0.2, 1), background 200ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.65)";
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.5)";
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
        }}
      >
        {playing ? (
          <Pause size={32} color={C.text} fill={C.text} />
        ) : (
          <Play size={32} color={C.text} fill={C.text} />
        )}
      </button>

      {/* Barre de bas : progression + boutons en dessous */}
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "20px 12px 10px",
          background: `linear-gradient(to top, ${C.bg}e6, ${C.bg}00)`,
          transition: "opacity 200ms ease",
          opacity: controlsVisible ? 1 : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Temps */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: C.text,
            padding: "0 2px 4px",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Barre de progression */}
        <div
          role="slider"
          aria-label="Progression"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          tabIndex={0}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seekTo((e.clientX - r.left) / r.width);
          }}
          className="group/bar"
          style={{
            position: "relative",
            height: 14,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          <div
            className="group-hover/bar:h-[5px]"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 3,
              borderRadius: 2,
              background: `${C.text2}55`,
              transition: "height 120ms ease",
            }}
          />
          <div
            className="group-hover/bar:h-[5px]"
            style={{
              position: "absolute",
              left: 0,
              height: 3,
              borderRadius: 2,
              width: `${progress * 100}%`,
              background: C.accent,
              transition: "width 120ms linear, height 120ms ease",
            }}
          />
          <div
            className="opacity-0 group-hover/bar:opacity-100"
            style={{
              position: "absolute",
              left: `calc(${progress * 100}% - 7px)`,
              width: 14,
              height: 14,
              borderRadius: 999,
              background: C.accent,
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              transition: "opacity 120ms ease",
            }}
          />
        </div>

        {/* Boutons sous la barre de progression */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CtrlBtn label={playing ? "Pause" : "Lecture"} onClick={togglePlay}>
            {playing ? <Pause size={20} color={C.text} fill={C.text} /> : <Play size={20} color={C.text} fill={C.text} />}
          </CtrlBtn>

          <CtrlBtn label="Reculer de 10 secondes" onClick={() => seek(-10)}>
            <Rewind size={18} color={C.text} fill={C.text} />
          </CtrlBtn>

          <CtrlBtn label="Avancer de 10 secondes" onClick={() => seek(10)}>
            <FastForward size={18} color={C.text} fill={C.text} />
          </CtrlBtn>

          {/* Groupe volume : bouton + slider */}
          <div
            className="group/vol"
            style={{ display: "flex", alignItems: "center" }}
          >
            <CtrlBtn label={muted ? "Activer le son" : "Couper le son"} onClick={toggleMute}>
              {muted || volume === 0 ? <VolumeX size={18} color={C.text} /> : <Volume2 size={18} color={C.text} />}
            </CtrlBtn>
            <div
              className="w-0 group-hover/vol:w-[80px] focus-within:w-[80px]"
              style={{
                overflow: "hidden",
                transition: "width 200ms ease",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVol(parseFloat(e.target.value))}
                aria-label="Volume"
                style={{
                  width: 72,
                  margin: "0 6px",
                  accentColor: C.accent,
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <CtrlBtn label={fullscreen ? "Quitter le plein écran" : "Plein écran"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={18} color={C.text} /> : <Maximize2 size={18} color={C.text} />}
          </CtrlBtn>
        </div>
      </div>
    </div>
  );
};

/* ── Bouton contrôle générique ────────────────────────────────────────── */
const CtrlBtn = ({ label, onClick, children, size = 40 }: { label: string; onClick: () => void; children: React.ReactNode; size?: number }) => (
  <button
    aria-label={label}
    onClick={onClick}
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 150ms ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    {children}
  </button>
);

export default VideoPlayer;
