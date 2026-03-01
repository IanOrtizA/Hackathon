import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Disc3, Users, ListMusic, BookOpen } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import AlbumCard from "@/components/AlbumCard";
import ReviewCard from "@/components/ReviewCard";
import ListCard from "@/components/ListCard";
import { MOCK_ALBUMS, MOCK_REVIEWS, POPULAR_LISTS } from "@/lib/data";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  const trendingAlbums = MOCK_ALBUMS.slice(0, 6);
  const popularAlbums = MOCK_ALBUMS.slice(6, 12);
  const recentReviews = MOCK_REVIEWS.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-7xl md:text-9xl tracking-wider text-foreground mb-4">
              SPIN<span className="text-gradient-primary">LOG</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Track albums you've listened to. Rate and review. Build your music diary. Discover what's next.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link
              to="/albums"
              className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-opacity"
            >
              Start Logging
            </Link>
            <Link
              to="/albums"
              className="px-8 py-3 border border-border text-foreground font-medium rounded-md hover:bg-secondary transition-colors"
            >
              Browse Albums
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-8 mt-16 text-muted-foreground"
          >
            {[
              { icon: Disc3, label: "Albums Logged", value: "2.4M" },
              { icon: Users, label: "Members", value: "180K" },
              { icon: ListMusic, label: "Lists Created", value: "45K" },
              { icon: BookOpen, label: "Reviews", value: "890K" },
            ].map((stat) => (
              <div key={stat.label} className="hidden sm:flex flex-col items-center gap-1">
                <stat.icon size={18} className="text-primary/60" />
                <span className="font-display text-2xl text-foreground">{stat.value}</span>
                <span className="text-xs">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trending */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-4xl text-foreground">Trending This Week</h2>
          <Link to="/albums" className="text-sm text-primary hover:underline flex items-center gap-1">
            See all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {trendingAlbums.map((album, i) => (
            <AlbumCard key={album.id} album={album} index={i} size="lg" />
          ))}
        </div>
      </section>

      {/* Reviews & Lists side-by-side */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Recent Reviews */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl text-foreground">Popular Reviews</h2>
              <Link to="/reviews" className="text-sm text-primary hover:underline flex items-center gap-1">
                More <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {recentReviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          </div>

          {/* Popular Lists */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl text-foreground">Popular Lists</h2>
              <Link to="/lists" className="text-sm text-primary hover:underline flex items-center gap-1">
                More <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POPULAR_LISTS.map((list, i) => (
                <ListCard key={list.id} list={list} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* More Albums */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-4xl text-foreground">Recently Popular</h2>
          <Link to="/albums" className="text-sm text-primary hover:underline flex items-center gap-1">
            See all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {popularAlbums.map((album, i) => (
            <AlbumCard key={album.id} album={album} index={i} size="lg" />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
