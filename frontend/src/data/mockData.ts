import { Album, Song, UserProfile, Review, TasteMatch, MatchMode } from "@/types/music";

const covers = {
  blonde: "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.png",
  kid_a: "https://upload.wikimedia.org/wikipedia/en/b/b5/Radiohead.bends.albumart.jpg",
  igor: "https://upload.wikimedia.org/wikipedia/en/2/2b/Igor_-_Tyler%2C_the_Creator.jpg",
  melodrama: "https://upload.wikimedia.org/wikipedia/en/b/b2/Lorde_-_Melodrama.png",
  currents: "https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png",
  mbdtf: "https://upload.wikimedia.org/wikipedia/en/4/4b/My_Beautiful_Dark_Twisted_Fantasy.jpg",
  carrie: "https://upload.wikimedia.org/wikipedia/en/3/3a/Carrie_%26_Lowell.jpg",
  in_rainbows: "https://upload.wikimedia.org/wikipedia/en/2/2e/In_Rainbows_Official_Cover.jpg",
};

export const albums: Album[] = [
  {
    id: "1", title: "Blonde", artist: "Frank Ocean", year: 2016, coverUrl: covers.blonde,
    genre: "R&B", avgRating: 4.6, totalRatings: 12400,
    songs: [
      { id: "s1", title: "Nikes", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "5:14" },
      { id: "s2", title: "Ivy", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "4:09" },
      { id: "s3", title: "Pink + White", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "3:04" },
      { id: "s4", title: "Solo", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "4:17" },
      { id: "s5", title: "Self Control", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "4:09" },
      { id: "s6", title: "Nights", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "5:07" },
      { id: "s7", title: "White Ferrari", artist: "Frank Ocean", albumId: "1", albumTitle: "Blonde", coverUrl: covers.blonde, duration: "4:08" },
    ],
  },
  {
    id: "2", title: "IGOR", artist: "Tyler, the Creator", year: 2019, coverUrl: covers.igor,
    genre: "Neo-Soul / Hip-Hop", avgRating: 4.4, totalRatings: 9800,
    songs: [
      { id: "s8", title: "IGOR'S THEME", artist: "Tyler, the Creator", albumId: "2", albumTitle: "IGOR", coverUrl: covers.igor, duration: "2:46" },
      { id: "s9", title: "EARFQUAKE", artist: "Tyler, the Creator", albumId: "2", albumTitle: "IGOR", coverUrl: covers.igor, duration: "3:10" },
      { id: "s10", title: "NEW MAGIC WAND", artist: "Tyler, the Creator", albumId: "2", albumTitle: "IGOR", coverUrl: covers.igor, duration: "3:15" },
      { id: "s11", title: "A BOY IS A GUN*", artist: "Tyler, the Creator", albumId: "2", albumTitle: "IGOR", coverUrl: covers.igor, duration: "3:22" },
    ],
  },
  {
    id: "3", title: "Melodrama", artist: "Lorde", year: 2017, coverUrl: covers.melodrama,
    genre: "Art Pop", avgRating: 4.5, totalRatings: 8700,
    songs: [
      { id: "s12", title: "Green Light", artist: "Lorde", albumId: "3", albumTitle: "Melodrama", coverUrl: covers.melodrama, duration: "3:54" },
      { id: "s13", title: "Sober", artist: "Lorde", albumId: "3", albumTitle: "Melodrama", coverUrl: covers.melodrama, duration: "3:16" },
      { id: "s14", title: "Liability", artist: "Lorde", albumId: "3", albumTitle: "Melodrama", coverUrl: covers.melodrama, duration: "2:52" },
      { id: "s15", title: "Supercut", artist: "Lorde", albumId: "3", albumTitle: "Melodrama", coverUrl: covers.melodrama, duration: "4:36" },
    ],
  },
  {
    id: "4", title: "Currents", artist: "Tame Impala", year: 2015, coverUrl: covers.currents,
    genre: "Psychedelic Pop", avgRating: 4.5, totalRatings: 11200,
    songs: [
      { id: "s16", title: "Let It Happen", artist: "Tame Impala", albumId: "4", albumTitle: "Currents", coverUrl: covers.currents, duration: "7:47" },
      { id: "s17", title: "The Less I Know the Better", artist: "Tame Impala", albumId: "4", albumTitle: "Currents", coverUrl: covers.currents, duration: "3:36" },
      { id: "s18", title: "Eventually", artist: "Tame Impala", albumId: "4", albumTitle: "Currents", coverUrl: covers.currents, duration: "5:19" },
      { id: "s19", title: "New Person, Same Old Mistakes", artist: "Tame Impala", albumId: "4", albumTitle: "Currents", coverUrl: covers.currents, duration: "6:03" },
    ],
  },
  {
    id: "5", title: "My Beautiful Dark Twisted Fantasy", artist: "Kanye West", year: 2010, coverUrl: covers.mbdtf,
    genre: "Hip-Hop", avgRating: 4.7, totalRatings: 15600,
    songs: [
      { id: "s20", title: "Dark Fantasy", artist: "Kanye West", albumId: "5", albumTitle: "My Beautiful Dark Twisted Fantasy", coverUrl: covers.mbdtf, duration: "4:40" },
      { id: "s21", title: "Runaway", artist: "Kanye West", albumId: "5", albumTitle: "My Beautiful Dark Twisted Fantasy", coverUrl: covers.mbdtf, duration: "9:08" },
      { id: "s22", title: "Power", artist: "Kanye West", albumId: "5", albumTitle: "My Beautiful Dark Twisted Fantasy", coverUrl: covers.mbdtf, duration: "4:52" },
      { id: "s23", title: "All of the Lights", artist: "Kanye West", albumId: "5", albumTitle: "My Beautiful Dark Twisted Fantasy", coverUrl: covers.mbdtf, duration: "4:59" },
    ],
  },
  {
    id: "6", title: "In Rainbows", artist: "Radiohead", year: 2007, coverUrl: covers.in_rainbows,
    genre: "Alternative Rock", avgRating: 4.6, totalRatings: 13200,
    songs: [
      { id: "s24", title: "15 Step", artist: "Radiohead", albumId: "6", albumTitle: "In Rainbows", coverUrl: covers.in_rainbows, duration: "3:58" },
      { id: "s25", title: "Weird Fishes/Arpeggi", artist: "Radiohead", albumId: "6", albumTitle: "In Rainbows", coverUrl: covers.in_rainbows, duration: "5:18" },
      { id: "s26", title: "Reckoner", artist: "Radiohead", albumId: "6", albumTitle: "In Rainbows", coverUrl: covers.in_rainbows, duration: "4:50" },
      { id: "s27", title: "Nude", artist: "Radiohead", albumId: "6", albumTitle: "In Rainbows", coverUrl: covers.in_rainbows, duration: "4:15" },
    ],
  },
];

