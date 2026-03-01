import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

interface ListCardProps {
  list: {
    id: string;
    title: string;
    author: string;
    albumCovers: string[];
    count: number;
    likes: number;
  };
  index?: number;
}

const ListCard = ({ list, index = 0 }: ListCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to="#" className="group block">
        <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/20 transition-all">
          {/* Stacked album covers */}
          <div className="flex h-40 overflow-hidden">
            {list.albumCovers.map((cover, i) => (
              <div key={i} className="flex-1 relative">
                <img
                  src={cover}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {i < list.albumCovers.length - 1 && (
                  <div className="absolute inset-y-0 right-0 w-px bg-background/50" />
                )}
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>

          <div className="p-4">
            <h3 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
              {list.title}
            </h3>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                by <span className="text-primary">{list.author}</span> · {list.count} albums
              </span>
              <span className="flex items-center gap-1">
                <Heart size={11} />
                {list.likes.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ListCard;
