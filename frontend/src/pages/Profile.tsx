import { PROFILE_COLORS } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import { Calendar, Star, Palette, Mic2, Check, Camera, Pencil, Save, X, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getProfileAreaTheme } from "@/lib/profileTheme";

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_DISPLAY_NAME_LENGTH = 40;
const LIKED_SONG_PREVIEW_COUNT = 5;

export default function Profile() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const reviews = useReviewStore((s) => s.reviews);
  const userReviews = reviews.filter((r) => r.userId === user?.id);
  const [profileColor, setProfileColor] = useState(user?.profileColor || PROFILE_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "/placeholder.svg");
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState(user?.displayName || "");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const joinedLabel = user?.joinedDate
    ? new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Pending sync";
  const likedSongs = user?.likedSongs || [];
  const favoriteSongIds = new Set((user?.favoriteSongs || []).map((song) => song.id));
  const favoriteSongs = likedSongs.filter((song) => favoriteSongIds.has(song.id));
  const likedArtists = user?.likedArtists || [];
  const likedSongPreview = likedSongs.slice(0, LIKED_SONG_PREVIEW_COUNT);
  const hasMoreLikedSongs = likedSongs.length > LIKED_SONG_PREVIEW_COUNT;
  const profileTheme = getProfileAreaTheme(profileColor);
  const accentStyle = { color: `hsl(${profileColor})` };

  useEffect(() => {
    setProfileColor(user?.profileColor || PROFILE_COLORS[0].value);
  }, [user?.profileColor]);

  useEffect(() => {
    setAvatarPreview(user?.avatarUrl || "/placeholder.svg");
  }, [user?.avatarUrl]);

  useEffect(() => {
    setDisplayNameDraft(user?.displayName || "");
  }, [user?.displayName]);

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

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      toast.error("Profile images must be 2 MB or smaller.");
      return;
    }

    try {
      setIsUpdatingAvatar(true);
      const avatarUrl = await readFileAsDataUrl(file);
      setAvatarPreview(avatarUrl);
      await updateProfile({ avatarUrl });
      toast.success("Profile photo updated.");
    } catch (error) {
      setAvatarPreview(user?.avatarUrl || "/placeholder.svg");
      toast.error(error instanceof Error ? error.message : "Failed to update profile photo.");
    } finally {
      setIsUpdatingAvatar(false);
    }
  }

  async function handleDisplayNameSave() {
    const nextDisplayName = displayNameDraft.trim();

    if (!nextDisplayName) {
      toast.error("Display name cannot be empty.");
      return;
    }

    if (nextDisplayName === user.displayName) {
      setIsEditingDisplayName(false);
      return;
    }

    try {
      setIsUpdatingDisplayName(true);
      await updateProfile({ displayName: nextDisplayName });
      setIsEditingDisplayName(false);
      toast.success("Display name updated.");
    } catch (error) {
      setDisplayNameDraft(user.displayName);
      toast.error(error instanceof Error ? error.message : "Failed to update display name.");
    } finally {
      setIsUpdatingDisplayName(false);
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
    <div className="min-h-screen" style={profileTheme.page}>
      {/* Profile Banner */}
      <div
        className="h-40 relative transition-colors duration-500"
        style={profileTheme.banner}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border px-3 py-2 text-xs font-medium hover:bg-background/70 transition-colors"
          style={profileTheme.subtlePanel}
        >
          <Palette className="h-3.5 w-3.5" />
          Customize
        </button>

        {/* Color picker dropdown */}
        {showColorPicker && (
          <div
            className="absolute top-14 right-4 rounded-xl bg-card border border-border p-4 shadow-xl z-10 animate-scale-in"
            style={profileTheme.panel}
          >
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
                  style={{
                    backgroundImage: `linear-gradient(135deg, hsl(${color.value}), hsl(${color.value} / 0.58))`,
                    boxShadow: `0 10px 20px -14px hsl(${color.value} / 0.8)`,
                  }}
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
          <div className="relative shrink-0">
            <img
              src={avatarPreview}
              alt={user.displayName}
              className="h-28 w-28 rounded-full ring-4 ring-background border-4 border-background object-cover"
              style={profileTheme.avatar}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleAvatarChange(event);
              }}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUpdatingAvatar}
              className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              style={profileTheme.subtlePanel}
              aria-label="Upload profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              {isEditingDisplayName ? (
                <>
                  <input
                    type="text"
                    value={displayNameDraft}
                    onChange={(event) => setDisplayNameDraft(event.target.value)}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    disabled={isUpdatingDisplayName}
                    className="min-w-[220px] max-w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleDisplayNameSave();
                    }}
                    disabled={isUpdatingDisplayName}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                    style={profileTheme.subtlePanel}
                    aria-label="Save display name"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayNameDraft(user.displayName);
                      setIsEditingDisplayName(false);
                    }}
                    disabled={isUpdatingDisplayName}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                    style={profileTheme.subtlePanel}
                    aria-label="Cancel display name edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-bold">{user.displayName}</h1>
                  <button
                    type="button"
                    onClick={() => setIsEditingDisplayName(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-background"
                    style={profileTheme.subtlePanel}
                    aria-label="Edit display name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
            {isEditingDisplayName && (
              <p className="mt-1 text-xs text-muted-foreground">
                {displayNameDraft.trim().length}/{MAX_DISPLAY_NAME_LENGTH}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" style={accentStyle} />
                {user.totalRatings + userReviews.length} ratings
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {joinedLabel}
              </span>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5" style={accentStyle} />
              Favorite Songs
            </h2>
            {likedSongs.length > 0 && (
              <Link
                to="/profile/liked-songs"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Manage Favorites
              </Link>
            )}
          </div>
          {favoriteSongs.length > 0 ? (
            <div className="grid gap-3">
              {favoriteSongs.map((song) => (
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
                  <Star className="h-4 w-4 fill-current" style={accentStyle} />
                </div>
              ))}
            </div>
          ) : (
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
              Pick up to 4 songs from your liked songs list to feature them here.
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
                  to="/profile/liked-songs"
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
              Songs you like will appear here after you tap the heart on a song page.
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
                <div
                  key={artist}
                  className="rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium card-hover"
                  style={profileTheme.panel}
                >
                  {artist}
                </div>
              ))}
            </div>
          ) : (
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
              Artists from songs you like will be tracked here.
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
                  style={{
                    ...profileTheme.panel,
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <span className="font-display text-3xl font-bold w-8 text-center" style={accentStyle}>{i + 1}</span>
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
            <p
              className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground"
              style={profileTheme.subtlePanel}
            >
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image file."));
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file."));
    };

    reader.readAsDataURL(file);
  });
}
