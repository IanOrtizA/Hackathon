import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Heart, Plus } from "lucide-react";
import { MOCK_ALBUMS, MOCK_REVIEWS } from "@/lib/data";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AlbumDetail = () => {
  const { id } = useParams();
  const album = MOCK_ALBUMS.find((a) => a.id === id);
  const albumReviews = MOCK_REVIEWS.filter((r) => r.albumId === id);

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Album not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop */}
      <div className="relative h-72 overflow-hidden">
        <img src={album.cover} alt="" className="w-full h-full object-cover blur-3xl scale-150 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
      </div>

      <div className="container mx-auto px-4 -mt-40 relative z-10">
        <Link to="/albums" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Albums
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <img
              src={album.cover}
              alt={album.title}
              className="w-64 h-64 rounded-lg shadow-2xl object-cover"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex-1"
          >
            <h1 className="font-display text-5xl md:text-6xl text-foreground">{album.title}</h1>
            <p className="text-xl text-primary mt-1">{album.artist}</p>

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar size={14} /> {album.year}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> 42 min</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {album.genres.map((g) => (
                <span key={g} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {g}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <StarRating rating={album.rating} size={18} showValue />
              <span className="text-xs text-muted-foreground">
                {album.ratingCount.toLocaleString()} ratings
              </span>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus size={16} /> Log Album
              </button>
              <button className="px-6 py-2.5 border border-border text-foreground font-medium rounded-md hover:bg-secondary transition-colors flex items-center gap-2">
                <Heart size={16} /> Like
              </button>
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="font-display text-3xl text-foreground mb-6">Reviews</h2>
          {albumReviews.length > 0 ? (
            <div className="flex flex-col gap-4 max-w-2xl">
              {albumReviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet. Be the first to write one!</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AlbumDetail;
