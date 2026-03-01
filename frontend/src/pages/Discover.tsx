import { getTasteMatches, albums, allSongs } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { TasteMatchCard } from "@/components/TasteMatchCard";
import { ReviewCard } from "@/components/ReviewCard";
import { AlbumCard } from "@/components/AlbumCard";
import { Search, Music, Activity, Mic2 } from "lucide-react";
import { useState } from "react";
import { MatchMode } from "@/types/music";
import { cn } from "@/lib/utils";

const matchTabs: { mode: MatchMode; label: string; icon: typeof Music; description: string }[] = [
  { mode: "top5", label: "Top 5", icon: Music, description: "Based on shared Top 5 songs" },
  { mode: "activity", label: "Activity", icon: Activity, description: "Based on recently reviewed albums" },
  { mode: "artists", label: "Artists", icon: Mic2, description: "Based on favorite artists" },
];

export default function Discover() {
  const reviews = useReviewStore((s) => s.reviews);
  const [search, setSearch] = useState("");
  const [matchMode, setMatchMode] = useState<MatchMode>("top5");

  const matches = getTasteMatches(matchMode);

  const filteredAlbums = albums.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.artist.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSongs = search
    ? allSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.artist.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="container py-10 max-w-5xl">
      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search albums, songs, artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-12 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
      </div>

      {/* Search results */}
      {search && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold mb-4">Search Results</h2>
          {filteredSongs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Songs</h3>
              <div className="grid gap-2">
                {filteredSongs.slice(0, 5).map((song) => (
                  <div key={song.id} className="flex items-center gap-3 rounded-lg bg-card border border-border p-3">
                    <img src={song.coverUrl} alt={song.albumTitle} className="h-10 w-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.artist}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{song.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {filteredAlbums.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {filteredAlbums.map((a) => <AlbumCard key={a.id} album={a} />)}
              </div>
            </div>
          )}
          {filteredAlbums.length === 0 && filteredSongs.length === 0 && (
            <p className="text-muted-foreground text-sm">No results found.</p>
          )}
        </section>
      )}

      {/* Taste Matches */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-2">Your Taste Matches</h2>

        {/* Match mode tabs */}
        <div className="flex gap-2 mt-4 mb-6">
          {matchTabs.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setMatchMode(mode)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                matchMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          {matchTabs.find((t) => t.mode === matchMode)?.description}
        </p>

        <div className="grid gap-4">
          {matches.map((match, i) => (
            <div key={match.user.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <TasteMatchCard match={match} />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Community Activity */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold mb-2">Community Activity</h2>
        <p className="text-muted-foreground text-sm mb-6">What people are listening to and reviewing</p>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.slice(0, 6).map((review, i) => (
            <div key={review.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
