import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Shuffle,
  ListMusic,
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

interface PlayerViewProps {
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
  onOpenQueue: () => void;
  shuffle: boolean;
  repeat: string;
}

export const PlayerView = ({
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
  onOpenQueue,
  shuffle,
  repeat,
}: PlayerViewProps) => {
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-2">No track playing</p>
          <p className="text-sm text-muted-foreground">
            Select a track from your playlists to start playback
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Player Card */}
      <div className="glass-panel glass-highlight rounded-2xl p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Album Art */}
          <div className="flex-shrink-0">
            <img
              src={currentTrack.album.images?.[0]?.url}
              alt={currentTrack.album.name}
              className="w-64 h-64 rounded-xl shadow-card"
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 w-full space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentTrack.name}</h1>
              <p className="text-xl text-muted-foreground mb-1">
                {currentTrack.artists?.map((a) => a.name).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTrack.album.name} •{" "}
                {new Date(currentTrack.album.release_date).getFullYear()}
              </p>
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

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleShuffle}
                  className={shuffle ? "text-primary" : "text-muted-foreground"}
                >
                  <Shuffle className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrevious}
                >
                  <SkipBack className="h-6 w-6" />
                </Button>

                <Button
                  size="icon"
                  onClick={onPlayPause}
                  className="h-14 w-14 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" fill="currentColor" />
                  ) : (
                    <Play className="h-6 w-6" fill="currentColor" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                >
                  <SkipForward className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleRepeat}
                  className={repeat !== "off" ? "text-primary" : "text-muted-foreground"}
                >
                  <Repeat className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenQueue}
              >
                <ListMusic className="h-5 w-5" />
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
        </div>
      </div>
    </div>
  );
};
