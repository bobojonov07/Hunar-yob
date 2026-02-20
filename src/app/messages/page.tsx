
"use client"

import { useMemo, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, CheckCheck, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collectionGroup, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { Message, Listing } from "@/lib/storage";

interface Conversation {
  listingId: string;
  lastMessage: Message;
  otherPartyName: string;
  otherPartyImage?: string;
}

export default function MessagesList() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);

  const messagesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, "messages"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: allMessages = [], loading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    async function fetchConversationDetails() {
      if (!user || allMessages.length === 0) {
        setLoadingConv(false);
        return;
      }

      const groups: Record<string, Message> = {};
      allMessages.forEach(msg => {
        if (!groups[msg.listingId]) {
          groups[msg.listingId] = msg;
        }
      });

      const convList: Conversation[] = [];
      for (const [listingId, lastMessage] of Object.entries(groups)) {
        // Fetch listing to find who the other person is
        const listingSnap = await getDoc(doc(db, "listings", listingId));
        if (listingSnap.exists()) {
          const listing = listingSnap.data() as Listing;
          let otherPartyName = listing.userName;
          let otherPartyId = listing.userId;

          // If current user is the artisan, find the client from messages
          if (user.uid === listing.userId) {
            // This is a simplification; in a real app, messages would store receiverId
            otherPartyName = lastMessage.senderId === user.uid ? "Мизоҷ" : lastMessage.senderName;
          }

          convList.push({
            listingId,
            lastMessage,
            otherPartyName
          });
        }
      }
      setConversations(convList);
      setLoadingConv(false);
    }

    fetchConversationDetails();
  }, [allMessages, user, db]);

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

        {loading || loadingConv ? (
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
  const formattedTime = useMemo(() => {
    if (!conv.lastMessage.createdAt) return "";
    const date = conv.lastMessage.createdAt.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [conv.lastMessage.createdAt]);

  return (
    <Link href={`/chat/${conv.listingId}`}>
      <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group ring-1 ring-secondary/5">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16 border-4 border-muted shadow-lg transform group-hover:scale-110 transition-transform duration-500">
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                {conv.otherPartyName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-2">
              <h3 className="font-black text-secondary text-lg truncate tracking-tight group-hover:text-primary transition-colors">
                {conv.otherPartyName}
              </h3>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {conv.lastMessage.senderId === currentUser.uid && (
                <div className="flex">
                  {conv.lastMessage.isRead ? (
                    <CheckCheck className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Check className="h-4 w-4 text-muted-foreground opacity-30" />
                  )}
                </div>
              )}
              <p className={cn(
                "text-sm truncate font-medium text-muted-foreground",
                !conv.lastMessage.isRead && conv.lastMessage.senderId !== currentUser.uid && "font-black text-secondary"
              )}>
                {conv.lastMessage.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
