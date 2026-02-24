"use client";

import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export default function MobileLayout({
  children,
  showBottomNav = true,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto relative">
      <main className={showBottomNav ? "pb-20" : ""}>{children}</main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
