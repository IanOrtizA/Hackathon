export interface Song {
  id: string;
  title: string;
  artist: string;
  albumId: string;
  albumTitle: string;
  coverUrl: string;
  duration: string;
  rating?: number;
  previewUrl?: string | null;
  spotifyUrl?: string | null;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  genre: string;
  avgRating: number;
  totalRatings: number;
  songs: Song[];
}

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  genre: string;
  avgRating: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  topFive: Song[];
  favoriteArtists: string[];
  recentAlbumIds: string[];
  totalRatings: number;
  joinedDate: string | null;
  profileColor?: string | null;
}

export interface AuthenticatedUser extends UserProfile {
  email: string;
}

export type MatchMode = "top5" | "activity" | "artists";

export interface TasteMatch {
  user: UserProfile;
  matchPercentage: number;
  sharedSongs: Song[];
  sharedAlbums?: string[];
  sharedArtists?: string[];
  mode: MatchMode;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  albumId: string;
  songId?: string | null;
  albumTitle: string;
  albumCover: string;
  artist: string;
  rating: number;
  text: string;
  date: string;
}
