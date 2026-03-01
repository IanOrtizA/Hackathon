require('dotenv').config();
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
  albumId: String,      // Spotify's ID for the album
  albumName: String,    // Name of the album
  reviewerName: String, // Who wrote the review
  rating: Number,       // 1 to 5 stars
  text: String,         // The actual review
  date: { type: Date, default: Date.now }
});

// Create the actual Database Model based on the blueprint
const Review = mongoose.model('Review', reviewSchema);


// --- API ROUTES ---

// 1. Search Spotify Route (From earlier)
app.get('/api/search', async (req, res) => {
  const searchQuery = req.query.q;
  if (!searchQuery) return res.status(400).json({ error: "Provide an album name!" });

  try {
    // Get VIP Pass
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${process.env.SPOTIFY_CLIENT_ID}&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`
    });
    const tokenData = await tokenResponse.json();
    
    // Search Spotify
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=album&limit=5`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const searchData = await searchResponse.json();
    
    res.json(searchData.albums.items);
  } catch (error) {
    res.status(500).json({ error: "Spotify search failed" });
  }
});

// 2. Save a new review to the database
app.post('/api/reviews', async (req, res) => {
  try {
    const newReview = new Review({
      albumId: req.body.albumId,
      albumName: req.body.albumName,
      reviewerName: req.body.reviewerName,
      rating: req.body.rating,
      text: req.body.text
    });

    const savedReview = await newReview.save(); // Saves to MongoDB!
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({ error: "Failed to save review" });
  }
});

// 3. Get all reviews for a specific album
app.get('/api/reviews/:albumId', async (req, res) => {
  try {
    // Finds all reviews where the albumId matches what we asked for
    const reviews = await Review.find({ albumId: req.params.albumId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});