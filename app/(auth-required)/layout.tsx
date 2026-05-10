
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-white overflow-hidden sm:flex-row flex-col">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          <TopHeader />
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
