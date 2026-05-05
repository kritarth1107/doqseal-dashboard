"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UserData {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  organisationName: string;
}

interface AuthContextType {
  userData: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.success && data.data) {
        setUserData(data.data);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ userData, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
