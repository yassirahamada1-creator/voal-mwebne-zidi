/**
 * NativeVideo — lecteur vidéo natif HTML5 pour Capacitor/Android
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
} from "lucide-react";

export type NativeVideoProps = {
  src: string;
  poster?: string;
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

const NativeVideo = ({
  src,
  poster,
  ariaLabel,
  autoPlay = false,
  className = "",
}: NativeVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);

  const hideTimerRef = useRef<number | null>(null);

  // ---- Visibilité contrôles ----
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

  // ---- Play / Pause ----
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  // ---- Volume ----
  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val === 0) {
      v.muted = true;
      setMuted(true);
    } else {
      v.muted = false;
      setMuted(false);
    }
  }, []);

  // ---- Seek ----
  const handleSeek = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = val;
    setCurrentTime(val);
  }, []);

  // ---- Vitesse ----
  const setRate = useCallback((r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setPlaybackRate(r);
    setShowRateMenu(false);
  }, []);

  // ---- Fullscreen ----
  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
      await ScreenOrientation.lock({ orientation: "landscape" }).catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      await ScreenOrientation.unlock().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ---- Events vidéo ----
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onDurationChange = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setHasError(true);

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onError);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-black ${className}`}
      style={{ aspectRatio: "16/9" }}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onClick={revealControls}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={ariaLabel}
        autoPlay={autoPlay}
        playsInline
        className="h-full w-full object-contain"
      />

      {/* Erreur */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
          <p>Erreur de lecture vidéo</p>
        </div>
      )}

      {/* Overlay contrôles */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)",
        }}
      >
        {/* Barre de progression */}
        <div className="px-4 pb-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full accent-yellow-400"
            aria-label="Progression"
          />
          <div className="flex justify-between text-xs text-white/70">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Lecture"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15"
            >
              {playing ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>

            {/* Mute */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15"
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 accent-yellow-400"
              aria-label="Volume"
            />
          </div>

          <div className="flex items-center gap-1">
            {/* Vitesse */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRateMenu((s) => !s)}
                aria-label="Vitesse"
                className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-full px-2 text-xs font-semibold text-white transition active:scale-95 hover:bg-white/15"
              >
                <Gauge className="h-4 w-4" />
                <span>{playbackRate}x</span>
              </button>
              {showRateMenu && (
                <div className="absolute bottom-12 right-0 min-w-[6rem] rounded-xl border border-yellow-400/30 bg-zinc-900 p-1 text-white shadow-xl">
                  {PLAYBACK_RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
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
              aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition active:scale-95 hover:bg-white/15"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NativeVideo;
