import { Review } from "@/types/music";
import { RatingStars } from "./RatingStars";
import { Link } from "react-router-dom";

export function ReviewCard({ review }: { review: Review }) {
  const detailLink = review.songId ? `/song/${review.songId}` : `/album/${review.albumId}`;

  return (
    <div className="flex gap-4 rounded-xl bg-card p-4 border border-border card-hover">
      <Link to={detailLink} className="shrink-0">
        <img src={review.albumCover} alt={review.albumTitle} className="h-20 w-20 rounded-lg object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={detailLink} className="font-semibold text-sm hover:text-primary transition-colors truncate block">
              {review.albumTitle}
            </Link>
            <Link to={`/artist/${encodeURIComponent(review.artist)}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {review.artist}
            </Link>
          </div>
          <RatingStars rating={review.rating} size="sm" />
        </div>
        <p className="mt-2 text-sm text-secondary-foreground leading-relaxed line-clamp-2">{review.text}</p>
        <div className="mt-2 flex items-center gap-2">
          <Link to={`/user/${review.userId}`}>
            <img src={review.avatarUrl} alt={review.username} className="h-5 w-5 rounded-full" />
          </Link>
          <Link to={`/user/${review.userId}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">{review.username}</Link>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{review.date}</span>
        </div>
      </div>
    </div>
  );
}
