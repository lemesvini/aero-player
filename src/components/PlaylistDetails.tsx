import { useEffect, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface PlaylistTrack {
  track: Track;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
  description?: string;
}

interface PlaylistDetailsProps {
  playlist: Playlist;
  onBack: () => void;
  onTrackSelect: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  accessToken: string;
}

export const PlaylistDetails = ({
  playlist,
  onBack,
  onTrackSelect,
  onAddToQueue,
  accessToken,
}: PlaylistDetailsProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        
        if (data.items && Array.isArray(data.items)) {
          const playlistTracks = data.items
            .filter((item: PlaylistTrack) => item.track !== null)
            .map((item: PlaylistTrack) => item.track);
          setTracks(playlistTracks);
        }
      } catch (error) {
        console.error("Error fetching playlist tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistTracks();
  }, [playlist.id, accessToken]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel glass-highlight rounded-2xl p-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playlists
        </Button>

        <div className="flex gap-6 items-start">
          {playlist.images?.[0]?.url ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="w-48 h-48 rounded-xl shadow-card"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-muted flex items-center justify-center">
              <Play className="h-24 w-24 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{playlist.owner.display_name}</span>
              <span>•</span>
              <span>{playlist.tracks.total} tracks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel glass-highlight rounded-2xl p-4">
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tracks in this playlist
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <ContextMenu key={`${track.id}-${index}`}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => onTrackSelect(track)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm text-muted-foreground w-8">
                        {index + 1}
                      </span>
                      <img
                        src={
                          track.album.images?.[2]?.url || track.album.images?.[0]?.url
                        }
                        alt={track.album.name}
                        className="w-12 h-12 rounded object-cover shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artists?.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(track.duration_ms)}
                      </span>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onTrackSelect(track)}>
                      <Play className="h-4 w-4 mr-2" />
                      Play Now
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onAddToQueue(track)}>
                      Add to Queue
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
