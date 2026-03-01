import { Album, Song, UserProfile, Review, TasteMatch, MatchMode } from "@/types/music";

export const albums: Album[] = [];

export const allSongs: Song[] = [];

export const currentUser: UserProfile = {
  id: "current-user",
  username: "pending_sync",
  displayName: "Profile Pending",
  avatarUrl: "/placeholder.svg",
  topFive: [],
  favoriteArtists: [],
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
  { name: "Default", value: "220 20% 7%" },
  { name: "Midnight Blue", value: "230 25% 10%" },
  { name: "Deep Wine", value: "340 30% 10%" },
  { name: "Forest", value: "160 25% 8%" },
  { name: "Warm Charcoal", value: "20 15% 10%" },
  { name: "Ocean Deep", value: "200 30% 9%" },
  { name: "Obsidian", value: "260 20% 8%" },
  { name: "Ember", value: "15 35% 10%" },
];
