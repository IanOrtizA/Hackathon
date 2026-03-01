import { useParams, Link } from "react-router-dom";
import { users, PROFILE_COLORS, currentUser, getTasteMatches } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import { Calendar, Star, Mic2, ArrowLeft, Percent } from "lucide-react";

export default function UserProfile() {
  const { id } = useParams();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Link to="/discover" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Discover</Link>
      </div>
    );
  }

  const reviews = useReviewStore((s) => s.reviews);
  const userReviews = reviews.filter((r) => r.userId === user.id);
  const isCurrentUser = user.id === currentUser.id;

  // Calculate match with current user
  const top5Match = !isCurrentUser ? getTasteMatches("top5").find((m) => m.user.id === user.id) : null;
  const artistMatch = !isCurrentUser ? getTasteMatches("artists").find((m) => m.user.id === user.id) : null;

  // Songs from their reviews that the current user hasn't reviewed — simple recs
  const recAlbumIds = userReviews
    .filter((r) => !reviews.some((cr) => cr.userId === currentUser.id && cr.albumId === r.albumId))
    .map((r) => r.albumId);

  const recReviews = userReviews.filter((r) => recAlbumIds.includes(r.albumId));

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div
        className="h-36 relative transition-colors duration-500"
        style={{ backgroundColor: `hsl(${user.profileColor || PROFILE_COLORS[0].value})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container max-w-4xl -mt-14 relative z-10">
        <Link to="/discover" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>

        {/* Header */}
        <div className="flex items-end gap-6 mt-2">
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-24 w-24 rounded-full ring-4 ring-background border-4 border-background"
          />
          <div className="flex-1 pb-2">
            <h1 className="font-display text-3xl font-bold">{user.displayName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                {user.totalRatings} ratings
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Match badges */}
        {!isCurrentUser && (top5Match || artistMatch) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {top5Match && (
              <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-3">
                <Percent className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{top5Match.matchPercentage}% Top 5 Match</p>
                  {top5Match.sharedSongs.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Shared: {top5Match.sharedSongs.map((s) => s.title).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
            {artistMatch && artistMatch.sharedArtists && artistMatch.sharedArtists.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-3">
                <Mic2 className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{artistMatch.matchPercentage}% Artist Match</p>
                  <p className="text-xs text-muted-foreground">
                    Shared: {artistMatch.sharedArtists.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorite Artists */}
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            Favorite Artists
          </h2>
          <div className="flex flex-wrap gap-3">
            {user.favoriteArtists.map((artist) => (
              <div key={artist} className="rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium card-hover">
                {artist}
              </div>
            ))}
          </div>
        </section>

        {/* Top 5 */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-5">Top 5 Songs</h2>
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
        </section>

        {/* Recommendations from this user */}
        {!isCurrentUser && recReviews.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold mb-2">Discover From {user.displayName}</h2>
            <p className="text-muted-foreground text-sm mb-5">Albums they loved that you haven't reviewed yet</p>
            <div className="grid gap-4">
              {recReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          </section>
        )}

        {/* Their reviews */}
        <section className="mt-10 pb-16">
          <h2 className="font-display text-2xl font-bold mb-5">Recent Reviews</h2>
          {userReviews.length > 0 ? (
            <div className="grid gap-4">
              {userReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
