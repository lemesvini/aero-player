import { Music, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

interface PlaylistGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlists: Playlist[];
  onPlaylistSelect: (playlist: Playlist) => void;
}

export const PlaylistGalleryDialog = ({
  open,
  onOpenChange,
  playlists,
  onPlaylistSelect,
}: PlaylistGalleryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Your Playlists</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {playlists.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No playlists found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    onPlaylistSelect(playlist);
                    onOpenChange(false);
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
                >
                  {playlist.images?.[0]?.url ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-10 w-10 text-white" fill="white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium truncate">
                      {playlist.name}
                    </p>
                    <p className="text-white/70 text-xs truncate">
                      {playlist.owner.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
