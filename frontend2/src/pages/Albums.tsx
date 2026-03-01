import { motion } from "framer-motion";
import AlbumCard from "@/components/AlbumCard";
import { MOCK_ALBUMS } from "@/lib/data";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Albums = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-5xl text-foreground mb-2">Albums</h1>
          <p className="text-muted-foreground mb-10">Browse and discover music from every era and genre.</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {MOCK_ALBUMS.map((album, i) => (
            <AlbumCard key={album.id} album={album} index={i} size="md" />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Albums;
