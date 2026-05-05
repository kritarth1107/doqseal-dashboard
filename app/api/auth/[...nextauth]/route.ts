import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import LinkedInProvider from "next-auth/providers/linkedin"
import TwitterProvider from "next-auth/providers/twitter"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_ID!,
      clientSecret: process.env.LINKEDIN_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.X_ID!,
      clientSecret: process.env.X_SECRET!,
      version: "2.0", // Use Twitter API v2
    }),
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account) {
        try {
          const { getFingerprint } = await import('@/utils/auth');
          const { createJsonHeaders } = await import('@/lib/header-utils');
          const { headers: nextHeaders } = await import('next/headers');
          
          const fingerprint = await getFingerprint();
          const reqHeaders = await nextHeaders();
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const payload = {
            provider: account.provider,
            access_token: account.access_token,
            id_token: account.id_token,
            email: user.email,
            name: user.name,
            avatar: user.image,
            sessionData: {
              fingerprint: fingerprint
            }
          };

          console.log("Attempting social login sync with backend:", `${apiUrl}kingdom/social`);
          
          const response = await fetch(`${apiUrl}kingdom/social`, {
            method: 'POST',
            headers: createJsonHeaders({ 
              fingerprint,
              userAgent: reqHeaders.get('user-agent'),
              ip: reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip')
            }),
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          
          if (!response.ok || !data.success || !data.data?.token) {
            console.error("Backend auth failed. Status:", response.status);
            console.error("Response Data:", JSON.stringify(data, null, 2));
            return false;
          }

          if (response.ok && data.success && data.data?.token) {
            // Set the session_token cookie for the custom AuthProvider
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            cookieStore.set("session_token", data.data.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            return true;
          }
          console.error("Backend auth failed:", data);
          return false;
        } catch (error) {
          console.error("Error syncing with backend:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Discard NextAuth session in favor of our backend's session_token cookie
      return null as any;
    },
    async jwt({ token, user, account }) {
      // We don't need to store anything in the JWT since we use the session_token cookie
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
