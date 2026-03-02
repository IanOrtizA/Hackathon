import { Link, useLocation } from "react-router-dom";
import { MessageSquareText, Music, User, Compass, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", label: "Home", icon: Music },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/top-comments", label: "Leaderboard", icon: MessageSquareText },
];

export function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/70">
            <div className="flex items-end gap-0.5">
              <span className="block h-2 w-0.5 rounded-full bg-foreground/70" />
              <span className="block h-3.5 w-0.5 rounded-full bg-foreground" />
              <span className="block h-2.5 w-0.5 rounded-full bg-foreground/80" />
            </div>
          </div>
          <span className="text-base font-semibold tracking-[0.18em] uppercase text-foreground">MusicBox</span>
        </Link>

        <nav className="flex items-center gap-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2 border-b-2 border-transparent py-2 text-sm font-medium transition-colors",
                location.pathname === to
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 sm:hidden" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  location.pathname === "/profile"
                    ? "border-primary/40 bg-card text-foreground"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="hidden sm:inline max-w-[10rem] truncate">{user.displayName}</span>
                <User className="h-4 w-4 sm:hidden" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-border/80"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
