import { PROFILE_COLORS } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import { Calendar, Star, Palette, Mic2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const reviews = useReviewStore((s) => s.reviews);
  const userReviews = reviews.filter((r) => r.userId === user?.id);
  const [profileColor, setProfileColor] = useState(user?.profileColor || PROFILE_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const joinedLabel = user?.joinedDate
    ? new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Pending sync";

  useEffect(() => {
    setProfileColor(user?.profileColor || PROFILE_COLORS[0].value);
  }, [user?.profileColor]);

  async function handleProfileColorSelect(colorValue: string) {
    setProfileColor(colorValue);
    setShowColorPicker(false);

    if (!isAuthenticated) {
      return;
    }

    try {
      await updateProfile({ profileColor: colorValue });
      toast.success("Profile updated.");
    } catch (error) {
      setProfileColor(user?.profileColor || PROFILE_COLORS[0].value);
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    }
  }

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-4xl font-bold">Profile access requires login.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Create an account or sign in so your profile can load from the database.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    );
  }

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
                  onClick={() => {
                    void handleProfileColorSelect(color.value);
                  }}
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
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-28 w-28 rounded-full ring-4 ring-background border-4 border-background"
          />
          <div className="flex-1 pb-2">
            <h1 className="font-display text-3xl font-bold">{user.displayName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                {user.totalRatings + userReviews.length} ratings
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {joinedLabel}
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
          {user.favoriteArtists.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {user.favoriteArtists.map((artist) => (
                <div
                  key={artist}
                  className="rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium card-hover"
                >
                  {artist}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
              Favorite artists will appear here after your Spotify profile is connected.
            </p>
          )}
        </section>

        {/* Top 5 */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-5">Top 5 Songs</h2>
          {user.topFive.length > 0 ? (
            <div className="grid gap-3">
              {user.topFive.map((song, i) => (
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
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
              Your Top 5 will be filled in once saved song data is available.
            </p>
          )}
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
