import { motion } from "framer-motion";
import { MOCK_DIARY } from "@/lib/data";
import StarRating from "@/components/StarRating";
import { RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Diary = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-5xl text-foreground mb-2">Diary</h1>
          <p className="text-muted-foreground mb-10">Your personal listening journal.</p>
        </motion.div>

        <div className="max-w-2xl">
          {MOCK_DIARY.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="flex items-center gap-4 py-4 border-b border-border last:border-0"
            >
              <div className="w-20 text-right flex-shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" })}
                </p>
              </div>

              <Link to={`/album/${entry.albumId}`} className="flex-shrink-0">
                <img
                  src={entry.albumCover}
                  alt={entry.albumTitle}
                  className="w-12 h-12 rounded object-cover hover:opacity-80 transition-opacity"
                  loading="lazy"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/album/${entry.albumId}`} className="hover:text-primary transition-colors">
                  <p className="text-sm font-medium text-foreground truncate">{entry.albumTitle}</p>
                </Link>
                <p className="text-xs text-muted-foreground truncate">{entry.albumArtist}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {entry.relisten && (
                  <RefreshCw size={13} className="text-primary" />
                )}
                <StarRating rating={entry.rating} size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Diary;
