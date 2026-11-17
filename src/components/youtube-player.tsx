import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Player {
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}
interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      host: string;
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) => Player;
}
type YouTubeWindow = Window & { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
let apiPromise: Promise<YouTubeApi> | undefined;
function loadApi() {
  const target = window as YouTubeWindow;
  if (target.YT?.Player) return Promise.resolve(target.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
      const previous = target.onYouTubeIframeAPIReady;
      const timeout = window.setTimeout(() => {
        apiPromise = undefined;
        reject(new Error("O YouTube demorou para responder. Atualize a página."));
      }, 20000);
      target.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (target.YT) {
          clearTimeout(timeout);
          resolve(target.YT);
        }
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        clearTimeout(timeout);
        apiPromise = undefined;
        reject(new Error("Não foi possível carregar o player do YouTube."));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

export function YouTubePlayer({
  videoId,
  initialSeconds,
  onProgress,
}: {
  videoId: string;
  initialSeconds: number;
  onProgress?: ((seconds: number, completed: boolean) => void) | undefined;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const progress = useRef(onProgress);
  const start = useRef(initialSeconds);
  progress.current = onProgress;
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let instance: Player | undefined;
    let finished = false;
    const report = (completed = false) => {
      finished ||= completed;
      if (instance && readyToReport) progress.current?.(instance.getCurrentTime(), finished);
    };
    let readyToReport = false;
    setReady(false);
    setPlaying(false);
    setError("");
    void loadApi()
      .then((api) => {
        if (cancelled || !mount.current) return;
        const element = document.createElement("div");
        mount.current.replaceChildren(element);
        instance = new api.Player(element, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          playerVars: {
            controls: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            origin: window.location.origin,
            start: Math.max(0, Math.floor(start.current)),
          },
          events: {
            onReady: () => {
              if (!cancelled) {
                readyToReport = true;
                setReady(true);
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              setPlaying(event.data === 1);
              if (event.data === 2 || event.data === 0) report(event.data === 0);
            },
            onError: (event) => {
              if (!cancelled)
                setError(
                  [101, 150].includes(event.data)
                    ? "O proprietário deste vídeo desativou a incorporação."
                    : "Não foi possível reproduzir este vídeo. Confira se ele está disponível para incorporação.",
                );
            },
          },
        });
        player.current = instance;
        timer = setInterval(() => {
          if (instance?.getPlayerState() === 1) report();
        }, 10000);
      })
      .catch((reason) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Falha ao carregar o vídeo.");
      });
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (readyToReport) report();
      instance?.destroy();
      player.current = null;
    };
  }, [videoId]);
  async function fullscreen() {
    try {
      if (document.fullscreenElement === container.current) await document.exitFullscreen();
      else await container.current?.requestFullscreen();
    } catch {
      setError("Tela cheia indisponível neste navegador.");
    }
  }
  return (
    <div ref={container} className="youtube-player">
      <div ref={mount} className="youtube-surface" />
      <div className="youtube-actions">
        <Button
          variant="ghost"
          size="icon"
          disabled={!ready || !!error}
          aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
          onClick={() => {
            if (playing) player.current?.pauseVideo();
            else player.current?.playVideo();
          }}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        {!ready && !error && <span role="status">Carregando vídeo…</span>}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tela cheia"
          onClick={() => void fullscreen()}
        >
          <Maximize />
        </Button>
      </div>
      {error && (
        <p role="alert" className="player-feedback">
          {error}
        </p>
      )}
    </div>
  );
}
