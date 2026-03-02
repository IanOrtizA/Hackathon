import { useParams, Link } from "react-router-dom";
import { allSongs, albums } from "@/data/mockData";
import { ReviewForm } from "@/components/ReviewForm";
import { PreviewClipButton } from "@/components/PreviewClipButton";
import { ReviewCard } from "@/components/ReviewCard";
import { useReviewStore } from "@/stores/reviewStore";
import { ArrowLeft, Clock, ExternalLink, Heart, Music } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Song } from "@/types/music";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function SongDetail() {
  const { id } = useParams();
  const fallbackSong = useMemo(() => allSongs.find((s) => s.id === id), [id]);
  const [song, setSong] = useState<Song | null>(fallbackSong ?? null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [songError, setSongError] = useState<string | null>(null);
  const [isUpdatingLikedSong, setIsUpdatingLikedSong] = useState(false);
  const reviews = useReviewStore((s) => s.reviews);
  const { user, isAuthenticated, updateProfile } = useAuth();

  useEffect(() => {
    if (!id) {
      setSong(null);
      setSongError(null);
      setIsLoadingSong(false);
      return;
    }

    if (fallbackSong) {
      setSong(fallbackSong);
      setSongError(null);
      setIsLoadingSong(false);
      return;
    }

    const controller = new AbortController();

    async function loadSong() {
      setIsLoadingSong(true);
      setSongError(null);

      try {
        const response = await fetch(apiUrl(`/api/tracks/${encodeURIComponent(id)}`), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Spotify track fetch failed");
        }

        const data = await response.json();
        setSong(data.track ?? null);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setSong(null);
        setSongError("Unable to load this song right now.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSong(false);
        }
      }
    }

    void loadSong();

    return () => {
      controller.abort();
    };
  }, [fallbackSong, id]);

  if (isLoadingSong) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading song...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{songError || "Song not found."}</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Go home</Link>
      </div>
    );
  }

  const album = albums.find((a) => a.id === song.albumId);
  const hasLocalAlbum = Boolean(album);
  const songReviews = reviews.filter((r) => r.songId === song.id);
  const likedSongs = user?.likedSongs || [];
  const isSongLiked = likedSongs.some((likedSong) => likedSong.id === song.id);

  async function handleToggleLikedSong() {
    if (!isAuthenticated || !user) {
      toast.error("Sign in to like songs.");
      return;
    }

    const nextLikedSongs = isSongLiked
      ? likedSongs.filter((likedSong) => likedSong.id !== song.id)
      : [song, ...likedSongs.filter((likedSong) => likedSong.id !== song.id)];

    try {
      setIsUpdatingLikedSong(true);
      await updateProfile({
        likedSongs: nextLikedSongs,
      });
      toast.success(isSongLiked ? "Removed from liked songs." : "Added to liked songs.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update liked songs.");
    } finally {
      setIsUpdatingLikedSong(false);
    }
  }

  return (
    <div className="container py-10 max-w-4xl">
      <Link to={hasLocalAlbum ? `/album/${song.albumId}` : "/discover"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> {hasLocalAlbum ? "Back to album" : "Back to discover"}
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        <div className="shrink-0">
          <img src={song.coverUrl} alt={song.albumTitle} className="w-52 h-52 rounded-xl object-cover shadow-2xl glow-md" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
            <Music className="h-4 w-4" />
            Song
          </div>
          <h1 className="font-display text-4xl font-bold">{song.title}</h1>
          {hasLocalAlbum ? (
            <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-lg text-muted-foreground mt-1 hover:text-primary transition-colors inline-block">
              {song.artist}
            </Link>
          ) : (
            <p className="text-lg text-muted-foreground mt-1">{song.artist}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            From{" "}
            {hasLocalAlbum ? (
              <Link to={`/album/${song.albumId}`} className="hover:text-primary transition-colors">
                {song.albumTitle}
              </Link>
            ) : (
              <span>{song.albumTitle}</span>
            )}
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {song.duration}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void handleToggleLikedSong();
              }}
              disabled={isUpdatingLikedSong}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isSongLiked
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border hover:bg-secondary/50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Heart className={`h-4 w-4 ${isSongLiked ? "fill-current" : ""}`} />
              {isSongLiked ? "Liked" : "Like Song"}
            </button>
            {song.previewUrl && (
              <PreviewClipButton previewUrl={song.previewUrl} />
            )}
            {song.spotifyUrl && (
              <a
                href={song.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Spotify
              </a>
            )}
          </div>
          {!song.previewUrl && (
            <p className="mt-3 text-xs text-muted-foreground">
              Spotify did not provide a 30-second preview clip for this track.
            </p>
          )}

        </div>
      </div>

      {/* Rate and Review */}
      <section className="mt-10">
        <ReviewForm
          albumId={song.albumId}
          songId={song.id}
          albumTitle={song.albumTitle}
          albumCover={song.coverUrl}
          artist={song.artist}
        />
      </section>

      {/* Song reviews */}
      {songReviews.length > 0 && (
        <section className="mt-8 pb-10">
          <h2 className="font-display text-xl font-bold mb-4">Reviews for {song.title} ({songReviews.length})</h2>
          <div className="grid gap-4">
            {songReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
