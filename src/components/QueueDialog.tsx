import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface QueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: Track[];
  onRemoveFromQueue: (index: number) => void;
  onTrackSelect: (track: Track) => void;
}

export const QueueDialog = ({
  open,
  onOpenChange,
  queue,
  onRemoveFromQueue,
  onTrackSelect,
}: QueueDialogProps) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Queue ({queue.length} songs)</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <p>Queue is empty</p>
              <p className="text-sm mt-2">
                Right-click on songs to add them to queue
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 group border border-white/10"
                >
                  <button
                    onClick={() => onTrackSelect(track)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <img
                      src={
                        track.album.images?.[2]?.url ||
                        track.album.images?.[0]?.url
                      }
                      alt={track.album.name}
                      className="w-12 h-12 rounded object-cover shadow-sm"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate text-sm text-white">
                        {track.name}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {track.artists?.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    <span className="text-xs text-white/40">
                      {formatTime(track.duration_ms)}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveFromQueue(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
