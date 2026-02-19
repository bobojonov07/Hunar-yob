
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { getCurrentUser, getAllMessages, getListings, Listing, Message, User } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, CheckCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        <div className="mb-10 flex flex-col gap-6">
          <Button variant="ghost" onClick={() => router.back()} className="w-fit hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" />
            БОЗГАШТ
          </Button>
          <h1 className="text-4xl font-headline font-black text-secondary tracking-tighter">Паёмҳо</h1>
        </div>

        {conversations.length > 0 ? (
          <div className="space-y-6">
            {conversations.map((conv) => (
              <Link key={conv.listing.id} href={`/chat/${conv.listing.id}`}>
                <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group ring-1 ring-secondary/5">
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className="relative shrink-0">
                      <Avatar className="h-16 w-16 border-4 border-muted shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                        <AvatarImage src={conv.listing.images[0]} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                          {conv.listing.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black h-7 w-7 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="font-black text-secondary text-lg truncate tracking-tight group-hover:text-primary transition-colors">{conv.listing.userName}</h3>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] truncate mb-2 opacity-60">{conv.listing.title}</p>
                      <div className="flex items-center gap-2">
                        {conv.lastMessage.senderId === user.id && (
                          <CheckCheck className={cn("h-4 w-4", conv.lastMessage.isRead ? "text-blue-500" : "text-muted-foreground opacity-30")} />
                        )}
                        <p className={cn("text-sm truncate font-medium italic", conv.unreadCount > 0 ? "font-black text-secondary not-italic" : "text-muted-foreground")}>
                          &ldquo;{conv.lastMessage.text}&rdquo;
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-muted/50 shadow-inner group">
            <MessageSquare className="h-20 w-20 mx-auto text-muted mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-muted-foreground font-black text-xl uppercase tracking-[0.2em] opacity-40">ҲОЛО ЯГОН МУКОТИБА НАДОРЕД</p>
          </div>
        )}
      </div>
    </div>
  );
}

