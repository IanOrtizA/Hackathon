import { useParams, Link } from "react-router-dom";
import { albums } from "@/data/mockData";
import { RatingStars } from "@/components/RatingStars";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { useReviewStore } from "@/stores/reviewStore";
import { ArrowLeft, Clock } from "lucide-react";
import { useState } from "react";

export default function AlbumDetail() {
  const { id } = useParams();
  const album = albums.find((a) => a.id === id);
  const [userRating, setUserRating] = useState(0);
  const reviews = useReviewStore((s) => s.reviews);
  const albumReviews = reviews.filter((r) => r.albumId === id && !r.songId);

  if (!album) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Album data will appear here once Spotify album syncing is connected.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Album Header */}
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="shrink-0">
          <img src={album.coverUrl} alt={album.title} className="w-56 h-56 rounded-xl object-cover shadow-2xl glow-md" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">{album.genre}</p>
          <h1 className="font-display text-4xl font-bold mt-1">{album.title}</h1>
          <p className="text-lg text-muted-foreground mt-1">
            <Link to={`/artist/${encodeURIComponent(album.artist)}`} className="hover:text-primary transition-colors">{album.artist}</Link>
            {" · "}{album.year}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <RatingStars rating={album.avgRating} size="lg" />
            <span className="text-lg font-semibold">{album.avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({album.totalRatings.toLocaleString()} ratings)</span>
          </div>

          {/* User rating */}
          <div className="mt-6 rounded-xl bg-card border border-border p-4">
            <p className="text-sm font-medium mb-2">Your rating</p>
            <RatingStars rating={userRating} size="lg" interactive onRate={setUserRating} />
            {userRating > 0 && (
              <p className="text-xs text-muted-foreground mt-2">You rated this {userRating}/5</p>
            )}
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4">Tracklist</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {album.songs.map((song, i) => (
            <Link
              to={`/song/${song.id}`}
              key={song.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
            >
              <span className="text-sm text-muted-foreground w-6 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {song.duration}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Write Review */}
      <section className="mt-10">
        <ReviewForm
          albumId={album.id}
          albumTitle={album.title}
          albumCover={album.coverUrl}
          artist={album.artist}
        />
      </section>

      {/* Reviews */}
      <section className="mt-8 pb-10">
        <h2 className="font-display text-xl font-bold mb-4">Reviews ({albumReviews.length})</h2>
        {albumReviews.length > 0 ? (
          <div className="grid gap-4">
            {albumReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  );
}
