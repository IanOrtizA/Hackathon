import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface PreviewClipButtonProps {
  previewUrl: string;
}

export function PreviewClipButton({ previewUrl }: PreviewClipButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = new Audio(previewUrl);
    audioRef.current = audio;

    function handleEnded() {
      setIsPlaying(false);
    }

    function handleError() {
      setIsPlaying(false);
      setHasError(true);
    }

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [previewUrl]);

  async function handleTogglePlayback() {
    const audio = audioRef.current;

    if (!audio || hasError) {
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setHasError(true);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleTogglePlayback();
      }}
      disabled={hasError}
      className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      {hasError ? "Preview unavailable" : isPlaying ? "Stop preview" : "Play 30s preview"}
    </button>
  );
}
