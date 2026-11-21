import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI, User } from '../api';
import { saveAuthToken, getAuthToken, clearAuthToken } from '../api/client';
import { getApiBaseUrl, setCustomApiBaseUrl } from '../config/constants';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  serverUrl: string;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  setServerUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper to safely parse JWT payload
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverUrl, setServerUrlState] = useState<string>('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUrl = await getApiBaseUrl();
        setServerUrlState(currentUrl);

        const storedToken = await getAuthToken();
        if (storedToken) {
          setToken(storedToken);
          // Extract user identity from JWT payload
          const payload = parseJwt(storedToken);
          if (payload && payload.sub) {
            setUser({
              id: payload.sub,
              name: payload.name || 'User',
              email: payload.email || '',
              role: payload.role || 'operator',
              phone: payload.phone,
              organization: payload.organization || payload.assignedDepot,
            });
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    setIsLoading(true);
    try {
      const data = await AuthAPI.login(email, password, role);
      if (data?.token) {
        await saveAuthToken(data.token);
        setToken(data.token);

        const userData = data.user || parseJwt(data.token);
        const resolvedUser: User = {
          id: userData.id || userData.sub,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
          organization: userData.organization || userData.assignedDepot,
          status: userData.status,
        };
        setUser(resolvedUser);
      } else {
        throw new Error(data?.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } finally {
      await clearAuthToken();
      setUser(null);
      setToken(null);
    }
  };

  const setServerUrl = async (url: string) => {
    await setCustomApiBaseUrl(url);
    const updated = await getApiBaseUrl();
    setServerUrlState(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        serverUrl,
        login,
        logout,
        setServerUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
