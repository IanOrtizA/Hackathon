import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Albums from "./pages/Albums";
import AlbumDetail from "./pages/AlbumDetail";
import Diary from "./pages/Diary";
import Reviews from "./pages/Reviews";
import Lists from "./pages/Lists";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/album/:id" element={<AlbumDetail />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
