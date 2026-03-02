import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, Star } from "lucide-react";
import { PROFILE_COLORS } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { AuthenticatedUser, Song } from "@/types/music";
import { apiUrl } from "@/lib/api";
import { getProfileAreaTheme } from "@/lib/profileTheme";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FAVORITE_SONGS = 4;

export default function LikedSongs() {
  const { id } = useParams();
  const {
    user: authUser,
    isAuthenticated,
    isLoading: isAuthLoading,
    updateProfile,
  } = useAuth();
  const [profileUser, setProfileUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingFavorites, setIsUpdatingFavorites] = useState(false);
  const [pendingReplacementSong, setPendingReplacementSong] = useState<Song | null>(null);

  useEffect(() => {
    if (!id) {
      if (!isAuthenticated || !authUser) {
        setProfileUser(null);
        setError("Profile access requires login.");
        setIsLoading(false);
        return;
      }

      setProfileUser(authUser);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (authUser && authUser.id === id) {
      setProfileUser(authUser);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(apiUrl(`/api/users/${encodeURIComponent(id)}`), {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "User not found.");
        }

        setProfileUser(data.user ?? null);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setProfileUser(null);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load user.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [authUser, id, isAuthenticated]);

  if (isAuthLoading && !id) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading liked songs...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading liked songs...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{error || "User not found."}</p>
        <Link to={id ? `/user/${id}` : "/profile"} className="mt-3 inline-block text-sm text-primary hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  const likedSongs = profileUser.likedSongs || [];
  const storedFavoriteSongs = profileUser.favoriteSongs || [];
  const favoriteSongIds = new Set(storedFavoriteSongs.map((song) => song.id));
  const likedSongsById = new Map(likedSongs.map((song) => [song.id, song]));
  const favoriteSongs = storedFavoriteSongs.map((song) => likedSongsById.get(song.id) ?? song);
  const activeProfileColor = profileUser.profileColor || PROFILE_COLORS[0].value;
  const profileTheme = getProfileAreaTheme(activeProfileColor);
  const backLink = id ? `/user/${profileUser.id}` : "/profile";
  const isOwnLikedSongs = Boolean(authUser && authUser.id === profileUser.id);
  const accentStyle = { color: `hsl(${activeProfileColor})` };

  async function persistFavoriteSongs(nextFavoriteSongs: Song[], successMessage: string) {
    const previousFavoriteSongs = favoriteSongs;

    try {
      setIsUpdatingFavorites(true);
      setProfileUser((currentProfile) => (
        currentProfile
          ? { ...currentProfile, favoriteSongs: nextFavoriteSongs }
          : currentProfile
      ));
      await updateProfile({ favoriteSongs: nextFavoriteSongs });
      toast.success(successMessage);
    } catch (favoriteError) {
      setProfileUser((currentProfile) => (
        currentProfile
          ? { ...currentProfile, favoriteSongs: previousFavoriteSongs }
          : currentProfile
      ));
      toast.error(favoriteError instanceof Error ? favoriteError.message : "Failed to update favorites.");
    } finally {
      setIsUpdatingFavorites(false);
    }
  }

  async function handleFavoriteToggle(songId: string) {
    if (!isOwnLikedSongs || !authUser) {
      return;
    }

    const song = likedSongs.find((entry) => entry.id === songId);

    if (!song) {
      return;
    }

    const isFavorite = favoriteSongIds.has(songId);

    if (!isFavorite && favoriteSongs.length >= MAX_FAVORITE_SONGS) {
      setPendingReplacementSong(song);
      return;
    }

    const nextFavoriteSongs = isFavorite
      ? favoriteSongs.filter((entry) => entry.id !== songId)
      : [...favoriteSongs, song];

    await persistFavoriteSongs(nextFavoriteSongs, isFavorite ? "Removed from favorites." : "Added to favorites.");
  }

  async function handleFavoriteReplace(replacedSongId: string) {
    if (!pendingReplacementSong) {
      return;
    }

    const nextFavoriteSongs = [
      ...favoriteSongs.filter((song) => song.id !== replacedSongId),
      pendingReplacementSong,
    ];

    setPendingReplacementSong(null);
    await persistFavoriteSongs(nextFavoriteSongs, "Favorite song replaced.");
  }

  return (
    <div className="min-h-screen" style={profileTheme.page}>
      <div className="container max-w-4xl py-10">
        <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          {id ? "Back to Profile" : "Back to Your Profile"}
        </Link>

        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Collection</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Liked Songs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profileUser.displayName}'s full liked songs list.
          </p>
          {isOwnLikedSongs && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <p>
                Pick up to {MAX_FAVORITE_SONGS} songs here to feature at the top of your profile.
              </p>
              <span
                className="inline-flex rounded-full border px-3 py-1 font-medium"
                style={{
                  ...profileTheme.subtlePanel,
                  borderColor: `hsl(${activeProfileColor} / 0.35)`,
                  color: `hsl(${activeProfileColor})`,
                }}
              >
                {favoriteSongs.length}/{MAX_FAVORITE_SONGS} selected
              </span>
            </div>
          )}
        </div>

        {likedSongs.length > 0 ? (
          <div className="grid gap-3">
            {likedSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                style={profileTheme.panel}
              >
                <Link to={`/song/${song.id}`}>
                  <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/song/${song.id}`} className="block truncate font-semibold hover:text-primary transition-colors">
                    {song.title}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{song.artist} · {song.albumTitle}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{song.duration}</span>
                </div>
                {isOwnLikedSongs && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleFavoriteToggle(song.id);
                    }}
                    disabled={isUpdatingFavorites}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      favoriteSongIds.has(song.id)
                        ? "shadow-sm"
                        : "border-border bg-background/70 text-muted-foreground hover:text-foreground"
                    )}
                    style={favoriteSongIds.has(song.id)
                      ? {
                          backgroundColor: `hsl(${activeProfileColor} / 0.18)`,
                          borderColor: `hsl(${activeProfileColor} / 0.42)`,
                          color: `hsl(${activeProfileColor})`,
                          boxShadow: `0 0 0 1px hsl(${activeProfileColor} / 0.12)`,
                        }
                      : profileTheme.subtlePanel}
                    aria-label={favoriteSongIds.has(song.id) ? "Remove from favorites" : "Add to favorites"}
                    title={favoriteSongIds.has(song.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star
                      className={favoriteSongIds.has(song.id) ? "h-4 w-4 fill-current" : "h-4 w-4"}
                      style={favoriteSongIds.has(song.id) ? accentStyle : undefined}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground"
            style={profileTheme.subtlePanel}
          >
            No liked songs yet.
          </div>
        )}
      </div>

      {pendingReplacementSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            style={profileTheme.panel}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={accentStyle}>Favorite Limit Reached</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Replace a current favorite</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You can only keep {MAX_FAVORITE_SONGS} favorite songs. Choose one to replace with {pendingReplacementSong.title}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingReplacementSong(null)}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                style={profileTheme.subtlePanel}
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {favoriteSongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    void handleFavoriteReplace(song.id);
                  }}
                  disabled={isUpdatingFavorites}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-background/60 p-4 text-left transition-colors hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-60"
                  style={profileTheme.subtlePanel}
                >
                  <img src={song.coverUrl} alt={song.albumTitle} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{song.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{song.artist} · {song.albumTitle}</p>
                  </div>
                  <span className="text-xs font-medium" style={accentStyle}>Replace</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
