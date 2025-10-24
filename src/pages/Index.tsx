import { useState, useEffect } from 'react';
import { SpotifyAuth } from '@/components/SpotifyAuth';
import { SpotifyPlayer } from '@/components/SpotifyPlayer';
import { AlbumArtPanel } from '@/components/AlbumArtPanel';
import { RecentlyPlayed } from '@/components/RecentlyPlayed';
import { Playlists } from '@/components/Playlists';
import { useToast } from '@/hooks/use-toast';

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

const Index = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const { toast } = useToast();

  useEffect(() => {
    // Check for callback from Spotify OAuth
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      handleCallback(code);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchRecentlyPlayed();
      fetchPlaylists();
      fetchCurrentPlayback();
      
      const interval = setInterval(fetchCurrentPlayback, 3000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  const handleCallback = async (code: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spotify-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'callback', code }),
        }
      );

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        setAccessToken(data.access_token);
      }
    } catch (error) {
      console.error('Callback error:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Could not complete Spotify login',
        variant: 'destructive',
      });
    }
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('spotify_access_token');
      setAccessToken(null);
      throw new Error('Token expired');
    }
    
    return response;
  };

  const fetchRecentlyPlayed = async () => {
    try {
      const response = await fetchWithAuth(
        'https://api.spotify.com/v1/me/player/recently-played?limit=20'
      );
      const data = await response.json();
      
      if (data.items) {
        const tracks = data.items.map((item: any) => ({
          ...item.track,
          played_at: item.played_at,
        }));
        setRecentTracks(tracks);
      }
    } catch (error) {
      console.error('Error fetching recently played:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetchWithAuth(
        'https://api.spotify.com/v1/me/playlists?limit=50'
      );
      const data = await response.json();
      
      if (data.items) {
        setPlaylists(data.items);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchCurrentPlayback = async () => {
    try {
      const response = await fetchWithAuth(
        'https://api.spotify.com/v1/me/player'
      );
      
      if (response.status === 204) {
        return;
      }
      
      const data = await response.json();
      
      if (data.item) {
        setCurrentTrack(data.item);
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms || 0);
        setShuffle(data.shuffle_state);
        setRepeat(data.repeat_state);
      }
    } catch (error) {
      console.error('Error fetching playback:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      const endpoint = isPlaying ? 'pause' : 'play';
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/${endpoint}`,
        { method: 'PUT' }
      );
      setIsPlaying(!isPlaying);
    } catch (error) {
      toast({
        title: 'Playback Error',
        description: 'Make sure Spotify is active on a device',
        variant: 'destructive',
      });
    }
  };

  const handleNext = async () => {
    try {
      await fetchWithAuth(
        'https://api.spotify.com/v1/me/player/next',
        { method: 'POST' }
      );
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error('Error skipping track:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      await fetchWithAuth(
        'https://api.spotify.com/v1/me/player/previous',
        { method: 'POST' }
      );
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error('Error going to previous track:', error);
    }
  };

  const handleSeek = async (position: number) => {
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${position}`,
        { method: 'PUT' }
      );
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`,
        { method: 'PUT' }
      );
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const handleToggleShuffle = async () => {
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/shuffle?state=${!shuffle}`,
        { method: 'PUT' }
      );
      setShuffle(!shuffle);
    } catch (error) {
      console.error('Error toggling shuffle:', error);
    }
  };

  const handleToggleRepeat = async () => {
    try {
      const nextRepeat = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off';
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/repeat?state=${nextRepeat}`,
        { method: 'PUT' }
      );
      setRepeat(nextRepeat);
    } catch (error) {
      console.error('Error toggling repeat:', error);
    }
  };

  const handleTrackSelect = async (track: Track) => {
    try {
      await fetchWithAuth(
        'https://api.spotify.com/v1/me/player/play',
        {
          method: 'PUT',
          body: JSON.stringify({
            uris: [`spotify:track:${track.id}`],
          }),
        }
      );
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      toast({
        title: 'Playback Error',
        description: 'Make sure Spotify is active on a device',
        variant: 'destructive',
      });
    }
  };

  const handlePlaylistSelect = (playlistId: string) => {
    toast({
      title: 'Playlist Selected',
      description: 'Playlist view coming soon',
    });
  };

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
              <p className="text-sm text-muted-foreground">Windows 7 Style Media Player</p>
            </div>
            <SpotifyAuth onAuthSuccess={setAccessToken} />
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Album Art - Left on Desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <AlbumArtPanel track={currentTrack} />
          </div>

          {/* Player - Center on Desktop, Full on Mobile */}
          <div className="lg:col-span-6">
            <SpotifyPlayer
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
              shuffle={shuffle}
              repeat={repeat}
            />
          </div>

          {/* Library - Right on Desktop, Below on Mobile */}
          <div className="lg:col-span-3 space-y-4">
            <RecentlyPlayed
              tracks={recentTracks}
              onTrackSelect={handleTrackSelect}
              currentTrackId={currentTrack?.id}
            />
            <Playlists
              playlists={playlists}
              onPlaylistSelect={handlePlaylistSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
