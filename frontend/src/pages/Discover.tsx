import { getTasteMatches, albums } from "@/data/mockData";
import { useReviewStore } from "@/stores/reviewStore";
import { TasteMatchCard } from "@/components/TasteMatchCard";
import { ReviewCard } from "@/components/ReviewCard";
import { AlbumCard } from "@/components/AlbumCard";
import { Search, Music, Activity, Mic2, Check, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MatchMode, SocialUserSummary, Song } from "@/types/music";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SONG_PAGE_SIZE = 5;

const matchTabs: { mode: MatchMode; label: string; icon: typeof Music; description: string }[] = [
  { mode: "top5", label: "Top 5", icon: Music, description: "Based on shared Top 5 songs" },
  { mode: "activity", label: "Activity", icon: Activity, description: "Based on recently reviewed albums" },
  { mode: "artists", label: "Artists", icon: Mic2, description: "Based on favorite artists" },
];

export default function Discover() {
  const reviews = useReviewStore((s) => s.reviews);
  const { isAuthenticated, user, loadFriendNetwork, acceptFriendRequest } = useAuth();
  const [search, setSearch] = useState("");
  const [matchMode, setMatchMode] = useState<MatchMode>("top5");
  const [searchedSongs, setSearchedSongs] = useState<Song[]>([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);
  const [isLoadingMoreSongs, setIsLoadingMoreSongs] = useState(false);
  const [songSearchError, setSongSearchError] = useState<string | null>(null);
  const [songTotalCount, setSongTotalCount] = useState(0);
  const [friends, setFriends] = useState<SocialUserSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SocialUserSummary[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [acceptingRequestUserId, setAcceptingRequestUserId] = useState<string | null>(null);

  const matches = getTasteMatches(matchMode);
  const searchQuery = search.trim();

  const filteredAlbums = searchQuery
    ? albums.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (!isAuthenticated) {
      setFriends([]);
      setIncomingRequests([]);
      setIsLoadingNetwork(false);
      setNetworkError(null);
      return;
    }

    let isCancelled = false;

    void (async () => {
      setIsLoadingNetwork(true);
      setNetworkError(null);

      try {
        const data = await loadFriendNetwork();

        if (isCancelled) {
          return;
        }

        setFriends(Array.isArray(data.friends) ? data.friends : []);
        setIncomingRequests(Array.isArray(data.incomingRequests) ? data.incomingRequests : []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setFriends([]);
        setIncomingRequests([]);
        setNetworkError(error instanceof Error ? error.message : "Failed to load friend network.");
      } finally {
        if (!isCancelled) {
          setIsLoadingNetwork(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, loadFriendNetwork, user]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchedSongs([]);
      setIsSearchingSongs(false);
      setIsLoadingMoreSongs(false);
      setSongSearchError(null);
      setSongTotalCount(0);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingSongs(true);
      setSongSearchError(null);

      try {
        const response = await fetch(
          apiUrl(`/api/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${SONG_PAGE_SIZE}&offset=0`),
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Spotify search failed");
        }

        const data = await response.json();
        setSearchedSongs(Array.isArray(data.tracks) ? data.tracks : []);
        setSongTotalCount(
          typeof data.trackPagination?.total === "number"
            ? data.trackPagination.total
            : Array.isArray(data.tracks)
              ? data.tracks.length
              : 0
        );
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setSearchedSongs([]);
        setSongTotalCount(0);
        setSongSearchError("Unable to load Spotify song results right now.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingSongs(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  async function handleLoadMoreSongs() {
    if (isLoadingMoreSongs || searchedSongs.length >= songTotalCount) {
      return;
    }

    setIsLoadingMoreSongs(true);
    setSongSearchError(null);

    try {
      const response = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${SONG_PAGE_SIZE}&offset=${searchedSongs.length}`)
      );

      if (!response.ok) {
        throw new Error("Spotify search failed");
      }

      const data = await response.json();
      const nextSongs = Array.isArray(data.tracks) ? data.tracks : [];

      setSearchedSongs((currentSongs) => {
        const seenIds = new Set(currentSongs.map((song) => song.id));
        const uniqueNextSongs = nextSongs.filter((song: Song) => !seenIds.has(song.id));
        return [...currentSongs, ...uniqueNextSongs];
      });
      setSongTotalCount(
        typeof data.trackPagination?.total === "number"
          ? data.trackPagination.total
          : searchedSongs.length + nextSongs.length
      );
    } catch {
      setSongSearchError("Unable to load more Spotify songs right now.");
    } finally {
      setIsLoadingMoreSongs(false);
    }
  }

  async function handleAcceptFriendRequest(requesterUserId: string) {
    try {
      setAcceptingRequestUserId(requesterUserId);
      await acceptFriendRequest(requesterUserId);
      const data = await loadFriendNetwork();
      setFriends(Array.isArray(data.friends) ? data.friends : []);
      setIncomingRequests(Array.isArray(data.incomingRequests) ? data.incomingRequests : []);
      toast.success("Friend request accepted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept friend request.");
    } finally {
      setAcceptingRequestUserId(null);
    }
  }

  const hasMoreSongs = searchedSongs.length > 0 && searchedSongs.length < songTotalCount;

  return (
    <div className="container py-10 max-w-5xl">
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-bold">Your Friends</h2>
          <p className="mt-1 text-sm text-muted-foreground">Friends and incoming requests live here.</p>
        </div>
        {!isAuthenticated ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
            Sign in to manage your friends and accept requests.
          </div>
        ) : isLoadingNetwork ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
            Loading your network...
          </div>
        ) : networkError ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
            {networkError}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Friends</h3>
              </div>
              {friends.length > 0 ? (
                <div className="grid gap-3">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      to={`/user/${friend.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2 transition-colors hover:bg-secondary/30"
                    >
                      <img src={friend.avatarUrl} alt={friend.displayName} className="h-10 w-10 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{friend.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">@{friend.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You have no friends yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Friend Requests</h3>
              </div>
              {incomingRequests.length > 0 ? (
                <div className="grid gap-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
                    >
                      <Link to={`/user/${request.id}`} className="flex min-w-0 items-center gap-3">
                        <img src={request.avatarUrl} alt={request.displayName} className="h-10 w-10 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{request.displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">@{request.username}</p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void handleAcceptFriendRequest(request.id);
                        }}
                        disabled={acceptingRequestUserId === request.id}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pending friend requests.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search albums, songs, artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-12 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
      </div>

      {/* Search results */}
      {searchQuery && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold mb-4">Search Results</h2>
          {isSearchingSongs && (
            <p className="text-sm text-muted-foreground mb-6">Searching Spotify songs...</p>
          )}
          {songSearchError && (
            <p className="text-sm text-destructive mb-6">{songSearchError}</p>
          )}
          {searchedSongs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Songs</h3>
              <div className="grid gap-2">
                {searchedSongs.map((song) => (
                  <Link
                    key={song.id}
                    to={`/song/${song.id}`}
                    className="flex items-center gap-3 rounded-lg bg-card border border-border p-3 hover:bg-secondary/40 transition-colors"
                  >
                    <img src={song.coverUrl} alt={song.albumTitle} className="h-10 w-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.albumTitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{song.duration}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Showing {searchedSongs.length} of {songTotalCount || searchedSongs.length} matching songs
                </p>
                {hasMoreSongs && (
                  <button
                    type="button"
                    onClick={handleLoadMoreSongs}
                    disabled={isLoadingMoreSongs}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingMoreSongs ? "Loading..." : "See more songs"}
                  </button>
                )}
              </div>
            </div>
          )}
          {filteredAlbums.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {filteredAlbums.map((a) => <AlbumCard key={a.id} album={a} />)}
              </div>
            </div>
          )}
          {!isSearchingSongs && !songSearchError && searchQuery.length >= 2 && searchedSongs.length === 0 && filteredAlbums.length > 0 && (
            <p className="text-muted-foreground text-sm mb-6">No Spotify songs found.</p>
          )}
          {filteredAlbums.length === 0 && searchedSongs.length === 0 && !isSearchingSongs && !songSearchError && searchQuery.length >= 2 && (
            <p className="text-muted-foreground text-sm">No results found.</p>
          )}
        </section>
      )}

      {/* Taste Matches */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-2">Your Taste Matches</h2>

        {/* Match mode tabs */}
        <div className="flex gap-2 mt-4 mb-6">
          {matchTabs.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setMatchMode(mode)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                matchMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          {matchTabs.find((t) => t.mode === matchMode)?.description}
        </p>

        {matches.length > 0 ? (
          <div className="grid gap-4">
            {matches.map((match, i) => (
              <div key={match.user.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <TasteMatchCard match={match} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
            Taste matches will appear after user profiles and listening history are stored in Mongo.
          </div>
        )}
      </section>

      {/* Recent Community Activity */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold mb-2">Community Activity</h2>
        <p className="text-muted-foreground text-sm mb-6">What people are listening to and reviewing</p>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.slice(0, 6).map((review, i) => (
            <div key={review.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
