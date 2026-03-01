import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

const StarRating = ({ rating, size = 14, showValue = false }: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const roundedUp = rating % 1 >= 0.75;

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars || (roundedUp && i < fullStars + 1)) {
            return <Star key={i} size={size} className="fill-star text-star" />;
          }
          if (i === fullStars && hasHalf) {
            return <StarHalf key={i} size={size} className="fill-star text-star" />;
          }
          return <Star key={i} size={size} className="text-muted-foreground/30" />;
        })}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

export default StarRating;
