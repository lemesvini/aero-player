"use client";
import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  ListMusic,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import GlassSurface from "./GlassSurface";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string }[];
    release_date: string;
  };
  duration_ms: number;
  track_number?: number;
}

interface AlbumTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  duration_ms: number;
  track_number: number;
}

interface Album {
  id: string;
  name: string;
  images: { url: string }[];
  artists: { name: string }[];
  release_date: string;
  total_tracks: number;
}

interface PlayerScreenProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (position: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onOpenQueue: () => void;
  onTrackSelect: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onBack?: () => void;
  shuffle: boolean;
  repeat: string;
  isLiked: boolean;
  accessToken: string;
}

export const PlayerScreen = ({
  currentTrack,
  isPlaying,
  progress,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onOpenQueue,
  onTrackSelect,
  onToggleLike,
  onBack,
  shuffle,
  repeat,
  isLiked,
  accessToken,
}: PlayerScreenProps) => {
  const [localProgress, setLocalProgress] = useState(progress);
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const element = titleRef.current;
        const isOverflowing = element.scrollWidth > element.clientWidth;
        setIsScrolling(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [currentTrack?.name]);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      if (!currentTrack?.album?.id || !accessToken) {
        setAlbum(null);
        setAlbumTracks([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/albums/${currentTrack.album.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();

        setAlbum({
          id: data.id,
          name: data.name,
          images: data.images || [],
          artists: data.artists || [],
          release_date: data.release_date || "",
          total_tracks: data.total_tracks || 0,
        });

        if (data.tracks?.items) {
          const tracks = data.tracks.items.map((item: AlbumTrack) => ({
            id: item.id,
            name: item.name,
            artists: item.artists || [],
            album: {
              id: data.id,
              name: data.name,
              images: data.images || [],
              release_date: data.release_date || "",
            },
            duration_ms: item.duration_ms,
            track_number: item.track_number,
          }));
          setAlbumTracks(tracks);
        }
      } catch (error) {
        console.error("Error fetching album details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [currentTrack?.album?.id, accessToken]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
    onSeek(newProgress);
  };

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
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
    <div className="w-full max-w-[75dvw] md:aspect-[2/1] flex md:flex-row flex-col overflow-hidden p-2 md:p-4 bg-black">
      {/* Left Section - Album Art */}
      <div className="w-full md:w-1/2 flex-shrink-0 relative overflow-hidden group">
        <CardContainer className="w-full h-full p-0">
          <CardItem className="p-0">
            <CardBody>
              <img
                src={currentTrack.album.images?.[0]?.url}
                alt={currentTrack.album.name}
                className="w-full h-full object-fill transition-transform duration-300 ease-in-out group-hover:scale-105"
              />

              {/* Media Controls at Center - Visible on Hover */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 px-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 pointer-events-auto">
                  {/* Previous Button */}
                  <GlassSurface
                    width={70}
                    height={70}
                    borderRadius={35}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    displace={20}
                    distortionScale={-400}
                    redOffset={5}
                    greenOffset={15}
                    blueOffset={25}
                    brightness={40}
                    opacity={0.3}
                    blur={20}
                    backgroundOpacity={0.1}
                    mixBlendMode="overlay"
                  >
                    <button
                      onClick={onPrevious}
                      className="w-full h-full flex items-center justify-center text-white transition-colors drop-shadow-lg"
                    >
                      <SkipBack className="h-7 w-7" />
                    </button>
                  </GlassSurface>

                  {/* Play/Pause Button */}
                  <GlassSurface
                    width={90}
                    height={90}
                    borderRadius={45}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    displace={20}
                    distortionScale={-400}
                    redOffset={5}
                    greenOffset={15}
                    blueOffset={25}
                    brightness={40}
                    opacity={0.3}
                    blur={20}
                    backgroundOpacity={0.15}
                    mixBlendMode="overlay"
                  >
                    <button
                      onClick={onPlayPause}
                      className="w-full h-full flex items-center justify-center text-white transition-colors drop-shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" fill="currentColor" />
                      ) : (
                        <Play className="h-8 w-8 ml-1" fill="currentColor" />
                      )}
                    </button>
                  </GlassSurface>

                  {/* Next Button */}
                  <GlassSurface
                    width={70}
                    height={70}
                    borderRadius={35}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    displace={20}
                    distortionScale={-400}
                    redOffset={5}
                    greenOffset={15}
                    blueOffset={25}
                    brightness={40}
                    opacity={0.3}
                    blur={20}
                    backgroundOpacity={0.1}
                    mixBlendMode="overlay"
                  >
                    <button
                      onClick={onNext}
                      className="w-full h-full flex items-center justify-center text-white transition-colors drop-shadow-lg"
                    >
                      <SkipForward className="h-7 w-7" />
                    </button>
                  </GlassSurface>
                </div>
              </div>
            </CardBody>
          </CardItem>
        </CardContainer>
        {onBack && (
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="backdrop-blur-md bg-black/20 hover:bg-black/40 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Right Section - Track Info, Album Tracks, and Controls */}
      <div className="w-full md:w-1/2 flex-shrink-0 flex flex-col bg-black text-white overflow-hidden">
        {/* Top Section - Track Info */}
        <div className="p-4 md:p-8 border-b border-white/10">
          <div className="mb-4 md:mb-6">
            <p className="text-xs md:text-sm text-white/60 mb-2 font-light">
              {album?.artists?.map((a) => a.name).join(", ")} /{" "}
              {album?.release_date
                ? new Date(album.release_date).getFullYear()
                : ""}
            </p>
            <div className="flex items-center gap-3">
              <div className="overflow-hidden relative flex-1">
                <div
                  ref={titleRef}
                  className={`text-2xl md:text-5xl font-bold tracking-tight leading-tight whitespace-nowrap ${
                    isScrolling ? "animate-scroll-left" : ""
                  }`}
                  style={
                    !isScrolling
                      ? { overflow: "hidden", textOverflow: "ellipsis" }
                      : {}
                  }
                >
                  <span className={isScrolling ? "flex-shrink-0" : ""}>
                    {currentTrack.name}
                  </span>
                  {isScrolling && (
                    <span className="flex-shrink-0 px-8">
                      {currentTrack.name}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onToggleLike(currentTrack.id)}
                className="flex-shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label={isLiked ? "Unlike track" : "Like track"}
              >
                <Heart
                  className={`h-6 w-6 md:h-7 md:w-7 transition-all ${
                    isLiked
                      ? "fill-white text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm md:text-lg text-white/60 font-light mt-2 md:mt-3">
              {currentTrack.album?.name || album?.name || ""}
            </p>
          </div>
        </div>

        {/* Middle Section - Album Tracks */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-4 md:px-8 py-4 space-y-0">
            {albumTracks.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                {loading ? "Loading tracks..." : "No tracks available"}
              </div>
            ) : (
              albumTracks.map((track) => {
                const isCurrentTrack = track.id === currentTrack.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => onTrackSelect(track)}
                    className={`w-full flex items-center gap-4 px-3 py-2.5 rounded hover:bg-white/5 transition-colors text-left ${
                      isCurrentTrack ? "bg-white/10" : ""
                    }`}
                  >
                    <span className="text-sm text-white/40 w-8 text-right font-light">
                      {track.track_number ? (
                        isCurrentTrack ? (
                          <Pause className="h-4 w-4 mx-auto" />
                        ) : (
                          String(track.track_number).padStart(2, "0")
                        )
                      ) : (
                        ""
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm leading-relaxed">
                        {track.name}
                      </p>
                    </div>
                    <span className="text-sm text-white/40 font-light">
                      {formatTime(track.duration_ms)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Bottom Section - Media Controls */}
        <div className="px-4 md:px-8 py-4 md:py-6 border-t border-white/10 space-y-3 md:space-y-4 bg-black">
          {/* Current Track Info */}
          {/* <div className="space-y-2">
            <p className="text-xs text-white/60 font-light">
              {currentTrack.name}
            </p>
            <div className="flex items-center justify-between text-xs text-white/60 font-light">
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(currentTrack.duration_ms)}</span>
            </div>
            <Slider
              value={[localProgress]}
              max={currentTrack.duration_ms}
              step={1000}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div> */}

          {/* Controls */}
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 md:gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleShuffle}
                className={`text-white/60 hover:text-white hover:bg-white/10 ${
                  shuffle ? "text-white" : ""
                }`}
              >
                <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <SkipBack className="h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <Button
                size="icon"
                onClick={onPlayPause}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                {isPlaying ? (
                  <Pause
                    className="h-5 w-5 md:h-6 md:w-6"
                    fill="currentColor"
                  />
                ) : (
                  <Play className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <SkipForward className="h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleRepeat}
                className={`text-white/60 hover:text-white hover:bg-white/10 ${
                  repeat !== "off" ? "text-white" : ""
                }`}
              >
                <Repeat className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenQueue}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ListMusic className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div> */}

          {/* Progress Control */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleShuffle}
              className={`h-8 w-8 md:h-9 md:w-9 text-white/60 hover:text-white hover:bg-white/10 ${
                shuffle ? "text-white" : ""
              }`}
            >
              <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleRepeat}
              className={`h-8 w-8 md:h-9 md:w-9 text-white/60 hover:text-white hover:bg-white/10 ${
                repeat !== "off" ? "text-white" : ""
              }`}
            >
              <Repeat className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <span className="text-xs text-white/60 font-light min-w-[45px]">
              {formatTime(localProgress)}
            </span>
            <Slider
              value={[localProgress]}
              max={currentTrack.duration_ms}
              step={1000}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-white/60 font-light min-w-[45px]">
              {formatTime(currentTrack.duration_ms)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
