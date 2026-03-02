import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import LikedSongs from "./pages/LikedSongs";
import Discover from "./pages/Discover";
import Match from "./pages/Match";
import TopStories from "./pages/TopStories";
import TopComments from "./pages/TopComments";
import AlbumDetail from "./pages/AlbumDetail";
import ArtistDetail from "./pages/ArtistDetail";
import SongDetail from "./pages/SongDetail";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  const loadReviews = useReviewStore((state) => state.loadReviews);
  const { token } = useAuth();

  useEffect(() => {
    void loadReviews(undefined, token).catch(() => {
      // The UI already renders review empty states; failed hydration should not block the app shell.
    });
  }, [loadReviews, token]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/liked-songs" element={<LikedSongs />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/match" element={<Match />} />
            <Route path="/top-stories" element={<TopStories />} />
            <Route path="/top-comments" element={<TopComments />} />
            <Route path="/album/:id" element={<AlbumDetail />} />
            <Route path="/artist/:name" element={<ArtistDetail />} />
            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/user/:id/liked-songs" element={<LikedSongs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
