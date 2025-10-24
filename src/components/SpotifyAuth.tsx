import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SpotifyUser {
  display_name: string;
  images: { url: string }[];
  id: string;
}

interface SpotifyAuthProps {
  onAuthSuccess: (accessToken: string) => void;
}

export const SpotifyAuth = ({ onAuthSuccess }: SpotifyAuthProps) => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('spotify_access_token');
      if (token) {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          onAuthSuccess(token);
        } else {
          localStorage.removeItem('spotify_access_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'authorize' }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/30">
          <AvatarImage src={user.images[0]?.url} alt={user.display_name} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{user.display_name}</p>
          <p className="text-xs text-muted-foreground">Connected</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hover-glow"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Connect to Spotify</h3>
        <p className="text-sm text-muted-foreground">
          Sign in with your Spotify account to start playing music
        </p>
      </div>
      <Button
        onClick={handleLogin}
        className="glow-primary bg-secondary hover:bg-secondary/90"
        size="lg"
      >
        Login with Spotify
      </Button>
    </div>
  );
};
