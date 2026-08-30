"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  onboardingCompleted?: boolean;
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
  const pathname = usePathname();
  const router = useRouter();

  // Initialize activeOrgId from localStorage
  useEffect(() => {
    const savedOrgId = localStorage.getItem("active_organisation_id");
    if (savedOrgId) {
      setActiveOrgIdState(savedOrgId);
      document.cookie = `active_organisation_id=${encodeURIComponent(savedOrgId)}; path=/; SameSite=Lax`;
    }
  }, []);

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem("active_organisation_id", id);
    document.cookie = `active_organisation_id=${encodeURIComponent(id)}; path=/; SameSite=Lax`;
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

  // Gate dashboard until onboarding is complete
  useEffect(() => {
    if (loading || !userData) return;

    const onboardingDone = userData.onboardingCompleted !== false;
    const onOnboardingPage = pathname?.startsWith("/onboarding");

    if (!onboardingDone && !onOnboardingPage) {
      router.replace("/onboarding");
    } else if (onboardingDone && onOnboardingPage) {
      router.replace("/dashboard");
    }
  }, [loading, userData, pathname, router]);

  const activeOrg = userData?.organisations.find(o => o.organisationId === activeOrgId) || null;

  const onboardingDone = !userData || userData.onboardingCompleted !== false;
  const onOnboardingPage = pathname?.startsWith("/onboarding");
  const blockingForOnboarding =
    !loading &&
    userData &&
    ((!onboardingDone && !onOnboardingPage) || (onboardingDone && onOnboardingPage));

  if (loading || blockingForOnboarding) {
    return (
      <AuthContext.Provider value={{ 
        userData, 
        loading: true, 
        refreshUser: fetchUser,
        activeOrgId,
        setActiveOrgId,
        activeOrg
      }}>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthContext.Provider>
    );
  }

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
