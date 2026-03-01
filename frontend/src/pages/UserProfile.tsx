import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Mic2, Star } from "lucide-react";
import { PROFILE_COLORS } from "@/data/mockData";
import { ReviewCard } from "@/components/ReviewCard";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuth } from "@/contexts/AuthContext";
import { AuthenticatedUser } from "@/types/music";

export default function UserProfile() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const reviews = useReviewStore((state) => state.reviews);
  const [profileUser, setProfileUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProfileUser(null);
      setIsLoading(false);
      setError("User not found.");
      return;
    }

    if (authUser && authUser.id === id) {
      setProfileUser(authUser);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "User not found.");
        }

        setProfileUser(data.user ?? null);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setProfileUser(null);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load user.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [authUser, id]);

  const userReviews = useMemo(
    () => reviews.filter((review) => review.userId === profileUser?.id),
    [profileUser?.id, reviews]
  );

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading user profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{error || "User not found."}</p>
        <Link to="/discover" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Discover</Link>
      </div>
    );
  }

  const joinedLabel = profileUser.joinedDate
    ? new Date(profileUser.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Pending sync";

  return (
    <div className="min-h-screen">
      <div
        className="h-36 relative transition-colors duration-500"
        style={{ backgroundColor: `hsl(${profileUser.profileColor || PROFILE_COLORS[0].value})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container max-w-4xl -mt-14 relative z-10">
        <Link to="/discover" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>

        <div className="flex items-end gap-6 mt-2">
          <img
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            className="h-24 w-24 rounded-full ring-4 ring-background border-4 border-background"
          />
          <div className="flex-1 pb-2">
            <h1 className="font-display text-3xl font-bold">{profileUser.displayName}</h1>
            <p className="text-muted-foreground">@{profileUser.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                {profileUser.totalRatings} ratings
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {joinedLabel}
              </span>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            Favorite Artists
          </h2>
          {profileUser.favoriteArtists.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profileUser.favoriteArtists.map((artist) => (
                <div key={artist} className="rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium card-hover">
                  {artist}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
              This user has not added favorite artists yet.
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-5">Top 5 Songs</h2>
          {profileUser.topFive.length > 0 ? (
            <div className="grid gap-3">
              {profileUser.topFive.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 rounded-xl bg-card border border-border p-4"
                >
                  <span className="font-display text-3xl font-bold text-primary w-8 text-center">{index + 1}</span>
                  <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
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
              Top songs will appear after this user saves them.
            </p>
          )}
        </section>

        <section className="mt-10 pb-16">
          <h2 className="font-display text-2xl font-bold mb-5">Recent Reviews</h2>
          {userReviews.length > 0 ? (
            <div className="grid gap-4">
              {userReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
