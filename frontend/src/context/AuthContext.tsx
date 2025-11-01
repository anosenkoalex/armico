import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LoginPayload,
  MeProfile,
  decodeToken,
  fetchMeProfile,
  login as apiLogin,
} from '../api/client.js';

type AuthUser = ReturnType<typeof decodeToken>;

type AuthContextValue = {
  token: string | null;
  user: AuthUser;
  profile: MeProfile | null;
  isFetchingProfile: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem('armico_token');
  });
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  const user = useMemo<AuthUser>(() => {
    if (!token) {
      return null;
    }

    return decodeToken(token);
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('armico_token');
    }
  }, []);

  const fetchMe = useCallback(async () => {
    if (!token) {
      setProfile(null);
      return;
    }

    setIsFetchingProfile(true);

    try {
      const data = await fetchMeProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      throw error;
    } finally {
      setIsFetchingProfile(false);
    }
  }, [token]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsFetchingProfile(true);

      try {
        const accessToken = await apiLogin(payload);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('armico_token', accessToken);
        }

        setToken(accessToken);

        const data = await fetchMeProfile();
        setProfile(data);
      } catch (error) {
        logout();
        throw error;
      } finally {
        setIsFetchingProfile(false);
      }
    },
    [logout],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = () => logout();

    window.addEventListener('armico:unauthorized', handler);
    return () => {
      window.removeEventListener('armico:unauthorized', handler);
    };
  }, [logout]);

  useEffect(() => {
    if (!token || profile) {
      return;
    }

    setIsFetchingProfile(true);

    fetchMeProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((error) => {
        console.error('Failed to restore profile', error);
        logout();
      })
      .finally(() => {
        setIsFetchingProfile(false);
      });
  }, [token, profile, logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      isFetchingProfile,
      login,
      logout,
      fetchMe,
    }),
    [token, user, profile, isFetchingProfile, login, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
