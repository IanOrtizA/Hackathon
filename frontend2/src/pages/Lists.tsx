import { motion } from "framer-motion";
import { POPULAR_LISTS } from "@/lib/data";
import ListCard from "@/components/ListCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Lists = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-5xl text-foreground mb-2">Lists</h1>
          <p className="text-muted-foreground mb-10">Curated collections from the community.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_LISTS.map((list, i) => (
            <ListCard key={list.id} list={list} index={i} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Lists;
