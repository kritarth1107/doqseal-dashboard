"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UserOrganisation {
  organisationId: string;
  name: string;
  role: string;
}

interface UserData {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  organisationName: string;
  organisations: UserOrganisation[];
}

interface AuthContextType {
  userData: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
  activeOrg: UserOrganisation | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  // Initialize activeOrgId from localStorage
  useEffect(() => {
    const savedOrgId = localStorage.getItem("active_organisation_id");
    if (savedOrgId) {
      setActiveOrgIdState(savedOrgId);
    }
  }, []);

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem("active_organisation_id", id);
  };

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.success && data.data) {
        setUserData(data.data);
        
        // If no active org is set, or if the current active org isn't in the new list,
        // default to the first one available.
        const savedOrgId = localStorage.getItem("active_organisation_id");
        const userOrgs = data.data.organisations || [];
        
        if (userOrgs.length > 0) {
          const isValidOrg = userOrgs.some((o: UserOrganisation) => o.organisationId === savedOrgId);
          if (!savedOrgId || !isValidOrg) {
            setActiveOrgId(userOrgs[0].organisationId);
          }
        }
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

  const activeOrg = userData?.organisations.find(o => o.organisationId === activeOrgId) || null;

  return (
    <AuthContext.Provider value={{ 
      userData, 
      loading, 
      refreshUser: fetchUser,
      activeOrgId,
      setActiveOrgId,
      activeOrg
    }}>
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