export const allSongs: Song[] = albums.flatMap((a) => a.songs);

export const currentUser: UserProfile = {
  id: "u1",
  username: "melodymaven",
  displayName: "Melody Maven",
  avatarUrl: "https://i.pravatar.cc/150?img=32",
  topFive: [allSongs[5], allSongs[1], allSongs[16], allSongs[20], allSongs[14]],
  favoriteArtists: ["Frank Ocean", "Tame Impala", "Kanye West"],
  recentAlbumIds: ["1", "3", "4", "5"],
  totalRatings: 247,
  joinedDate: "2024-03-15",
};

export const users: UserProfile[] = [
  currentUser,
  {
    id: "u2", username: "vinylvibes", displayName: "Vinyl Vibes",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    topFive: [allSongs[5], allSongs[20], allSongs[16], allSongs[1], allSongs[24]],
    favoriteArtists: ["Frank Ocean", "Kanye West", "Radiohead"],
    recentAlbumIds: ["1", "5", "6"],
    totalRatings: 312, joinedDate: "2023-11-02",
  },
  {
    id: "u3", username: "bassline", displayName: "Bass Line",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
    topFive: [allSongs[1], allSongs[5], allSongs[8], allSongs[20], allSongs[14]],
    favoriteArtists: ["Frank Ocean", "Tyler, the Creator", "Lorde"],
    recentAlbumIds: ["1", "2", "3"],
    totalRatings: 189, joinedDate: "2024-06-20",
  },
  {
    id: "u4", username: "synesthesia", displayName: "Synesthesia",
    avatarUrl: "https://i.pravatar.cc/150?img=22",
    topFive: [allSongs[16], allSongs[24], allSongs[25], allSongs[18], allSongs[11]],
    favoriteArtists: ["Tame Impala", "Radiohead", "Tyler, the Creator"],
    recentAlbumIds: ["4", "6", "2"],
    totalRatings: 456, joinedDate: "2023-05-10",
  },
  {
    id: "u5", username: "reverie", displayName: "Reverie",
    avatarUrl: "https://i.pravatar.cc/150?img=44",
    topFive: [allSongs[20], allSongs[5], allSongs[1], allSongs[14], allSongs[16]],
    favoriteArtists: ["Kanye West", "Frank Ocean", "Lorde"],
    recentAlbumIds: ["5", "1", "3"],
    totalRatings: 278, joinedDate: "2024-01-08",
  },
];

