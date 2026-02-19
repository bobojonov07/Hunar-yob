
"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User, getMessages, sendMessage, Message, markMessagesAsRead, getDeals, saveDeal, updateDealStatus, Deal, calculateFee, reportUser, saveReview, Review, getUsers } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, Hammer, CheckCheck, MessageSquare, Handshake, ShieldCheck, Flag, Star, CheckCircle2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function ChatPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [artisan, setArtisan] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("Online");
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeDealForReview, setActiveDealForReview] = useState<Deal | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.isBlocked) {
      toast({ title: "Дастрасӣ маҳдуд аст", description: "Акаунти шумо блок шудааст.", variant: "destructive" });
      router.push("/");
      return;
    }
    setUser(currentUser);

    const allListings = getListings();
    const found = allListings.find(l => l.id === id);
    if (found) {
      setListing(found);
      const allUsers = getUsers();
      const artisanUser = allUsers.find(u => u.id === found.userId);
      if (artisanUser) setArtisan(artisanUser);
      
      setMessages(getMessages(found.id));
      setDeals(getDeals().filter(d => d.listingId === found.id));
      markMessagesAsRead(found.id, currentUser.id);
    } else {
      router.push("/");
    }
    setStatus(["Online", "Online", "2 дақиқа пеш"][Math.floor(Math.random() * 3)]);
  }, [id, router]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listing) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      senderId: user.id,
      senderName: user.name,
      text: type === 'deal' ? "Дархости шартнома фиристода шуд" : newMessage,
      createdAt: new Date().toISOString(),
      isRead: false,
      type,
      dealId
    };

    sendMessage(message);
    setMessages(getMessages(listing.id));
    if (type === 'text') setNewMessage("");
  };

  const handleCreateDeal = () => {
    if (!user || !listing) return;
    const price = parseFloat(dealPrice);
    const duration = parseInt(dealDuration);
    if (!dealTitle || isNaN(price) || isNaN(duration)) {
      toast({ title: "Хатогӣ", description: "Майдонҳоро пур кунед", variant: "destructive" });
      return;
    }

    const fee = calculateFee(price);
    const deal: Deal = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      clientId: user.role === 'Client' ? user.id : 'unknown',
      artisanId: listing.userId,
      title: dealTitle,
      price,
      fee,
      durationDays: duration,
      status: 'Pending',
      senderId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      saveDeal(deal);
      setDeals([...deals, deal]);
      handleSendMessage(undefined, 'deal', deal.id);
      setIsDealDialogOpen(false);
      setDealTitle(""); setDealPrice(""); setDealDuration("");
      toast({ title: "Дархост фиристода шуд" });
    } catch (e: any) {
      toast({ title: "Хатогӣ", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdateStatus = (dealId: string, status: any) => {
    const res = updateDealStatus(dealId, status);
    if (res.success) {
      setDeals(getDeals().filter(d => d.listingId === listing?.id));
      toast({ title: "Навсозӣ шуд" });
      
      if (status === 'Confirmed') {
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
          setActiveDealForReview(deal);
          setIsReviewDialogOpen(true);
        }
      }
    } else {
      toast({ title: "Хатогӣ", description: res.message, variant: "destructive" });
    }
  };

  const handleReport = () => {
    if (!listing) return;
    const res = reportUser(listing.userId);
    if (res.success) toast({ title: res.message });
  };

  const handleReviewSubmit = () => {
    if (!activeDealForReview || !user || !listing) return;
    if (reviewComment.length < 10) {
      toast({ title: "Хатогӣ", description: "Шарҳ бояд камаш 10 ҳарф бошад", variant: "destructive" });
      return;
    }

    const review: Review = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      userId: user.id,
      userName: user.name,
      rating,
      comment: reviewComment,
      createdAt: new Date().toISOString(),
      dealId: activeDealForReview.id
    };

    saveReview(review);
    setIsReviewDialogOpen(false);
    setReviewComment("");
    toast({ title: "Ташаккур барои баҳо!" });
  };

  if (!listing || !user) return null;

  const currentFee = dealPrice ? calculateFee(parseFloat(dealPrice)) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-4 max-w-3xl flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-center justify-between p-4 bg-white rounded-t-[2.5rem] border border-b-0 shadow-2xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ChevronLeft className="h-6 w-6" /></Button>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg"><Hammer className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-secondary truncate text-sm">{listing.userName}</h3>
                {artisan?.identificationStatus === 'Verified' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 fill-green-50" />}
              </div>
              <div className="flex items-center gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", status === "Online" ? "bg-green-500" : "bg-muted-foreground")} /><p className="text-[10px] text-muted-foreground font-bold">{status}</p></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleReport} className="text-red-400 hover:text-red-600 rounded-full"><Flag className="h-5 w-5" /></Button>
            <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary text-white rounded-full px-6 font-black shadow-lg hover:scale-105 transition-transform">ШАРТНОМА</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[3rem] p-10 border-none shadow-3xl">
                {user.identificationStatus !== 'Verified' ? (
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
                          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Ин маблағ барои ҳифзи 100% маблағи шумо ва кафолати иҷрои кор нигоҳ дошта мешавад.</p>
                        </div>
                      )}
                      <Button onClick={handleCreateDeal} className="w-full bg-primary h-16 rounded-[2rem] font-black uppercase text-lg shadow-2xl transition-all hover:scale-[1.02]">ФИРИСТОДАН</Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-white border shadow-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30"><MessageSquare className="h-20 w-20 mb-4" /><p className="font-bold uppercase tracking-widest text-xs">Муколамаро оғоз кунед</p></div>
          ) : (
            messages.map((msg) => {
              const deal = msg.type === 'deal' ? deals.find(d => d.id === msg.dealId) : null;
              return (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'deal' && deal ? (
                    <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-secondary/5">
                      <div className="bg-secondary p-4 text-white flex justify-between items-center px-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center"><Handshake className="h-4 w-4 mr-2 text-primary" /> ШАРТНОМА</span>
                        <Badge className="bg-white/10 text-white border-none font-black text-[10px] uppercase">{deal.status}</Badge>
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <h4 className="font-black text-secondary text-xl leading-tight tracking-tighter">{deal.title}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 p-4 rounded-3xl"><p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">НАРХ</p><p className="font-black text-lg">{deal.price} TJS</p></div>
                          <div className="bg-muted/30 p-4 rounded-3xl"><p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">МУҲЛАТ</p><p className="font-black text-lg">{deal.durationDays} рӯз</p></div>
                        </div>
                        {deal.status === 'Pending' && deal.senderId !== user.id && (
                          <div className="pt-2 flex gap-3">
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Accepted')} className="flex-1 bg-green-500 text-white rounded-2xl font-black h-12 shadow-lg shadow-green-500/20">ҚАБУЛ</Button>
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Cancelled')} variant="ghost" className="flex-1 text-destructive font-black rounded-2xl h-12">РАД</Button>
                          </div>
                        )}
                        {deal.status === 'Accepted' && (
                          <div className="pt-2 flex flex-col gap-2">
                            {user.id === deal.artisanId && <Button onClick={() => handleUpdateStatus(deal.id, 'Completed')} className="w-full bg-primary text-white rounded-2xl font-black h-14 shadow-xl">КОР ИҶРО ШУД</Button>}
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Cancelled')} variant="outline" className="w-full rounded-2xl font-bold h-12 text-muted-foreground border-muted">БЕКОР КАРДАН</Button>
                          </div>
                        )}
                        {deal.status === 'Completed' && user.id === deal.clientId && (
                          <div className="pt-2 flex flex-col gap-2">
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Confirmed')} className="w-full bg-green-500 text-white rounded-2xl font-black h-14 shadow-xl">ТАСДИҚ ВА ПАРДОХТ</Button>
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Cancelled')} variant="outline" className="w-full rounded-2xl font-bold h-12 text-red-400 border-red-100">ШИКОЯТ / БЕКОР</Button>
                          </div>
                        )}
                        {deal.status === 'Confirmed' && (<div className="p-4 bg-green-50 text-green-700 rounded-3xl text-center text-[10px] font-black uppercase flex items-center justify-center tracking-[0.2em] border border-green-200"><ShieldCheck className="h-5 w-5 mr-3" /> ШАРТНОМА БО МУВАФФАҚИЯТ АНҶОМ ЁФТ</div>)}
                        {deal.status === 'Expired' && (<div className="p-4 bg-red-50 text-red-700 rounded-3xl text-center text-[10px] font-black uppercase tracking-[0.2em] border border-red-100">МУҲЛАТИ ҶАВОБ ГУЗАШТ (24С)</div>)}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className={`max-w-[80%] p-5 rounded-[2rem] shadow-2xl ${msg.senderId === user.id ? 'bg-primary text-white rounded-br-none' : 'bg-muted/50 text-secondary rounded-bl-none'}`}>
                      <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-2 opacity-60">
                        <p className="text-[10px] font-black">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {msg.senderId === user.id && (<CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-blue-200" : "text-white/70")} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-white rounded-b-[2.5rem] border border-t-0 shadow-2xl mb-4">
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3">
            <Input placeholder="Паём..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="rounded-2xl h-16 font-bold border-muted bg-muted/20 px-6" />
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 rounded-2xl h-16 w-16 shrink-0 shadow-xl transition-all active:scale-90"><Send className="h-7 w-7 text-white" /></Button>
          </form>
        </div>
      </div>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="rounded-[3rem] p-10">
          <DialogHeader><DialogTitle className="text-3xl font-black tracking-tighter text-secondary">БАҲО БА КОР</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4 text-center">
            <p className="text-sm text-muted-foreground font-medium">Лутфан ба сифати кори усто баҳо диҳед. Ин барои дигар мизоҷон муҳим аст.</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-10 w-10 cursor-pointer transition-all hover:scale-110 ${s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} onClick={() => setRating(s)} />
              ))}
            </div>
            <Textarea placeholder="Таассуроти шумо..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="min-h-[120px] rounded-[2rem] p-6 border-muted bg-muted/20 font-medium" />
            <Button onClick={handleReviewSubmit} className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl">ИРСОЛИ БАҲО</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
