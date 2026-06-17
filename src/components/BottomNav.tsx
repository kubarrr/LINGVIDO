"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, BookImage, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Camera, label: "Snap" },
  { href: "/album", icon: BookImage, label: "Album" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 pb-safe">
      <div className="glass border-t border-border px-2 pt-2 pb-2 flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-6 rounded-2xl transition-all duration-200 ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                size={22}
                className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium leading-none ${active ? "text-primary" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
