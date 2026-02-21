
"use client"

import { useMemo, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, CheckCheck, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, doc, getDoc, or } from "firebase/firestore";
import { Chat, UserProfile } from "@/lib/storage";

interface Conversation extends Chat {
  otherParty: UserProfile | null;
}

export default function MessagesList() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);

  const chatsQuery = useMemo(() => {
    if (!db || !user) return null;
    // We use a query that finds chats where current user is involved
    return query(
      collection(db, "chats"),
      or(where("clientId", "==", user.uid), where("artisanId", "==", user.uid)),
      orderBy("updatedAt", "desc")
    );
  }, [db, user]);

  const { data: allChats = [], loading } = useCollection<Chat>(chatsQuery as any);

  useEffect(() => {
    async function fetchDetails() {
      if (!user) return;
      if (allChats.length === 0) {
        if (!loading) {
          setConversations([]);
          setLoadingConv(false);
        }
        return;
      }

      setLoadingConv(true);
      try {
        const convList: Conversation[] = [];
        for (const chat of allChats) {
          const otherId = user.uid === chat.clientId ? chat.artisanId : chat.clientId;
          if (!otherId) continue;
          
          const otherSnap = await getDoc(doc(db, "users", otherId));
          convList.push({
            ...chat,
            otherParty: otherSnap.exists() ? { ...(otherSnap.data() as UserProfile), id: otherSnap.id } : null
          });
        }
        setConversations(convList);
      } catch (err) {
        console.error("Error fetching chat details:", err);
      } finally {
        setLoadingConv(false);
      }
    }

    fetchDetails();
  }, [allChats, user, db, loading]);

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
          <h1 className="text-4xl font-headline font-black text-secondary tracking-tighter uppercase">Паёмҳо</h1>
        </div>

        {(loading || loadingConv) ? (
          <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="font-black uppercase tracking-widest text-[10px]">Дар ҳоли боргузорӣ...</p>
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <ConversationItem key={conv.id} conv={conv} currentUser={user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-muted/50 shadow-inner group">
            <MessageSquare className="h-20 w-20 mx-auto text-muted mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-muted-foreground font-black text-xl uppercase tracking-[0.2em] opacity-40 text-center px-4">ҲОЛО ЯГОН МУКОТИБА НАДОРЕД</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conv, currentUser }: { conv: Conversation, currentUser: any }) {
  const formattedTime = useMemo(() => {
    if (!conv.updatedAt) return "";
    try {
      const date = conv.updatedAt.toDate();
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch (e) {
      return "";
    }
  }, [conv.updatedAt]);

  const chatLink = `/chat/${conv.listingId}?client=${conv.clientId}`;

  return (
    <Link href={chatLink}>
      <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-none shadow-md rounded-[2rem] bg-white group">
        <CardContent className="p-5 flex items-center gap-5">
          <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-sm group-hover:scale-105 transition-transform">
            <AvatarImage src={conv.otherParty?.profileImage} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
              {conv.otherParty?.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-black text-secondary text-lg truncate group-hover:text-primary transition-colors">
                {conv.otherParty?.name || "Корбар"}
              </h3>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest shrink-0">
                {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {conv.lastSenderId === currentUser.uid && (
                <CheckCheck className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              <p className={cn(
                "text-sm truncate font-medium text-muted-foreground",
                (conv.unreadCount?.[currentUser.uid] || 0) > 0 && "font-black text-secondary"
              )}>
                {conv.lastMessage}
              </p>
            </div>
          </div>
          {(conv.unreadCount?.[currentUser.uid] || 0) > 0 && (
            <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-black shrink-0">
              {conv.unreadCount[currentUser.uid]}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
