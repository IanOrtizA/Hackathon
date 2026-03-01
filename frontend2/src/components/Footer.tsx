import { Music2 } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-primary" />
            <span className="font-display text-xl tracking-wider text-foreground">SPINLOG</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/albums" className="hover:text-foreground transition-colors">Albums</Link>
            <Link to="/diary" className="hover:text-foreground transition-colors">Diary</Link>
            <Link to="/reviews" className="hover:text-foreground transition-colors">Reviews</Link>
            <Link to="/lists" className="hover:text-foreground transition-colors">Lists</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Spinlog. Track your music journey.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