export const recentReviews: Review[] = [
  { id: "r1", userId: "u2", username: "vinylvibes", avatarUrl: "https://i.pravatar.cc/150?img=12", albumId: "1", albumTitle: "Blonde", albumCover: covers.blonde, artist: "Frank Ocean", rating: 5, text: "A masterpiece of vulnerability. Every listen reveals something new.", date: "2025-02-28" },
  { id: "r2", userId: "u3", username: "bassline", avatarUrl: "https://i.pravatar.cc/150?img=15", albumId: "2", albumTitle: "IGOR", albumCover: covers.igor, artist: "Tyler, the Creator", rating: 4.5, text: "Tyler's best work. The production is otherworldly.", date: "2025-02-27" },
  { id: "r3", userId: "u4", username: "synesthesia", avatarUrl: "https://i.pravatar.cc/150?img=22", albumId: "4", albumTitle: "Currents", albumCover: covers.currents, artist: "Tame Impala", rating: 5, text: "Psychedelic perfection. 'Let It Happen' changed my life.", date: "2025-02-26" },
  { id: "r4", userId: "u5", username: "reverie", avatarUrl: "https://i.pravatar.cc/150?img=44", albumId: "5", albumTitle: "My Beautiful Dark Twisted Fantasy", albumCover: covers.mbdtf, artist: "Kanye West", rating: 5, text: "The magnum opus. Runaway alone deserves all the stars.", date: "2025-02-25" },
  { id: "r5", userId: "u1", username: "melodymaven", avatarUrl: "https://i.pravatar.cc/150?img=32", albumId: "3", albumTitle: "Melodrama", albumCover: covers.melodrama, artist: "Lorde", rating: 4.5, text: "Pure emotion distilled into pop perfection.", date: "2025-02-24" },
  { id: "r6", userId: "u1", username: "melodymaven", avatarUrl: "https://i.pravatar.cc/150?img=32", albumId: "4", albumTitle: "Currents", albumCover: covers.currents, artist: "Tame Impala", rating: 5, text: "Kevin Parker is a genius. Every track floats.", date: "2025-02-20" },
  { id: "r7", userId: "u2", username: "vinylvibes", avatarUrl: "https://i.pravatar.cc/150?img=12", albumId: "5", albumTitle: "My Beautiful Dark Twisted Fantasy", albumCover: covers.mbdtf, artist: "Kanye West", rating: 4.5, text: "Peak artistry. The maximalism is intoxicating.", date: "2025-02-18" },
  { id: "r8", userId: "u3", username: "bassline", avatarUrl: "https://i.pravatar.cc/150?img=15", albumId: "1", albumTitle: "Blonde", albumCover: covers.blonde, artist: "Frank Ocean", rating: 5, text: "This album understands longing better than anything.", date: "2025-02-15" },
];

export function calculateTasteMatch(userA: UserProfile, userB: UserProfile, mode: MatchMode): TasteMatch {
  if (mode === "top5") {
    const shared = userA.topFive.filter((s) => userB.topFive.some((t) => t.id === s.id));
    return { user: userB, matchPercentage: (shared.length / 5) * 100, sharedSongs: shared, mode };
  }

  if (mode === "activity") {
    const sharedAlbumIds = userA.recentAlbumIds.filter((id) => userB.recentAlbumIds.includes(id));
    const sharedAlbums = sharedAlbumIds.map((id) => albums.find((a) => a.id === id)?.title || id);
    const maxAlbums = Math.max(userA.recentAlbumIds.length, userB.recentAlbumIds.length);
    return { user: userB, matchPercentage: Math.round((sharedAlbumIds.length / maxAlbums) * 100), sharedSongs: [], sharedAlbums, mode };
  }

  // artists
  const sharedArtists = userA.favoriteArtists.filter((a) => userB.favoriteArtists.includes(a));
  const maxArtists = Math.max(userA.favoriteArtists.length, userB.favoriteArtists.length);
  return { user: userB, matchPercentage: Math.round((sharedArtists.length / maxArtists) * 100), sharedSongs: [], sharedArtists, mode };
}

export function getTasteMatches(mode: MatchMode): TasteMatch[] {
  return users
    .filter((u) => u.id !== currentUser.id)
    .map((u) => calculateTasteMatch(currentUser, u, mode))
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
