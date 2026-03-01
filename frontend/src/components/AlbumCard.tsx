import { Link } from "react-router-dom";
import { Album } from "@/types/music";
import { RatingStars } from "./RatingStars";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <div className="group card-hover block">
      <Link to={`/album/${album.id}`} className="overflow-hidden rounded-lg block">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="mt-3 space-y-1">
        <Link to={`/album/${album.id}`}>
          <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
            {album.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground truncate">
          <Link to={`/artist/${encodeURIComponent(album.artist)}`} className="hover:text-primary transition-colors">
            {album.artist}
          </Link>
          {" · "}{album.year}
        </p>
        <div className="flex items-center gap-2">
          <RatingStars rating={album.avgRating} size="sm" />
          <span className="text-xs text-muted-foreground">{album.avgRating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
