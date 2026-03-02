import { Album, Song, UserProfile, Review, TasteMatch, MatchMode } from "@/types/music";

export const albums: Album[] = [];

export const allSongs: Song[] = [];

export const currentUser: UserProfile = {
  id: "current-user",
  username: "pending_sync",
  displayName: "Profile Pending",
  avatarUrl: "/placeholder.svg",
  topFive: [],
  favoriteSongs: [],
  favoriteArtists: [],
  likedSongs: [],
  likedArtists: [],
  friendIds: [],
  incomingFriendRequestIds: [],
  outgoingFriendRequestIds: [],
  recentAlbumIds: [],
  totalRatings: 0,
  joinedDate: "",
};

export const users: UserProfile[] = [currentUser];

export const recentReviews: Review[] = [];

export function calculateTasteMatch(userA: UserProfile, userB: UserProfile, mode: MatchMode): TasteMatch {
  if (mode === "top5") {
    const shared = userA.topFive.filter((s) => userB.topFive.some((t) => t.id === s.id));
    return { user: userB, matchPercentage: (shared.length / 5) * 100, sharedSongs: shared, mode };
  }

  if (mode === "activity") {
    const sharedAlbumIds = userA.recentAlbumIds.filter((id) => userB.recentAlbumIds.includes(id));
    const maxAlbums = Math.max(1, userA.recentAlbumIds.length, userB.recentAlbumIds.length);

    return {
      user: userB,
      matchPercentage: Math.round((sharedAlbumIds.length / maxAlbums) * 100),
      sharedSongs: [],
      sharedAlbums: sharedAlbumIds,
      mode,
    };
  }

  const sharedArtists = userA.favoriteArtists.filter((artist) => userB.favoriteArtists.includes(artist));
  const maxArtists = Math.max(1, userA.favoriteArtists.length, userB.favoriteArtists.length);

  return {
    user: userB,
    matchPercentage: Math.round((sharedArtists.length / maxArtists) * 100),
    sharedSongs: [],
    sharedArtists,
    mode,
  };
}

export function getTasteMatches(mode: MatchMode): TasteMatch[] {
  return users
    .filter((user) => user.id !== currentUser.id)
    .map((user) => calculateTasteMatch(currentUser, user, mode))
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}

export const PROFILE_COLORS = [
  { name: "Default", value: "220 76% 58%" },
  { name: "Midnight Blue", value: "244 74% 64%" },
  { name: "Deep Wine", value: "338 72% 56%" },
  { name: "Forest", value: "156 74% 42%" },
  { name: "Sunset Gold", value: "34 94% 58%" },
  { name: "Ocean Deep", value: "194 86% 52%" },
  { name: "Ultraviolet", value: "272 74% 64%" },
  { name: "Ember", value: "10 88% 58%" },
];
