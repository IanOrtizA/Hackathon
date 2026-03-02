import { useState } from "react";
import { BookOpenText, Heart, Sparkles } from "lucide-react";

const pregeneratedStories = [
  {
    title: "Sydney",
    body: "What makes this journey moving is how quietly it becomes a form of self-recognition. The songs are not just favorites; they are markers of emotional survival, each one holding a version of the listener that might otherwise have been forgotten. In that sense, music becomes less about entertainment and more about continuity, a way of remaining connected to yourself while life keeps changing shape.",
  },
  {
    title: "Katelyn",
    body: "There is something deeply human in the way this story unfolds through artists and albums instead of milestones alone. The listener grows by returning, again and again, to the sounds that made difficult moments feel speakable. What begins as comfort gradually becomes meaning, and what once felt like background music turns into a private archive of tenderness, resilience, and becoming.",
  },
  {
    title: "Ethan",
    body: "The emotional depth here comes from the fact that music is carrying more than memory. It is carrying interpretation. Every song holds not just a feeling, but a way of understanding that feeling after the moment has passed. That is why this journey reads with such weight: it shows a life shaped not only by what was lived, but by what was truly listened to.",
  },
];

export default function TopStories() {
  const [storyDraft, setStoryDraft] = useState("");

  return (
    <div className="container max-w-6xl py-10">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-secondary/30">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:px-8">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Top Stories
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Music, translated into memory.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              This page presents three short, emotionally grounded stories drawn from a music journey. They are meant to
              feel reflective, intimate, and fully formed the moment the page opens.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/75 p-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <Heart className="h-4 w-4 text-primary" />
              What these stories capture
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                The emotional role music plays across different phases of life.
              </div>
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                The way artists and albums become part of identity, memory, and healing.
              </div>
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                A concise but thoughtful reading of a listener's inner world.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Your Story</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Write your own music journey here.
              </p>
            </div>
            <BookOpenText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-5">
            <textarea
              value={storyDraft}
              onChange={(event) => setStoryDraft(event.target.value)}
              placeholder="Write about the songs, albums, or artists that shaped you..."
              className="min-h-[220px] w-full resize-y bg-transparent text-sm leading-7 text-foreground/95 placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Stories</h2>
            </div>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid gap-4">
            {pregeneratedStories.map((story) => (
              <article key={story.title} className="rounded-2xl border border-border/70 bg-background/80 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {story.title}
                </p>
                <p className="text-sm leading-7 text-foreground/95">{story.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
