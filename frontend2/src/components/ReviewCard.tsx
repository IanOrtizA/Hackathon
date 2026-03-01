import { motion } from "framer-motion";
import { Review } from "@/lib/data";
import StarRating from "./StarRating";
import { Heart, MessageCircle } from "lucide-react";

interface ReviewCardProps {
  review: Review;
  index?: number;
}

const ReviewCard = ({ review, index = 0 }: ReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors"
    >
      <img
        src={review.albumCover}
        alt={review.albumTitle}
        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground text-sm">{review.albumTitle}</p>
            <p className="text-xs text-muted-foreground">
              {review.albumArtist} · <span className="text-primary">{review.userName}</span>
            </p>
          </div>
          <StarRating rating={review.rating} size={12} />
        </div>
        <p className="text-sm text-secondary-foreground mt-2 line-clamp-3 leading-relaxed">
          {review.content}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <Heart size={13} />
            {review.likes}
          </button>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <MessageCircle size={13} />
            Reply
          </button>
          <span className="ml-auto">{review.date}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard;
