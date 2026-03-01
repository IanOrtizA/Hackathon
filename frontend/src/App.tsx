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
import Discover from "./pages/Discover";
import AlbumDetail from "./pages/AlbumDetail";
import ArtistDetail from "./pages/ArtistDetail";
import SongDetail from "./pages/SongDetail";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import { useReviewStore } from "@/stores/reviewStore";

const queryClient = new QueryClient();

const App = () => {
  const loadReviews = useReviewStore((state) => state.loadReviews);

  useEffect(() => {
    void loadReviews().catch(() => {
      // The UI already renders review empty states; failed hydration should not block the app shell.
    });
  }, [loadReviews]);

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
            <Route path="/discover" element={<Discover />} />
            <Route path="/album/:id" element={<AlbumDetail />} />
            <Route path="/artist/:name" element={<ArtistDetail />} />
            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
