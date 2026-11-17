import { useRef, useState } from 'react';
import { Play, Pause, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { youtubeVideoId } from '@/lib/platform';
type Props = { src: string; initialSeconds?: number; onProgress?: (seconds: number, completed: boolean) => void };
export function VideoPlayer({ src, initialSeconds = 0, onProgress }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const lastSave = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const report = (completed = false) => { if (video.current) onProgress?.(video.current.currentTime, completed); };
  async function toggle() {
    if (!video.current) return;
    if (playing) video.current.pause();
    else { try { await video.current.play(); setError(''); } catch { setError('Não foi possível reproduzir o vídeo. Verifique o endereço e o formato.'); } }
  }
  if (!src) return <div className="video-empty"><VideoOff /><p>Vídeo ainda não disponível</p></div>;
  const youtubeId = youtubeVideoId(src);
  if (youtubeId) {
    return <div className="custom-player" style={{ minHeight: 200 }}>
      <iframe
        className="absolute inset-0 size-full"
        title="Vídeo da aula no YouTube"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&start=${Math.max(0, Math.floor(initialSeconds))}`}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>;
  }
  return <div className={`custom-player ${playing ? 'is-playing' : ''}`}>
    <video ref={video} src={src} playsInline preload="metadata" controls={false} disablePictureInPicture controlsList="nodownload noremoteplayback" aria-label="Vídeo da aula" onLoadedMetadata={() => { if (video.current) video.current.currentTime = initialSeconds; }} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); report(); }} onEnded={() => { setPlaying(false); report(true); }} onError={() => setError('O vídeo não pôde ser carregado. Confira a URL de reprodução.')} onTimeUpdate={() => { if (video.current && Math.abs(video.current.currentTime - lastSave.current) >= 10) { lastSave.current = video.current.currentTime; report(); } }} />
    {!error && <Button variant="playback" className="playback-control" size="icon" onClick={toggle} aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'} title={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'}>{playing ? <Pause /> : <Play />}</Button>}
    {error && <div role="alert" className="player-error"><VideoOff /><p>{error}</p></div>}
  </div>;
}
