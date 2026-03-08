
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  Loader2, 
  Crown, 
  Flag, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  CheckCheck,
  MoreVertical,
  Scale,
  Clock,
  Handshake
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
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
  addDoc, 
  arrayUnion,
  writeBatch,
  where,
  getDocs
} from "firebase/firestore";
import { Listing, Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT, Deal } from "@/lib/storage";
import { cn, hasProfanity } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);

  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing, loading: listingLoading } = useDoc<Listing>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef as any);

  const chatId = useMemo(() => {
    if (!listingId || !user) return null;
    const clientId = targetClientId || user.uid;
    return `${listingId}_${clientId}`;
  }, [listingId, user, targetClientId]);

  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!chatId || !user || !db) return;
    getDoc(doc(db, "chats", chatId)).then(snap => {
      if (snap.exists()) {
        const chatData = snap.data();
        const otherId = user.uid === chatData.clientId ? chatData.artisanId : chatData.clientId;
        if (otherId) {
          getDoc(doc(db, "users", otherId)).then(uSnap => {
            if (uSnap.exists()) setOtherParty(uSnap.data() as UserProfile);
          });
        }
      } else if (listing) {
        const otherId = user.uid === listing.userId ? targetClientId : listing.userId;
        if (otherId) {
          getDoc(doc(db, "users", otherId)).then(uSnap => {
            if (uSnap.exists()) setOtherParty(uSnap.data() as UserProfile);
          });
        }
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

  const handleSendMessage = async (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listingId || !profile || !chatId) return;

    if (type === 'text' && hasProfanity(newMessage)) {
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

    if (totalChars + (type === 'text' ? newMessage.length : 0) > CHAR_LIMIT) {
      toast({ title: "Лимит", description: "Лимити аломатҳо гузашт", variant: "destructive" });
      return;
    }

    let currentDealId = dealId;
    if (type === 'deal' && !dealId) {
      const newDealRef = doc(collection(db, "deals"));
      currentDealId = newDealRef.id;
      const dealData: Deal = {
        id: newDealRef.id,
        listingId: listingId as string,
        clientId: targetClientId || user.uid,
        artisanId: listing?.userId || otherParty?.id || "",
        title: dealTitle,
        price: parseFloat(dealPrice),
        duration: parseInt(dealDuration),
        status: 'Pending',
        createdAt: serverTimestamp()
      };
      await setDoc(newDealRef, dealData);
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const messageData = {
      id: msgRef.id,
      chatId,
      senderId: user.uid,
      senderName: profile.name,
      text: type === 'deal' ? "Дархости шартнома фиристода шуд" : newMessage,
      createdAt: serverTimestamp(),
      isRead: false,
      type,
      dealId: currentDealId || null,
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
    if (type === 'text') setNewMessage("");
  };

  const handleAcceptDeal = async (dealId: string, msgId: string) => {
    if (!db || !chatId) return;
    const dealRef = doc(db, "deals", dealId);
    await updateDoc(dealRef, { status: 'Active', acceptedAt: serverTimestamp() });
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), { text: "Шартнома қабул шуд" });
    toast({ title: "Шартнома фаъол шуд" });
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (authLoading || listingLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

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
            <Button disabled={profile?.identificationStatus !== 'Verified'} size="sm" onClick={() => setIsDealDialogOpen(true)} className="rounded-full font-black text-[10px] px-6 h-10 bg-secondary text-white">ШАРТНОМА</Button>
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
                  <DealMessage dealId={msg.dealId} isMe={isMe} onAccept={() => handleAcceptDeal(msg.dealId!, msg.id)} />
                ) : (
                  <p className="text-sm font-bold">{msg.text}</p>
                )}
                <div className="flex justify-end mt-1">
                  <span className="text-[8px] opacity-60 mr-2">{msg.createdAt?.toDate()?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  {isMe && (msg.isRead ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 opacity-60" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("p-6 border-t", isPremiumTheme ? "bg-black/40 border-white/10" : "bg-white")}>
        <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3 max-w-4xl mx-auto items-center">
          <Input placeholder="Нависед..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className={cn("rounded-full h-14 px-8", isPremiumTheme ? "bg-white/5 border-white/10 text-white" : "bg-muted/30 border-none")} />
          <Button type="submit" size="icon" className="rounded-full h-14 w-14 bg-primary"><Send className="h-6 w-6 text-white" /></Button>
        </form>
      </div>

      <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
        <DialogContent className="rounded-3xl p-8 max-w-sm">
          <DialogHeader><DialogTitle className="font-black uppercase">ДАРХОСТИ ШАРТНОМА</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Номи кор</Label><Input placeholder="Масалан: Ремонти хона" value={dealTitle} onChange={e => setDealTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Нарх (TJS)</Label><Input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Мӯҳлат (рӯз)</Label><Input type="number" value={dealDuration} onChange={e => setDealDuration(e.target.value)} /></div>
            </div>
            <Button onClick={() => { handleSendMessage(undefined, 'deal'); setIsDealDialogOpen(false); }} className="w-full bg-primary h-12 font-black uppercase">ФИРИСТОДАН</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DealMessage({ dealId, isMe, onAccept }: { dealId: string, isMe: boolean, onAccept: () => void }) {
  const db = useFirestore();
  const { data: deal } = useDoc<Deal>(doc(db, "deals", dealId) as any);

  if (!deal) return <Loader2 className="animate-spin h-5 w-5" />;

  return (
    <div className="space-y-4 min-w-[240px]">
      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
        <Scale className="h-6 w-6 text-yellow-400" />
        <div>
          <h4 className="font-black text-xs uppercase tracking-tight">Шартнома</h4>
          <p className="text-[10px] opacity-70">Ҳифзи 100% маблағ</p>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-black text-sm uppercase">{deal.title}</h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
          <div className="bg-black/20 p-2 rounded-xl"><p className="opacity-60">НАРХ:</p><p className="text-base text-yellow-400">{deal.price} TJS</p></div>
          <div className="bg-black/20 p-2 rounded-xl"><p className="opacity-60">МӮҲЛАТ:</p><p className="text-base">{deal.duration} рӯз</p></div>
        </div>
      </div>
      {!isMe && deal.status === 'Pending' && (
        <Button onClick={onAccept} className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] h-10 rounded-xl">ҚАБУЛ КАРДАН</Button>
      )}
      <Badge className={cn("w-full justify-center h-8 rounded-lg font-black uppercase text-[9px]", deal.status === 'Active' ? "bg-green-500" : "bg-black/20")}>
        ҲОЛАТ: {deal.status === 'Pending' ? 'Интизорӣ' : deal.status === 'Active' ? 'ФАЪОЛ' : deal.status}
      </Badge>
    </div>
  );
}
