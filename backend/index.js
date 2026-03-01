require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Lets frontend talk to backend, and allows us to read JSON data)
app.use(cors());
app.use(express.json());

// --- DATABASE SETUP ---
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Create a "Blueprint" for what a Review should look like
const reviewSchema = new mongoose.Schema({
  albumId: { type: String, required: true },
  songId: { type: String, default: null },
  albumTitle: { type: String, required: true },
  albumCover: { type: String, default: '' },
  artist: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, default: '/placeholder.svg' },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// Create the actual Database Model based on the blueprint
const Review = mongoose.model('Review', reviewSchema);

const songSnapshotSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  albumId: { type: String, required: true },
  albumTitle: { type: String, required: true },
  coverUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  previewUrl: { type: String, default: null },
  spotifyUrl: { type: String, default: null },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
  avatarUrl: { type: String, default: '/placeholder.svg' },
  topFive: { type: [songSnapshotSchema], default: [] },
  favoriteArtists: { type: [String], default: [] },
  recentAlbumIds: { type: [String], default: [] },
  totalRatings: { type: Number, default: 0 },
  joinedDate: { type: Date, default: Date.now },
  profileColor: { type: String, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


// --- API ROUTES ---

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'development-auth-secret';
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return Buffer.from(normalized, 'base64').toString('utf8');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  const derivedHash = crypto.scryptSync(password, passwordSalt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derivedHash, 'hex'), Buffer.from(passwordHash, 'hex'));
}

function signAuthToken(userId) {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const encodedPayload = base64UrlEncode(payload);
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${encodedPayload}.${signature}`;
}

function readAuthToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  if (expectedSignature !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim();
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    topFive: user.topFive,
    favoriteArtists: user.favoriteArtists,
    recentAlbumIds: user.recentAlbumIds,
    totalRatings: user.totalRatings,
    joinedDate: user.joinedDate ? user.joinedDate.toISOString() : null,
    profileColor: user.profileColor,
  };
}

function sanitizeReview(review) {
  return {
    id: review._id.toString(),
    userId: review.userId,
    username: review.username,
    avatarUrl: review.avatarUrl,
    albumId: review.albumId,
    songId: review.songId || null,
    albumTitle: review.albumTitle,
    albumCover: review.albumCover,
    artist: review.artist,
    rating: review.rating,
    text: review.text,
    date: review.date ? review.date.toISOString().split('T')[0] : null,
  };
}

async function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const payload = readAuthToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await User.findById(payload.userId);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.authUser = user;
  return next();
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function mapSpotifyTrack(track) {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(', '),
    albumId: track.album.id,
    albumTitle: track.album.name,
    coverUrl: track.album.images?.[0]?.url || '',
    duration: formatDuration(track.duration_ms),
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls?.spotify || null,
  };
}

function mapSpotifyAlbum(album) {
  return {
    id: album.id,
    title: album.name,
    artist: album.artists.map((artist) => artist.name).join(', '),
    year: album.release_date ? Number(album.release_date.slice(0, 4)) : null,
    coverUrl: album.images?.[0]?.url || '',
    totalTracks: album.total_tracks,
    spotifyUrl: album.external_urls?.spotify || null,
  };
}

async function searchSpotifyCatalog(accessToken, {
  query,
  types,
  limit,
  offset = 0,
  market = 'US',
}) {
  const params = new URLSearchParams({
    q: query,
    type: types.join(','),
    limit: String(limit),
    offset: String(offset),
    market,
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error('Spotify search failed');
  }

  return data;
}

async function getSpotifyNewReleases(accessToken, {
  country = 'US',
  limit = 6,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({
    country,
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(`https://api.spotify.com/v1/browse/new-releases?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error('Spotify new releases request failed');
  }

  return data;
}

async function getSpotifyPlaylistTracks(accessToken, playlistId, {
  market = 'US',
  limit = 50,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({
    market,
    limit: String(limit),
    offset: String(offset),
    fields: 'items(track(id,name,artists(name),album(id,name,images,release_date,available_markets,external_urls,total_tracks),duration_ms,preview_url,external_urls,popularity)),total',
  });

  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error('Spotify playlist tracks request failed');
  }

  return data;
}

function normalizeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function findUsChartPlaylist(accessToken, query) {
  const playlistSearchData = await searchSpotifyCatalog(accessToken, {
    query,
    types: ['playlist'],
    limit: 10,
    market: 'US',
  });

  const playlists = Array.isArray(playlistSearchData.playlists?.items)
    ? playlistSearchData.playlists.items
    : [];

  if (playlists.length === 0) {
    return null;
  }

  const normalizedQuery = normalizeLabel(query);
  const exactSpotifyPlaylist = playlists.find((playlist) =>
    normalizeLabel(playlist.name) === normalizedQuery &&
    normalizeLabel(playlist.owner?.display_name).includes('spotify')
  );

  if (exactSpotifyPlaylist) {
    return exactSpotifyPlaylist;
  }

  const exactMatch = playlists.find((playlist) => normalizeLabel(playlist.name) === normalizedQuery);
  return exactMatch || playlists[0];
}

