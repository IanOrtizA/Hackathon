import { useParams, Link } from "react-router-dom";
import { allSongs, albums } from "@/data/mockData";
import { RatingStars } from "@/components/RatingStars";
import { ReviewForm } from "@/components/ReviewForm";
import { useReviewStore } from "@/stores/reviewStore";
import { ArrowLeft, Clock, Music } from "lucide-react";
import { useState } from "react";

export default function SongDetail() {
  const { id } = useParams();
  const song = allSongs.find((s) => s.id === id);
  const [userRating, setUserRating] = useState(0);
  const reviews = useReviewStore((s) => s.reviews);

  if (!song) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Song not found.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Go home</Link>
      </div>
    );
  }

  const album = albums.find((a) => a.id === song.albumId);
  const albumReviews = reviews.filter((r) => r.albumId === song.albumId);

  return (
    <div className="container py-10 max-w-4xl">
      <Link to={`/album/${song.albumId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to album
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
          <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-lg text-muted-foreground mt-1 hover:text-primary transition-colors inline-block">
            {song.artist}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            From{" "}
            <Link to={`/album/${song.albumId}`} className="hover:text-primary transition-colors">
              {song.albumTitle}
            </Link>
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {song.duration}
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

      {/* Write Review */}
      <section className="mt-10">
        <ReviewForm
          albumId={song.albumId}
          albumTitle={song.albumTitle}
          albumCover={song.coverUrl}
          artist={song.artist}
        />
      </section>

      {/* Related album reviews */}
      {albumReviews.length > 0 && (
        <section className="mt-8 pb-10">
          <h2 className="font-display text-xl font-bold mb-4">Reviews for {song.albumTitle} ({albumReviews.length})</h2>
          <div className="grid gap-4">
            {albumReviews.map((r) => (
              <div key={r.id} className="flex gap-4 rounded-xl bg-card p-4 border border-border">
                <Link to={`/user/${r.userId}`}>
                  <img src={r.avatarUrl} alt={r.username} className="h-10 w-10 rounded-full" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/user/${r.userId}`} className="text-sm font-semibold hover:text-primary transition-colors">{r.username}</Link>
                    <RatingStars rating={r.rating} size="sm" />
                  </div>
                  <p className="text-sm text-secondary-foreground mt-1">{r.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
