

import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   
          <div className="flex h-screen bg-white dark:bg-[#212121] overflow-hidden sm:flex-row flex-col">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
              <TopHeader />
              {children}
            </main>
          </div>
  );
}