function extractPlaylistTracks(playlistTrackData) {
  const playlistItems = Array.isArray(playlistTrackData.items) ? playlistTrackData.items : [];

  return playlistItems
    .map((item) => item?.track)
    .filter((track) => Boolean(track && track.id && track.album?.id));
}

async function findStrictUsTrendingFeed(accessToken) {
  const chartPlaylist =
    await findUsChartPlaylist(accessToken, 'Top 50 - USA') ||
    await findUsChartPlaylist(accessToken, 'Viral 50 - USA');

  if (!chartPlaylist?.id) {
    throw new Error('US chart playlist not found');
  }

  const playlistTrackData = await getSpotifyPlaylistTracks(accessToken, chartPlaylist.id, {
    market: 'US',
    limit: 50,
  });
  const rawTracks = extractPlaylistTracks(playlistTrackData);

  if (rawTracks.length === 0) {
    throw new Error('US chart playlist returned no tracks');
  }

  const tracks = [...rawTracks]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10)
    .map(mapSpotifyTrack);
  const albumCounts = new Map();

  for (const track of rawTracks) {
    const album = track.album;

    if (!album?.id) {
      continue;
    }

    const existing = albumCounts.get(album.id);

    if (existing) {
      existing.count += 1;
      if ((track.popularity || 0) > existing.popularity) {
        existing.popularity = track.popularity || 0;
      }
      continue;
    }

    albumCounts.set(album.id, {
      album,
      count: 1,
      popularity: track.popularity || 0,
    });
  }

  const albums = [...albumCounts.values()]
    .sort((a, b) => {
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }

      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return 0;
    })
    .slice(0, 6)
    .map((entry) => mapSpotifyAlbum(entry.album));

  return {
    albums,
    tracks,
    source: chartPlaylist.name,
  };
}

async function findTrendingAlbums(accessToken) {
  const currentYear = new Date().getFullYear();

  try {
    const newReleasesData = await getSpotifyNewReleases(accessToken, {
      country: 'US',
      limit: 6,
    });

    return Array.isArray(newReleasesData.albums?.items)
      ? newReleasesData.albums.items
          .filter((album) => Array.isArray(album.available_markets) ? album.available_markets.includes('US') : true)
          .map(mapSpotifyAlbum)
      : [];
  } catch {
    const fallbackAlbumSearchData = await searchSpotifyCatalog(accessToken, {
      query: `year:${currentYear}`,
      types: ['album'],
      limit: 6,
      market: 'US',
    });

    return Array.isArray(fallbackAlbumSearchData.albums?.items)
      ? fallbackAlbumSearchData.albums.items
          .filter((album) => Array.isArray(album.available_markets) ? album.available_markets.includes('US') : true)
          .map(mapSpotifyAlbum)
      : [];
  }
}

async function findTrendingTracks(accessToken) {
  const currentYear = new Date().getFullYear();

  try {
    const trackSearchData = await searchSpotifyCatalog(accessToken, {
      query: `year:${currentYear}`,
      types: ['track'],
      limit: 20,
      market: 'US',
    });

    return Array.isArray(trackSearchData.tracks?.items)
      ? [...trackSearchData.tracks.items]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 8)
          .map(mapSpotifyTrack)
      : [];
  } catch {
    const fallbackTrackSearchData = await searchSpotifyCatalog(accessToken, {
      query: 'genre:pop',
      types: ['track'],
      limit: 8,
      market: 'US',
    });

    return Array.isArray(fallbackTrackSearchData.tracks?.items)
      ? fallbackTrackSearchData.tracks.items.map(mapSpotifyTrack)
      : [];
  }
}

