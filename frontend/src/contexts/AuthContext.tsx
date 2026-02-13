import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API_URL, STORAGE_KEYS } from '../lib/constants';
import { AuthResponse, AuthUser, Profile, UserRole } from '../lib/types';
import { buildUrl, extractError, parseJsonSafe } from '../lib/http';

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'admin'>;
};

type LoginPayload = {
  email: string;
  password: string;
};

type ApiRequestInit = RequestInit & {
  skipAuth?: boolean;
};

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  profile: Profile | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<Profile | null>;
  apiFetch: <T>(path: string, init?: ApiRequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function canUseLocalStorage() {
  return typeof window !== 'undefined';
}

function saveSession(accessToken: string, refreshToken: string, user: AuthUser) {
  if (!canUseLocalStorage()) return;

  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
}

function clearSessionStorage() {
  if (!canUseLocalStorage()) return;

  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.authUser);
}

function buildHeaders(init?: RequestInit, accessToken?: string | null): Headers {
  const headers = new Headers(init?.headers || {});

  const hasBody = init?.body !== undefined && init?.body !== null;
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const resetSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setProfile(null);
    clearSessionStorage();
  }, []);

  const persistSession = useCallback((auth: AuthResponse) => {
    setAccessToken(auth.access_token);
    setRefreshToken(auth.refresh_token);
    setUser(auth.user);
    saveSession(auth.access_token, auth.refresh_token, auth.user);
  }, []);

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) return null;

    const response = await fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      resetSession();
      return null;
    }

    const payload = await parseJsonSafe<AuthResponse>(response);
    if (!payload) {
      resetSession();
      return null;
    }

    persistSession(payload);
    return payload.access_token;
  }, [persistSession, refreshToken, resetSession]);

  const apiFetch = useCallback(
    async <T,>(path: string, init?: ApiRequestInit): Promise<T> => {
      const request = async (token?: string | null) =>
        fetch(buildUrl(path), {
          ...init,
          headers: buildHeaders(init, init?.skipAuth ? null : token),
        });

      const tokenForRequest = init?.skipAuth ? null : accessToken;
      let response = await request(tokenForRequest);

      if (response.status === 401 && !init?.skipAuth && refreshToken) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          response = await request(refreshed);
        }
      }

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const payload = await parseJsonSafe<T>(response);
      return payload as T;
    },
    [accessToken, refreshToken, refreshTokens],
  );

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return null;

    try {
      const me = await apiFetch<Profile>('/api/users/me');
      setProfile(me);
      return me;
    } catch {
      return null;
    }
  }, [accessToken, apiFetch]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      const auth = await parseJsonSafe<AuthResponse>(response);
      if (!auth) {
        throw new Error('Некорректный ответ сервиса авторизации');
      }

      persistSession(auth);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      const auth = await parseJsonSafe<AuthResponse>(response);
      if (!auth) {
        throw new Error('Некорректный ответ сервиса авторизации');
      }

      persistSession(auth);
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    resetSession();
  }, [resetSession]);

  useEffect(() => {
    if (!canUseLocalStorage()) {
      setIsReady(true);
      return;
    }

    const storedAccessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    const storedUser = localStorage.getItem(STORAGE_KEYS.authUser);

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);

      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        clearSessionStorage();
      }
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !accessToken) return;
    void refreshProfile();
  }, [accessToken, isReady, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: Boolean(accessToken),
      accessToken,
      refreshToken,
      user,
      profile,
      login,
      register,
      logout,
      refreshProfile,
      apiFetch,
    }),
    [
      accessToken,
      apiFetch,
      isReady,
      login,
      logout,
      profile,
      refreshProfile,
      refreshToken,
      register,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}
