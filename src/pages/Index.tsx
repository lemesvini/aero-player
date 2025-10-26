import { useState, useEffect, useCallback } from "react";
import { SpotifyAuth } from "@/components/SpotifyAuth";
import { PlayerView } from "@/components/PlayerView";
import { RecentlyPlayed } from "@/components/RecentlyPlayed";
import { Playlists } from "@/components/Playlists";
import { PlaylistDetails } from "@/components/PlaylistDetails";
import { QueueDialog } from "@/components/QueueDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
  played_at?: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

const Index = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const { toast } = useToast();

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("spotify_access_token");
        setAccessToken(null);
        throw new Error("Token expired");
      }

      return response;
    },
    [accessToken]
  );

  const handleCallback = useCallback(
    async (code: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spotify-auth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "callback", code }),
          }
        );

        const data = await response.json();
        if (data.access_token) {
          localStorage.setItem("spotify_access_token", data.access_token);
          setAccessToken(data.access_token);
        }
      } catch (error) {
        console.error("Callback error:", error);
        toast({
          title: "Authentication Failed",
          description: "Could not complete Spotify login",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const fetchRecentlyPlayed = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/me/player/recently-played?limit=20"
      );
      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        const tracks = data.items
          .filter((item: { track: Track | null }) => item.track !== null)
          .map(
            (item: { track: Track; played_at: string }) => ({
              ...item.track,
              played_at: item.played_at,
              // Ensure arrays exist
              artists: item.track?.artists || [],
              album: {
                ...item.track?.album,
                images: item.track?.album?.images || [],
                release_date: item.track?.album?.release_date || "",
              },
            })
          );
        setRecentTracks(tracks);
      }
    } catch (error) {
      console.error("Error fetching recently played:", error);
    }
  }, [fetchWithAuth]);

  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/me/playlists?limit=50"
      );
      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        setPlaylists(
          data.items
            .filter((playlist: Playlist | null) => playlist !== null)
            .map((playlist: Playlist) => ({
              ...playlist,
              // Ensure arrays exist
              images: playlist?.images || [],
              tracks: playlist?.tracks || { total: 0 },
              owner: playlist?.owner || { display_name: "Unknown" },
            }))
        );
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  }, [fetchWithAuth]);

  const fetchCurrentPlayback = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/me/player"
      );

      if (response.status === 204) {
        return;
      }

      const data = await response.json();

      if (data.item && data.item.id) {
        setCurrentTrack({
          ...data.item,
          // Ensure arrays exist
          artists: data.item?.artists || [],
          album: {
            ...data.item?.album,
            images: data.item?.album?.images || [],
            release_date: data.item?.album?.release_date || "",
          },
        });
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms || 0);
        setShuffle(data.shuffle_state);
        setRepeat(data.repeat_state);
      }
    } catch (error) {
      console.error("Error fetching playback:", error);
    }
  }, [fetchWithAuth]);

  const handlePlayPause = async () => {
    try {
      const endpoint = isPlaying ? "pause" : "play";
      await fetchWithAuth(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: "PUT",
      });
      setIsPlaying(!isPlaying);
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Make sure Spotify is active on a device",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    try {
      await fetchWithAuth("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
      });
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error("Error skipping track:", error);
    }
  };

  const handlePrevious = async () => {
    try {
      await fetchWithAuth("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
      });
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error("Error going to previous track:", error);
    }
  };

  const handleSeek = async (position: number) => {
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${position}`,
        { method: "PUT" }
      );
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`,
        { method: "PUT" }
      );
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  };

  const handleToggleShuffle = async () => {
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/shuffle?state=${!shuffle}`,
        { method: "PUT" }
      );
      setShuffle(!shuffle);
    } catch (error) {
      console.error("Error toggling shuffle:", error);
    }
  };

  const handleToggleRepeat = async () => {
    try {
      const nextRepeat =
        repeat === "off" ? "context" : repeat === "context" ? "track" : "off";
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/repeat?state=${nextRepeat}`,
        { method: "PUT" }
      );
      setRepeat(nextRepeat);
    } catch (error) {
      console.error("Error toggling repeat:", error);
    }
  };

  const handleTrackSelect = async (track: Track) => {
    try {
      await fetchWithAuth("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        body: JSON.stringify({
          uris: [`spotify:track:${track.id}`],
        }),
      });
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Make sure Spotify is active on a device",
        variant: "destructive",
      });
    }
  };

  const handlePlaylistSelect = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      setSelectedPlaylist(playlist);
    }
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    toast({
      title: "Added to Queue",
      description: `${track.name} added to queue`,
    });
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // Check for callback from Spotify OAuth
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      handleCallback(code);
      window.history.replaceState({}, document.title, "/");
    }
  }, [handleCallback]);

  useEffect(() => {
    if (accessToken) {
      fetchRecentlyPlayed();
      fetchPlaylists();
      fetchCurrentPlayback();

      const interval = setInterval(fetchCurrentPlayback, 3000);
      return () => clearInterval(interval);
    }
  }, [accessToken, fetchCurrentPlayback, fetchPlaylists, fetchRecentlyPlayed]);

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel glass-highlight rounded-2xl">
          <SpotifyAuth onAuthSuccess={setAccessToken} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="glass-panel glass-highlight rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                SpotiPlayer
              </h1>
              <p className="text-sm text-muted-foreground">
                Windows 7 Style Media Player
              </p>
            </div>
            <SpotifyAuth onAuthSuccess={setAccessToken} />
          </div>
        </header>

        {/* Main Content */}
        <Tabs defaultValue="player" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="player">Player</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="player" className="space-y-6">
            <PlayerView
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onToggleShuffle={handleToggleShuffle}
              onToggleRepeat={handleToggleRepeat}
              onOpenQueue={() => setQueueDialogOpen(true)}
              shuffle={shuffle}
              repeat={repeat}
            />

            <div className="max-w-4xl mx-auto">
              <RecentlyPlayed
                tracks={recentTracks}
                onTrackSelect={handleTrackSelect}
                onAddToQueue={handleAddToQueue}
                currentTrackId={currentTrack?.id}
              />
            </div>
          </TabsContent>

          <TabsContent value="playlists">
            {selectedPlaylist ? (
              <PlaylistDetails
                playlist={selectedPlaylist}
                onBack={() => setSelectedPlaylist(null)}
                onTrackSelect={handleTrackSelect}
                onAddToQueue={handleAddToQueue}
                accessToken={accessToken!}
              />
            ) : (
              <div className="max-w-4xl mx-auto">
                <Playlists
                  playlists={playlists}
                  onPlaylistSelect={handlePlaylistSelect}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <QueueDialog
          open={queueDialogOpen}
          onOpenChange={setQueueDialogOpen}
          queue={queue}
          onRemoveFromQueue={handleRemoveFromQueue}
          onTrackSelect={handleTrackSelect}
        />
      </div>
    </div>
  );
};

export default Index;
