"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { UserProfile } from "@/types";
import { initAds } from "@/lib/ads";

type ProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: UserProfile) => void;
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refresh: async () => {},
  setProfile: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { initAds(); }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
