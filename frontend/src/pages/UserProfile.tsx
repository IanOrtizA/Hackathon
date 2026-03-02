import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Heart, Mic2, Star, UserPlus, Users } from "lucide-react";
import { PROFILE_COLORS } from "@/data/mockData";
import { ReviewCard } from "@/components/ReviewCard";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuth } from "@/contexts/AuthContext";
import { AuthenticatedUser } from "@/types/music";
import { apiUrl } from "@/lib/api";
import { getProfileAreaTheme } from "@/lib/profileTheme";
import { toast } from "sonner";

export default function UserProfile() {
  const LIKED_SONG_PREVIEW_COUNT = 5;
  const { id } = useParams();
  const {
    user: authUser,
    isAuthenticated,
    sendFriendRequest,
    acceptFriendRequest,
  } = useAuth();
  const reviews = useReviewStore((state) => state.reviews);
  const [profileUser, setProfileUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingFriendship, setIsUpdatingFriendship] = useState(false);

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
        const response = await fetch(apiUrl(`/api/users/${encodeURIComponent(id)}`), {
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
  const likedSongs = profileUser.likedSongs || [];
  const storedFavoriteSongs = profileUser.favoriteSongs || [];
  const favoriteSongIds = new Set(storedFavoriteSongs.map((song) => song.id));
  const likedSongsById = new Map(likedSongs.map((song) => [song.id, song]));
  const favoriteSongs = storedFavoriteSongs.map((song) => likedSongsById.get(song.id) ?? song);
  const likedArtists = profileUser.likedArtists || [];
  const likedSongPreview = likedSongs.slice(0, LIKED_SONG_PREVIEW_COUNT);
  const hasMoreLikedSongs = likedSongs.length > LIKED_SONG_PREVIEW_COUNT;
  const activeProfileColor = profileUser.profileColor || PROFILE_COLORS[0].value;
  const profileTheme = getProfileAreaTheme(activeProfileColor);
  const accentStyle = { color: `hsl(${activeProfileColor})` };
  const isOwnProfile = authUser?.id === profileUser.id;
  const friendIds = authUser?.friendIds || [];
  const incomingFriendRequestIds = authUser?.incomingFriendRequestIds || [];
  const outgoingFriendRequestIds = authUser?.outgoingFriendRequestIds || [];
  const isFriend = friendIds.includes(profileUser.id);
  const hasIncomingRequest = incomingFriendRequestIds.includes(profileUser.id);
  const hasOutgoingRequest = outgoingFriendRequestIds.includes(profileUser.id);

  async function handleSendFriendRequest() {
    try {
      setIsUpdatingFriendship(true);
      await sendFriendRequest(profileUser.id);
      toast.success("Friend request sent.");
    } catch (friendError) {
      toast.error(friendError instanceof Error ? friendError.message : "Failed to send friend request.");
    } finally {
      setIsUpdatingFriendship(false);
    }
  }

  async function handleAcceptFriendRequest() {
    try {
      setIsUpdatingFriendship(true);
      await acceptFriendRequest(profileUser.id);
      toast.success("Friend request accepted.");
    } catch (friendError) {
      toast.error(friendError instanceof Error ? friendError.message : "Failed to accept friend request.");
    } finally {
      setIsUpdatingFriendship(false);
    }
  }

  return (
    <div className="min-h-screen" style={profileTheme.page}>
      <div
        className="h-36 relative transition-colors duration-500"
        style={profileTheme.banner}
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
            style={profileTheme.avatar}
          />
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold">{profileUser.displayName}</h1>
              {!isOwnProfile && isAuthenticated && (
                <>
                  {hasIncomingRequest ? (
                    <button
                      type="button"
                      onClick={() => {
                        void handleAcceptFriendRequest();
                      }}
                      disabled={isUpdatingFriendship}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-60"
                      style={profileTheme.subtlePanel}
                    >
                      <Users className="h-4 w-4" />
                      Accept Request
                    </button>
                  ) : isFriend ? (
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground"
                      style={profileTheme.subtlePanel}
                    >
                      <Users className="h-4 w-4" />
                      Friends
                    </span>
                  ) : hasOutgoingRequest ? (
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground"
                      style={profileTheme.subtlePanel}
                    >
                      <UserPlus className="h-4 w-4" />
                      Request Sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        void handleSendFriendRequest();
                      }}
                      disabled={isUpdatingFriendship}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-60"
                      style={profileTheme.subtlePanel}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-muted-foreground">@{profileUser.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" style={accentStyle} />
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
            <Star className="h-5 w-5" style={accentStyle} />
            Favorite Songs
          </h2>
          {favoriteSongs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {favoriteSongs.map((song) => (
                <Link
                  key={song.id}
                  to={`/song/${song.id}`}
                  className="rounded-2xl bg-card border border-border p-4 transition-transform hover:-translate-y-1"
                  style={profileTheme.panel}
                >
                  <div className="relative">
                    <img src={song.coverUrl} alt={song.albumTitle} className="aspect-square w-full rounded-xl object-cover" />
                    <div
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm"
                      style={profileTheme.subtlePanel}
                    >
                      <Star className="h-4 w-4 fill-current" style={accentStyle} />
                    </div>
                  </div>
                  <p className="mt-3 text-base font-semibold leading-tight">{song.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
              {isOwnProfile
                ? "Pick up to 4 songs from your liked songs list to feature them here."
                : "This user has not featured any favorite songs yet."}
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5" style={accentStyle} />
            Liked Songs
          </h2>
          {likedSongs.length > 0 ? (
            <>
              <div className="grid gap-3">
                {likedSongPreview.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 rounded-xl bg-card border border-border p-4"
                    style={profileTheme.panel}
                  >
                    <Link to={`/song/${song.id}`}>
                      <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/song/${song.id}`} className="block truncate font-semibold hover:text-primary transition-colors">
                        {song.title}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">{song.artist} · {song.albumTitle}</p>
                    </div>
                    {favoriteSongIds.has(song.id) && (
                      <Star className="h-4 w-4 shrink-0 fill-current" style={accentStyle} />
                    )}
                    <span className="text-xs text-muted-foreground">{song.duration}</span>
                  </div>
                ))}
              </div>
              {hasMoreLikedSongs && (
                <Link
                  to={`/user/${profileUser.id}/liked-songs`}
                  className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background/60"
                  style={profileTheme.subtlePanel}
                >
                  View More Songs
                </Link>
              )}
            </>
          ) : (
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
              This user has not liked any songs yet.
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <Mic2 className="h-5 w-5" style={accentStyle} />
            Liked Artists
          </h2>
          {likedArtists.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {likedArtists.map((artist) => (
                <Link
                  key={artist}
                  to={`/artist/${encodeURIComponent(artist)}`}
                  state={{
                    seededSongs: likedSongs.filter((song) => song.artist === artist),
                  }}
                  className="rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium card-hover"
                  style={profileTheme.panel}
                >
                  {artist}
                </Link>
              ))}
            </div>
          ) : (
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
              Liked artists will appear here once this user hearts songs.
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
                  style={profileTheme.panel}
                >
                  <span className="font-display text-3xl font-bold w-8 text-center" style={accentStyle}>{index + 1}</span>
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
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
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
