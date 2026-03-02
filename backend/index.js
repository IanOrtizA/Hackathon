const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_REVIEW_COMMENTS = 5;

// Middleware (Lets frontend talk to backend, and allows us to read JSON data)
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// --- DATABASE SETUP ---
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const reviewCommentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, default: '/placeholder.svg' },
  text: { type: String, required: true },
  likedBy: { type: [String], default: [] },
  date: { type: Date, default: Date.now },
});

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
  likedBy: { type: [String], default: [] },
  dislikedBy: { type: [String], default: [] },
  comments: { type: [reviewCommentSchema], default: [] },
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

const userReviewSnapshotSchema = new mongoose.Schema({
  reviewId: { type: String, required: true },
  songId: { type: String, default: null },
  albumId: { type: String, required: true },
  albumTitle: { type: String, default: '' },
  albumCover: { type: String, default: '' },
  artist: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  text: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const userReviewReactionSchema = new mongoose.Schema({
  reviewId: { type: String, required: true },
  songId: { type: String, default: null },
  albumId: { type: String, required: true },
  reaction: { type: String, enum: ['like', 'dislike'], required: true },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const userCommentSnapshotSchema = new mongoose.Schema({
  reviewId: { type: String, required: true },
  commentId: { type: String, required: true },
  songId: { type: String, default: null },
  albumId: { type: String, required: true },
  text: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userCommentLikeSchema = new mongoose.Schema({
  reviewId: { type: String, required: true },
  commentId: { type: String, required: true },
  songId: { type: String, default: null },
  albumId: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
  avatarUrl: { type: String, default: '/placeholder.svg' },
  topFive: { type: [songSnapshotSchema], default: [] },
  favoriteSongs: { type: [songSnapshotSchema], default: [] },
  favoriteArtists: { type: [String], default: [] },
  likedSongs: { type: [songSnapshotSchema], default: [] },
  likedArtists: { type: [String], default: [] },
  reviewHistory: { type: [userReviewSnapshotSchema], default: [] },
  reviewReactionHistory: { type: [userReviewReactionSchema], default: [] },
  commentHistory: { type: [userCommentSnapshotSchema], default: [] },
  commentLikeHistory: { type: [userCommentLikeSchema], default: [] },
  friendIds: { type: [String], default: [] },
  incomingFriendRequestIds: { type: [String], default: [] },
  outgoingFriendRequestIds: { type: [String], default: [] },
  recentAlbumIds: { type: [String], default: [] },
  totalRatings: { type: Number, default: 0 },
  joinedDate: { type: Date, default: Date.now },
  profileColor: { type: String, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const songAggregateSchema = new mongoose.Schema({
  songId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: '' },
  artist: { type: String, default: '' },
  albumId: { type: String, default: '' },
  albumTitle: { type: String, default: '' },
  coverUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  previewUrl: { type: String, default: null },
  spotifyUrl: { type: String, default: null },
  avgEmbedding: { type: [Number], default: [] },
  genreWeights: { type: Map, of: Number, default: {} },
  reviewCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  likedByUserIds: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

const SongAggregate = mongoose.model('SongAggregate', songAggregateSchema);

function normalizeSongSnapshotInput(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const artist = typeof value.artist === 'string' ? value.artist.trim() : '';
  const albumId = typeof value.albumId === 'string' ? value.albumId.trim() : '';
  const albumTitle = typeof value.albumTitle === 'string' ? value.albumTitle.trim() : '';

  if (!id || !title || !artist || !albumId || !albumTitle) {
    return null;
  }

  return {
    id,
    title,
    artist,
    albumId,
    albumTitle,
    coverUrl: typeof value.coverUrl === 'string' ? value.coverUrl.trim() : '',
    duration: typeof value.duration === 'string' ? value.duration.trim() : '',
    previewUrl: typeof value.previewUrl === 'string' && value.previewUrl.trim() ? value.previewUrl.trim() : null,
    spotifyUrl: typeof value.spotifyUrl === 'string' && value.spotifyUrl.trim() ? value.spotifyUrl.trim() : null,
  };
}

function createUserReviewSnapshot(review) {
  return {
    reviewId: review._id.toString(),
    songId: review.songId || null,
    albumId: review.albumId,
    albumTitle: review.albumTitle || '',
    albumCover: review.albumCover || '',
    artist: review.artist || '',
    rating: Number(review.rating) || 0,
    text: review.text || '',
    createdAt: review.date || new Date(),
    updatedAt: review.updatedAt || review.date || new Date(),
  };
}

function createUserReviewReactionSnapshot(review, reaction) {
  return {
    reviewId: review._id.toString(),
    songId: review.songId || null,
    albumId: review.albumId,
    reaction,
    updatedAt: new Date(),
  };
}

function createUserCommentSnapshot(review, comment) {
  return {
    reviewId: review._id.toString(),
    commentId: comment._id.toString(),
    songId: review.songId || null,
    albumId: review.albumId,
    text: comment.text || '',
    createdAt: comment.date || new Date(),
  };
}

function createUserCommentLikeSnapshot(review, commentId) {
  return {
    reviewId: review._id.toString(),
    commentId,
    songId: review.songId || null,
    albumId: review.albumId,
    updatedAt: new Date(),
  };
}

function upsertActivityEntry(entries, key, nextEntry) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return [
    nextEntry,
    ...safeEntries.filter((entry) => entry && entry[key] !== nextEntry[key]),
  ];
}

function removeActivityEntry(entries, key, value) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return safeEntries.filter((entry) => entry && entry[key] !== value);
}

async function rebuildUserActivitySnapshots() {
  const users = await User.find({});
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  for (const user of users) {
    user.reviewHistory = [];
    user.reviewReactionHistory = [];
    user.commentHistory = [];
    user.commentLikeHistory = [];
  }

  const reviews = await Review.find({}).sort({ date: -1 });

  for (const review of reviews) {
    const author = userMap.get(String(review.userId || ''));

    if (author) {
      author.reviewHistory = upsertActivityEntry(author.reviewHistory, 'reviewId', createUserReviewSnapshot(review));
    }

    for (const userId of Array.isArray(review.likedBy) ? review.likedBy : []) {
      const reactingUser = userMap.get(String(userId || ''));

      if (reactingUser) {
        reactingUser.reviewReactionHistory = upsertActivityEntry(
          reactingUser.reviewReactionHistory,
          'reviewId',
          createUserReviewReactionSnapshot(review, 'like'),
        );
      }
    }

    for (const userId of Array.isArray(review.dislikedBy) ? review.dislikedBy : []) {
      const reactingUser = userMap.get(String(userId || ''));

      if (reactingUser) {
        reactingUser.reviewReactionHistory = upsertActivityEntry(
          reactingUser.reviewReactionHistory,
          'reviewId',
          createUserReviewReactionSnapshot(review, 'dislike'),
        );
      }
    }

    for (const comment of Array.isArray(review.comments) ? review.comments : []) {
      const commentAuthor = userMap.get(String(comment.userId || ''));

      if (commentAuthor && comment?._id) {
        commentAuthor.commentHistory = upsertActivityEntry(
          commentAuthor.commentHistory,
          'commentId',
          createUserCommentSnapshot(review, comment),
        );
      }

      for (const userId of Array.isArray(comment.likedBy) ? comment.likedBy : []) {
        const likingUser = userMap.get(String(userId || ''));

        if (likingUser && comment?._id) {
          likingUser.commentLikeHistory = upsertActivityEntry(
            likingUser.commentLikeHistory,
            'commentId',
            createUserCommentLikeSnapshot(review, comment._id.toString()),
          );
        }
      }
    }
  }

  for (const user of users) {
    user.totalRatings = Array.isArray(user.reviewHistory) ? user.reviewHistory.length : 0;
  }

  await Promise.all(users.map((user) => user.save()));

  return {
    usersSynced: users.length,
    reviewsSynced: reviews.length,
  };
}

// --- MATCHING SYSTEM HELPERS ---

const GENRE_TAXONOMY = [
  'pop', 'hip-hop', 'r&b', 'rock', 'indie',
  'electronic', 'jazz', 'folk', 'metal', 'classical',
];

async function generateEmbedding(text) {
  if (!genAI || !text) return [];
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding?.values || [];
  } catch (error) {
    console.error('Gemini embedding error:', error.message);
    return [];
  }
}

async function generateGenreTags(reviewText, artist, albumTitle) {
  if (!genAI || !reviewText) return [];
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Given this music review for "${albumTitle}" by ${artist}:\n"${reviewText}"\n\nWhich of these genres apply? Pick 1-3 that best fit: ${GENRE_TAXONOMY.join(', ')}\nReply with ONLY a comma-separated list of genres from that exact list, nothing else.`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().toLowerCase();
    return responseText.split(',').map(t => t.trim()).filter(t => GENRE_TAXONOMY.includes(t));
  } catch (error) {
    console.error('Gemini genre tag error:', error.message);
    return [];
  }
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

function buildMusicJourneyStoryFallback(journey) {
  const normalizedJourney = String(journey || '').replace(/\s+/g, ' ').trim();
  const excerpt = normalizedJourney.length > 220
    ? `${normalizedJourney.slice(0, 217)}...`
    : normalizedJourney;

  return [
    `It starts quietly: a life measured in songs, in small private rituals, in the albums that stayed when other things changed. ${excerpt} In that story, music is not background noise. It is memory with rhythm, a way of naming seasons of growth, grief, and becoming without having to explain every wound out loud.`,
    `Another version of this journey feels like learning yourself in layers. Certain artists arrive first as comfort, then return later as mirrors, reflecting who you were and who you are still trying to become. The deeper truth is simple: your taste has been building an emotional map, turning scattered moments into something coherent, intimate, and lasting.`,
    `The most moving part is not just what you listened to, but how faithfully music kept pace with your life. It held joy without making it shallow and held sadness without making it collapse. Over time, your listening history became a kind of autobiography: concise, imperfect, and deeply human, but unmistakably yours.`,
  ];
}

async function generateMusicJourneyStories(journey) {
  const fallbackStories = buildMusicJourneyStoryFallback(journey);
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return fallbackStories;
  }

  try {
    const prompt = `Write exactly 3 short, heartfelt stories inspired by the following music journey.

Requirements:
- Each story should be emotionally intelligent, warm, and reflective.
- Each story should be concise but deep, roughly 60 to 95 words.
- No titles, no numbering, no bullet points inside the stories.
- Make each story distinct in emotional angle.
- Return strict JSON with this exact shape: {"stories":["story one","story two","story three"]}.

Music journey:
${journey}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini story generation failed.');
    }

    let responseText = extractGeminiText(data);
    if (!responseText) {
      return fallbackStories;
    }

    responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return fallbackStories;
    }

    const storyCandidates = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed?.stories) ? parsed.stories : []);

    const normalizedStories = storyCandidates
      .filter((story) => typeof story === 'string' && story.trim())
      .map((story) => story.trim())
      .slice(0, 3);

    if (normalizedStories.length === 0) {
      return fallbackStories;
    }

    while (normalizedStories.length < 3) {
      normalizedStories.push(fallbackStories[normalizedStories.length]);
    }

    return normalizedStories;
  } catch (error) {
    console.error('Gemini story generation error:', error.message);
    return fallbackStories;
  }
}

async function rebuildSongAggregate(songId) {
  const reviews = await Review.find({ songId });

  // Average embedding from reviews
  const reviewsWithEmbeddings = reviews.filter(r => r.embedding && r.embedding.length > 0);
  let avgEmbedding = [];
  if (reviewsWithEmbeddings.length > 0) {
    const dim = reviewsWithEmbeddings[0].embedding.length;
    avgEmbedding = new Array(dim).fill(0);
    for (const r of reviewsWithEmbeddings) {
      for (let i = 0; i < dim; i++) {
        avgEmbedding[i] += r.embedding[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      avgEmbedding[i] /= reviewsWithEmbeddings.length;
    }
  }

  // Genre weights from reviews
  const genreCounts = {};
  for (const r of reviews) {
    for (const tag of (r.genreTags || [])) {
      genreCounts[tag] = (genreCounts[tag] || 0) + 1;
    }
  }
  const genreWeights = {};
  const totalReviews = reviews.length || 1;
  for (const [genre, count] of Object.entries(genreCounts)) {
    genreWeights[genre] = count / totalReviews;
  }

  // Average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Users who liked this song
  const usersWhoLiked = await User.find({ 'likedSongs.id': songId }, { _id: 1 });
  const likedByUserIds = usersWhoLiked.map(u => u._id.toString());

  // Get song metadata from a user's likedSongs snapshot
  let title = '', artist = '', albumId = '', albumTitle = '', coverUrl = '', duration = '', previewUrl = null, spotifyUrl = null;

  const userWithSong = await User.findOne({ 'likedSongs.id': songId });
  if (userWithSong) {
    const snap = (userWithSong.likedSongs || []).find(s => s.id === songId);
    if (snap) {
      title = snap.title || '';
      artist = snap.artist || '';
      albumId = snap.albumId || '';
      albumTitle = snap.albumTitle || '';
      coverUrl = snap.coverUrl || '';
      duration = snap.duration || '';
      previewUrl = snap.previewUrl || null;
      spotifyUrl = snap.spotifyUrl || null;
    }
  }

  // Fallback metadata from review
  if (!title && reviews.length > 0) {
    const r = reviews[0];
    artist = r.artist || '';
    albumId = r.albumId || '';
    albumTitle = r.albumTitle || '';
    coverUrl = r.albumCover || '';
  }

  await SongAggregate.findOneAndUpdate(
    { songId },
    {
      songId, title, artist, albumId, albumTitle, coverUrl, duration, previewUrl, spotifyUrl,
      avgEmbedding, genreWeights, reviewCount: reviews.length, avgRating, likedByUserIds,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

async function processReviewWithGemini(reviewId) {
  try {
    const review = await Review.findById(reviewId);
    if (!review || !review.text) return;

    const embeddingText = `${review.artist} - ${review.albumTitle}: ${review.text}`;
    const [embedding, genreTags] = await Promise.all([
      generateEmbedding(embeddingText),
      generateGenreTags(review.text, review.artist, review.albumTitle),
    ]);

    if (embedding.length > 0) review.embedding = embedding;
    if (genreTags.length > 0) review.genreTags = genreTags;
    await review.save();

    if (review.songId) {
      await rebuildSongAggregate(review.songId);
    }
  } catch (error) {
    console.error('Review post-processing error:', error.message);
  }
}

// --- SCORING UTILITIES ---

function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function jaccardWithSignificance(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap++;
  }
  const union = setA.size + setB.size - overlap;
  if (union === 0) return 0;
  const jaccard = overlap / union;
  const significance = Math.min(1, overlap / 4);
  return jaccard * significance;
}

function genreOverlap(weightsA, weightsB) {
  if (!weightsA || !weightsB) return 0;
  const getVal = (w, key) => (w instanceof Map ? w.get(key) : w[key]) || 0;
  let dot = 0, normA = 0, normB = 0;
  for (const genre of GENRE_TAXONOMY) {
    const a = getVal(weightsA, genre);
    const b = getVal(weightsB, genre);
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function artistMatchScore(artistA, artistB) {
  if (!artistA || !artistB) return 0;
  const normA = artistA.toLowerCase().trim();
  const normB = artistB.toLowerCase().trim();
  if (normA === normB) return 1.0;
  const partsA = normA.split(/,\s*/).map(s => s.trim());
  const partsB = normB.split(/,\s*/).map(s => s.trim());
  for (const a of partsA) {
    for (const b of partsB) {
      if (a === b) return 0.4;
    }
  }
  return 0;
}

function scorePair(candidate, seed) {
  // Collaborative score
  const seedUserSet = new Set(seed.likedByUserIds || []);
  const candidateUserSet = new Set(candidate.likedByUserIds || []);
  const hasCollab = seedUserSet.size > 0 || candidateUserSet.size > 0;
  const collaborativeScore = jaccardWithSignificance(seedUserSet, candidateUserSet);

  // Semantic score
  const hasSemantic = seed.avgEmbedding?.length > 0 && candidate.avgEmbedding?.length > 0;
  const embeddingCosine = hasSemantic ? Math.max(0, cosineSimilarity(seed.avgEmbedding, candidate.avgEmbedding)) : 0;
  const genreJaccard = genreOverlap(seed.genreWeights, candidate.genreWeights);
  const semanticScore = hasSemantic ? Math.min(1, 0.90 * embeddingCosine + 0.10 * genreJaccard) : 0;

  // Core score (per spec)
  let coreScore;
  if (hasCollab && hasSemantic) {
    coreScore = 0.65 * collaborativeScore + 0.35 * semanticScore;
  } else if (hasCollab) {
    coreScore = collaborativeScore;
  } else if (hasSemantic) {
    coreScore = semanticScore;
  } else {
    coreScore = 0;
  }

  // Artist and album scores
  const artistScore = artistMatchScore(seed.artist, candidate.artist);
  const albumScore = (seed.albumId && candidate.albumId && seed.albumId === candidate.albumId) ? 1.0 : 0.0;

  // Pair score (per spec: 0.85 * core + 0.10 * artist + 0.05 * album)
  const pairScore = 0.85 * coreScore + 0.10 * artistScore + 0.05 * albumScore;
  return Math.min(Math.max(pairScore, 0), 1);
}

function scoreCandidate(candidate, seeds) {
  if (seeds.length === 0) return 0;
  if (seeds.length === 1) return scorePair(candidate, seeds[0]);

  let maxPairScore = 0;
  let supportCount = 0;

  for (const seed of seeds) {
    const ps = scorePair(candidate, seed);
    maxPairScore = Math.max(maxPairScore, ps);
    if (ps >= 0.45) supportCount++;
  }

  const coverageBonus = Math.min(0.10, 0.05 * Math.max(0, supportCount - 1));
  return Math.min(1, maxPairScore + coverageBonus);
}

// --- CANDIDATE GENERATION ---

async function getCollaborativeCandidates(seedSongIds, limit = 100) {
  const users = await User.find(
    { 'likedSongs.id': { $in: seedSongIds } },
    { likedSongs: 1 }
  );
  const candidateIds = new Set();
  for (const user of users) {
    for (const song of (user.likedSongs || [])) {
      if (!seedSongIds.includes(song.id)) {
        candidateIds.add(song.id);
      }
    }
  }
  const ids = [...candidateIds].slice(0, limit);
  return SongAggregate.find({ songId: { $in: ids } });
}

async function getSemanticCandidates(seedAggregates, seedSongIds, limit = 30) {
  const allAggregates = await SongAggregate.find({
    songId: { $nin: seedSongIds },
    'avgEmbedding.0': { $exists: true },
  });
  const scored = new Map();
  for (const seed of seedAggregates) {
    if (!seed.avgEmbedding || seed.avgEmbedding.length === 0) continue;
    for (const agg of allAggregates) {
      const sim = cosineSimilarity(seed.avgEmbedding, agg.avgEmbedding);
      const existing = scored.get(agg.songId);
      if (!existing || sim > existing.score) {
        scored.set(agg.songId, { agg, score: sim });
      }
    }
  }
  return [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => entry.agg);
}

async function getMetadataCandidates(seedAggregates, seedSongIds, limit = 20) {
  const artists = seedAggregates.map(s => s.artist).filter(Boolean);
  const albumIds = seedAggregates.map(s => s.albumId).filter(Boolean);
  if (artists.length === 0 && albumIds.length === 0) return [];
  return SongAggregate.find({
    songId: { $nin: seedSongIds },
    $or: [
      ...(artists.length > 0 ? [{ artist: { $in: artists } }] : []),
      ...(albumIds.length > 0 ? [{ albumId: { $in: albumIds } }] : []),
    ],
  }).limit(limit);
}

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
    favoriteSongs: user.favoriteSongs || [],
    favoriteArtists: user.favoriteArtists || [],
    likedSongs: user.likedSongs || [],
    likedArtists: user.likedArtists || [],
    friendIds: user.friendIds || [],
    incomingFriendRequestIds: user.incomingFriendRequestIds || [],
    outgoingFriendRequestIds: user.outgoingFriendRequestIds || [],
    recentAlbumIds: user.recentAlbumIds,
    totalRatings: user.totalRatings,
    joinedDate: user.joinedDate ? user.joinedDate.toISOString() : null,
    profileColor: user.profileColor,
  };
}

function sanitizeUserSummary(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileColor: user.profileColor,
  };
}

function getOptionalAuthUserId(req) {
  const token = getTokenFromRequest(req);
  const payload = readAuthToken(token);

  return payload?.userId ? String(payload.userId) : null;
}

async function buildReviewAuthorProfileMap(reviews) {
  const userIds = new Set();

  for (const review of reviews) {
    if (review?.userId) {
      userIds.add(String(review.userId));
    }

    const comments = Array.isArray(review?.comments) ? review.comments : [];

    for (const comment of comments) {
      if (comment?.userId) {
        userIds.add(String(comment.userId));
      }
    }
  }

  if (userIds.size === 0) {
    return new Map();
  }

  const users = await User.find({
    _id: { $in: [...userIds] },
  }).select('_id username avatarUrl');

  return new Map(
    users.map((user) => [
      user._id.toString(),
      {
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    ])
  );
}

function sanitizeReviewComment(comment, viewerUserId = null, authorProfileMap = null) {
  const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
  const authorProfile = authorProfileMap?.get(String(comment.userId));

  return {
    id: comment._id.toString(),
    userId: comment.userId,
    username: authorProfile?.username || comment.username,
    avatarUrl: authorProfile?.avatarUrl || comment.avatarUrl,
    text: comment.text,
    likesCount: likedBy.length,
    popularityScore: likedBy.length,
    currentUserLiked: viewerUserId ? likedBy.includes(viewerUserId) : false,
    date: comment.date ? comment.date.toISOString().split('T')[0] : null,
  };
}

function sanitizeReview(review, viewerUserId = null, authorProfileMap = null) {
  const likedBy = Array.isArray(review.likedBy) ? review.likedBy : [];
  const dislikedBy = Array.isArray(review.dislikedBy) ? review.dislikedBy : [];
  const comments = Array.isArray(review.comments) ? review.comments.slice(0, MAX_REVIEW_COMMENTS) : [];
  const authorProfile = authorProfileMap?.get(String(review.userId));
  let currentUserReaction = null;

  if (viewerUserId) {
    if (likedBy.includes(viewerUserId)) {
      currentUserReaction = 'like';
    } else if (dislikedBy.includes(viewerUserId)) {
      currentUserReaction = 'dislike';
    }
  }

  return {
    id: review._id.toString(),
    userId: review.userId,
    username: authorProfile?.username || review.username,
    avatarUrl: authorProfile?.avatarUrl || review.avatarUrl,
    albumId: review.albumId,
    songId: review.songId || null,
    albumTitle: review.albumTitle,
    albumCover: review.albumCover,
    artist: review.artist,
    rating: review.rating,
    text: review.text,
    likesCount: likedBy.length,
    dislikesCount: dislikedBy.length,
    currentUserReaction,
    comments: comments.map((comment) => sanitizeReviewComment(comment, viewerUserId, authorProfileMap)),
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

function mapSpotifyArtist(artist) {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images?.[0]?.url || '',
    genres: Array.isArray(artist.genres) ? artist.genres : [],
    spotifyUrl: artist.external_urls?.spotify || null,
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

async function findSpotifyArtist(accessToken, name) {
  const artistSearchData = await searchSpotifyCatalog(accessToken, {
    query: name,
    types: ['artist'],
    limit: 10,
    market: 'US',
  });

  const artists = Array.isArray(artistSearchData.artists?.items)
    ? artistSearchData.artists.items
    : [];

  if (artists.length === 0) {
    return null;
  }

  const normalizedName = normalizeLabel(name);
  const exactMatch = artists.find((artist) => normalizeLabel(artist.name) === normalizedName);
  return exactMatch || artists[0];
}

async function getSpotifyArtistAlbums(accessToken, artistId, {
  market = 'US',
  includeGroups = 'album,single',
} = {}) {
  const albums = [];
  let offset = 0;
  let shouldContinue = true;

  while (shouldContinue) {
    const params = new URLSearchParams({
      include_groups: includeGroups,
      market,
      limit: '50',
      offset: String(offset),
    });

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Spotify artist albums request failed');
    }

    const items = Array.isArray(data.items) ? data.items : [];
    albums.push(...items);
    offset += items.length;
    shouldContinue = Boolean(data.next) && items.length > 0;
  }

  const seenReleaseKeys = new Set();

  return albums.filter((album) => {
    const dedupeKey = `${normalizeLabel(album.name)}::${album.release_date || ''}`;

    if (seenReleaseKeys.has(dedupeKey)) {
      return false;
    }

    seenReleaseKeys.add(dedupeKey);
    return true;
  });
}

async function getSpotifyArtistTopTracks(accessToken, artistId, {
  market = 'US',
} = {}) {
  const params = new URLSearchParams({ market });
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error('Spotify artist top tracks request failed');
  }

  return Array.isArray(data.tracks) ? data.tracks : [];
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
    .slice(0, 12)
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
      limit: 12,
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
      limit: 12,
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

app.post('/api/top-stories', async (req, res) => {
  const journey = String(req.body.journey || '').trim();

  if (journey.length < 20) {
    return res.status(400).json({ error: 'Share a bit more about your music journey.' });
  }

  if (journey.length > 4000) {
    return res.status(400).json({ error: 'Keep your music journey under 4000 characters.' });
  }

  try {
    const stories = await generateMusicJourneyStories(journey);
    return res.json({ stories });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate stories.',
    });
  }
});

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

app.get('/api/auth/network', requireAuth, async (req, res) => {
  try {
    const friendIds = Array.isArray(req.authUser.friendIds) ? req.authUser.friendIds : [];
    const incomingFriendRequestIds = Array.isArray(req.authUser.incomingFriendRequestIds)
      ? req.authUser.incomingFriendRequestIds
      : [];

    const [friendUsers, incomingRequestUsers] = await Promise.all([
      friendIds.length > 0 ? User.find({ _id: { $in: friendIds } }) : [],
      incomingFriendRequestIds.length > 0 ? User.find({ _id: { $in: incomingFriendRequestIds } }) : [],
    ]);

    const friendMap = new Map(friendUsers.map((user) => [user._id.toString(), user]));
    const requestMap = new Map(incomingRequestUsers.map((user) => [user._id.toString(), user]));

    return res.json({
      friends: friendIds
        .map((id) => friendMap.get(id))
        .filter(Boolean)
        .map((user) => sanitizeUserSummary(user)),
      incomingRequests: incomingFriendRequestIds
        .map((id) => requestMap.get(id))
        .filter(Boolean)
        .map((user) => sanitizeUserSummary(user)),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load friend network.' });
  }
});

app.post('/api/users/:id/friend-request', requireAuth, async (req, res) => {
  const targetUserId = String(req.params.id || '').trim();
  const authUserId = req.authUser._id.toString();

  if (!targetUserId || targetUserId === authUserId) {
    return res.status(400).json({ error: 'Choose a different user.' });
  }

  try {
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const friendIds = Array.isArray(req.authUser.friendIds) ? req.authUser.friendIds : [];
    const incomingFriendRequestIds = Array.isArray(req.authUser.incomingFriendRequestIds)
      ? req.authUser.incomingFriendRequestIds
      : [];
    const outgoingFriendRequestIds = Array.isArray(req.authUser.outgoingFriendRequestIds)
      ? req.authUser.outgoingFriendRequestIds
      : [];

    if (friendIds.includes(targetUserId)) {
      return res.json({ user: sanitizeUser(req.authUser) });
    }

    if (incomingFriendRequestIds.includes(targetUserId)) {
      return res.status(409).json({ error: 'This user already sent you a request. Accept it instead.' });
    }

    if (outgoingFriendRequestIds.includes(targetUserId)) {
      return res.json({ user: sanitizeUser(req.authUser) });
    }

    req.authUser.outgoingFriendRequestIds = [...outgoingFriendRequestIds, targetUserId];

    const targetIncoming = Array.isArray(targetUser.incomingFriendRequestIds)
      ? targetUser.incomingFriendRequestIds
      : [];
    targetUser.incomingFriendRequestIds = targetIncoming.includes(authUserId)
      ? targetIncoming
      : [...targetIncoming, authUserId];

    await Promise.all([req.authUser.save(), targetUser.save()]);

    return res.json({
      user: sanitizeUser(req.authUser),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send friend request.' });
  }
});

app.post('/api/users/:id/friend-accept', requireAuth, async (req, res) => {
  const requesterUserId = String(req.params.id || '').trim();
  const authUserId = req.authUser._id.toString();

  if (!requesterUserId || requesterUserId === authUserId) {
    return res.status(400).json({ error: 'Choose a different user.' });
  }

  try {
    const requesterUser = await User.findById(requesterUserId);

    if (!requesterUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const incomingFriendRequestIds = Array.isArray(req.authUser.incomingFriendRequestIds)
      ? req.authUser.incomingFriendRequestIds
      : [];

    if (!incomingFriendRequestIds.includes(requesterUserId)) {
      return res.status(400).json({ error: 'No friend request from this user.' });
    }

    const currentFriendIds = Array.isArray(req.authUser.friendIds) ? req.authUser.friendIds : [];
    req.authUser.incomingFriendRequestIds = incomingFriendRequestIds.filter((id) => id !== requesterUserId);
    req.authUser.friendIds = currentFriendIds.includes(requesterUserId)
      ? currentFriendIds
      : [...currentFriendIds, requesterUserId];

    const requesterOutgoing = Array.isArray(requesterUser.outgoingFriendRequestIds)
      ? requesterUser.outgoingFriendRequestIds
      : [];
    const requesterFriends = Array.isArray(requesterUser.friendIds) ? requesterUser.friendIds : [];
    requesterUser.outgoingFriendRequestIds = requesterOutgoing.filter((id) => id !== authUserId);
    requesterUser.friendIds = requesterFriends.includes(authUserId)
      ? requesterFriends
      : [...requesterFriends, authUserId];

    await Promise.all([req.authUser.save(), requesterUser.save()]);

    return res.json({
      user: sanitizeUser(req.authUser),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to accept friend request.' });
  }
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const updates = {};
  const MAX_FAVORITE_SONGS = 4;
  const {
    username,
    displayName,
    avatarUrl,
    profileColor,
    favoriteArtists,
    favoriteSongs,
    likedSongs,
    likedArtists,
    topFive,
  } = req.body;

  if (typeof username === 'string') {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Username cannot be empty.' });
    }

    if (/\s/.test(normalizedUsername)) {
      return res.status(400).json({ error: 'Username cannot contain spaces.' });
    }

    if (normalizedUsername !== req.authUser.username) {
      updates.username = normalizedUsername;
    }
  }

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
    updates.topFive = topFive
      .map((song) => normalizeSongSnapshotInput(song))
      .filter(Boolean)
      .slice(0, 5);
  }

  if (Array.isArray(likedSongs)) {
    const nextLikedSongs = likedSongs
      .map((song) => normalizeSongSnapshotInput(song))
      .filter(Boolean);
    const nextLikedArtists = [...new Set(
      nextLikedSongs
        .map((song) => (typeof song.artist === 'string' ? song.artist.trim() : ''))
        .filter(Boolean)
    )];
    const nextLikedSongIds = new Set(
      nextLikedSongs
        .map((song) => (typeof song.id === 'string' ? song.id : ''))
        .filter(Boolean)
    );
    const currentFavoriteSongs = Array.isArray(req.authUser.favoriteSongs) ? req.authUser.favoriteSongs : [];
    const nextFavoriteSongs = currentFavoriteSongs
      .filter((song) => song && typeof song === 'object' && typeof song.id === 'string' && nextLikedSongIds.has(song.id))
      .slice(0, MAX_FAVORITE_SONGS);

    updates.likedSongs = nextLikedSongs;
    updates.likedArtists = nextLikedArtists;
    updates.favoriteSongs = nextFavoriteSongs;
  } else if (Array.isArray(likedArtists)) {
    updates.likedArtists = likedArtists.filter((artist) => typeof artist === 'string');
  }

  if (Array.isArray(favoriteSongs)) {
    const sourceLikedSongs = Array.isArray(updates.likedSongs)
      ? updates.likedSongs
      : (Array.isArray(req.authUser.likedSongs) ? req.authUser.likedSongs : []);
    const likedSongIds = new Set(
      sourceLikedSongs
        .map((song) => (song && typeof song === 'object' && typeof song.id === 'string' ? song.id : ''))
        .filter(Boolean)
    );

    updates.favoriteSongs = favoriteSongs
      .map((song) => normalizeSongSnapshotInput(song))
      .filter((song) => song && likedSongIds.has(song.id))
      .slice(0, MAX_FAVORITE_SONGS);
  }

  try {
    if (typeof updates.username === 'string') {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: req.authUser._id },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }
    }

    Object.assign(req.authUser, updates);
    await req.authUser.save();

    if (typeof updates.username === 'string' || typeof updates.avatarUrl === 'string') {
      const authUserId = req.authUser._id.toString();
      const reviewFieldUpdates = {};
      const commentFieldUpdates = {};

      if (typeof updates.username === 'string') {
        reviewFieldUpdates.username = updates.username;
        commentFieldUpdates['comments.$[comment].username'] = updates.username;
      }

      if (typeof updates.avatarUrl === 'string') {
        reviewFieldUpdates.avatarUrl = updates.avatarUrl;
        commentFieldUpdates['comments.$[comment].avatarUrl'] = updates.avatarUrl;
      }

      await Promise.all([
        Review.updateMany(
          { userId: authUserId },
          { $set: reviewFieldUpdates }
        ),
        Review.updateMany(
          { 'comments.userId': authUserId },
          { $set: commentFieldUpdates },
          { arrayFilters: [{ 'comment.userId': authUserId }] }
        ),
      ]);
    }

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

    if (albums.length === 0) {
      try {
        albums = await findTrendingAlbums(accessToken);
        if (albums.length > 0 && source !== 'fallback-search') {
          source = `${source} + fallback albums`;
        }
      } catch {
        // Preserve any tracks we already have; the route can still succeed with partial data.
      }
    }

    if (tracks.length === 0) {
      try {
        tracks = await findTrendingTracks(accessToken);
        if (tracks.length > 0 && source !== 'fallback-search') {
          source = `${source} + fallback tracks`;
        }
      } catch {
        // Preserve any albums we already have; the route can still succeed with partial data.
      }
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

app.get('/api/artists/:name', async (req, res) => {
  const artistName = decodeURIComponent(String(req.params.name || '')).trim();

  if (!artistName) {
    return res.status(400).json({ error: 'Artist name is required.' });
  }

  try {
    const accessToken = await getSpotifyAccessToken();
    const artist = await findSpotifyArtist(accessToken, artistName);

    if (!artist?.id) {
      return res.status(404).json({ error: 'Artist not found on Spotify.' });
    }

    const [artistAlbums, topTracks] = await Promise.all([
      getSpotifyArtistAlbums(accessToken, artist.id, { market: 'US' }),
      getSpotifyArtistTopTracks(accessToken, artist.id, { market: 'US' }),
    ]);

    return res.json({
      market: 'US',
      artist: mapSpotifyArtist(artist),
      albums: artistAlbums.map(mapSpotifyAlbum),
      tracks: topTracks.map(mapSpotifyTrack),
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Spotify artist fetch failed',
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Spotify track fetch failed',
    });
  }
});

app.get('/api/reviews', async (req, res) => {
  const filters = {};
  const viewerUserId = getOptionalAuthUserId(req);
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
    const authorProfileMap = await buildReviewAuthorProfileMap(reviews);

    return res.json({
      reviews: reviews.map((review) => sanitizeReview(review, viewerUserId, authorProfileMap)),
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

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Ratings must be between 1 and 5.' });
  }

  if (text.length > 500) {
    return res.status(400).json({ error: 'Reviews must be 500 characters or fewer.' });
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
    req.authUser.reviewHistory = upsertActivityEntry(
      req.authUser.reviewHistory,
      'reviewId',
      createUserReviewSnapshot(newReview),
    );
    req.authUser.totalRatings = Math.max(
      Number(req.authUser.totalRatings) || 0,
      Math.max((Array.isArray(req.authUser.reviewHistory) ? req.authUser.reviewHistory.length : 1) - 1, 0),
    ) + 1;
    await req.authUser.save();

    // Fire-and-forget: process with Gemini for embedding + genre tags
    processReviewWithGemini(newReview._id.toString()).catch(err =>
      console.error('Background Gemini processing failed:', err.message)
    );

    const authorProfileMap = await buildReviewAuthorProfileMap([newReview]);

    return res.status(201).json({
      review: sanitizeReview(newReview, req.authUser._id.toString(), authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save review' });
  }
});

app.patch('/api/reviews/:id', requireAuth, async (req, res) => {
  const reviewId = String(req.params.id || '').trim();
  const text = String(req.body.text || '').trim();
  const rating = Number(req.body.rating);

  if (!reviewId) {
    return res.status(400).json({ error: 'Review id is required.' });
  }

  if (!text || !Number.isFinite(rating)) {
    return res.status(400).json({ error: 'Rating and review text are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Ratings must be between 1 and 5.' });
  }

  if (text.length > 500) {
    return res.status(400).json({ error: 'Reviews must be 500 characters or fewer.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const authUserId = req.authUser._id.toString();

    if (review.userId !== authUserId) {
      return res.status(403).json({ error: 'You can only edit your own reviews.' });
    }

    review.rating = rating;
    review.text = text;
    await review.save();
    const authorProfileMap = await buildReviewAuthorProfileMap([review]);

    return res.json({
      review: sanitizeReview(review, authUserId, authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update review.' });
  }
});
app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
  const reviewId = String(req.params.id || '').trim();

  if (!reviewId) {
    return res.status(400).json({ error: 'Review id is required.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const authUserId = req.authUser._id.toString();

    if (review.userId !== authUserId) {
      return res.status(403).json({ error: 'You can only delete your own reviews.' });
    }

    await review.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
});

app.patch('/api/reviews/:id/reaction', requireAuth, async (req, res) => {
  const reviewId = String(req.params.id || '').trim();
  const reaction = typeof req.body.reaction === 'string'
    ? req.body.reaction.trim().toLowerCase()
    : null;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review id is required.' });
  }

  if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
    return res.status(400).json({ error: 'Reaction must be like, dislike, or null.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const authUserId = req.authUser._id.toString();
    const likedBy = (Array.isArray(review.likedBy) ? review.likedBy : []).filter((id) => id !== authUserId);
    const dislikedBy = (Array.isArray(review.dislikedBy) ? review.dislikedBy : []).filter((id) => id !== authUserId);

    if (reaction === 'like') {
      likedBy.push(authUserId);
    } else if (reaction === 'dislike') {
      dislikedBy.push(authUserId);
    }

    review.likedBy = likedBy;
    review.dislikedBy = dislikedBy;
    await review.save();
    const authorProfileMap = await buildReviewAuthorProfileMap([review]);

    req.authUser.reviewReactionHistory = reaction
      ? upsertActivityEntry(
          req.authUser.reviewReactionHistory,
          'reviewId',
          createUserReviewReactionSnapshot(review, reaction),
        )
      : removeActivityEntry(req.authUser.reviewReactionHistory, 'reviewId', reviewId);
    await req.authUser.save();

    return res.json({
      review: sanitizeReview(review, authUserId, authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update review reaction.' });
  }
});

app.post('/api/reviews/:id/comments', requireAuth, async (req, res) => {
  const reviewId = String(req.params.id || '').trim();
  const text = String(req.body.text || '').trim();

  if (!reviewId) {
    return res.status(400).json({ error: 'Review id is required.' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  if (text.length > 300) {
    return res.status(400).json({ error: 'Comments must be 300 characters or fewer.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (Array.isArray(review.comments) && review.comments.length >= MAX_REVIEW_COMMENTS) {
      return res.status(400).json({ error: `Reviews can only have up to ${MAX_REVIEW_COMMENTS} comments.` });
    }

    review.comments.push({
      userId: req.authUser._id.toString(),
      username: req.authUser.username,
      avatarUrl: req.authUser.avatarUrl,
      text,
    });
    await review.save();
    const authorProfileMap = await buildReviewAuthorProfileMap([review]);

    const createdComment = review.comments[review.comments.length - 1];

    if (createdComment?._id) {
      req.authUser.commentHistory = upsertActivityEntry(
        req.authUser.commentHistory,
        'commentId',
        createUserCommentSnapshot(review, createdComment),
      );
      await req.authUser.save();
    }

    return res.status(201).json({
      review: sanitizeReview(review, req.authUser._id.toString(), authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
});

app.patch('/api/reviews/:reviewId/comments/:commentId', requireAuth, async (req, res) => {
  const reviewId = String(req.params.reviewId || '').trim();
  const commentId = String(req.params.commentId || '').trim();
  const text = String(req.body.text || '').trim();

  if (!reviewId || !commentId) {
    return res.status(400).json({ error: 'Review id and comment id are required.' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  if (text.length > 300) {
    return res.status(400).json({ error: 'Comments must be 300 characters or fewer.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const comment = review.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const authUserId = req.authUser._id.toString();

    if (comment.userId !== authUserId) {
      return res.status(403).json({ error: 'You can only edit your own comments.' });
    }

    comment.text = text;
    await review.save();
    const authorProfileMap = await buildReviewAuthorProfileMap([review]);

    return res.json({
      review: sanitizeReview(review, authUserId, authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update comment.' });
  }
});
app.delete('/api/reviews/:reviewId/comments/:commentId', requireAuth, async (req, res) => {
  const reviewId = String(req.params.reviewId || '').trim();
  const commentId = String(req.params.commentId || '').trim();

  if (!reviewId || !commentId) {
    return res.status(400).json({ error: 'Review id and comment id are required.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const comment = review.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const authUserId = req.authUser._id.toString();

    if (comment.userId !== authUserId) {
      return res.status(403).json({ error: 'You can only delete your own comments.' });
    }

    comment.deleteOne();
    await review.save();
    const authorProfileMap = await buildReviewAuthorProfileMap([review]);

    return res.json({
      review: sanitizeReview(review, authUserId, authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

app.patch('/api/reviews/:reviewId/comments/:commentId/like', requireAuth, async (req, res) => {
  const reviewId = String(req.params.reviewId || '').trim();
  const commentId = String(req.params.commentId || '').trim();

  if (!reviewId || !commentId) {
    return res.status(400).json({ error: 'Review id and comment id are required.' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const comment = review.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const authUserId = req.authUser._id.toString();
    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
    const hasLiked = likedBy.includes(authUserId);

    comment.likedBy = hasLiked
      ? likedBy.filter((id) => id !== authUserId)
      : [...likedBy, authUserId];

    await review.save();
    const authorProfileMap = await buildReviewAuthorProfileMap([review]);

    req.authUser.commentLikeHistory = hasLiked
      ? removeActivityEntry(req.authUser.commentLikeHistory, 'commentId', commentId)
      : upsertActivityEntry(
          req.authUser.commentLikeHistory,
          'commentId',
          createUserCommentLikeSnapshot(review, commentId),
        );
    await req.authUser.save();

    return res.json({
      review: sanitizeReview(review, authUserId, authorProfileMap),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update comment like.' });
  }
});

// --- MATCHING ENDPOINTS ---

app.get('/api/match/songs', async (req, res) => {
  const songIdsParam = String(req.query.songIds || '').trim();
  if (!songIdsParam) {
    return res.status(400).json({ error: 'Provide at least one songId.' });
  }

  const seedSongIds = songIdsParam.split(',').map(id => id.trim()).filter(Boolean);
  if (seedSongIds.length === 0 || seedSongIds.length > 3) {
    return res.status(400).json({ error: 'Provide between 1 and 3 song IDs.' });
  }

  try {
    // Ensure seed aggregates exist (build on-the-fly if missing)
    for (const seedId of seedSongIds) {
      const existing = await SongAggregate.findOne({ songId: seedId });
      if (!existing) {
        await rebuildSongAggregate(seedId);
        // If still no aggregate, create minimal one from user likedSongs
        const stillMissing = await SongAggregate.findOne({ songId: seedId });
        if (!stillMissing) {
          const userWithSong = await User.findOne({ 'likedSongs.id': seedId });
          if (userWithSong) {
            const snap = (userWithSong.likedSongs || []).find(s => s.id === seedId);
            if (snap) {
              const likedByUsers = await User.find({ 'likedSongs.id': seedId }, { _id: 1 });
              await SongAggregate.create({
                songId: seedId, title: snap.title || '', artist: snap.artist || '',
                albumId: snap.albumId || '', albumTitle: snap.albumTitle || '',
                coverUrl: snap.coverUrl || '', duration: snap.duration || '',
                previewUrl: snap.previewUrl || null, spotifyUrl: snap.spotifyUrl || null,
                likedByUserIds: likedByUsers.map(u => u._id.toString()),
              });
            }
          }
        }
      }
    }

    const seedAggregates = await SongAggregate.find({ songId: { $in: seedSongIds } });

    // Stage 1: Candidate generation (parallel)
    const [collabCandidates, semanticCandidates, metadataCandidates] = await Promise.all([
      getCollaborativeCandidates(seedSongIds, 100),
      getSemanticCandidates(seedAggregates, seedSongIds, 30),
      getMetadataCandidates(seedAggregates, seedSongIds, 20),
    ]);

    // Merge and deduplicate
    const candidateMap = new Map();
    for (const agg of [...collabCandidates, ...semanticCandidates, ...metadataCandidates]) {
      if (!candidateMap.has(agg.songId) && !seedSongIds.includes(agg.songId)) {
        candidateMap.set(agg.songId, agg);
      }
    }

    // Stage 2: Score and rank
    const scored = [];
    for (const [, candidate] of candidateMap) {
      const finalScore = scoreCandidate(candidate, seedAggregates);
      const displayScore = Math.round(finalScore * 100);
      if (displayScore >= 35) {
        scored.push({ candidate, displayScore });
      }
    }

    scored.sort((a, b) => b.displayScore - a.displayScore);
    let topMatches = scored.slice(0, 20);

    // Cold-start fallback: if few results, add same-artist songs
    if (topMatches.length < 5 && seedAggregates.length > 0) {
      const fallbackAggs = await SongAggregate.find({
        songId: { $nin: [...seedSongIds, ...topMatches.map(m => m.candidate.songId)] },
        artist: { $in: seedAggregates.map(s => s.artist).filter(Boolean) },
      }).limit(10);
      for (const agg of fallbackAggs) {
        topMatches.push({ candidate: agg, displayScore: Math.max(35, Math.round(scorePair(agg, seedAggregates[0]) * 100)) });
      }
      topMatches.sort((a, b) => b.displayScore - a.displayScore);
      topMatches = topMatches.slice(0, 20);
    }

    const matches = topMatches.map(({ candidate, displayScore }) => ({
      id: candidate.songId,
      title: candidate.title || candidate.albumTitle || 'Unknown',
      artist: candidate.artist || 'Unknown',
      albumId: candidate.albumId || '',
      albumTitle: candidate.albumTitle || '',
      coverUrl: candidate.coverUrl || '',
      duration: candidate.duration || '',
      previewUrl: candidate.previewUrl || null,
      spotifyUrl: candidate.spotifyUrl || null,
      similarityScore: displayScore,
    }));

    return res.json({ matches });
  } catch (error) {
    console.error('Match songs error:', error);
    return res.status(500).json({ error: 'Failed to find similar songs.' });
  }
});

app.get('/api/match/users', async (req, res) => {
  const songIdsParam = String(req.query.songIds || '').trim();
  if (!songIdsParam) {
    return res.status(400).json({ error: 'Provide at least one songId.' });
  }

  const seedSongIds = songIdsParam.split(',').map(id => id.trim()).filter(Boolean);
  if (seedSongIds.length === 0 || seedSongIds.length > 3) {
    return res.status(400).json({ error: 'Provide between 1 and 3 song IDs.' });
  }

  try {
    const users = await User.find({ 'likedSongs.id': { $in: seedSongIds } });
    const matches = [];

    for (const user of users) {
      const userLikedIds = new Set((user.likedSongs || []).map(s => s.id));
      const exactMatchedSongs = seedSongIds
        .filter(id => userLikedIds.has(id))
        .map(id => {
          const snap = (user.likedSongs || []).find(s => s.id === id);
          return snap ? {
            id: snap.id, title: snap.title, artist: snap.artist,
            albumId: snap.albumId, albumTitle: snap.albumTitle,
            coverUrl: snap.coverUrl || '', duration: snap.duration || '',
            previewUrl: snap.previewUrl || null, spotifyUrl: snap.spotifyUrl || null,
          } : null;
        })
        .filter(Boolean);

      const exactMatchPercentage = Math.round((exactMatchedSongs.length / seedSongIds.length) * 100);

      const library = (user.likedSongs || [])
        .filter(s => !seedSongIds.includes(s.id))
        .slice(0, 8)
        .map(snap => ({
          id: snap.id, title: snap.title, artist: snap.artist,
          albumId: snap.albumId, albumTitle: snap.albumTitle,
          coverUrl: snap.coverUrl || '', duration: snap.duration || '',
          previewUrl: snap.previewUrl || null, spotifyUrl: snap.spotifyUrl || null,
        }));

      matches.push({
        user: {
          id: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          totalRatings: user.totalRatings || 0,
          profileColor: user.profileColor || null,
        },
        exactMatchPercentage,
        exactMatchedSongs,
        library,
      });
    }

    matches.sort((a, b) => {
      if (b.exactMatchPercentage !== a.exactMatchPercentage) {
        return b.exactMatchPercentage - a.exactMatchPercentage;
      }
      return b.library.length - a.library.length;
    });

    return res.json({ matches: matches.slice(0, 20) });
  } catch (error) {
    console.error('Match users error:', error);
    return res.status(500).json({ error: 'Failed to find matching users.' });
  }
});

app.post('/api/admin/backfill-user-activity', async (req, res) => {
  try {
    const result = await rebuildUserActivitySnapshots();

    return res.json({
      message: `Synced ${result.usersSynced} users from ${result.reviewsSynced} reviews.`,
    });
  } catch (error) {
    console.error('User activity backfill error:', error);
    return res.status(500).json({ error: 'User activity backfill failed.' });
  }
});

app.post('/api/admin/backfill-embeddings', async (req, res) => {
  try {
    // Process reviews that don't have embeddings yet
    const reviews = await Review.find({
      $or: [
        { embedding: { $size: 0 } },
        { embedding: { $exists: false } },
      ],
      text: { $exists: true, $ne: '' },
    });

    let processed = 0;
    for (const review of reviews) {
      await processReviewWithGemini(review._id.toString());
      processed++;
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Rebuild aggregates for all songs with reviews
    const reviewSongIds = [...new Set(reviews.filter(r => r.songId).map(r => r.songId))];
    for (const songId of reviewSongIds) {
      await rebuildSongAggregate(songId);
    }

    // Build aggregates from user likedSongs
    const users = await User.find({ 'likedSongs.0': { $exists: true } });
    const allSongIds = new Set();
    for (const user of users) {
      for (const song of (user.likedSongs || [])) {
        allSongIds.add(song.id);
      }
    }

    let aggregatesCreated = 0;
    for (const songId of allSongIds) {
      const existing = await SongAggregate.findOne({ songId });
      if (!existing) {
        const userWithSong = await User.findOne({ 'likedSongs.id': songId });
        if (userWithSong) {
          const snap = (userWithSong.likedSongs || []).find(s => s.id === songId);
          if (snap) {
            const likedByUsers = await User.find({ 'likedSongs.id': songId }, { _id: 1 });
            await SongAggregate.findOneAndUpdate(
              { songId },
              {
                songId, title: snap.title || '', artist: snap.artist || '',
                albumId: snap.albumId || '', albumTitle: snap.albumTitle || '',
                coverUrl: snap.coverUrl || '', duration: snap.duration || '',
                previewUrl: snap.previewUrl || null, spotifyUrl: snap.spotifyUrl || null,
                likedByUserIds: likedByUsers.map(u => u._id.toString()),
                updatedAt: new Date(),
              },
              { upsert: true }
            );
            aggregatesCreated++;
          }
        }
      } else {
        // Update likedByUserIds for existing aggregates
        const likedByUsers = await User.find({ 'likedSongs.id': songId }, { _id: 1 });
        existing.likedByUserIds = likedByUsers.map(u => u._id.toString());
        await existing.save();
      }
    }

    const userSyncResult = await rebuildUserActivitySnapshots();

    return res.json({
      message: `Processed ${processed} reviews, created/updated ${aggregatesCreated} new aggregates, synced ${allSongIds.size} total songs, and refreshed ${userSyncResult.usersSynced} user activity profiles.`,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: 'Backfill failed.' });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
