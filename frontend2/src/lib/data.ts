export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  cover: string;
  rating: number;
  ratingCount: number;
  genres: string[];
}

export interface Review {
  id: string;
  albumId: string;
  albumTitle: string;
  albumArtist: string;
  albumCover: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string;
  likes: number;
  date: string;
}

export interface DiaryEntry {
  id: string;
  albumId: string;
  albumTitle: string;
  albumArtist: string;
  albumCover: string;
  rating: number;
  date: string;
  relisten: boolean;
}

export const MOCK_ALBUMS: Album[] = [
  { id: "1", title: "In Rainbows", artist: "Radiohead", year: 2007, cover: "https://upload.wikimedia.org/wikipedia/en/2/2e/In_Rainbows_Official_Cover.jpg", rating: 4.5, ratingCount: 48200, genres: ["Alternative Rock", "Art Rock"] },
  { id: "2", title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015, cover: "https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png", rating: 4.6, ratingCount: 52100, genres: ["Hip Hop", "Jazz Rap"] },
  { id: "3", title: "Blonde", artist: "Frank Ocean", year: 2016, cover: "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.png", rating: 4.4, ratingCount: 45300, genres: ["R&B", "Art Pop"] },
  { id: "4", title: "Loveless", artist: "My Bloody Valentine", year: 1991, cover: "https://upload.wikimedia.org/wikipedia/en/4/4b/My_Bloody_Valentine_-_Loveless.png", rating: 4.5, ratingCount: 31500, genres: ["Shoegaze", "Noise Pop"] },
  { id: "5", title: "Vespertine", artist: "Björk", year: 2001, cover: "https://upload.wikimedia.org/wikipedia/en/4/43/Bj%C3%B6rk_-_Vespertine_album_cover.png", rating: 4.3, ratingCount: 22800, genres: ["Art Pop", "Electronic"] },
  { id: "6", title: "The Miseducation of Lauryn Hill", artist: "Lauryn Hill", year: 1998, cover: "https://upload.wikimedia.org/wikipedia/en/6/6b/LaurynHillTheMiseducationofLaurynHillalbumcover.jpg", rating: 4.5, ratingCount: 38900, genres: ["Neo Soul", "Hip Hop"] },
  { id: "7", title: "OK Computer", artist: "Radiohead", year: 1997, cover: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png", rating: 4.6, ratingCount: 61200, genres: ["Alternative Rock", "Art Rock"] },
  { id: "8", title: "Remain in Light", artist: "Talking Heads", year: 1980, cover: "https://upload.wikimedia.org/wikipedia/en/d/d2/Talking_Heads_-_Remain_in_Light.png", rating: 4.4, ratingCount: 29700, genres: ["New Wave", "Post-Punk"] },
  { id: "9", title: "Dummy", artist: "Portishead", year: 1994, cover: "https://upload.wikimedia.org/wikipedia/en/f/f0/Portishead_-_Dummy.png", rating: 4.3, ratingCount: 27400, genres: ["Trip Hop", "Electronic"] },
  { id: "10", title: "Hounds of Love", artist: "Kate Bush", year: 1985, cover: "https://upload.wikimedia.org/wikipedia/en/0/05/Kate_Bush_-_Hounds_of_Love.png", rating: 4.4, ratingCount: 33100, genres: ["Art Pop", "Synth-pop"] },
  { id: "11", title: "Currents", artist: "Tame Impala", year: 2015, cover: "https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png", rating: 4.2, ratingCount: 41500, genres: ["Psychedelic Pop", "Synth-pop"] },
  { id: "12", title: "Titanic Rising", artist: "Weyes Blood", year: 2019, cover: "https://upload.wikimedia.org/wikipedia/en/3/3a/Weyes_Blood_-_Titanic_Rising.png", rating: 4.3, ratingCount: 19800, genres: ["Chamber Pop", "Art Pop"] },
];

export const MOCK_REVIEWS: Review[] = [
  { id: "r1", albumId: "2", albumTitle: "To Pimp a Butterfly", albumArtist: "Kendrick Lamar", albumCover: MOCK_ALBUMS[1].cover, userName: "jazzhead_91", userAvatar: "", rating: 5, content: "A landmark in modern hip hop. The way Kendrick weaves jazz, funk, and spoken word into a cohesive narrative about Black identity in America is nothing short of genius. Every track peels back another layer.", likes: 342, date: "2025-02-15" },
  { id: "r2", albumId: "3", albumTitle: "Blonde", albumArtist: "Frank Ocean", albumCover: MOCK_ALBUMS[2].cover, userName: "ocean_waves", userAvatar: "", rating: 5, content: "This album feels like watching memories dissolve in water. Frank's vocal performance is devastating — the way 'Self Control' builds and then just... lets go. Pure emotional architecture.", likes: 287, date: "2025-02-12" },
  { id: "r3", albumId: "1", albumTitle: "In Rainbows", albumArtist: "Radiohead", albumCover: MOCK_ALBUMS[0].cover, userName: "glitch_pop", userAvatar: "", rating: 4.5, content: "Radiohead's warmest record. Where Kid A felt cold and alien, In Rainbows is intimate, tactile. 'Reckoner' might be the most beautiful song they've ever written. Still hits different every listen.", likes: 198, date: "2025-02-10" },
  { id: "r4", albumId: "4", albumTitle: "Loveless", albumArtist: "My Bloody Valentine", albumCover: MOCK_ALBUMS[3].cover, userName: "shoegaze_forever", userAvatar: "", rating: 5, content: "30+ years later and nothing sounds like this. The guitars on 'Only Shallow' are like being submerged in warm static. Kevin Shields created a universe with this record.", likes: 156, date: "2025-02-08" },
  { id: "r5", albumId: "10", albumTitle: "Hounds of Love", albumArtist: "Kate Bush", albumCover: MOCK_ALBUMS[9].cover, userName: "art_pop_stan", userAvatar: "", rating: 5, content: "Side B ('The Ninth Wave') is one of the most ambitious and fully realized suites in pop history. Kate Bush was decades ahead of everyone. 'Running Up That Hill' still gives me chills.", likes: 221, date: "2025-01-28" },
];

export const MOCK_DIARY: DiaryEntry[] = [
  { id: "d1", albumId: "3", albumTitle: "Blonde", albumArtist: "Frank Ocean", albumCover: MOCK_ALBUMS[2].cover, rating: 5, date: "2025-02-28", relisten: false },
  { id: "d2", albumId: "11", albumTitle: "Currents", albumArtist: "Tame Impala", albumCover: MOCK_ALBUMS[10].cover, rating: 4, date: "2025-02-27", relisten: true },
  { id: "d3", albumId: "1", albumTitle: "In Rainbows", albumArtist: "Radiohead", albumCover: MOCK_ALBUMS[0].cover, rating: 5, date: "2025-02-25", relisten: true },
  { id: "d4", albumId: "9", albumTitle: "Dummy", albumArtist: "Portishead", albumCover: MOCK_ALBUMS[8].cover, rating: 4.5, date: "2025-02-23", relisten: false },
  { id: "d5", albumId: "6", albumTitle: "The Miseducation of Lauryn Hill", albumArtist: "Lauryn Hill", albumCover: MOCK_ALBUMS[5].cover, rating: 4.5, date: "2025-02-20", relisten: true },
  { id: "d6", albumId: "12", albumTitle: "Titanic Rising", albumArtist: "Weyes Blood", albumCover: MOCK_ALBUMS[11].cover, rating: 4.5, date: "2025-02-18", relisten: false },
];

export const POPULAR_LISTS = [
  { id: "l1", title: "Albums That Changed My Life", author: "vinyl_dreams", albumCovers: [MOCK_ALBUMS[0].cover, MOCK_ALBUMS[1].cover, MOCK_ALBUMS[3].cover, MOCK_ALBUMS[6].cover], count: 24, likes: 1840 },
  { id: "l2", title: "Essential Trip Hop", author: "lo_fi_nights", albumCovers: [MOCK_ALBUMS[8].cover, MOCK_ALBUMS[4].cover, MOCK_ALBUMS[2].cover, MOCK_ALBUMS[7].cover], count: 18, likes: 923 },
  { id: "l3", title: "Best of the 90s", author: "decade_digger", albumCovers: [MOCK_ALBUMS[6].cover, MOCK_ALBUMS[8].cover, MOCK_ALBUMS[5].cover, MOCK_ALBUMS[3].cover], count: 50, likes: 3102 },
  { id: "l4", title: "Late Night Listening", author: "midnight_vinyl", albumCovers: [MOCK_ALBUMS[2].cover, MOCK_ALBUMS[4].cover, MOCK_ALBUMS[8].cover, MOCK_ALBUMS[11].cover], count: 32, likes: 1456 },
];
