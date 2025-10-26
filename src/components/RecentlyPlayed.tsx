import { Clock, Play } from "lucide-react";
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
  played_at?: string;
}

interface RecentlyPlayedProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  currentTrackId?: string;
}

export const RecentlyPlayed = ({
  tracks,
  onTrackSelect,
  onAddToQueue,
  currentTrackId,
}: RecentlyPlayedProps) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="glass-panel glass-highlight rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Recently Played</h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          {tracks?.map((track, index) => (
            <ContextMenu key={`${track.id}-${index}`}>
              <ContextMenuTrigger>
                <button
                  onClick={() => onTrackSelect(track)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-muted/50 ${
                    currentTrackId === track.id
                      ? "bg-primary/20 border border-primary/30"
                      : ""
                  }`}
                >
                  <img
                    src={
                      track.album.images?.[2]?.url || track.album.images?.[0]?.url
                    }
                    alt={track.album.name}
                    className="w-12 h-12 rounded object-cover shadow-sm"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate text-sm">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists?.map((a) => a.name).join(", ") ||
                        "Unknown Artist"}
                    </p>
                    {track.played_at && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {formatTimeAgo(track.played_at)}
                      </p>
                    )}
                  </div>
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
          )) || []}
        </div>
      </ScrollArea>
    </div>
  );
};
