"use client"

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User as UserIcon, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function BottomNav() {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const pathname = usePathname();

  const clientChatsQuery = useMemo(() => {
    if (!db || !currentUser?.uid) return null;
    return query(collection(db, "chats"), where("clientId", "==", currentUser.uid));
  }, [db, currentUser?.uid]);

  const artisanChatsQuery = useMemo(() => {
    if (!db || !currentUser?.uid) return null;
    return query(collection(db, "chats"), where("artisanId", "==", currentUser.uid));
  }, [db, currentUser?.uid]);

  const { data: clientChats = [] } = useCollection(clientChatsQuery as any);
  const { data: artisanChats = [] } = useCollection(artisanChatsQuery as any);

  const unreadCount = useMemo(() => {
    if (!currentUser?.uid) return 0;
    
    const allChats = [...(Array.isArray(clientChats) ? clientChats : []), ...(Array.isArray(artisanChats) ? artisanChats : [])];
    const seenChatIds = new Set();
    let totalUnread = 0;

    allChats.forEach((chat: any) => {
      if (chat?.id && !seenChatIds.has(chat.id)) {
        seenChatIds.add(chat.id);
        const count = chat.unreadCount?.[currentUser.uid] || 0;
        if (typeof count === 'number') {
          totalUnread += count;
        }
      }
    });

    return totalUnread;
  }, [clientChats, artisanChats, currentUser?.uid]);

  if (!currentUser) return null;

  const navItems = [
    { label: "Асосӣ", icon: Home, href: "/" },
    { label: "Эълонҳо", icon: Search, href: "/listings" },
    { label: "Паёмҳо", icon: MessageSquare, href: "/messages", hasBadge: unreadCount > 0 },
    { label: "Профил", icon: UserIcon, href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-border px-4 h-16 flex items-center justify-around md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-all relative flex-1 h-full",
              isActive ? "text-primary" : "text-muted-foreground hover:text-secondary"
            )}
          >
            <div className="relative">
              <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
              {item.hasBadge && (
                <span className="absolute -top-2.5 -right-2.5 h-6 w-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.7)] animate-pulse z-10">
                  <span className="text-[10px] text-white font-black leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