app.post('/api/auth/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const displayName = String(req.body.displayName || username).trim();

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with that email or username already exists.' });
    }

    const { passwordHash, passwordSalt } = hashPassword(password);
    const newUser = await User.create({
      email,
      username,
      displayName,
      passwordHash,
      passwordSalt,
    });

    const token = signAuthToken(newUser._id.toString());

    return res.status(201).json({
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const token = signAuthToken(user._id.toString());

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  return res.json({
    user: sanitizeUser(req.authUser),
  });
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const updates = {};
  const { displayName, avatarUrl, profileColor, favoriteArtists, topFive } = req.body;

  if (typeof displayName === 'string' && displayName.trim()) {
    updates.displayName = displayName.trim();
  }

  if (typeof avatarUrl === 'string') {
    updates.avatarUrl = avatarUrl.trim() || '/placeholder.svg';
  }

  if (typeof profileColor === 'string' || profileColor === null) {
    updates.profileColor = profileColor;
  }

  if (Array.isArray(favoriteArtists)) {
    updates.favoriteArtists = favoriteArtists.filter((artist) => typeof artist === 'string');
  }

  if (Array.isArray(topFive)) {
    updates.topFive = topFive.slice(0, 5);
  }

  try {
    Object.assign(req.authUser, updates);
    await req.authUser.save();

    return res.json({
      user: sanitizeUser(req.authUser),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

async function getSpotifyAccessToken() {
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${process.env.SPOTIFY_CLIENT_ID}&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`
  });
  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error('Failed to fetch Spotify access token');
  }

  return tokenData.access_token;
}

// 1. Search Spotify Route
app.get('/api/search', async (req, res) => {
  const searchQuery = String(req.query.q || '').trim();
  if (!searchQuery) return res.status(400).json({ error: "Provide a search query." });

  const requestedTypes = String(req.query.type || 'track')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value === 'track' || value === 'album');

  const types = requestedTypes.length > 0 ? requestedTypes : ['track'];
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 5, 1), 20);
  const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);

  try {
    const accessToken = await getSpotifyAccessToken();
    const searchData = await searchSpotifyCatalog(accessToken, {
      query: searchQuery,
      types,
      limit,
      offset,
      market: 'US',
    });

    res.json({
      query: searchQuery,
      market: 'US',
      tracks: Array.isArray(searchData.tracks?.items)
        ? searchData.tracks.items.map(mapSpotifyTrack)
        : [],
      trackPagination: searchData.tracks
        ? {
            offset: searchData.tracks.offset,
            limit: searchData.tracks.limit,
            total: searchData.tracks.total,
            nextOffset:
              searchData.tracks.offset + searchData.tracks.items.length < searchData.tracks.total
                ? searchData.tracks.offset + searchData.tracks.items.length
                : null,
          }
        : null,
      albums: Array.isArray(searchData.albums?.items)
        ? searchData.albums.items.map(mapSpotifyAlbum)
        : [],
    });
  } catch (error) {
    res.status(500).json({ error: "Spotify search failed" });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    let albums = [];
    let tracks = [];
    let source = 'fallback-search';

    try {
      const strictFeed = await findStrictUsTrendingFeed(accessToken);
      albums = strictFeed.albums;
      tracks = strictFeed.tracks;
      source = strictFeed.source;
    } catch {
      const [albumsResult, tracksResult] = await Promise.allSettled([
        findTrendingAlbums(accessToken),
        findTrendingTracks(accessToken),
      ]);

      albums = albumsResult.status === 'fulfilled' ? albumsResult.value : [];
      tracks = tracksResult.status === 'fulfilled' ? tracksResult.value : [];
    }

    if (albums.length === 0 && tracks.length === 0) {
      throw new Error('No trending content could be loaded from Spotify.');
    }

    res.json({
      market: 'US',
      albums,
      tracks,
      source,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load trending Spotify content.',
    });
  }
});

app.get('/api/tracks/:id', async (req, res) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${req.params.id}?market=US`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const trackData = await trackResponse.json();

    if (!trackResponse.ok) {
      return res.status(trackResponse.status).json({
        error: trackData?.error?.message || 'Spotify track fetch failed',
      });
    }

    res.json({
      market: 'US',
      track: mapSpotifyTrack(trackData),
    });
  } catch (error) {
    res.status(500).json({ error: "Spotify track fetch failed" });
  }
});

app.get('/api/reviews', async (req, res) => {
  const filters = {};
  const albumId = String(req.query.albumId || '').trim();
  const songId = String(req.query.songId || '').trim();
  const userId = String(req.query.userId || '').trim();
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 200);

  if (albumId) {
    filters.albumId = albumId;
  }

  if (songId) {
    filters.songId = songId;
  }

  if (userId) {
    filters.userId = userId;
  }

  try {
    const reviews = await Review.find(filters)
      .sort({ date: -1 })
      .limit(limit);

    return res.json({
      reviews: reviews.map(sanitizeReview),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', requireAuth, async (req, res) => {
  const albumId = String(req.body.albumId || '').trim();
  const songId = req.body.songId ? String(req.body.songId).trim() : null;
  const albumTitle = String(req.body.albumTitle || '').trim();
  const albumCover = String(req.body.albumCover || '').trim();
  const artist = String(req.body.artist || '').trim();
  const text = String(req.body.text || '').trim();
  const rating = Number(req.body.rating);

  if (!albumId || !albumTitle || !artist || !text || !Number.isFinite(rating)) {
    return res.status(400).json({ error: 'Album, artist, rating, and review text are required.' });
  }

  try {
    const newReview = await Review.create({
      albumId,
      songId,
      albumTitle,
      albumCover,
      artist,
      userId: req.authUser._id.toString(),
      username: req.authUser.username,
      avatarUrl: req.authUser.avatarUrl,
      rating,
      text,
    });

    return res.status(201).json({
      review: sanitizeReview(newReview),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save review' });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
