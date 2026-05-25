/**
 * ReactPlayerVideo — lecteur vidéo basé sur react-player (v3) avec contrôles
 * personnalisés et thématisés (palette terreuse / dorée de l'app).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
  Subtitles,
} from "lucide-react";
import { biStr } from "@/lib/bilingual";
import type { VideoSubtitle } from "@/lib/vtt";

export type ReactPlayerVideoProps = {
  src: string;
  poster?: string;
  subtitles?: VideoSubtitle[];
  ariaLabel?: string;
  autoPlay?: boolean;
  className?: string;
};

const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;

const fmtTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const ReactPlayerVideo = ({
  src,
  poster,
  subtitles = [],
  ariaLabel,
  autoPlay = false,
  className = "",
}: ReactPlayerVideoProps) => {
  // ✅ Ref correcte pour ReactPlayer
  const playerRef = useRef<ReactPlayer>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState<boolean>(autoPlay);
  const [muted, setMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showRateMenu, setShowRateMenu] = useState<boolean>(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
  const [activeSubLang, setActiveSubLang] = useState<string | null>(
    subtitles?.find((s) => s.default)?.srclang ?? null
  );
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const hideTimerRef = useRef<number | null>(null);

  // ✅ Helper pour accéder au <video> natif
  const getVideo = useCallback((): HTMLVideoElement | null => {
    return playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
  }, []);

  // ---- Contrôles visibilité ----
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(
      () => setControlsVisible(false),
      2500
    );
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  // ---- Fullscreen avec Capacitor ----
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        // Passer en plein écran
        if (wrapperRef.current?.requestFullscreen) {
          await wrapperRef.current.requestFullscreen();
        }
        await ScreenOrientation.lock({ orientation: "landscape" });
        setIsFullscreen(true);
      } else {
        // Quitter le plein écran
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        await ScreenOrientation.unlock();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }
  }, [isFullscreen]);

  // Écouter changement fullscreen via API browser
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        ScreenOrientation.unlock().catch(() => {});
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ---- Sous-titres ----
  useEffect(() => {
    const video = getVideo();
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode =
        tracks[i].language === activeSubLang ? "showing" : "hidden";
    }
  }, [activeSubLang, getVideo, currentTime]); // currentTime pour re-check après mount

  // ---- Progress ----
  const handleProgress = useCallback(
    ({ playedSeconds }: { playedSeconds: number }) => {
      setCurrentTime(playedSeconds);
    },
    []
  );

  const handleDuration = useCallback((d: number) => {
    setDuration(d);
  }, []);

  // ---- Seek ----
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setCurrentTime(val);
      playerRef.current?.seekTo(val, "seconds");
    },
    []
  );

  // ---- Volume ----
  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setVolume(val);
      setMuted(val === 0);
    },
    []
  );

  // ---- Rate ----
  const setRate = useCallback((r: number) => {
    setPlaybackRate(r);
    setShowRateMenu(false);
  }, []);

  // ---- Config ReactPlayer ✅ ----
  const playerConfig = {
    file: {
      attributes: {
        poster: poster ?? "",
        preload: "metadata",
        crossOrigin: "anonymous",
        "aria-label": ariaLabel ?? biStr("Lecteur vidéo", "Kichezaji video"),
      },
      tracks: subtitles.map((sub) => ({
        kind: "subtitles" as const,
        src: sub.src,
        srcLang: sub.srclang,
        label: sub.label,
        default: sub.srclang === activeSubLang,
      })),
    },
  };

  if (hasError) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-sm text-white">
        {biStr("Erreur de lecture vidéo", "Hitilafu ya video")}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`group relative w-full overflow-hidden rounded-xl bg-black ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-video"
      } ${className}`}
      onClick={revealControls}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      {/* ✅ ReactPlayer correctement configuré */}
      <ReactPlayer
        ref={playerRef}
        url={src}
        playing={playing}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
        progressInterval={500}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onError={() => setHasError(true)}
        onEnded={() => setPlaying(false)}
        config={playerConfig}
      />

      {/* Overlay play/pause au centre */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPlaying((p) => !p);
          revealControls();
        }}
        aria-label={
          playing
            ? biStr("Pause", "Simama")
            : biStr("Lecture", "Cheza")
        }
        className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none"
      >
        {!playing && (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50">
            <Play className="h-8 w-8 text-white" aria-hidden="true" />
          </span>
        )}
      </button>

      {/* ---- Barre de contrôles ---- */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Barre de progression */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={currentTime}
          onChange={handleSeek}
          aria-label={biStr("Progression", "Maendeleo")}
          className="mb-2 h-1 w-full cursor-pointer accent-yellow-400"
        />

        {/* Rangée boutons */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={
              playing ? biStr("Pause", "Simama") : biStr("Lecture", "Cheza")
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            {playing ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Mute */}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={
              muted ? biStr("Activer le son", "Washa sauti") : biStr("Couper le son", "Zima sauti")
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            {muted ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Volume slider */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolume}
            aria-label={biStr("Volume", "Sauti")}
            className="hidden h-1 w-20 cursor-pointer accent-yellow-400 sm:block"
          />

          {/* Temps */}
          <span className="ml-1 flex-1 text-xs tabular-nums text-white">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          {/* Sous-titres */}
          {subtitles.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSubtitleMenu((s) => !s);
                  setShowRateMenu(false);
                }}
                aria-label={biStr("Sous-titres", "Manukuu")}
                aria-expanded={showSubtitleMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                <Subtitles className="h-5 w-5" aria-hidden="true" />
              </button>
              {showSubtitleMenu && (
                <div
                  role="menu"
                  className="absolute bottom-12 right-0 min-w-[8rem] rounded-xl border border-yellow-400/30 bg-zinc-900 p-1 text-white shadow-xl"
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeSubLang === null}
                    onClick={() => {
                      setActiveSubLang(null);
                      setShowSubtitleMenu(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-zinc-700 ${
                      activeSubLang === null ? "font-semibold text-yellow-400" : ""
                    }`}
                  >
                    Off
                  </button>
                  {subtitles.map((sub) => (
                    <button
                      key={sub.srclang}
                      type="button"
                      role="menuitemradio"
                      aria-checked={activeSubLang === sub.srclang}
                      onClick={() => {
                        setActiveSubLang(sub.srclang);
                        setShowSubtitleMenu(false);
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-zinc-700 ${
                        activeSubLang === sub.srclang
                          ? "font-semibold text-yellow-400"
                          : ""
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vitesse */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRateMenu((s) => !s);
                setShowSubtitleMenu(false);
              }}
              aria-label={biStr("Vitesse de lecture", "Kasi ya kucheza")}
              aria-expanded={showRateMenu}
              className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-full px-2 text-xs font-semibold text-white transition active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">{playbackRate}x</span>
            </button>
            {showRateMenu && (
              <div
                role="menu"
                className="absolute bottom-12 right-0 min-w-[6rem] rounded-xl border border-yellow-400/30 bg-zinc-900 p-1 text-white shadow-xl"
              >
                {PLAYBACK_RATES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="menuitemradio"
                    aria-checked={playbackRate === r}
                    onClick={() => setRate(r)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-zinc-700 ${
                      playbackRate === r ? "font-semibold text-yellow-400" : ""
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? biStr("Quitter le plein écran", "Toka skrini nzima")
                : biStr("Plein écran", "Skrini nzima")
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Maximize className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactPlayerVideo;
