import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, saveToken } from "../api/client";
import { User } from "../types";

interface Credentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        // We don't have a "whoami" endpoint; the presence of a token is
        // enough to consider the user logged in, requests will 401 if it
        // has expired and the interceptor below handles that case.
        setUser({ id: "unknown", email: "" });
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const id = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await clearToken();
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  const login = async ({ email, password }: Credentials) => {
    const { data } = await api.post("/auth/login", { email, password });
    await saveToken(data.token);
    setUser(data.user);
  };

  const register = async ({ email, password }: Credentials) => {
    const { data } = await api.post("/auth/register", { email, password });
    await saveToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, register, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
