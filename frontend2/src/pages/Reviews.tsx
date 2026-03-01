import { motion } from "framer-motion";
import { MOCK_REVIEWS } from "@/lib/data";
import ReviewCard from "@/components/ReviewCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Reviews = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-5xl text-foreground mb-2">Reviews</h1>
          <p className="text-muted-foreground mb-10">What the community is saying.</p>
        </motion.div>

        <div className="flex flex-col gap-4 max-w-2xl">
          {MOCK_REVIEWS.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Reviews;
