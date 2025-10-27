import { useState, useEffect, useCallback } from "react";
import { Library, ListMusic, Search, Maximize2, Minimize2 } from "lucide-react";
import { SpotifyAuth } from "@/components/SpotifyAuth";
import { PlayerScreen } from "@/components/PlayerScreen";
import { RecentlyPlayed } from "@/components/RecentlyPlayed";
import { Playlists } from "@/components/Playlists";
import { PlaylistDetails } from "@/components/PlaylistDetails";
import { AlbumDetails } from "@/components/AlbumDetails";
import { QueueDialog } from "@/components/QueueDialog";
import { SearchDialog } from "@/components/SearchDialog";
import { PlaylistGalleryDialog } from "@/components/PlaylistGalleryDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<Track[]>(
    []
  );
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("player");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<{
    images?: { url: string }[];
    external_urls?: { spotify: string };
  } | null>(null);
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
          description: "Could not complete login",
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
          .map((item: { track: Track; played_at: string }) => ({
            ...item.track,
            played_at: item.played_at,
            // Ensure arrays exist
            artists: item.track?.artists || [],
            album: {
              id: item.track?.album?.id || "",
              ...item.track?.album,
              images: item.track?.album?.images || [],
              release_date: item.track?.album?.release_date || "",
            },
          }));
        setRecentTracks(tracks);
      }
    } catch (error) {
      console.error("Error fetching recently played:", error);
    }
  }, [fetchWithAuth]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetchWithAuth("https://api.spotify.com/v1/me");
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
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
            id: data.item?.album?.id || "",
            ...data.item?.album,
            images: data.item?.album?.images || [],
            release_date: data.item?.album?.release_date || "",
          },
        });
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms || 0);
        setShuffle(data.shuffle_state);
        setRepeat(data.repeat_state);

        // Check if current track is liked
        if (data.item.id) {
          try {
            const likedResponse = await fetchWithAuth(
              `https://api.spotify.com/v1/me/tracks/contains?ids=${data.item.id}`
            );
            const likedData = await likedResponse.json();
            setIsLiked(likedData[0] || false);
          } catch (error) {
            console.error("Error checking if track is liked:", error);
          }
        }
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
        description: "Make sure a device is active",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/me/player/next",
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Success - refresh playback state
        setTimeout(fetchCurrentPlayback, 500);
        return;
      }

      // If API call fails, check if we have a queue
      if (queue.length > 0) {
        // Play the first track from our local queue
        const nextTrack = queue[0];
        await handleTrackSelect(nextTrack, true);
        handleRemoveFromQueue(0);
        return;
      }

      // No queue available, show error
      const errorText = await response.text();
      console.error("Next track error:", response.status, errorText);
      toast({
        title: "Cannot skip track",
        description: "No queue or context available",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error skipping track:", error);
      toast({
        title: "Network Error",
        description: "Could not skip to next track",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = async () => {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/me/player/previous",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        console.error("Previous track error:", response.status);
        toast({
          title: "Cannot go to previous track",
          description: "No context available to navigate",
          variant: "destructive",
        });
        return;
      }

      // Success - refresh playback state
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error("Error going to previous track:", error);
      toast({
        title: "Network Error",
        description: "Could not go to previous track",
        variant: "destructive",
      });
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
      // Update local state immediately for instant UI feedback
      setShuffle(!shuffle);

      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/shuffle?state=${!shuffle}`,
        { method: "PUT" }
      );

      // Refresh playback state after Spotify processes the change
      setTimeout(fetchCurrentPlayback, 800);
    } catch (error) {
      console.error("Error toggling shuffle:", error);
      // Revert on error
      setShuffle(shuffle);
    }
  };

  const handleToggleRepeat = async () => {
    try {
      const nextRepeat =
        repeat === "off" ? "context" : repeat === "context" ? "track" : "off";

      // Update local state immediately for instant UI feedback
      setRepeat(nextRepeat);

      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/repeat?state=${nextRepeat}`,
        { method: "PUT" }
      );

      // Refresh playback state after Spotify processes the change
      setTimeout(fetchCurrentPlayback, 800);
    } catch (error) {
      console.error("Error toggling repeat:", error);
      // Revert on error
      setRepeat(repeat);
    }
  };

  const handleToggleLike = async (trackId: string) => {
    try {
      // Update local state immediately for instant UI feedback
      setIsLiked(!isLiked);

      const endpoint = `https://api.spotify.com/v1/me/tracks?ids=${trackId}`;

      // Use direct fetch with minimal headers as per Spotify API requirements
      const response = await fetch(endpoint, {
        method: isLiked ? "DELETE" : "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("spotify_access_token");
        setAccessToken(null);
        throw new Error("Token expired");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      setIsLiked(isLiked);
    }
  };

  const handleTrackSelect = useCallback(
    async (track: Track, clearPlaylist: boolean = false) => {
      try {
        // If we have a playlist selected and it should be kept, play with context for auto-advance
        if (
          !clearPlaylist &&
          selectedPlaylist &&
          selectedPlaylistTracks.length > 0
        ) {
          const currentIndex = selectedPlaylistTracks.findIndex(
            (t) => t.id === track.id
          );

          console.log(
            `Playing track ${currentIndex + 1} of ${
              selectedPlaylistTracks.length
            } from playlist`
          );

          // Use context_uri to ensure playlist context is maintained
          await fetchWithAuth("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            body: JSON.stringify({
              context_uri: `spotify:playlist:${selectedPlaylist.id}`,
              offset: { uri: `spotify:track:${track.id}` },
              position_ms: 0,
            }),
          });
        } else {
          // Single track playback without context
          if (clearPlaylist) {
            setSelectedPlaylist(null);
            setSelectedPlaylistTracks([]);
          }

          await fetchWithAuth("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            body: JSON.stringify({
              uris: [`spotify:track:${track.id}`],
            }),
          });
        }
        setTimeout(fetchCurrentPlayback, 500);
      } catch (error) {
        toast({
          title: "Playback Error",
          description: "Make sure a device is active",
          variant: "destructive",
        });
      }
    },
    [
      fetchWithAuth,
      fetchCurrentPlayback,
      toast,
      selectedPlaylist,
      selectedPlaylistTracks,
    ]
  );

  const handlePlaylistSelect = useCallback(
    async (playlist: Playlist) => {
      setSelectedPlaylist(playlist);

      // Fetch playlist tracks
      try {
        const response = await fetchWithAuth(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`
        );
        const data = await response.json();

        if (data.items && Array.isArray(data.items)) {
          const playlistTracks = data.items
            .filter((item: { track: Track | null }) => item.track !== null)
            .map((item: { track: Track }) => ({
              ...item.track,
              artists: item.track?.artists || [],
              album: {
                id: item.track?.album?.id || "",
                ...item.track?.album,
                images: item.track?.album?.images || [],
                release_date: item.track?.album?.release_date || "",
              },
            }));

          setSelectedPlaylistTracks(playlistTracks);

          // Play the first track if available
          if (playlistTracks.length > 0) {
            const firstTrack = playlistTracks[0];
            await handleTrackSelect(firstTrack, false);
          }
        }
      } catch (error) {
        console.error("Error fetching playlist tracks:", error);
        toast({
          title: "Error",
          description: "Failed to load playlist",
          variant: "destructive",
        });
      }
    },
    [fetchWithAuth, handleTrackSelect, toast]
  );

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

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleAlbumClick = () => {
    // Use the current track's album ID
    const track = currentTrack;
    if (track && track.album?.id) {
      setSelectedAlbumId(track.album.id);
      setSelectedPlaylist(null);
      setActiveTab("playlists");
    }
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
      fetchUserProfile();
      fetchRecentlyPlayed();
      fetchPlaylists();
      fetchCurrentPlayback();

      const interval = setInterval(fetchCurrentPlayback, 1000);
      return () => clearInterval(interval);
    }
  }, [
    accessToken,
    fetchCurrentPlayback,
    fetchPlaylists,
    fetchRecentlyPlayed,
    fetchUserProfile,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!accessToken) {
    return <SpotifyAuth onAuthSuccess={setAccessToken} />;
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-b from-black via-black/10 to-black">
      <div className="absolute left-16 flex flex-col items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQueueDialogOpen(true)}
          className="text-white border-white/20 hover:bg-white/5"
        >
          <ListMusic className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchDialogOpen(true)}
          className="text-white border-white/20 hover:bg-white/5"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLibraryDialogOpen(true)}
          className="text-white border-white/20 hover:bg-white/5"
        >
          <Library className="h-5 w-5" />
        </Button>
      </div>
      <div className="max-w-7xl mx-auto border-2 border-white/10 rounded-2xl">
        {/* Main Content */}
        <PlayerScreen
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSeek={handleSeek}
          onToggleShuffle={handleToggleShuffle}
          onToggleRepeat={handleToggleRepeat}
          onOpenQueue={() => setQueueDialogOpen(true)}
          onTrackSelect={handleTrackSelect}
          onAddToQueue={handleAddToQueue}
          onToggleLike={handleToggleLike}
          shuffle={shuffle}
          repeat={repeat}
          isLiked={isLiked}
          accessToken={accessToken!}
          selectedPlaylist={selectedPlaylist}
          selectedPlaylistTracks={selectedPlaylistTracks}
        />
        {/* <div className="max-w-4xl mx-auto">
              <RecentlyPlayed
                tracks={recentTracks}
                onTrackSelect={handleTrackSelect}
                onAddToQueue={handleAddToQueue}
                currentTrackId={currentTrack?.id}
              />
            </div> */}

        {/* <TabsContent value="playlists">
          {selectedAlbumId ? (
            <AlbumDetails
              albumId={selectedAlbumId}
              onBack={() => setSelectedAlbumId(null)}
              onTrackSelect={handleTrackSelect}
              onAddToQueue={handleAddToQueue}
              accessToken={accessToken!}
            />
          ) : selectedPlaylist ? (
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
        </TabsContent> */}

        <QueueDialog
          open={queueDialogOpen}
          onOpenChange={setQueueDialogOpen}
          queue={queue}
          onRemoveFromQueue={handleRemoveFromQueue}
          onTrackSelect={handleTrackSelect}
        />

        <SearchDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          accessToken={accessToken!}
          onTrackSelect={handleTrackSelect}
          onAddToQueue={handleAddToQueue}
        />

        <PlaylistGalleryDialog
          open={libraryDialogOpen}
          onOpenChange={setLibraryDialogOpen}
          playlists={playlists}
          onPlaylistSelect={handlePlaylistSelect}
        />
      </div>
      <div className="absolute right-16 flex flex-col items-center gap-3">
        <div
          onClick={() =>
            window.open(userProfile?.external_urls?.spotify, "_blank")
          }
          className="w-10 h-10 rounded-full border-2 border-white/70 hover:border-white/10 transition-all duration-300 cursor-pointer overflow-hidden mb-12"
        >
          {userProfile?.images && userProfile.images.length > 0 ? (
            <img
              src={userProfile.images[0].url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <span className="text-white text-xs">?</span>
            </div>
          )}
        </div>
        <span className="text-white/50 text-sm">
          {currentTime.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="text-white text-2xl font-light">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleFullscreen}
          className="text-white border-white/20 hover:bg-white/5 mt-12"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Index;
