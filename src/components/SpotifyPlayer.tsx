import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
    release_date: string;
  };
  duration_ms: number;
}

interface SpotifyPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  shuffle: boolean;
  repeat: string;
}

export const SpotifyPlayer = ({
  currentTrack,
  isPlaying,
  progress,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  shuffle,
  repeat,
}: SpotifyPlayerProps) => {
  const [volume, setVolume] = useState(50);
  const [localProgress, setLocalProgress] = useState(progress);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
    onSeek(newProgress);
  };

  if (!currentTrack) {
    return (
      <div className="glass-panel glass-highlight rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">No track playing</p>
        <p className="text-sm text-muted-foreground mt-2">
          Select a track to start playback
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-highlight rounded-2xl p-6 space-y-6">
      {/* Album Art & Metadata for Mobile */}
      <div className="lg:hidden flex flex-col items-center space-y-4">
        <img
          src={currentTrack.album.images?.[0]?.url}
          alt={currentTrack.album.name}
          className="w-48 h-48 rounded-xl shadow-card"
        />
        <div className="text-center">
          <h2 className="text-2xl font-semibold">{currentTrack.name}</h2>
          <p className="text-muted-foreground">
            {currentTrack.artists?.map((a) => a.name).join(", ") ||
              "Unknown Artist"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTrack.album.name}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[localProgress]}
          max={currentTrack.duration_ms}
          step={1000}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(localProgress)}</span>
          <span>{formatTime(currentTrack.duration_ms)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleShuffle}
          className={shuffle ? "text-secondary" : "text-muted-foreground"}
        >
          <Shuffle className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="hover-glow"
        >
          <SkipBack className="h-6 w-6" />
        </Button>

        <Button
          size="icon"
          onClick={onPlayPause}
          className="h-16 w-16 rounded-full glow-primary hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" fill="currentColor" />
          ) : (
            <Play className="h-8 w-8" fill="currentColor" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="hover-glow"
        >
          <SkipForward className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRepeat}
          className={
            repeat !== "off" ? "text-secondary" : "text-muted-foreground"
          }
        >
          <Repeat className="h-5 w-5" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Volume2 className="h-5 w-5 text-muted-foreground" />
        <Slider
          value={[volume]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />
      </div>
    </div>
  );
};
