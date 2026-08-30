
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-white dark:bg-[#0b1220] overflow-hidden sm:flex-row flex-col text-gray-900 dark:text-slate-100">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-[#f8fafc] dark:bg-[#0b1220]">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
