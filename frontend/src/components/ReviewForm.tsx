import { useState } from "react";
import { RatingStars } from "./RatingStars";
import { useReviewStore } from "@/stores/reviewStore";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  albumId: string;
  albumTitle: string;
  albumCover: string;
  artist: string;
}

const MAX_REVIEW_LENGTH = 500;

export function ReviewForm({ albumId, albumTitle, albumCover, artist }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addReview = useReviewStore((s) => s.addReview);

  const trimmedText = text.trim();
  const canSubmit = rating > 0 && trimmedText.length > 0 && trimmedText.length <= MAX_REVIEW_LENGTH;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    // Simulate a brief delay
    setTimeout(() => {
      addReview({
        albumId,
        albumTitle,
        albumCover,
        artist,
        rating,
        text: trimmedText,
      });
      setRating(0);
      setText("");
      setIsSubmitting(false);
      toast.success("Review posted!");
    }, 300);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="font-semibold text-sm mb-3">Write a Review</h3>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1.5">Rating</p>
        <RatingStars rating={rating} size="lg" interactive onRate={setRating} />
      </div>

      <div className="mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you think?"
          maxLength={MAX_REVIEW_LENGTH}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-shadow"
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
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="h-3.5 w-3.5" />
        {isSubmitting ? "Posting..." : "Post Review"}
      </button>
    </div>
  );
}
