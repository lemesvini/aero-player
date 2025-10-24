import { Music, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

interface PlaylistsProps {
  playlists: Playlist[];
  onPlaylistSelect: (playlistId: string) => void;
}

export const Playlists = ({ playlists, onPlaylistSelect }: PlaylistsProps) => {
  return (
    <div className="glass-panel glass-highlight rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Music className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your Playlists</h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          {playlists.map((playlist) => (
            <Button
              key={playlist.id}
              variant="ghost"
              onClick={() => onPlaylistSelect(playlist.id)}
              className="w-full justify-start gap-3 h-auto py-3 px-3 hover:bg-muted/50"
            >
              <div className="relative">
                {playlist.images[0]?.url ? (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="w-12 h-12 rounded object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium truncate text-sm">
                  {playlist.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {playlist.tracks.total} tracks • {playlist.owner.display_name}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
