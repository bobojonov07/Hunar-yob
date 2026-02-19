
"use client"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User as UserIcon, Hammer, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collectionGroup, query, where } from "firebase/firestore";

export function BottomNav() {
  const { user } = useUser();
  const db = useFirestore();
  const pathname = usePathname();

  // Query for unread messages where the user is NOT the sender
  // Note: For this to work efficiently in a real app, you'd need a more specific schema,
  // but for this MVP we look for all unread messages.
  const unreadMessagesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, "messages"),
      where("isRead", "==", false),
      where("senderId", "!=", user.uid)
    );
  }, [db, user]);

  const { data: unreadMessages = [] } = useCollection(unreadMessagesQuery);
  const unreadCount = unreadMessages.length;

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
                <span className="text-[8px] text-white font-bold leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </span>
            )}
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
