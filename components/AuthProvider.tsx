"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Organisation {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  plan_details: any;
  member_count: number;
  logo_url: string;
  website: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Membership {
  id: number;
  user_id: string;
  organisation_id: number;
  organisation: Organisation;
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: number;
  user_id: string;
  name: string;
  email: string;
  avatar: string;
  memberships: Membership[];
  last_login_at: string;
  created_at: string;
  updated_at: string;
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
      if (data.success) {
        setUserData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
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
