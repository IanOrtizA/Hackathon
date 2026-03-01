import { TasteMatch } from "@/types/music";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

function getMatchColor(pct: number) {
  if (pct >= 60) return "text-match-high";
  if (pct >= 40) return "text-match-medium";
  return "text-match-low";
}

function getMatchBg(pct: number) {
  if (pct >= 60) return "bg-match-high/10 border-match-high/20";
  if (pct >= 40) return "bg-match-medium/10 border-match-medium/20";
  return "bg-muted border-border";
}

export function TasteMatchCard({ match }: { match: TasteMatch }) {
  return (
    <Link to={`/user/${match.user.id}`} className={cn("rounded-xl border p-5 card-hover block", getMatchBg(match.matchPercentage))}>
      <div className="flex items-center gap-3">
        <img src={match.user.avatarUrl} alt={match.user.displayName} className="h-12 w-12 rounded-full ring-2 ring-border" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{match.user.displayName}</p>
          <p className="text-xs text-muted-foreground">@{match.user.username} · {match.user.totalRatings} ratings</p>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold font-display", getMatchColor(match.matchPercentage))}>
            {match.matchPercentage}%
          </p>
          <p className="text-xs text-muted-foreground">match</p>
        </div>
      </div>

      {match.mode === "top5" && match.sharedSongs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Shared in Top 5</p>
          <div className="flex flex-wrap gap-2">
            {match.sharedSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-2 rounded-lg bg-background/50 px-2.5 py-1.5">
                <img src={song.coverUrl} alt={song.title} className="h-6 w-6 rounded" />
                <span className="text-xs font-medium truncate max-w-[100px]">{song.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {match.mode === "activity" && match.sharedAlbums && match.sharedAlbums.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Recently both listened to</p>
          <div className="flex flex-wrap gap-2">
            {match.sharedAlbums.map((album) => (
              <span key={album} className="rounded-lg bg-background/50 px-2.5 py-1.5 text-xs font-medium">{album}</span>
            ))}
          </div>
        </div>
      )}

      {match.mode === "artists" && match.sharedArtists && match.sharedArtists.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Shared favorite artists</p>
          <div className="flex flex-wrap gap-2">
            {match.sharedArtists.map((artist) => (
              <span key={artist} className="rounded-lg bg-background/50 px-2.5 py-1.5 text-xs font-medium">{artist}</span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
