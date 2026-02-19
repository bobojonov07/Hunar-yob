
"use client"

import { useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, CheckCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collectionGroup, query, where, orderBy } from "firebase/firestore";
import { Message, Listing } from "@/lib/storage";

interface Conversation {
  listingId: string;
  lastMessage: Message;
}

export default function MessagesList() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const messagesQuery = useMemo(() => {
    if (!db || !user) return null;
    // Дар ин MVP мо ҳамаи паёмҳоеро мегирем, ки корбар дар онҳо иштирок дорад
    return query(
      collectionGroup(db, "messages"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: allMessages = [], loading } = useCollection<Message>(messagesQuery);

  // Гурӯҳбандии паёмҳо аз рӯи Listing
  const conversations = useMemo(() => {
    if (!user) return [];
    const groups: Record<string, Message> = {};
    
    allMessages.forEach(msg => {
      // Танҳо паёмҳои корбари ҷорӣ (фиристода ё гирифта)
      // Дар оянда метавон логикаи иштирокчиёнро мукаммалтар кард
      if (!groups[msg.listingId]) {
        groups[msg.listingId] = msg;
      }
    });

    return Object.entries(groups).map(([listingId, lastMessage]) => ({
      listingId,
      lastMessage
    }));
  }, [allMessages, user]);

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
          <h1 className="text-4xl font-headline font-black text-secondary tracking-tighter text-center md:text-left">Паёмҳо</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 opacity-50">Дар ҳоли боргузорӣ...</div>
        ) : conversations.length > 0 ? (
          <div className="space-y-6">
            {conversations.map((conv) => (
              <ConversationItem key={conv.listingId} conv={conv} currentUser={user} />
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

function ConversationItem({ conv, currentUser }: { conv: Conversation, currentUser: any }) {
  // Барои гирифтани номи Listing метавон аз useDoc истифода бурд, 
  // аммо дар ин ҷо мо танҳо ID-ро барои чат истифода мебарем
  return (
    <Link href={`/chat/${conv.listingId}`}>
      <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group ring-1 ring-secondary/5">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16 border-4 border-muted shadow-lg transform group-hover:scale-110 transition-transform duration-500">
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                {conv.lastMessage.senderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-2">
              <h3 className="font-black text-secondary text-lg truncate tracking-tight group-hover:text-primary transition-colors">
                {conv.lastMessage.senderId === currentUser.uid ? "Муколама" : conv.lastMessage.senderName}
              </h3>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                {conv.lastMessage.createdAt?.seconds ? new Date(conv.lastMessage.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {conv.lastMessage.senderId === currentUser.uid && (
                <CheckCheck className={cn("h-4 w-4", conv.lastMessage.isRead ? "text-blue-500" : "text-muted-foreground opacity-30")} />
              )}
              <p className={cn("text-sm truncate font-medium italic text-muted-foreground")}>
                &ldquo;{conv.lastMessage.text}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
