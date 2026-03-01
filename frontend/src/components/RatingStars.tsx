import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const sizeMap = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-6 h-6" };

export function RatingStars({ rating, maxRating = 5, size = "md", interactive = false, onRate }: RatingStarsProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1;
        const filled = hover ? value <= hover : value <= Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              "transition-colors duration-150",
              filled ? "fill-star-filled text-star-filled" : "fill-transparent text-star-empty",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
            onMouseEnter={() => interactive && setHover(value)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onRate?.(value)}
          />
        );
      })}
    </div>
  );
}
