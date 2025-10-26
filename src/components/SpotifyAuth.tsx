import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      const token = localStorage.getItem("spotify_access_token");
      if (token) {
        const response = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          onAuthSuccess(token);
        } else {
          localStorage.removeItem("spotify_access_token");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("spotify-auth", {
        body: { action: "authorize" },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
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
          <AvatarImage src={user.images?.[0]?.url} alt={user.display_name} />
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <img
            src="/newfavicon.png"
            alt="aero-player"
            className="w-24 h-24 border-2 border-white/30 rounded-full"
          />
        </div>

        {/* Title */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">aero-player</h1>
        </div>

        {/* Login Section */}
        <div className="space-y-6 pt-8 w-full">
          <Button
            onClick={handleLogin}
            className="w-full min-h-14 bg-[#1db954] text-white hover:bg-[#1ed760] font-medium text-base transition-all duration-200 border border-[#1db954]/20 shadow-lg flex items-center justify-center py-6"
            size="lg"
          >
            <svg
              className="w-8 h-8 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Connect with Spotify
          </Button>
        </div>

        {/* Footer */}
        {/* <div className="pt-12 text-center">
          <p className="text-xs text-white/30 font-light tracking-wide">
            © 2025 aero-player
          </p>
        </div> */}
      </div>
    </div>
  );
};
