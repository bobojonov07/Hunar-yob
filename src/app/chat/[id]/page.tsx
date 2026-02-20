"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, Hammer, MessageSquare, ShieldCheck, ShieldAlert, Star, CheckCircle2, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, setDoc, serverTimestamp, where, updateDoc, writeBatch, getDocs, getDoc } from "firebase/firestore";
import { Listing, Message, Deal, calculateFee, UserProfile, Chat } from "@/lib/storage";

export default function ChatPage() {
  const { id: listingId } = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // If current user is artisan, we need to know which client they are talking to
  const targetClientId = searchParams.get("client") || (user?.uid !== undefined ? user.uid : "");
  
  const [newMessage, setNewMessage] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);

  // Firestore Data
  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing } = useDoc<Listing>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  // Chat identification: listingId + clientId (always unique thread)
  const chatId = useMemo(() => {
    if (!listing || !user) return null;
    const clientId = user.uid === listing.userId ? targetClientId : user.uid;
    return `${listingId}_${clientId}`;
  }, [listing, user, listingId, targetClientId]);

  // Fetch other party profile
  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!listing || !user || !chatId) return;
    const otherId = user.uid === listing.userId ? targetClientId : listing.userId;
    if (otherId) {
      getDoc(doc(db, "users", otherId)).then(snap => {
        if (snap.exists()) setOtherParty(snap.data() as UserProfile);
      });
    }
  }, [db, listing, user, chatId, targetClientId]);

  const messagesQuery = useMemo(() => {
    if (!db || !chatId) return null;
    return query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  }, [db, chatId]);
  const { data: messages = [] } = useCollection<Message>(messagesQuery as any);

  // Mark as read
  useEffect(() => {
    if (!chatId || !user || messages.length === 0) return;
    const unread = messages.filter(m => !m.isRead && m.senderId !== user.uid);
    if (unread.length > 0) {
      unread.forEach(m => {
        updateDoc(doc(db, "chats", chatId, "messages", m.id), { isRead: true });
      });
      updateDoc(doc(db, "chats", chatId), { [`unreadCount.${user.uid}`]: 0 });
    }
  }, [chatId, user, messages, db]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listingId || !profile || !chatId || !listing) return;

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
      dealId: dealId || null
    };

    const chatUpdate = {
      id: chatId,
      listingId: listingId as string,
      clientId: user.uid === listing.userId ? targetClientId : user.uid,
      artisanId: listing.userId,
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
    };

    // Use a batch or sequential writes
    setDoc(chatRef, chatUpdate, { merge: true }).catch(() => {});
    setDoc(msgRef, messageData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: msgRef.path,
        operation: 'create',
        requestResourceData: messageData,
      }));
    });

    if (type === 'text') setNewMessage("");
  };

  const handleCreateDeal = async () => {
    if (!user || !listing || !profile) return;
    const price = parseFloat(dealPrice);
    const duration = parseInt(dealDuration);
    if (!dealTitle || isNaN(price) || isNaN(duration)) {
      toast({ title: "Хатогӣ", description: "Майдонҳоро пур кунед", variant: "destructive" });
      return;
    }

    const fee = calculateFee(price);
    const dealRef = doc(collection(db, "deals"));
    const dealData: Deal = {
      id: dealRef.id,
      listingId: listing.id,
      clientId: user.uid === listing.userId ? targetClientId : user.uid,
      artisanId: listing.userId,
      title: dealTitle,
      price,
      fee,
      durationDays: duration,
      status: 'Pending',
      senderId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } as any;

    setDoc(dealRef, dealData)
      .then(() => {
        handleSendMessage(undefined, 'deal', dealRef.id);
        setIsDealDialogOpen(false);
        setDealTitle(""); setDealPrice(""); setDealDuration("");
        toast({ title: "Дархост фиристода шуд" });
      })
      .catch(async (err: any) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: dealRef.path,
          operation: 'create',
          requestResourceData: dealData,
        }));
      });
  };

  if (!listing || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  const currentFee = dealPrice ? calculateFee(parseFloat(dealPrice)) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-4 max-w-3xl flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-center justify-between p-4 bg-white rounded-t-[2.5rem] border border-b-0 shadow-2xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ChevronLeft className="h-6 w-6" /></Button>
            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-md">
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black">{otherParty?.name.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-secondary truncate text-sm">{otherParty?.name || listing.userName}</h3>
                {listing.isVip && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground font-bold">Дар хат</p>
              </div>
            </div>
          </div>
          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary text-white rounded-full px-6 font-black shadow-lg hover:scale-105 transition-transform">ШАРТНОМА</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem] p-10 border-none shadow-3xl">
              {profile.identificationStatus !== 'Verified' ? (
                <div className="text-center space-y-6">
                  <ShieldAlert className="h-20 w-20 text-red-500 mx-auto animate-pulse" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter">ИДЕНТИФИКАТСИЯ ЛОЗИМ</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">Барои бастани шартнома ва ҳифзи 100% маблағ, профили худро тасдиқ кунед.</p>
                  <Button asChild className="w-full bg-primary h-14 rounded-2xl font-black shadow-xl"><Link href="/profile">ТАСДИҚ КАРДАН</Link></Button>
                </div>
              ) : (
                <>
                  <DialogHeader><DialogTitle className="text-3xl font-black text-secondary tracking-tighter">ДАРХОСТИ КОР</DialogTitle></DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest opacity-60">Номи кор</Label><Input placeholder="Масалан: Сохтани шкаф" value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="h-14 rounded-2xl border-muted bg-muted/20" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest opacity-60">Нарх (TJS)</Label><Input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} className="h-14 rounded-2xl border-muted bg-muted/20" /></div>
                      <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest opacity-60">Муҳлат (рӯз)</Label><Input type="number" value={dealDuration} onChange={e => setDealDuration(e.target.value)} className="h-14 rounded-2xl border-muted bg-muted/20" /></div>
                    </div>
                    {currentFee > 0 && (
                      <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20">
                        <p className="text-xs font-black text-primary flex items-center gap-2 uppercase tracking-widest"><ShieldCheck className="h-5 w-5" /> КОМИССИЯИ АМНИЯТӢ: {currentFee} TJS</p>
                      </div>
                    )}
                    <Button onClick={handleCreateDeal} className="w-full bg-primary h-16 rounded-[2rem] font-black uppercase text-lg shadow-2xl transition-all hover:scale-[1.02]">ФИРИСТОДАН</Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-white border shadow-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30"><MessageSquare className="h-20 w-20 mb-4" /><p className="font-bold uppercase tracking-widest text-xs text-center">Муколамаи махфӣ бо {otherParty?.name || "усто"}<br/>Паёмҳо ҳифз карда мешаванд</p></div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm relative group ${msg.senderId === user.uid ? 'bg-primary text-white rounded-br-none' : 'bg-muted/50 text-secondary rounded-bl-none'}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-50 text-[9px] font-bold">
                    <span>{msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.senderId === user.uid && (
                      msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white rounded-b-[2.5rem] border border-t-0 shadow-2xl mb-4">
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3">
            <Input placeholder="Паём..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="rounded-2xl h-14 font-bold border-muted bg-muted/20 px-6" />
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 rounded-2xl h-14 w-14 shrink-0 shadow-xl transition-all active:scale-90"><Send className="h-6 w-6 text-white" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
