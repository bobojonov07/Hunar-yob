
"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User as UserIcon, Hammer, Home, Search } from "lucide-react";
import { getCurrentUser, User, getAllMessages } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      const messages = getAllMessages();
      const count = messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length;
      setUnreadCount(count);
    }
  }, [pathname]);

  if (!user) return null;

  const navItems = [
    { label: "Асосӣ", icon: Home, href: "/" },
    { label: "Эълонҳо", icon: Search, href: "/listings" },
    { label: "Паёмҳо", icon: MessageSquare, href: "/messages", hasBadge: unreadCount > 0 },
    { label: "Профил", icon: UserIcon, href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-4 h-16 flex items-center justify-around md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-colors relative",
              isActive ? "text-primary" : "text-muted-foreground hover:text-secondary"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
            {item.hasBadge && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[8px] text-white font-bold leading-none">{unreadCount}</span>
              </span>
            )}
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
