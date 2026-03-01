import { currentUser, PROFILE_COLORS } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import { Calendar, Star, Palette, Mic2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const reviews = useReviewStore((s) => s.reviews);
  const userReviews = reviews.filter((r) => r.userId === currentUser.id);
  const [profileColor, setProfileColor] = useState(PROFILE_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Profile Banner */}
      <div
        className="h-40 relative transition-colors duration-500"
        style={{ backgroundColor: `hsl(${profileColor})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border px-3 py-2 text-xs font-medium hover:bg-background/70 transition-colors"
        >
          <Palette className="h-3.5 w-3.5" />
          Customize
        </button>

        {/* Color picker dropdown */}
        {showColorPicker && (
          <div className="absolute top-14 right-4 rounded-xl bg-card border border-border p-4 shadow-xl z-10 animate-scale-in">
            <p className="text-xs font-semibold mb-3">Profile Background</p>
            <div className="grid grid-cols-4 gap-2">
              {PROFILE_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => { setProfileColor(color.value); setShowColorPicker(false); }}
                  className={cn(
                    "h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 relative",
                    profileColor === color.value ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                  style={{ backgroundColor: `hsl(${color.value})` }}
                  title={color.name}
                >
                  {profileColor === color.value && (
                    <Check className="h-3.5 w-3.5 text-primary absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container max-w-4xl -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex items-end gap-6">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            className="h-28 w-28 rounded-full ring-4 ring-background border-4 border-background"
          />
          <div className="flex-1 pb-2">
            <h1 className="font-display text-3xl font-bold">{currentUser.displayName}</h1>
            <p className="text-muted-foreground">@{currentUser.username}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                {currentUser.totalRatings + userReviews.length} ratings
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {new Date(currentUser.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Favorite Artists */}
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            Favorite Artists
          </h2>
          <div className="flex flex-wrap gap-3">
            {currentUser.favoriteArtists.map((artist) => (
              <div
                key={artist}
                className="rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium card-hover"
              >
                {artist}
              </div>
            ))}
          </div>
        </section>

        {/* Top 5 */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-5">Top 5 Songs</h2>
          <div className="grid gap-3">
            {currentUser.topFive.map((song, i) => (
              <div
                key={song.id}
                className="flex items-center gap-4 rounded-xl bg-card border border-border p-4 card-hover animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="font-display text-3xl font-bold text-primary w-8 text-center">{i + 1}</span>
                <Link to={`/album/${song.albumId}`}>
                  <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{song.artist} · {song.albumTitle}</p>
                </div>
                <span className="text-xs text-muted-foreground">{song.duration}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-10 pb-16">
          <h2 className="font-display text-2xl font-bold mb-5">Recent Activity</h2>
          {userReviews.length > 0 ? (
            <div className="grid gap-4">
              {userReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No recent reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
