import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Music2, Search, Sparkles, Users, X } from "lucide-react";
import { Song } from "@/types/music";
import { apiUrl } from "@/lib/api";

interface MatchedSong extends Song {
  similarityScore: number;
}

interface MatchedUser {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    totalRatings: number;
    profileColor?: string | null;
  };
  exactMatchPercentage: number;
  exactMatchedSongs: Song[];
  library: Song[];
}

const SONG_SEARCH_LIMIT = 8;
const MAX_SEED_SONGS = 3;

async function readJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

export default function Match() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [matchedSongs, setMatchedSongs] = useState<MatchedSong[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [songMatchError, setSongMatchError] = useState<string | null>(null);
  const [userMatchError, setUserMatchError] = useState<string | null>(null);
  const [isLoadingSongMatches, setIsLoadingSongMatches] = useState(false);
  const [isLoadingUserMatches, setIsLoadingUserMatches] = useState(false);

  const searchQuery = search.trim();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(
          apiUrl(`/api/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${SONG_SEARCH_LIMIT}&offset=0`),
          { signal: controller.signal }
        );
        const data = await readJson<{ tracks?: Song[]; error?: string }>(response);

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to search for songs.");
        }

        setSearchResults(Array.isArray(data.tracks) ? data.tracks : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSearchResults([]);
        setSearchError(error instanceof Error ? error.message : "Failed to search for songs.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    setMatchedSongs([]);
    setMatchedUsers([]);
    setSongMatchError(null);
    setUserMatchError(null);
  }, [selectedSongs]);

  function handleSelectSong(song: Song) {
    setSelectedSongs((currentSongs) => {
      if (currentSongs.some((currentSong) => currentSong.id === song.id)) {
        return currentSongs;
      }

      if (currentSongs.length >= MAX_SEED_SONGS) {
        return currentSongs;
      }

      return [...currentSongs, song];
    });
  }

  function handleRemoveSong(songId: string) {
    setSelectedSongs((currentSongs) => currentSongs.filter((song) => song.id !== songId));
  }

  async function handleFindSimilarSongs() {
    if (selectedSongs.length === 0) {
      setSongMatchError("Pick at least one song to run the song matcher.");
      return;
    }

    setIsLoadingSongMatches(true);
    setSongMatchError(null);

    try {
      const params = new URLSearchParams({
        songIds: selectedSongs.map((song) => song.id).join(","),
      });
      const response = await fetch(apiUrl(`/api/match/songs?${params.toString()}`));
      const data = await readJson<{ matches?: MatchedSong[]; error?: string }>(response);

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to load similar songs.");
      }

      setMatchedSongs(Array.isArray(data.matches) ? data.matches : []);
    } catch (error) {
      setMatchedSongs([]);
      setSongMatchError(error instanceof Error ? error.message : "Failed to load similar songs.");
    } finally {
      setIsLoadingSongMatches(false);
    }
  }

  async function handleFindMatchingUsers() {
    if (selectedSongs.length === 0) {
      setUserMatchError("Pick at least one song to run the user matcher.");
      return;
    }

    setIsLoadingUserMatches(true);
    setUserMatchError(null);

    try {
      const params = new URLSearchParams({
        songIds: selectedSongs.map((song) => song.id).join(","),
      });
      const response = await fetch(apiUrl(`/api/match/users?${params.toString()}`));
      const data = await readJson<{ matches?: MatchedUser[]; error?: string }>(response);

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to load matching users.");
      }

      setMatchedUsers(Array.isArray(data.matches) ? data.matches : []);
    } catch (error) {
      setMatchedUsers([]);
      setUserMatchError(error instanceof Error ? error.message : "Failed to load matching users.");
    } finally {
      setIsLoadingUserMatches(false);
    }
  }

  return (
    <div className="container max-w-6xl py-10">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-secondary/20">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] md:px-8">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Match Engine
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Build a seed set and let the backend score the rest.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Select up to three songs, then explore two complementary views of musical affinity. One surfaces tracks
              that align with the character of your selections, while the other identifies listeners whose preferences
              meaningfully intersect with the songs you chose.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
            <h2 className="text-sm font-semibold text-foreground">How matching works</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                The system evaluates overlap in listening behavior to understand which songs and listeners cluster around
                similar tastes.
              </div>
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                It also considers musical context, including stylistic proximity, shared sonic traits, and closely
                related artist or album signals.
              </div>
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                These signals are blended into a weighted relevance score so the strongest, most credible matches rise
                to the top.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Select Seed Songs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search Spotify tracks, then choose between one and three songs.
            </p>
          </div>
          <div className="rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground">
            {selectedSongs.length} / {MAX_SEED_SONGS} selected
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for songs to seed the matcher..."
            className="w-full rounded-2xl border border-border bg-background px-12 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {selectedSongs.length > 0 && (
          <div className="mt-5 grid gap-3">
            {selectedSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 p-3"
              >
                <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.albumTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSong(song.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Remove ${song.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleFindSimilarSongs}
            disabled={selectedSongs.length === 0 || isLoadingSongMatches}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {isLoadingSongMatches ? "Finding Similar Songs..." : "Find Similar Songs"}
          </button>
          <button
            type="button"
            onClick={handleFindMatchingUsers}
            disabled={selectedSongs.length === 0 || isLoadingUserMatches}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Users className="h-4 w-4" />
            {isLoadingUserMatches ? "Finding Matching Users..." : "Find Matching Users"}
          </button>
        </div>

        {searchError && <p className="mt-4 text-sm text-destructive">{searchError}</p>}
        {!searchError && isSearching && (
          <p className="mt-4 text-sm text-muted-foreground">Searching Spotify songs...</p>
        )}
        {!isSearching && !searchError && searchQuery.length >= 2 && searchResults.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No songs found for that search.</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-5 grid gap-3">
            {searchResults.map((song) => {
              const isSelected = selectedSongs.some((selectedSong) => selectedSong.id === song.id);
              const isAtCapacity = selectedSongs.length >= MAX_SEED_SONGS;

              return (
                <div
                  key={song.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/75 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <img src={song.coverUrl} alt={song.albumTitle} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{song.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                      <p className="truncate text-xs text-muted-foreground">{song.albumTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Link
                      to={`/song/${song.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleSelectSong(song)}
                      disabled={isSelected || isAtCapacity}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSelected ? "Selected" : isAtCapacity ? "Max 3" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Similar Songs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Songs surfaced through a weighted similarity model that balances behavioral and musical signals.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>

          {songMatchError && <p className="mt-4 text-sm text-destructive">{songMatchError}</p>}
          {!songMatchError && matchedSongs.length === 0 && !isLoadingSongMatches && (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
              Run the song matcher to see the top scored tracks.
            </div>
          )}

          {matchedSongs.length > 0 && (
            <div className="mt-5 grid gap-3">
              {matchedSongs.map((song) => (
                <div key={song.id} className="rounded-2xl border border-border/70 bg-background/80 p-3">
                  <div className="flex gap-3">
                    <img src={song.coverUrl} alt={song.albumTitle} className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{song.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                          <p className="truncate text-xs text-muted-foreground">{song.albumTitle}</p>
                        </div>
                        <div className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold">
                          {song.similarityScore}% match
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to={`/song/${song.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Music2 className="h-3.5 w-3.5" />
                          Open Song
                        </Link>
                        {song.spotifyUrl && (
                          <a
                            href={song.spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Spotify
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Matching Users</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Listeners ranked by the strength of their overlap with the songs in your selected set.
              </p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>

          {userMatchError && <p className="mt-4 text-sm text-destructive">{userMatchError}</p>}
          {!userMatchError && matchedUsers.length === 0 && !isLoadingUserMatches && (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
              Run the user matcher to see listeners with overlapping likes.
            </div>
          )}

          {matchedUsers.length > 0 && (
            <div className="mt-5 grid gap-4">
              {matchedUsers.map((match) => (
                <div key={match.user.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/user/${match.user.id}`} className="flex min-w-0 items-center gap-3">
                      <img
                        src={match.user.avatarUrl}
                        alt={match.user.displayName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{match.user.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{match.user.username} · {match.user.totalRatings} ratings
                        </p>
                      </div>
                    </Link>
                    <div className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold">
                      {match.exactMatchPercentage}% overlap
                    </div>
                  </div>

                  {match.exactMatchedSongs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Matched Songs
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {match.exactMatchedSongs.map((song) => (
                          <Link
                            key={song.id}
                            to={`/song/${song.id}`}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {song.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.library.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Other Liked Songs
                      </p>
                      <div className="mt-3 grid gap-2">
                        {match.library.slice(0, 4).map((song) => (
                          <Link
                            key={`${match.user.id}-${song.id}`}
                            to={`/song/${song.id}`}
                            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-2.5 transition-colors hover:bg-card"
                          >
                            <img src={song.coverUrl} alt={song.albumTitle} className="h-10 w-10 rounded-md object-cover" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold">{song.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
