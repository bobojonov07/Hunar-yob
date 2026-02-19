"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { getCurrentUser, getAllMessages, getListings, Listing, Message, User } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, CheckCheck } from "lucide-react";
import Link from "next/link";

interface Conversation {
  listing: Listing;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const allMessages = getAllMessages();
    const allListings = getListings();
    
    // Group messages by listingId
    const groups: Record<string, Message[]> = {};
    allMessages.forEach(m => {
      // Show conversation if user is sender OR the listing belongs to user
      const listing = allListings.find(l => l.id === m.listingId);
      if (m.senderId === currentUser.id || (listing && listing.userId === currentUser.id)) {
        if (!groups[m.listingId]) groups[m.listingId] = [];
        groups[m.listingId].push(m);
      }
    });

    const conversationList: Conversation[] = Object.keys(groups).map(listingId => {
      const listing = allListings.find(l => l.id === listingId);
      const sortedMsgs = groups[listingId].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const unreadCount = sortedMsgs.filter(m => !m.isRead && m.senderId !== currentUser.id).length;
      
      return {
        listing: listing!,
        lastMessage: sortedMsgs[0],
        unreadCount
      };
    }).filter(c => !!c.listing);

    // Sort conversations by last message time
    conversationList.sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    setConversations(conversationList);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-headline font-bold text-secondary mb-8">Паёмҳо</h1>

        {conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Link key={conv.listing.id} href={`/chat/${conv.listing.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.listing.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-secondary truncate">{conv.listing.userName}</h3>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">{conv.listing.title}</p>
                      <div className="flex items-center gap-1">
                        {conv.lastMessage.senderId === user.id && (
                          <CheckCheck className={cn("h-3 w-3", conv.lastMessage.isRead ? "text-blue-500" : "text-muted-foreground")} />
                        )}
                        <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold text-secondary" : "text-muted-foreground")}>
                          {conv.lastMessage.text}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Ҳоло ягон мукотиба надоред.</p>
          </div>
        )}
      </div>
    </div>
  );
}
