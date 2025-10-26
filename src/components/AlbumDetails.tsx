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
    id: string;
    name: string;
    images: { url: string }[];
    release_date: string;
  };
  duration_ms: number;
  track_number: number;
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

interface AlbumDetailsProps {
  albumId: string;
  onBack: () => void;
  onTrackSelect: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  accessToken: string;
}

export const AlbumDetails = ({
  albumId,
  onBack,
  onTrackSelect,
  onAddToQueue,
  accessToken,
}: AlbumDetailsProps) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/albums/${albumId}`,
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
          const albumTracks = data.tracks.items.map((item: AlbumTrack) => ({
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
          setTracks(albumTracks);
        }
      } catch (error) {
        console.error("Error fetching album details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [albumId, accessToken]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="glass-panel glass-highlight rounded-2xl p-6 text-center">
        <p className="text-muted-foreground">Loading album...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="glass-panel glass-highlight rounded-2xl p-6 text-center">
        <p className="text-muted-foreground">Album not found</p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel glass-highlight rounded-2xl p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-6 items-start">
          {album.images?.[0]?.url ? (
            <img
              src={album.images[0].url}
              alt={album.name}
              className="w-48 h-48 rounded-xl shadow-card"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-muted flex items-center justify-center">
              <Play className="h-24 w-24 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Album</p>
            <h1 className="text-4xl font-bold mb-2">{album.name}</h1>
            <p className="text-lg text-muted-foreground mb-2">
              {album.artists?.map((a) => a.name).join(", ")}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{new Date(album.release_date).getFullYear()}</span>
              <span>•</span>
              <span>{album.total_tracks} songs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel glass-highlight rounded-2xl p-4">
        <ScrollArea className="h-[500px]">
          {tracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tracks found
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track) => (
                <ContextMenu key={track.id}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => onTrackSelect(track)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm text-muted-foreground w-8">
                        {track.track_number}
                      </span>
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
