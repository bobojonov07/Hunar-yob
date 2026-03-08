
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, ShieldCheck, CheckCircle2, MessageSquare, Loader2, Crown, Volume2, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, setDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore";
import { Listing, Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT } from "@/lib/storage";
import { textToSpeech } from "@/ai/flows/tts-flow";
import { cn } from "@/lib/utils";

function formatDistanceToNowTajik(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Ҳозир";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} дақиқа пеш`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} соат пеш`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} рӯз пеш`;
  return date.toLocaleDateString();
}

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
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

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
  const { data: messages = [], loading: messagesLoading } = useCollection<Message>(messagesQuery as any);

  const CHAR_LIMIT = profile?.isPremium ? PREMIUM_CHAR_LIMIT : REGULAR_CHAR_LIMIT;
  const totalChars = useMemo(() => messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0), [messages]);
  const isLimitReached = totalChars >= CHAR_LIMIT;
  const charProgress = Math.min((totalChars / CHAR_LIMIT) * 100, 100);

  useEffect(() => {
    if (!chatId || !user || !db || messagesLoading) return;
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${user.uid}`]: 0 }).catch(() => {});
  }, [chatId, user, db, messagesLoading]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listingId || !profile || !chatId) return;

    if (totalChars + (type === 'text' ? newMessage.length : 0) > CHAR_LIMIT) {
      toast({ title: "Лимит", description: "Лимити аломатҳо гузашт", variant: "destructive" });
      return;
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const clientId = targetClientId || user.uid;
    const artisanId = listing?.userId || otherParty?.id || "";

    const messageData = {
      id: msgRef.id,
      chatId,
      senderId: user.uid,
      senderName: profile.name,
      text: type === 'deal' ? "Дархости шартнома фиристода шуд" : newMessage,
      createdAt: serverTimestamp(),
      isRead: false,
      type,
      dealId: dealId || null,
      isPremiumSender: profile.isPremium || false
    };

    const chatUpdate = {
      id: chatId,
      listingId: listingId as string,
      clientId: clientId,
      artisanId: artisanId || "",
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherParty?.id || ""}`]: increment(1)
    };

    setDoc(chatRef, chatUpdate, { merge: true }).catch(() => {});
    setDoc(msgRef, messageData).catch((err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: msgRef.path,
        operation: 'create',
        requestResourceData: messageData,
      }));
    });

    if (type === 'text') setNewMessage("");
  };

  const handlePlayTTS = async (text: string, msgId: string) => {
    if (!profile?.isPremium) {
      toast({ title: "Танҳо барои Premium", description: "Барои истифодаи AI Voice аввал Premium гиред." });
      return;
    }
    setPlayingAudioId(msgId);
    try {
      const { audioDataUri } = await textToSpeech({ text });
      const audio = new Audio(audioDataUri);
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
    } catch (e) {
      toast({ title: "Хатогӣ дар AI", variant: "destructive" });
      setPlayingAudioId(null);
    }
  };

  const lastActiveText = useMemo(() => {
    if (!otherParty?.lastActive) return "Офлайн";
    try {
      const lastActive = otherParty.lastActive.toDate();
      const now = new Date();
      if ((now.getTime() - lastActive.getTime()) / 1000 / 60 < 5) return "Дар хат";
      return formatDistanceToNowTajik(lastActive);
    } catch (e) { return "Офлайн"; }
  }, [otherParty]);

  if (authLoading || listingLoading || profileLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  const isPremiumTheme = profile?.isPremium;

  return (
    <div className={cn("flex flex-col h-screen transition-colors duration-500", isPremiumTheme ? "bg-secondary" : "bg-background")}>
      <Navbar />
      
      <div className={cn(
        "flex flex-col border-b shadow-lg sticky top-[64px] z-10",
        isPremiumTheme ? "bg-black/40 backdrop-blur-xl border-white/10" : "bg-white"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className={cn("rounded-full", isPremiumTheme ? "text-white" : "")}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Avatar className={cn("h-12 w-12 border-2", otherParty?.isPremium ? "border-yellow-400" : "border-muted")}>
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black">{otherParty?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={cn("font-black text-base truncate max-w-[150px]", isPremiumTheme ? "text-white" : "text-secondary")}>
                  {otherParty?.name || "Корбар"}
                </h3>
                {otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                {otherParty?.isPremium && <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </div>
              <p className={cn("text-[10px] font-bold", isPremiumTheme ? "text-white/60" : "text-muted-foreground")}>{lastActiveText}</p>
            </div>
          </div>

          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <Button size="sm" onClick={() => setIsDealDialogOpen(true)} className={cn(
              "rounded-full font-black text-[10px] px-6 h-10 shadow-xl transition-all hover:scale-105",
              isPremiumTheme ? "bg-yellow-500 text-secondary" : "bg-secondary text-white"
            )}>ШАРТНОМА</Button>
            <DialogContent className="rounded-3xl p-8 max-w-sm">
              <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter">ДАРХОСТИ КОР</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Номи кор</Label><Input placeholder="Масалан: Сохтани шкаф" value={dealTitle} onChange={e => setDealTitle(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Нарх (TJS)</Label><Input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Мӯҳлат (рӯз)</Label><Input type="number" value={dealDuration} onChange={e => setDealDuration(e.target.value)} /></div>
                </div>
                <Button onClick={() => { handleSendMessage(undefined, 'deal'); setIsDealDialogOpen(false); }} className="w-full bg-primary h-12 font-black uppercase">ФИРИСТОДАН</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="px-6 pb-3 space-y-1">
          <div className={cn("flex justify-between text-[9px] font-black uppercase tracking-widest", isPremiumTheme ? "text-yellow-400" : "text-muted-foreground")}>
            <span>Лимити аломатҳо {profile?.isPremium && "★ PREMIUM ★"}</span>
            <span>{totalChars} / {CHAR_LIMIT}</span>
          </div>
          <Progress value={charProgress} className={cn("h-1.5", isPremiumTheme ? "bg-white/10 [&>div]:bg-yellow-500" : "")} />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
            <MessageSquare className={cn("h-20 w-20 mb-4", isPremiumTheme ? "text-white" : "")} />
            <p className={cn("font-black uppercase text-xs tracking-[0.3em]", isPremiumTheme ? "text-white" : "")}>Сӯҳбатро оғоз кунед</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={cn("flex flex-col group", isMe ? 'items-end' : 'items-start')}>
                <div className={cn(
                  "relative max-w-[85%] p-4 rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02]",
                  isMe 
                    ? (isPremiumTheme ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-secondary ring-4 ring-yellow-400/20" : "bg-primary text-white") 
                    : (isPremiumTheme ? "bg-white/5 backdrop-blur-md text-white border border-white/10" : "bg-white text-secondary border")
                )}>
                  <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                  
                  <div className="flex justify-between items-center mt-3 gap-4">
                    <span className="text-[8px] font-black uppercase opacity-60">
                      {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {profile?.isPremium && (
                      <button 
                        onClick={() => handlePlayTTS(msg.text, msg.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full transition-all",
                          playingAudioId === msg.id ? "bg-white/20 animate-pulse" : "hover:bg-white/10"
                        )}
                      >
                        {playingAudioId === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
                        <span className="text-[8px] font-black uppercase">ГӮШ КАРДАН</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={cn(
        "p-6 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)]",
        isPremiumTheme ? "bg-black/40 border-white/10" : "bg-white"
      )}>
        {!isLimitReached ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3 max-w-4xl mx-auto">
            <Input 
              placeholder="Нависед..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              className={cn(
                "rounded-full h-14 px-8 flex-1 text-base font-bold transition-all focus:ring-4",
                isPremiumTheme 
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-yellow-400/20" 
                  : "bg-muted/30 border-none"
              )} 
            />
            <Button 
              type="submit" 
              size="icon" 
              className={cn(
                "rounded-full h-14 w-14 shadow-2xl transition-transform active:scale-90",
                isPremiumTheme ? "bg-yellow-500 hover:bg-yellow-400" : "bg-primary"
              )}
            >
              <Send className={cn("h-6 w-6", isPremiumTheme ? "text-secondary" : "text-white")} />
            </Button>
          </form>
        ) : (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest border border-red-500/20">
            Лимити аломатҳо ба охир расид. {!profile?.isPremium && "БАРОИ ИДОМА PREMIUM ГИРЕД!"}
          </div>
        )}
      </div>
    </div>
  );
}
