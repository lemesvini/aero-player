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
}

interface AlbumArtPanelProps {
  track: Track | null;
}

export const AlbumArtPanel = ({ track }: AlbumArtPanelProps) => {
  if (!track) {
    return (
      <div className="glass-panel glass-highlight rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-muted/20 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">No track selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-highlight rounded-2xl p-6 space-y-6">
      {/* Album Art */}
      <div className="relative group">
        <img
          src={track.album.images?.[0]?.url}
          alt={track.album.name}
          className="w-full aspect-square object-cover rounded-2xl shadow-card"
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-transparent to-background/80" />
      </div>

      {/* Metadata */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold leading-tight">{track.name}</h2>
          <p className="text-lg text-muted-foreground mt-1">
            {track.artists?.map((a) => a.name).join(", ") || "Unknown Artist"}
          </p>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Album</span>
            <span className="text-right font-medium">{track.album.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Year</span>
            <span className="font-medium">
              {new Date(track.album.release_date).getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
