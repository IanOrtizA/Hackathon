import { useParams, Link } from "react-router-dom";
import { albums, allSongs, recentReviews } from "@/data/mockData";
import { AlbumCard } from "@/components/AlbumCard";
import { ReviewCard } from "@/components/ReviewCard";
import { RatingStars } from "@/components/RatingStars";
import { ArrowLeft, Disc3 } from "lucide-react";

export default function ArtistDetail() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name || "");
  const artistAlbums = albums.filter((a) => a.artist === decodedName);
  const artistSongs = allSongs.filter((s) => s.artist === decodedName);
  const artistReviews = recentReviews.filter((r) => r.artist === decodedName);

  if (artistAlbums.length === 0 && artistSongs.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Artist data will appear here once Spotify artist data is connected.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Go home</Link>
      </div>
    );
  }

  const avgRating = artistAlbums.length > 0
    ? artistAlbums.reduce((sum, a) => sum + a.avgRating, 0) / artistAlbums.length
    : 0;

  const totalRatings = artistAlbums.reduce((sum, a) => sum + a.totalRatings, 0);
  const genres = [...new Set(artistAlbums.map((a) => a.genre))];
  const coverUrl = artistAlbums[0]?.coverUrl;

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
            <span>{artistAlbums.length} album{artistAlbums.length !== 1 ? "s" : ""}</span>
            <span>{artistSongs.length} song{artistSongs.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Discography */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-5">Discography</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {artistAlbums.map((album, i) => (
            <div key={album.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <AlbumCard album={album} />
            </div>
          ))}
        </div>
      </section>

      {/* All Songs */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-4">Songs</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {artistSongs.map((song, i) => (
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
