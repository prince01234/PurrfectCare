"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, PawPrint, LayoutGrid, User } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Adopt", icon: Heart, href: "/adopt" },
  { label: "Pets", icon: PawPrint, href: "/pets" },
  { label: "Services", icon: LayoutGrid, href: "/services" },
  { label: "Profile", icon: User, href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-14 transition-colors ${
                isActive
                  ? "text-teal-600"
                  : "text-gray-400 active:text-gray-600"
              }`}
            >
              <item.icon
                className="w-5 h-5"
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
