import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { ReviewCard } from "@/components/ReviewCard";
import { RatingStars } from "@/components/RatingStars";
import { ArrowLeft, Disc3 } from "lucide-react";
import { Song } from "@/types/music";
import { apiUrl } from "@/lib/api";
import { useReviewStore } from "@/stores/reviewStore";

interface ArtistAlbumSummary {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverUrl: string;
  totalTracks?: number;
  spotifyUrl?: string | null;
}

function normalizeArtistLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export default function ArtistDetail() {
  const { name } = useParams();
  const location = useLocation();
  const decodedName = decodeURIComponent(name || "");
  const reviews = useReviewStore((state) => state.reviews);
  const [spotifyAlbums, setSpotifyAlbums] = useState<ArtistAlbumSummary[]>([]);
  const [spotifyTracks, setSpotifyTracks] = useState<Song[]>([]);
  const [spotifyGenres, setSpotifyGenres] = useState<string[]>([]);
  const [spotifyImageUrl, setSpotifyImageUrl] = useState<string>("");
  const [isLoadingSpotifyArtist, setIsLoadingSpotifyArtist] = useState(Boolean(decodedName));
  const seededSongs = Array.isArray((location.state as { seededSongs?: Song[] } | null)?.seededSongs)
    ? ((location.state as { seededSongs?: Song[] }).seededSongs ?? []).filter((song) => song?.artist === decodedName)
    : [];
  const fallbackAlbums = seededSongs.reduce<ArtistAlbumSummary[]>((acc, song) => {
    if (!acc.some((album) => album.id === song.albumId)) {
      acc.push({
        id: song.albumId,
        title: song.albumTitle,
        artist: song.artist,
        year: new Date().getFullYear(),
        coverUrl: song.coverUrl,
        totalTracks: seededSongs.filter((entry) => entry.albumId === song.albumId).length,
        spotifyUrl: null,
      });
    }

    return acc;
  }, []);
  const combinedArtistAlbums = spotifyAlbums.length > 0
    ? spotifyAlbums
    : fallbackAlbums;
  const combinedArtistSongs = spotifyTracks.length > 0
    ? spotifyTracks
    : seededSongs;
  const artistReviews = reviews.filter((review) => review.artist === decodedName);

  useEffect(() => {
    if (!decodedName) {
      setSpotifyAlbums([]);
      setSpotifyTracks([]);
      setSpotifyGenres([]);
      setSpotifyImageUrl("");
      return;
    }

    const controller = new AbortController();
    setSpotifyAlbums([]);
    setSpotifyTracks([]);
    setSpotifyGenres([]);
    setSpotifyImageUrl("");
    setIsLoadingSpotifyArtist(true);

    void (async () => {
      try {
        const response = await fetch(apiUrl(`/api/artists/${encodeURIComponent(decodedName)}`), {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load artist.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setSpotifyAlbums(Array.isArray(data.albums) ? data.albums : []);
        setSpotifyTracks(Array.isArray(data.tracks) ? data.tracks : []);
        setSpotifyGenres(Array.isArray(data.artist?.genres) ? data.artist.genres : []);
        setSpotifyImageUrl(typeof data.artist?.imageUrl === "string" ? data.artist.imageUrl : "");
      } catch {
        try {
          const fallbackResponse = await fetch(
            apiUrl(`/api/search?q=${encodeURIComponent(decodedName)}&type=album,track&limit=20`),
            { signal: controller.signal }
          );
          const fallbackData = await fallbackResponse.json().catch(() => ({}));

          if (!fallbackResponse.ok) {
            throw new Error(typeof fallbackData?.error === "string" ? fallbackData.error : "Fallback artist search failed.");
          }

          if (controller.signal.aborted) {
            return;
          }

          const normalizedArtistName = normalizeArtistLabel(decodedName);
          const fallbackAlbums = Array.isArray(fallbackData.albums)
            ? fallbackData.albums.filter((album: ArtistAlbumSummary) =>
                normalizeArtistLabel(String(album.artist || "")).includes(normalizedArtistName)
              )
            : [];
          const fallbackTracks = Array.isArray(fallbackData.tracks)
            ? fallbackData.tracks.filter((track: Song) =>
                normalizeArtistLabel(String(track.artist || "")).includes(normalizedArtistName)
              )
            : [];

          setSpotifyAlbums(fallbackAlbums);
          setSpotifyTracks(fallbackTracks);
          setSpotifyGenres([]);
          setSpotifyImageUrl("");
        } catch {
          if (controller.signal.aborted) {
            return;
          }

          setSpotifyAlbums([]);
          setSpotifyTracks([]);
          setSpotifyGenres([]);
          setSpotifyImageUrl("");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSpotifyArtist(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [decodedName]);

  if (!isLoadingSpotifyArtist && combinedArtistAlbums.length === 0 && combinedArtistSongs.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Artist data will appear here once Spotify artist data is connected.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Go home</Link>
      </div>
    );
  }

  const avgRating = artistReviews.length > 0
    ? artistReviews.reduce((sum, review) => sum + review.rating, 0) / artistReviews.length
    : 0;

  const totalRatings = artistReviews.length;
  const genres = spotifyGenres.length > 0 ? spotifyGenres : (seededSongs.length > 0 ? ["From liked songs"] : []);
  const coverUrl = spotifyImageUrl || combinedArtistAlbums[0]?.coverUrl || combinedArtistSongs[0]?.coverUrl;

  return (
    <div className="container py-10 max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Artist Header */}
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="shrink-0 relative">
          <img src={coverUrl} alt={decodedName} className="w-48 h-48 rounded-full object-cover shadow-2xl glow-md" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-background/40 to-transparent" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
            <Disc3 className="h-4 w-4" />
            Artist
          </div>
          <h1 className="font-display text-4xl font-bold">{decodedName}</h1>
          <p className="text-muted-foreground mt-1">{genres.join(", ")}</p>

          <div className="mt-4 flex items-center gap-3">
            <RatingStars rating={avgRating} size="lg" />
            <span className="text-lg font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({totalRatings.toLocaleString()} ratings)</span>
          </div>

          <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
            <span>{combinedArtistAlbums.length} album{combinedArtistAlbums.length !== 1 ? "s" : ""}</span>
            <span>{combinedArtistSongs.length} song{combinedArtistSongs.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Discography */}
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Discography</h2>
          {isLoadingSpotifyArtist && (
            <p className="text-xs text-muted-foreground">Loading full discography...</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {combinedArtistAlbums.map((album, i) => (
            <div key={album.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              {album.spotifyUrl ? (
                <a
                  href={album.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <div className="overflow-hidden rounded-lg border border-border bg-card/70">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                      {album.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {album.artist}
                      {album.year ? ` · ${album.year}` : ""}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="group block">
                  <div className="overflow-hidden rounded-lg border border-border bg-card/70">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="truncate text-sm font-semibold">
                      {album.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {album.artist}
                      {album.year ? ` · ${album.year}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* All Songs */}
      {combinedArtistSongs.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-4">
            {spotifyTracks.length > 0 ? "Top Songs" : "Songs"}
          </h2>
          <div className="rounded-xl border border-border overflow-hidden">
            {combinedArtistSongs.map((song, i) => (
              <Link
                key={song.id}
                to={`/song/${song.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
              >
                <img src={song.coverUrl} alt={song.albumTitle} className="h-10 w-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.albumTitle}</p>
                </div>
                <span className="text-xs text-muted-foreground">{song.duration}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {artistReviews.length > 0 && (
        <section className="mt-10 pb-10">
          <h2 className="font-display text-2xl font-bold mb-4">Reviews</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {artistReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
