import { useState } from "react";
import { RatingStars } from "./RatingStars";
import { useReviewStore } from "@/stores/reviewStore";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewFormProps {
  albumId: string;
  songId?: string;
  albumTitle: string;
  albumCover: string;
  artist: string;
}

const MAX_REVIEW_LENGTH = 500;

export function ReviewForm({ albumId, songId, albumTitle, albumCover, artist }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addReview = useReviewStore((s) => s.addReview);
  const { token, isAuthenticated } = useAuth();

  const trimmedText = text.trim();
  const canSubmit =
    isAuthenticated &&
    rating > 0 &&
    trimmedText.length > 0 &&
    trimmedText.length <= MAX_REVIEW_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      await addReview({
        albumId,
        songId,
        albumTitle,
        albumCover,
        artist,
        rating,
        text: trimmedText,
      }, token!);
      setRating(0);
      setText("");
      toast.success("Review posted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="font-semibold text-sm mb-3">Write a Review</h3>

      {!isAuthenticated && (
        <div className="mb-4 rounded-lg border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
          <p>Sign in to post a review tied to your profile.</p>
          <Link to="/auth" className="mt-3 inline-flex text-primary hover:underline">
            Go to Sign In
          </Link>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1.5">Rating</p>
        <RatingStars rating={rating} size="lg" interactive={isAuthenticated} onRate={setRating} />
      </div>

      <div className="mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you think?"
          maxLength={MAX_REVIEW_LENGTH}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-shadow"
          disabled={!isAuthenticated}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {trimmedText.length > 0 && rating === 0 && "Select a rating above"}
          </p>
          <p className={`text-xs ${trimmedText.length > MAX_REVIEW_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
            {trimmedText.length}/{MAX_REVIEW_LENGTH}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          void handleSubmit();
        }}
        disabled={!canSubmit || isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="h-3.5 w-3.5" />
        {isSubmitting ? "Posting..." : "Post Review"}
      </button>
    </div>
  );
}
