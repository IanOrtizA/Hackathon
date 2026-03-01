import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Album } from "@/lib/data";
import StarRating from "./StarRating";

interface AlbumCardProps {
  album: Album;
  index?: number;
  size?: "sm" | "md" | "lg";
}

const AlbumCard = ({ album, index = 0, size = "md" }: AlbumCardProps) => {
  const sizeClasses = {
    sm: "w-32",
    md: "w-44",
    lg: "w-56",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`${sizeClasses[size]} flex-shrink-0`}
    >
      <Link to={`/album/${album.id}`} className="group block">
        <div className="album-card-hover rounded-md overflow-hidden bg-card shadow-lg">
          <div className="aspect-square overflow-hidden">
            <img
              src={album.cover}
              alt={`${album.title} by ${album.artist}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        </div>
        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {album.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
          {size !== "sm" && (
            <div className="mt-1">
              <StarRating rating={album.rating} size={12} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default AlbumCard;
