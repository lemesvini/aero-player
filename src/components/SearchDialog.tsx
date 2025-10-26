import { useState, useEffect } from "react";
import { Search, Play, X } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const searchSchema = z.string().trim().max(200, "Search query too long");

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
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  onTrackSelect: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const SearchDialog = ({
  open,
  onOpenChange,
  accessToken,
  onTrackSelect,
  onAddToQueue,
}: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }

    const validationResult = searchSchema.safeParse(query);
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }
    setError("");

    const searchTracks = async () => {
      setLoading(true);
      try {
        const encodedQuery = encodeURIComponent(query.trim());
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        if (data.tracks?.items) {
          const tracks = data.tracks.items.map((track: any) => ({
            ...track,
            album: {
              id: track.album?.id || "",
              ...track.album,
              release_date: track.album?.release_date || "",
            },
          }));
          setResults(tracks);
        }
      } catch (err) {
        setError("Failed to search tracks");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchTracks, 500);
    return () => clearTimeout(debounce);
  }, [query, accessToken]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTrackSelect = (track: Track) => {
    onTrackSelect(track);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Songs</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, or albums..."
              className="pl-10"
              maxLength={200}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 && query ? (
              <div className="text-center py-12 text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Start typing to search for songs
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((track) => (
                  <ContextMenu key={track.id}>
                    <ContextMenuTrigger>
                      <button
                        onClick={() => handleTrackSelect(track)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <img
                          src={
                            track.album.images?.[2]?.url ||
                            track.album.images?.[0]?.url
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
                      <ContextMenuItem onClick={() => handleTrackSelect(track)}>
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
      </DialogContent>
    </Dialog>
  );
};
