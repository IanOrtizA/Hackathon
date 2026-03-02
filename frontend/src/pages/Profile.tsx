import { PROFILE_COLORS } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { ReviewCard } from "@/components/ReviewCard";
import { Calendar, Star, Palette, Mic2, Check, Camera, Pencil, Save, X, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Song } from "@/types/music";
import { toast } from "sonner";
import { getProfileAreaTheme } from "@/lib/profileTheme";

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_DISPLAY_NAME_LENGTH = 40;
const MAX_USERNAME_LENGTH = 30;
const LIKED_SONG_PREVIEW_COUNT = 5;
const MAX_FAVORITE_SONGS = 4;
const AVATAR_EDITOR_SIZE = 280;
const AVATAR_EXPORT_SIZE = 512;
const MAX_AVATAR_ZOOM = 3;
const RECENT_PROFILE_COLORS_STORAGE_KEY = "musicbox.profile.recent-colors";

interface PendingAvatarCrop {
  src: string;
  width: number;
  height: number;
}

export default function Profile() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const reviews = useReviewStore((s) => s.reviews);
  const userReviews = reviews.filter((r) => r.userId === user?.id);
  const [profileColor, setProfileColor] = useState(user?.profileColor || PROFILE_COLORS[0].value);
  const [recentProfileColors, setRecentProfileColors] = useState(() => loadRecentProfileColors());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingProfileColor, setPendingProfileColor] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "/placeholder.svg");
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [isUpdatingFavorites, setIsUpdatingFavorites] = useState(false);
  const [pendingReplacementSong, setPendingReplacementSong] = useState<Song | null>(null);
  const [pendingAvatarCrop, setPendingAvatarCrop] = useState<PendingAvatarCrop | null>(null);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [displayNameDraft, setDisplayNameDraft] = useState(user?.displayName || "");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username || "");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const joinedLabel = user?.joinedDate
    ? new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Pending sync";
  const likedSongs = user?.likedSongs || [];
  const storedFavoriteSongs = user?.favoriteSongs || [];
  const favoriteSongIds = new Set(storedFavoriteSongs.map((song) => song.id));
  const likedSongsById = new Map(likedSongs.map((song) => [song.id, song]));
  const favoriteSongs = storedFavoriteSongs.map((song) => likedSongsById.get(song.id) ?? song);
  const likedArtists = user?.likedArtists || [];
  const likedSongPreview = likedSongs.slice(0, LIKED_SONG_PREVIEW_COUNT);
  const hasMoreLikedSongs = likedSongs.length > LIKED_SONG_PREVIEW_COUNT;
  const profileTheme = getProfileAreaTheme(profileColor);
  const accentStyle = { color: `hsl(${profileColor})` };
  const selectedProfileColor = pendingProfileColor ?? profileColor;
  const avatarBaseScale = pendingAvatarCrop
    ? Math.max(
        AVATAR_EDITOR_SIZE / pendingAvatarCrop.width,
        AVATAR_EDITOR_SIZE / pendingAvatarCrop.height
      )
    : 1;
  const avatarDisplayWidth = pendingAvatarCrop
    ? pendingAvatarCrop.width * avatarBaseScale * avatarZoom
    : AVATAR_EDITOR_SIZE;
  const avatarDisplayHeight = pendingAvatarCrop
    ? pendingAvatarCrop.height * avatarBaseScale * avatarZoom
    : AVATAR_EDITOR_SIZE;
  const maxAvatarOffsetX = Math.max(0, (avatarDisplayWidth - AVATAR_EDITOR_SIZE) / 2);
  const maxAvatarOffsetY = Math.max(0, (avatarDisplayHeight - AVATAR_EDITOR_SIZE) / 2);

  useEffect(() => {
    setProfileColor(user?.profileColor || PROFILE_COLORS[0].value);
  }, [user?.profileColor]);

  useEffect(() => {
    setAvatarPreview(user?.avatarUrl || "/placeholder.svg");
  }, [user?.avatarUrl]);

  useEffect(() => {
    setDisplayNameDraft(user?.displayName || "");
  }, [user?.displayName]);

  useEffect(() => {
    saveRecentProfileColors(recentProfileColors);
  }, [recentProfileColors]);

  useEffect(() => {
    setUsernameDraft(user?.username || "");
  }, [user?.username]);

  async function handleProfileColorSelect(colorValue: string) {
    setProfileColor(colorValue);
    setRecentProfileColors((currentColors) => buildRecentProfileColors(currentColors, colorValue));
    setShowColorPicker(false);
    setPendingProfileColor(null);

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

  function toggleProfileColorPicker() {
    if (showColorPicker) {
      setShowColorPicker(false);
      setPendingProfileColor(null);
      return;
    }

    setPendingProfileColor(profileColor);
    setShowColorPicker(true);
  }

  async function handleProfileColorConfirm() {
    if (!pendingProfileColor) {
      return;
    }

    await handleProfileColorSelect(pendingProfileColor);
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
      const source = await readFileAsDataUrl(file);
      const image = await loadImageElement(source);
      setPendingAvatarCrop({
        src: source,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile photo.");
    }
  }

  function updateAvatarZoom(nextZoom: number) {
    const clampedZoom = clamp(nextZoom, 1, MAX_AVATAR_ZOOM);
    const nextDisplayWidth = pendingAvatarCrop
      ? pendingAvatarCrop.width * avatarBaseScale * clampedZoom
      : AVATAR_EDITOR_SIZE;
    const nextDisplayHeight = pendingAvatarCrop
      ? pendingAvatarCrop.height * avatarBaseScale * clampedZoom
      : AVATAR_EDITOR_SIZE;
    const nextMaxOffsetX = Math.max(0, (nextDisplayWidth - AVATAR_EDITOR_SIZE) / 2);
    const nextMaxOffsetY = Math.max(0, (nextDisplayHeight - AVATAR_EDITOR_SIZE) / 2);

    setAvatarZoom(clampedZoom);
    setAvatarOffsetX((current) => clamp(current, -nextMaxOffsetX, nextMaxOffsetX));
    setAvatarOffsetY((current) => clamp(current, -nextMaxOffsetY, nextMaxOffsetY));
  }

  function resetPendingAvatarCrop() {
    setPendingAvatarCrop(null);
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
  }

  async function handleAvatarCropSave() {
    if (!pendingAvatarCrop) {
      return;
    }

    try {
      setIsUpdatingAvatar(true);
      const avatarUrl = await renderCroppedAvatarDataUrl({
        crop: pendingAvatarCrop,
        zoom: avatarZoom,
        offsetX: avatarOffsetX,
        offsetY: avatarOffsetY,
      });
      setAvatarPreview(avatarUrl);
      await updateProfile({ avatarUrl });
      resetPendingAvatarCrop();
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

  async function handleFavoriteRemove(songId: string) {
    const nextFavoriteSongs = storedFavoriteSongs.filter((song) => song.id !== songId);

    await persistFavoriteSongs(nextFavoriteSongs, "Removed from favorites.");
  }

  async function persistFavoriteSongs(nextFavoriteSongs: Song[], successMessage: string) {
    try {
      setIsUpdatingFavorites(true);
      await updateProfile({ favoriteSongs: nextFavoriteSongs });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update favorites.");
    } finally {
      setIsUpdatingFavorites(false);
    }
  }

  async function handleFavoriteToggle(songId: string) {
    const song = likedSongsById.get(songId);

    if (!song) {
      return;
    }

    const isFavorite = favoriteSongIds.has(songId);

    if (!isFavorite && storedFavoriteSongs.length >= MAX_FAVORITE_SONGS) {
      setPendingReplacementSong(song);
      return;
    }

    const nextFavoriteSongs = isFavorite
      ? storedFavoriteSongs.filter((entry) => entry.id !== songId)
      : [...storedFavoriteSongs, song];

    await persistFavoriteSongs(nextFavoriteSongs, isFavorite ? "Removed from favorites." : "Added to favorites.");
  }

  async function handleFavoriteReplace(replacedSongId: string) {
    if (!pendingReplacementSong) {
      return;
    }

    const nextFavoriteSongs = [
      ...storedFavoriteSongs.filter((song) => song.id !== replacedSongId),
      pendingReplacementSong,
    ];

    setPendingReplacementSong(null);
    await persistFavoriteSongs(nextFavoriteSongs, "Favorite song replaced.");
  }

  async function handleUsernameSave() {
    const nextUsername = usernameDraft.trim().toLowerCase();

    if (!nextUsername) {
      toast.error("Username cannot be empty.");
      return;
    }

    if (/\s/.test(nextUsername)) {
      toast.error("Username cannot contain spaces.");
      return;
    }

    if (nextUsername === user.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      setIsUpdatingUsername(true);
      await updateProfile({ username: nextUsername });
      setIsEditingUsername(false);
      toast.success("Username updated.");
    } catch (error) {
      setUsernameDraft(user.username);
      toast.error(error instanceof Error ? error.message : "Failed to update username.");
    } finally {
      setIsUpdatingUsername(false);
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
          onClick={toggleProfileColorPicker}
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
              {recentProfileColors.map((colorValue, index) => (
                <button
                  key={`${colorValue}-${index}`}
                  onClick={() => {
                    setPendingProfileColor(colorValue);
                  }}
                  className={cn(
                    "h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 relative",
                    selectedProfileColor === colorValue ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                  style={{
                    backgroundImage: `linear-gradient(135deg, hsl(${colorValue}), hsl(${colorValue} / 0.58))`,
                    boxShadow: `0 10px 20px -14px hsl(${colorValue} / 0.8)`,
                  }}
                  title={`Recent color ${index + 1}`}
                >
                  {selectedProfileColor === colorValue && (
                    <Check className="h-3.5 w-3.5 text-primary absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <label className="flex items-center justify-between gap-3 text-xs font-medium">
                <span>Custom Color Wheel</span>
                <input
                  type="color"
                  value={hslStringToHex(selectedProfileColor)}
                  onChange={(event) => {
                    setPendingProfileColor(hexToHslString(event.target.value));
                  }}
                  className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-1"
                  aria-label="Choose custom profile color"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowColorPicker(false);
                  setPendingProfileColor(null);
                }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                style={profileTheme.subtlePanel}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleProfileColorConfirm();
                }}
                disabled={!pendingProfileColor || pendingProfileColor === profileColor}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Color
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="container max-w-4xl -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex items-end gap-6">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsAvatarLightboxOpen(true)}
              className="block rounded-full transition-transform hover:scale-[1.02]"
              aria-label="Open profile picture"
            >
              <img
                src={avatarPreview}
                alt={user.displayName}
                className="h-28 w-28 rounded-full ring-4 ring-background border-4 border-background object-cover"
                style={profileTheme.avatar}
              />
            </button>
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
            {isEditingUsername ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <input
                  type="text"
                  value={usernameDraft}
                  onChange={(event) => setUsernameDraft(event.target.value)}
                  maxLength={MAX_USERNAME_LENGTH}
                  disabled={isUpdatingUsername}
                  className="min-w-[200px] max-w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleUsernameSave();
                  }}
                  disabled={isUpdatingUsername}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                  style={profileTheme.subtlePanel}
                  aria-label="Save username"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameDraft(user.username);
                    setIsEditingUsername(false);
                  }}
                  disabled={isUpdatingUsername}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                  style={profileTheme.subtlePanel}
                  aria-label="Cancel username edit"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground">@{user.username}</p>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameDraft(user.username);
                    setIsEditingUsername(true);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-background"
                  style={profileTheme.subtlePanel}
                  aria-label="Edit username"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {isEditingDisplayName && (
              <p className="mt-1 text-xs text-muted-foreground">
                {displayNameDraft.trim().length}/{MAX_DISPLAY_NAME_LENGTH}
              </p>
            )}
            {isEditingUsername && (
              <p className="mt-1 text-xs text-muted-foreground">
                Username is used for your @handle and sign in. {usernameDraft.trim().length}/{MAX_USERNAME_LENGTH}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {favoriteSongs.map((song) => (
                <div
                  key={song.id}
                  className="rounded-2xl bg-card border border-border p-4 transition-transform hover:-translate-y-1"
                  style={profileTheme.panel}
                >
                  <div className="relative">
                    <Link to={`/song/${song.id}`}>
                      <img src={song.coverUrl} alt={song.albumTitle} className="aspect-square w-full rounded-xl object-cover" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void handleFavoriteRemove(song.id);
                      }}
                      disabled={isUpdatingFavorites}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                      style={profileTheme.subtlePanel}
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                    >
                      <Star className="h-4 w-4 fill-current" style={accentStyle} />
                    </button>
                  </div>
                  <Link to={`/song/${song.id}`} className="mt-3 block text-base font-semibold leading-tight hover:text-primary transition-colors">
                    {song.title}
                  </Link>
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
                    <button
                      type="button"
                      onClick={() => {
                        void handleFavoriteToggle(song.id);
                      }}
                      disabled={isUpdatingFavorites}
                      className={cn(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        favoriteSongIds.has(song.id)
                          ? "shadow-sm"
                          : "border-border bg-background/70 text-muted-foreground hover:text-foreground"
                      )}
                      style={favoriteSongIds.has(song.id)
                        ? {
                            backgroundColor: `hsl(${profileColor} / 0.18)`,
                            borderColor: `hsl(${profileColor} / 0.42)`,
                            color: `hsl(${profileColor})`,
                            boxShadow: `0 0 0 1px hsl(${profileColor} / 0.12)`,
                          }
                        : profileTheme.subtlePanel}
                      aria-label={favoriteSongIds.has(song.id) ? "Remove from favorites" : "Add to favorites"}
                      title={favoriteSongIds.has(song.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={favoriteSongIds.has(song.id) ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                    </button>
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

      {pendingReplacementSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            style={profileTheme.panel}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={accentStyle}>Favorite Limit Reached</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Replace a current favorite</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You can only keep {MAX_FAVORITE_SONGS} favorite songs. Choose one to replace with {pendingReplacementSong.title}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingReplacementSong(null)}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                style={profileTheme.subtlePanel}
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {favoriteSongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    void handleFavoriteReplace(song.id);
                  }}
                  disabled={isUpdatingFavorites}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-background/60 p-4 text-left transition-colors hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-60"
                  style={profileTheme.subtlePanel}
                >
                  <img src={song.coverUrl} alt={song.albumTitle} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{song.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{song.artist} · {song.albumTitle}</p>
                  </div>
                  <span className="text-xs font-medium" style={accentStyle}>Replace</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingAvatarCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
            style={profileTheme.panel}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={accentStyle}>Adjust Profile Photo</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Zoom and position your image</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set the crop before saving your new profile picture.
                </p>
              </div>
              <button
                type="button"
                onClick={resetPendingAvatarCrop}
                disabled={isUpdatingAvatar}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                style={profileTheme.subtlePanel}
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[auto,1fr]">
              <div className="mx-auto">
                <div
                  className="relative overflow-hidden rounded-full border-4 border-background bg-background/60 shadow-xl"
                  style={{
                    ...profileTheme.subtlePanel,
                    width: AVATAR_EDITOR_SIZE,
                    height: AVATAR_EDITOR_SIZE,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={pendingAvatarCrop.src}
                      alt="Avatar crop preview"
                      className="max-w-none select-none"
                      draggable={false}
                      style={{
                        width: avatarDisplayWidth,
                        height: avatarDisplayHeight,
                        transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Zoom</span>
                    <span className="text-muted-foreground">{avatarZoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={String(MAX_AVATAR_ZOOM)}
                    step="0.05"
                    value={avatarZoom}
                    onChange={(event) => updateAvatarZoom(Number(event.target.value))}
                    disabled={isUpdatingAvatar}
                    className="w-full accent-primary"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Horizontal Position</span>
                    <span className="text-muted-foreground">{Math.round(avatarOffsetX)} px</span>
                  </div>
                  <input
                    type="range"
                    min={String(-maxAvatarOffsetX)}
                    max={String(maxAvatarOffsetX)}
                    step="1"
                    value={avatarOffsetX}
                    onChange={(event) => setAvatarOffsetX(Number(event.target.value))}
                    disabled={isUpdatingAvatar || maxAvatarOffsetX === 0}
                    className="w-full accent-primary"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Vertical Position</span>
                    <span className="text-muted-foreground">{Math.round(avatarOffsetY)} px</span>
                  </div>
                  <input
                    type="range"
                    min={String(-maxAvatarOffsetY)}
                    max={String(maxAvatarOffsetY)}
                    step="1"
                    value={avatarOffsetY}
                    onChange={(event) => setAvatarOffsetY(Number(event.target.value))}
                    disabled={isUpdatingAvatar || maxAvatarOffsetY === 0}
                    className="w-full accent-primary"
                  />
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleAvatarCropSave();
                    }}
                    disabled={isUpdatingAvatar}
                    className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdatingAvatar ? "Saving..." : "Save Photo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarZoom(1);
                      setAvatarOffsetX(0);
                      setAvatarOffsetY(0);
                    }}
                    disabled={isUpdatingAvatar}
                    className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background/60 disabled:cursor-not-allowed disabled:opacity-60"
                    style={profileTheme.subtlePanel}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAvatarLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
          onClick={() => setIsAvatarLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsAvatarLightboxOpen(false)}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-colors hover:bg-background"
            style={profileTheme.subtlePanel}
            aria-label="Close profile picture"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={avatarPreview}
            alt={user.displayName}
            className="max-h-[85vh] max-w-[85vw] rounded-3xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
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

function hslStringToHex(hslValue: string) {
  const [hRaw, sRaw, lRaw] = hslValue.split(" ");
  const h = Number.parseFloat(hRaw);
  const s = Number.parseFloat(sRaw) / 100;
  const l = Number.parseFloat(lRaw) / 100;

  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    return "#4f46e5";
  }

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHslString(hexValue: string) {
  const normalizedHex = hexValue.replace("#", "");

  if (normalizedHex.length !== 6) {
    return PROFILE_COLORS[0].value;
  }

  const r = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;

  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
  }

  hue = Math.round(hue * 60);

  if (hue < 0) {
    hue += 360;
  }

  const saturation = delta === 0
    ? 0
    : delta / (1 - Math.abs(2 * lightness - 1));

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function loadRecentProfileColors() {
  const defaultColors = PROFILE_COLORS.map((color) => color.value);

  if (typeof window === "undefined") {
    return defaultColors;
  }

  try {
    const storedValue = window.localStorage.getItem(RECENT_PROFILE_COLORS_STORAGE_KEY);

    if (!storedValue) {
      return defaultColors;
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return defaultColors;
    }

    return buildRecentProfileColors(
      parsedValue.filter((color): color is string => typeof color === "string"),
      null
    );
  } catch {
    return defaultColors;
  }
}

function saveRecentProfileColors(colors: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RECENT_PROFILE_COLORS_STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // Ignore local storage write failures.
  }
}

function buildRecentProfileColors(colors: string[], nextColor: string | null) {
  const baseColors = nextColor ? [nextColor, ...colors] : [...colors];
  const fallbackColors = PROFILE_COLORS.map((color) => color.value);
  const mergedColors = [...baseColors, ...fallbackColors];
  const uniqueColors: string[] = [];

  for (const color of mergedColors) {
    if (!color || uniqueColors.includes(color)) {
      continue;
    }

    uniqueColors.push(color);

    if (uniqueColors.length === PROFILE_COLORS.length) {
      break;
    }
  }

  return uniqueColors;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("Failed to load image."));
    };

    image.src = src;
  });
}

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

async function renderCroppedAvatarDataUrl({
  crop,
  zoom,
  offsetX,
  offsetY,
}: {
  crop: PendingAvatarCrop;
  zoom: number;
  offsetX: number;
  offsetY: number;
}) {
  const image = await loadImageElement(crop.src);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_EXPORT_SIZE;
  canvas.height = AVATAR_EXPORT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to prepare image editor.");
  }

  const baseScaleEditor = Math.max(AVATAR_EDITOR_SIZE / crop.width, AVATAR_EDITOR_SIZE / crop.height);
  const baseScaleExport = Math.max(AVATAR_EXPORT_SIZE / crop.width, AVATAR_EXPORT_SIZE / crop.height);
  const displayWidthEditor = crop.width * baseScaleEditor * zoom;
  const displayHeightEditor = crop.height * baseScaleEditor * zoom;
  const maxOffsetXEditor = Math.max(0, (displayWidthEditor - AVATAR_EDITOR_SIZE) / 2);
  const maxOffsetYEditor = Math.max(0, (displayHeightEditor - AVATAR_EDITOR_SIZE) / 2);
  const normalizedOffsetX = maxOffsetXEditor > 0 ? offsetX / maxOffsetXEditor : 0;
  const normalizedOffsetY = maxOffsetYEditor > 0 ? offsetY / maxOffsetYEditor : 0;
  const displayWidthExport = crop.width * baseScaleExport * zoom;
  const displayHeightExport = crop.height * baseScaleExport * zoom;
  const maxOffsetXExport = Math.max(0, (displayWidthExport - AVATAR_EXPORT_SIZE) / 2);
  const maxOffsetYExport = Math.max(0, (displayHeightExport - AVATAR_EXPORT_SIZE) / 2);
  const exportOffsetX = normalizedOffsetX * maxOffsetXExport;
  const exportOffsetY = normalizedOffsetY * maxOffsetYExport;
  const drawX = (AVATAR_EXPORT_SIZE - displayWidthExport) / 2 + exportOffsetX;
  const drawY = (AVATAR_EXPORT_SIZE - displayHeightExport) / 2 + exportOffsetY;

  context.clearRect(0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
  context.drawImage(image, drawX, drawY, displayWidthExport, displayHeightExport);

  return canvas.toDataURL("image/jpeg", 0.92);
}
