import { albums } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { AlbumCard } from "@/components/AlbumCard";
import { ReviewCard } from "@/components/ReviewCard";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const reviews = useReviewStore((s) => s.reviews);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[420px] overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="container relative flex h-full flex-col justify-end pb-12">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Your music,<br />
            <span className="text-gradient">your story.</span>
          </h1>
          <p className="mt-4 max-w-md text-secondary-foreground text-lg">
            Rate albums, curate your Top 5, and find listeners who hear the world like you do.
          </p>
        </div>
      </section>

      {/* Trending Albums */}
      <section className="container py-12">
        <h2 className="font-display text-2xl font-bold mb-6">Trending Albums</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {albums.map((album, i) => (
            <div key={album.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <AlbumCard album={album} />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="container pb-16">
        <h2 className="font-display text-2xl font-bold mb-6">Recent Reviews</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review, i) => (
            <div key={review.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
