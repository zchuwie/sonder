"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type User = { name: string };

type UserContextValue = {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  updateName: (name: string) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = "sonder_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserContext.Provider
      value={{
        user: hydrated ? user : null,
        login: (name) => persist({ name: name.trim() || "Sonder User" }),
        logout: () => persist(null),
        updateName: (name) =>
          user && persist({ ...user, name: name.trim() || user.name }),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
