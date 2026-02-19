
"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User, getMessages, sendMessage, Message, markMessagesAsRead, getDeals, saveDeal, updateDealStatus, Deal, calculateFee } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, Hammer, CheckCheck, MessageSquare, Handshake, Clock, ShieldCheck, DollarSign, Lock, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ChatPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
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

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const allListings = getListings();
    const found = allListings.find(l => l.id === id);
    if (found) {
      setListing(found);
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
    setMessages([...messages, message]);
    if (type === 'text') setNewMessage("");
  };

  const handleCreateDeal = () => {
    if (!user || !listing) return;
    if (user.identificationStatus !== 'Verified') {
      toast({ title: "Амният", description: "Аввал идентификатсия кунед", variant: "destructive" });
      return;
    }

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
      clientId: user.role === 'Client' ? user.id : messages.find(m => m.senderId !== user.id)?.senderId || 'unknown',
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
    } else {
      toast({ title: "Хатогӣ", description: res.message, variant: "destructive" });
    }
  };

  if (!listing || !user) return null;

  const currentFee = dealPrice ? calculateFee(parseFloat(dealPrice)) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-4 max-w-3xl flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-center justify-between p-4 bg-white rounded-t-3xl border border-b-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft className="h-6 w-6" /></Button>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white"><Hammer className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-secondary truncate">{listing.userName}</h3>
              <div className="flex items-center gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", status === "Online" ? "bg-green-500" : "bg-muted-foreground")} /><p className="text-[10px] text-muted-foreground">{status}</p></div>
            </div>
          </div>
          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary text-white rounded-full px-6 font-bold">{user.identificationStatus === 'Verified' ? <Handshake className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />} ШАРТНОМА</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-10">
              {user.identificationStatus !== 'Verified' ? (
                <div className="text-center space-y-4">
                  <ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-black uppercase">ИДЕНТИФИКАТСИЯ ЛОЗИМ</h3>
                  <p className="text-sm text-muted-foreground font-medium">Барои бастани шартнома ва ҳифзи маблағ, профили худро тасдиқ кунед.</p>
                  <Button asChild className="w-full bg-primary h-12 rounded-xl"><Link href="/profile">ТАСДИҚ КАРДАН</Link></Button>
                </div>
              ) : (
                <>
                  <DialogHeader><DialogTitle className="text-2xl font-black text-secondary">ДАРХОСТИ КОР</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Label className="font-bold">Номи кор</Label><Input placeholder="Масалан: Сохтани шкаф" value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="h-12 rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="font-bold">Нарх (TJS)</Label><Input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} className="h-12 rounded-xl" /></div>
                      <div><Label className="font-bold">Муҳлат (рӯз)</Label><Input type="number" value={dealDuration} onChange={e => setDealDuration(e.target.value)} className="h-12 rounded-xl" /></div>
                    </div>
                    {currentFee > 0 && (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                        <p className="text-xs font-bold text-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> КОМИССИЯИ АМНИЯТӢ: {currentFee} TJS</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Ин маблағ барои ҳифзи 100% маблағи шумо ва кафолати иҷрои кор нигоҳ дошта мешавад.</p>
                      </div>
                    )}
                    <Button onClick={handleCreateDeal} className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl">ФИРИСТОДАН</Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-white border shadow-sm space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50"><MessageSquare className="h-12 w-12 mb-4" /><p>Паёмҳои худро нависед.</p></div>
          ) : (
            messages.map((msg) => {
              const deal = msg.type === 'deal' ? deals.find(d => d.id === msg.dealId) : null;
              return (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'deal' && deal ? (
                    <Card className="w-full max-w-sm border-2 border-secondary/20 shadow-lg rounded-[2rem] overflow-hidden">
                      <div className="bg-secondary p-3 text-white flex justify-between items-center px-6">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center"><Handshake className="h-3 w-3 mr-2" /> ШАРТНОМА</span>
                        <Badge variant="outline" className="text-[8px] border-white/30 text-white">{deal.status}</Badge>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <h4 className="font-black text-secondary text-lg leading-tight">{deal.title}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted p-3 rounded-2xl"><p className="text-[8px] font-bold opacity-50 uppercase">НАРХ</p><p className="font-black text-sm">{deal.price} TJS</p></div>
                          <div className="bg-muted p-3 rounded-2xl"><p className="text-[8px] font-bold opacity-50 uppercase">МУҲЛАТ</p><p className="font-black text-sm">{deal.durationDays} рӯз</p></div>
                        </div>
                        {deal.status === 'Pending' && deal.senderId !== user.id && (
                          <div className="pt-2 flex gap-2">
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Accepted')} className="flex-1 bg-green-500 text-white rounded-xl font-bold">Қабул</Button>
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Cancelled')} variant="ghost" className="flex-1 text-destructive font-bold">Рад</Button>
                          </div>
                        )}
                        {deal.status === 'Accepted' && user.id === deal.artisanId && (<Button onClick={() => handleUpdateStatus(deal.id, 'Completed')} className="w-full bg-primary text-white rounded-xl font-bold">Кор иҷро шуд</Button>)}
                        {deal.status === 'Completed' && user.id === deal.clientId && (<Button onClick={() => handleUpdateStatus(deal.id, 'Confirmed')} className="w-full bg-green-500 text-white rounded-xl font-bold">Тасдиқи иҷрои кор</Button>)}
                        {deal.status === 'Confirmed' && (<div className="p-3 bg-green-50 text-green-700 rounded-2xl text-center text-[10px] font-black uppercase flex items-center justify-center tracking-widest"><ShieldCheck className="h-4 w-4 mr-2" /> ШАРТНОМА АНҶОМ ЁФТ</div>)}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.senderId === user.id ? 'bg-primary text-white rounded-br-none' : 'bg-muted text-secondary rounded-bl-none'}`}>
                      <p className="text-sm font-medium">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                        <p className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {msg.senderId === user.id && (<CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-blue-200" : "text-white/70")} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-white rounded-b-3xl border border-t-0 shadow-sm mb-4">
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
            <Input placeholder="Нависед..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="rounded-2xl h-14 font-medium" />
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 rounded-2xl h-14 w-14 shrink-0"><Send className="h-6 w-6 text-white" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
