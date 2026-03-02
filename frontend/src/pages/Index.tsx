import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
import { Song } from "@/types/music";
import { Link } from "react-router-dom";
import { apiUrl } from "@/lib/api";

interface TrendingAlbum {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverUrl: string;
  spotifyUrl: string | null;
}

const Index = () => {
  const reviews = useReviewStore((s) => s.reviews);
  const [trendingAlbums, setTrendingAlbums] = useState<TrendingAlbum[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoadingTrending(true);
      setTrendingError(null);

      try {
        const response = await fetch(apiUrl("/api/trending"), {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load trending music.");
        }

        setTrendingAlbums(Array.isArray(data.albums) ? data.albums : []);
        setTrendingSongs(Array.isArray(data.tracks) ? data.tracks : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setTrendingAlbums([]);
        setTrendingSongs([]);
        setTrendingError(error instanceof Error ? error.message : "Failed to load trending music.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTrending(false);
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
            Rate albums, curate your Top 5, and find listeners who hear the world like you do.
          </p>
        </div>
      </section>

      {/* Trending Albums */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Trending Albums</h2>
          </div>
        </div>
        {isLoadingTrending ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Loading trending Spotify albums...
          </div>
        ) : trendingError ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            {trendingError}
          </div>
        ) : trendingAlbums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {trendingAlbums.map((album, index) => (
              <a
                key={album.id}
                href={album.spotifyUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="overflow-hidden rounded-lg border border-border bg-card/70">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
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
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            No trending albums are available right now.
          </div>
        )}
      </section>

      {/* Trending Songs */}
      <section className="container pb-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Trending Songs</h2>
          </div>
        </div>
        {isLoadingTrending ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Loading trending Spotify songs...
          </div>
        ) : trendingError ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            {trendingError}
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
