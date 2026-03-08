
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  Loader2, 
  Check, 
  CheckCheck,
  Scale,
  AlertTriangle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  updateDoc, 
  increment, 
  writeBatch,
} from "firebase/firestore";
import { Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT, Deal } from "@/lib/storage";
import { cn, hasProfanity } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ChatPage() {
  const { id: listingId } = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetClientId = searchParams.get("client");
  
  const [newMessage, setNewMessage] = useState("");
  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);

  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing } = useDoc<any>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const chatId = useMemo(() => {
    if (!listingId || !user) return null;
    const clientId = targetClientId || user.uid;
    return `${listingId}_${clientId}`;
  }, [listingId, user, targetClientId]);

  useEffect(() => {
    if (!chatId || !user || !db) return;
    getDoc(doc(db, "chats", chatId)).then(snap => {
      let otherId = "";
      if (snap.exists()) {
        const chatData = snap.data();
        otherId = user.uid === chatData.clientId ? chatData.artisanId : chatData.clientId;
      } else if (listing) {
        otherId = user.uid === listing.userId ? targetClientId! : listing.userId;
      }
      
      if (otherId) {
        getDoc(doc(db, "users", otherId)).then(uSnap => {
          if (uSnap.exists()) setOtherParty({ ...uSnap.data(), id: uSnap.id } as UserProfile);
        });
      }
    });
  }, [db, chatId, user, listing, targetClientId]);

  const messagesQuery = useMemo(() => {
    if (!db || !chatId) return null;
    return query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  }, [db, chatId]);
  const { data: messages = [] } = useCollection<Message>(messagesQuery as any);

  useEffect(() => {
    if (!user || !chatId || messages.length === 0) return;
    const unreadMessages = messages.filter(m => m.senderId !== user.uid && !m.isRead);
    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        batch.update(doc(db, "chats", chatId, "messages", msg.id), { isRead: true });
      });
      batch.update(doc(db, "chats", chatId), { [`unreadCount.${user.uid}`]: 0 });
      batch.commit().catch(() => {});
    }
  }, [user, chatId, messages, db]);

  const isOnePremium = profile?.isPremium || otherParty?.isPremium;
  const CHAR_LIMIT = isOnePremium ? PREMIUM_CHAR_LIMIT : REGULAR_CHAR_LIMIT;
  const totalChars = useMemo(() => messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0), [messages]);
  const isLimitReached = totalChars >= CHAR_LIMIT;
  const charProgress = Math.min((totalChars / CHAR_LIMIT) * 100, 100);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || !listingId || !profile || !chatId) return;

    if (hasProfanity(newMessage)) {
      const newWarningCount = (profile.warningCount || 0) + 1;
      await updateDoc(userProfileRef!, { 
        warningCount: increment(1),
        isBlocked: newWarningCount >= 5,
        identificationStatus: newWarningCount >= 5 ? 'Blocked' : profile.identificationStatus
      });
      toast({ title: "Огоҳӣ!", description: `Огоҳии шумо: ${newWarningCount}/5.`, variant: "destructive" });
      setNewMessage("");
      return;
    }

    if (totalChars + newMessage.length > CHAR_LIMIT) {
      toast({ title: "Лимит", description: "Лимити аломатҳо гузашт", variant: "destructive" });
      return;
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const messageData = {
      id: msgRef.id,
      chatId,
      senderId: user.uid,
      senderName: profile.name,
      text: newMessage,
      createdAt: serverTimestamp(),
      isRead: false,
      type: 'text',
      isPremiumSender: profile.isPremium || false
    };

    setDoc(chatRef, {
      id: chatId,
      listingId: listingId as string,
      clientId: targetClientId || user.uid,
      artisanId: listing?.userId || otherParty?.id || "",
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherParty?.id || ""}`]: increment(1)
    }, { merge: true });

    setDoc(msgRef, messageData);
    setNewMessage("");
  };

  const handleAcceptDeal = async (dealId: string, msgId: string) => {
    if (!db || !chatId) return;
    const dealRef = doc(db, "deals", dealId);
    await updateDoc(dealRef, { status: 'Active', acceptedAt: serverTimestamp() });
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), { text: "Шартнома қабул шуд" });
    toast({ title: "Шартнома фаъол шуд" });
  };

  const handleStartDeal = () => {
    if (otherParty?.identificationStatus !== 'Verified') {
      toast({
        variant: "destructive",
        title: "Амният",
        description: `Ҳамсуҳбат ${otherParty?.name || ""} верификатсия накардааст. Барои амнияти шумо мо наметавонем шартномаатонро бо ин шахс фаъол созем.`
      });
      return;
    }
    router.push(`/create-deal/${listingId}?client=${targetClientId || user?.uid}`);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const isPremiumTheme = profile?.isPremium;

  return (
    <div className={cn("flex flex-col h-screen", isPremiumTheme ? "bg-secondary" : "bg-background")}>
      <Navbar />
      
      <div className={cn("flex flex-col border-b shadow-lg sticky top-[64px] z-10", isPremiumTheme ? "bg-black/40 backdrop-blur-xl border-white/10" : "bg-white")}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className={cn("rounded-full", isPremiumTheme ? "text-white" : "")}><ChevronLeft className="h-6 w-6" /></Button>
            <Avatar className={cn("h-12 w-12 border-2", otherParty?.isPremium ? "border-yellow-400" : "border-muted")}>
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback>{otherParty?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className={cn("font-black text-base truncate", isPremiumTheme ? "text-white" : "text-secondary")}>{otherParty?.name}</h3>
                {otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className={cn("text-[10px] font-bold", isPremiumTheme ? "text-white/60" : "text-muted-foreground")}>{otherParty?.lastActive ? "Дар хат" : "Офлайн"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              disabled={profile?.identificationStatus !== 'Verified'} 
              size="sm" 
              onClick={handleStartDeal} 
              className="rounded-full font-black text-[10px] px-6 h-10 bg-secondary text-white shadow-xl hover:scale-105 transition-all"
            >
              ШАРТНОМА
            </Button>
          </div>
        </div>
        <div className="px-6 pb-3 space-y-1">
          <Progress value={charProgress} className="h-1" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? 'items-end' : 'items-start')}>
              <div className={cn(
                "relative max-w-[85%] p-4 rounded-[2rem] shadow-xl",
                isMe ? (isPremiumTheme ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-secondary" : "bg-primary text-white") : (isPremiumTheme ? "bg-white/5 text-white" : "bg-white text-secondary border")
              )}>
                {msg.type === 'deal' && msg.dealId ? (
                  <DealCard dealId={msg.dealId} isMe={isMe} onAccept={() => handleAcceptDeal(msg.dealId!, msg.id)} />
                ) : (
                  <p className="text-sm font-bold">{msg.text}</p>
                )}
                <div className="flex justify-end mt-1">
                  <span className="text-[8px] opacity-60 mr-2">{msg.createdAt?.toDate()?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  {isMe && (msg.isRead ? <CheckCheck className="h-3.5 w-3.5 text-blue-400" /> : <Check className="h-3.5 w-3.5 opacity-60" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("p-6 border-t", isPremiumTheme ? "bg-black/40 border-white/10" : "bg-white")}>
        <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3 max-w-4xl mx-auto items-center">
          <Input 
            placeholder="Нависед..." 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            className={cn("rounded-full h-14 px-8", isPremiumTheme ? "bg-white/5 border-white/10 text-white" : "bg-muted/30 border-none")} 
          />
          <Button type="submit" size="icon" className="rounded-full h-14 w-14 bg-primary"><Send className="h-6 w-6 text-white" /></Button>
        </form>
      </div>
    </div>
  );
}

function DealCard({ dealId, isMe, onAccept }: { dealId: string, isMe: boolean, onAccept: () => void }) {
  const db = useFirestore();
  const { data: deal } = useDoc<Deal>(doc(db, "deals", dealId) as any);

  if (!deal) return <Loader2 className="animate-spin h-5 w-5" />;

  return (
    <div className="space-y-4 min-w-[260px]">
      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
        <Scale className="h-7 w-7 text-yellow-400" />
        <div>
          <h4 className="font-black text-xs uppercase tracking-tight">Шартномаи Амниятӣ</h4>
          <p className="text-[10px] opacity-70">Ҳифзи 100% маблағи шумо</p>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-black text-sm uppercase leading-tight">{deal.title}</h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
          <div className="bg-black/20 p-2 rounded-xl text-center"><p className="opacity-60 text-[8px]">НАРХ:</p><p className="text-sm text-yellow-400">{deal.price} TJS</p></div>
          <div className="bg-black/20 p-2 rounded-xl text-center"><p className="opacity-60 text-[8px]">МӮҲЛАТ:</p><p className="text-sm">{deal.duration} рӯз</p></div>
        </div>
      </div>
      {!isMe && deal.status === 'Pending' && (
        <Button onClick={onAccept} className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] h-10 rounded-xl shadow-lg">ҚАБУЛ КАРДАН</Button>
      )}
      <Badge className={cn("w-full justify-center h-8 rounded-lg font-black uppercase text-[9px]", deal.status === 'Active' ? "bg-green-500" : "bg-black/20")}>
        ҲОЛАТ: {deal.status === 'Pending' ? 'Интизории қабул' : deal.status === 'Active' ? 'ФАЪОЛ (Escrow)' : deal.status === 'Completed' ? 'АНҶОМЁФТА' : deal.status}
      </Badge>
    </div>
  );
}
