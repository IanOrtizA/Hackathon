import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthenticatedUser, SocialUserSummary, Song } from "@/types/music";
import { apiUrl } from "@/lib/api";

const AUTH_TOKEN_STORAGE_KEY = "musicbox.auth.token";

interface AuthFormPayload {
  token: string;
  user: AuthenticatedUser;
}

interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

interface LoginInput {
  identifier: string;
  password: string;
}

interface ProfileUpdateInput {
  displayName?: string;
  avatarUrl?: string;
  profileColor?: string | null;
  favoriteSongs?: Song[];
  favoriteArtists?: string[];
  likedSongs?: Song[];
  likedArtists?: string[];
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: ProfileUpdateInput) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requesterUserId: string) => Promise<void>;
  loadFriendNetwork: () => Promise<{ friends: SocialUserSummary[]; incomingRequests: SocialUserSummary[] }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      typeof data?.error === "string" ? data.error : "Request failed.";
    throw new Error(errorMessage);
  }

  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = useCallback((nextToken: string | null, nextUser: AuthenticatedUser | null) => {
    setToken(nextToken);
    setUser(nextUser);

    if (nextToken) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  }, []);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    const response = await fetch(apiUrl("/api/auth/me"), {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await readJsonResponse<{ user: AuthenticatedUser }>(response);

    setUser(data.user);
  }, []);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    void (async () => {
      try {
        await fetchCurrentUser(savedToken);
      } catch {
        persistAuth(null, null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [fetchCurrentUser, persistAuth]);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const data = await readJsonResponse<AuthFormPayload>(response);

    persistAuth(data.token, data.user);
  }, [persistAuth]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const data = await readJsonResponse<AuthFormPayload>(response);

    persistAuth(data.token, data.user);
  }, [persistAuth]);

  const logout = useCallback(() => {
    persistAuth(null, null);
  }, [persistAuth]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      throw new Error("Not authenticated.");
    }

    await fetchCurrentUser(token);
  }, [fetchCurrentUser, token]);

  const updateProfile = useCallback(async (updates: ProfileUpdateInput) => {
    if (!token) {
      throw new Error("Not authenticated.");
    }

    const response = await fetch(apiUrl("/api/auth/profile"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await readJsonResponse<{ user: AuthenticatedUser }>(response);

    setUser(data.user);
  }, [token]);

  const sendFriendRequest = useCallback(async (targetUserId: string) => {
    if (!token) {
      throw new Error("Not authenticated.");
    }

    const response = await fetch(apiUrl(`/api/users/${encodeURIComponent(targetUserId)}/friend-request`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await readJsonResponse<{ user: AuthenticatedUser }>(response);

    setUser(data.user);
  }, [token]);

  const acceptFriendRequest = useCallback(async (requesterUserId: string) => {
    if (!token) {
      throw new Error("Not authenticated.");
    }

    const response = await fetch(apiUrl(`/api/users/${encodeURIComponent(requesterUserId)}/friend-accept`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await readJsonResponse<{ user: AuthenticatedUser }>(response);

    setUser(data.user);
  }, [token]);

  const loadFriendNetwork = useCallback(async () => {
    if (!token) {
      throw new Error("Not authenticated.");
    }

    const response = await fetch(apiUrl("/api/auth/network"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return readJsonResponse<{ friends: SocialUserSummary[]; incomingRequests: SocialUserSummary[] }>(response);
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    register,
    login,
    logout,
    refreshUser,
    updateProfile,
    sendFriendRequest,
    acceptFriendRequest,
    loadFriendNetwork,
  }), [
    acceptFriendRequest,
    isLoading,
    loadFriendNetwork,
    login,
    logout,
    refreshUser,
    register,
    sendFriendRequest,
    token,
    updateProfile,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
