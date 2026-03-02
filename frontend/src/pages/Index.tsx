import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
import { Song } from "@/types/music";
import { Link } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { ExternalLink } from "lucide-react";

interface FeaturedAlbum {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverUrl: string;
  spotifyUrl: string;
}

interface FeaturedAlbumSeed {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  query: string;
}

interface SpotifyAlbumSearchResult {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverUrl: string;
  spotifyUrl?: string | null;
}

const FEATURED_ALBUM_SEEDS: FeaturedAlbumSeed[] = [
  {
    id: "debi-tirar-mas-fotos",
    title: "DeBÍ TiRAR MáS FOToS",
    artist: "Bad Bunny",
    year: 2025,
    query: "DeBÍ TiRAR MáS FOToS Bad Bunny",
  },
  {
    id: "art-of-loving",
    title: "The Art of Loving",
    artist: "Olivia Dean",
    year: 2025,
    query: "The Art of Loving Olivia Dean",
  },
  {
    id: "un-verano-sin-ti",
    title: "Un Verano Sin Ti",
    artist: "Bad Bunny",
    year: 2022,
    query: "Un Verano Sin Ti Bad Bunny",
  },
  {
    id: "life-of-a-showgirl",
    title: "The Life of a Showgirl",
    artist: "Taylor Swift",
    year: 2025,
    query: "The Life of a Showgirl Taylor Swift",
  },
  {
    id: "octane",
    title: "Octane",
    artist: "Don Toliver",
    year: 2026,
    query: "Octane Don Toliver",
  },
  {
    id: "the-romantic",
    title: "The Romantic",
    artist: "Bruno Mars",
    year: 2026,
    query: "The Romantic Bruno Mars",
  },
];

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function createFallbackFeaturedAlbum(seed: FeaturedAlbumSeed): FeaturedAlbum {
  return {
    id: seed.id,
    title: seed.title,
    artist: seed.artist,
    year: seed.year,
    coverUrl: "",
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(seed.query)}`,
  };
}

const Index = () => {
  const reviews = useReviewStore((s) => s.reviews);
  const [featuredAlbums, setFeaturedAlbums] = useState<FeaturedAlbum[]>(
    FEATURED_ALBUM_SEEDS.map(createFallbackFeaturedAlbum)
  );
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [isLoadingTrendingSongs, setIsLoadingTrendingSongs] = useState(true);
  const [trendingSongsError, setTrendingSongsError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      const nextFeaturedAlbums = await Promise.all(
        FEATURED_ALBUM_SEEDS.map(async (seed) => {
          try {
            const response = await fetch(
              apiUrl(`/api/search?q=${encodeURIComponent(seed.query)}&type=album&limit=1`),
              { signal: controller.signal }
            );
            const data = await readJson(response);

            if (!response.ok || !Array.isArray(data.albums) || data.albums.length === 0) {
              return createFallbackFeaturedAlbum(seed);
            }

            const album = data.albums[0] as SpotifyAlbumSearchResult;

            return {
              id: album.id || seed.id,
              title: album.title || seed.title,
              artist: album.artist || seed.artist,
              year: typeof album.year === "number" ? album.year : seed.year,
              coverUrl: album.coverUrl || "",
              spotifyUrl: album.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(seed.query)}`,
            };
          } catch {
            return createFallbackFeaturedAlbum(seed);
          }
        })
      );

      if (!controller.signal.aborted) {
        setFeaturedAlbums(nextFeaturedAlbums);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoadingTrendingSongs(true);
      setTrendingSongsError(null);

      try {
        const response = await fetch(apiUrl("/api/trending"), {
          signal: controller.signal,
        });
        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load trending music.");
        }

        let nextTracks = Array.isArray(data.tracks) ? data.tracks : [];

        if (nextTracks.length === 0) {
          const currentYear = new Date().getFullYear();
          const trackResponse = await fetch(
            apiUrl(`/api/search?q=${encodeURIComponent(`year:${currentYear}`)}&type=track&limit=8`),
            { signal: controller.signal }
          );
          const trackData = await readJson(trackResponse);

          if (trackResponse.ok) {
            nextTracks = Array.isArray(trackData.tracks) ? trackData.tracks : [];
          }
        }

        setTrendingSongs(nextTracks);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        try {
          const currentYear = new Date().getFullYear();
          const trackResponse = await fetch(
            apiUrl(`/api/search?q=${encodeURIComponent(`year:${currentYear}`)}&type=track&limit=8`),
            { signal: controller.signal }
          );
          const trackData = await readJson(trackResponse);

          if (!trackResponse.ok) {
            throw new Error("Failed to load Spotify songs.");
          }

          if (controller.signal.aborted) {
            return;
          }

          setTrendingSongs(Array.isArray(trackData.tracks) ? trackData.tracks : []);
        } catch (fallbackError) {
          if (controller.signal.aborted) {
            return;
          }

          setTrendingSongs([]);
          setTrendingSongsError(
            fallbackError instanceof Error
              ? fallbackError.message
              : (error instanceof Error ? error.message : "Failed to load trending music.")
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTrendingSongs(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[420px] overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="container relative flex h-full flex-col justify-end pb-12">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Your music,<br />
            <span className="text-gradient">your story.</span>
          </h1>
          <p className="mt-4 max-w-md text-secondary-foreground text-lg">
            Rate albums, curate your favorites, and find listeners who hear the world like you do.
          </p>
        </div>
      </section>

      {/* Featured Albums */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Featured Albums</h2>
            <p className="mt-1 text-sm text-muted-foreground">A handpicked shelf hydrated with Spotify metadata.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
          {featuredAlbums.map((album, index) => (
            <a
              key={album.id}
              href={album.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {album.coverUrl ? (
                <div className="overflow-hidden rounded-lg border border-border bg-card/70 shadow-lg">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-card/70 p-4 text-foreground shadow-lg">
                  <div className="flex h-full flex-col justify-between rounded-md border border-border/70 bg-background/80 p-3">
                    <p className="line-clamp-3 text-lg font-black uppercase tracking-tight">{album.title}</p>
                    <div>
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.18em]">{album.artist}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        Open in Spotify
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-3 space-y-1">
                <h3 className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                  {album.title}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {album.artist}
                  {album.year ? ` · ${album.year}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Trending Songs */}
      <section className="container pb-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Trending Songs</h2>
          </div>
        </div>
        {isLoadingTrendingSongs ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Loading trending Spotify songs...
          </div>
        ) : trendingSongsError ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            {trendingSongsError}
          </div>
        ) : trendingSongs.length > 0 ? (
          <div className="grid gap-3">
            {trendingSongs.map((song, index) => (
              <Link
                key={song.id}
                to={`/song/${song.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card/70 p-4 transition-colors hover:bg-secondary/30 animate-fade-in"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.albumTitle}</p>
                </div>
                <span className="text-xs text-muted-foreground">{song.duration}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            No trending songs are available right now.
          </div>
        )}
      </section>

      {/* Recent Reviews */}
      <section className="container pb-16">
        <h2 className="font-display text-2xl font-bold mb-6">Recent Reviews</h2>
        {reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review, i) => (
              <div key={review.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Community reviews will populate here once Mongo review data is live.
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
