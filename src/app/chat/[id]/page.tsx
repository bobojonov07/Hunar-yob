"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User, getMessages, sendMessage, Message, markMessagesAsRead, getDeals, saveDeal, updateDealStatus, Deal } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, Hammer, CheckCheck, MessageSquare, Handshake, Clock, ShieldCheck, DollarSign, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

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

  // Deal Form States
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({ title: "Вуруд лозим аст", description: "Барои истифодаи чат ворид шавед", variant: "destructive" });
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const allListings = getListings();
    const found = allListings.find(l => l.id === id);
    if (found) {
      setListing(found);
      const msgs = getMessages(found.id);
      setMessages(msgs);
      setDeals(getDeals().filter(d => d.listingId === found.id));
      markMessagesAsRead(found.id, currentUser.id);
    } else {
      router.push("/");
    }

    const statuses = ["Online", "2 дақиқа пеш", "Online", "5 дақиқа пеш"];
    setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
  }, [id, router, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    const price = parseFloat(dealPrice);
    const duration = parseInt(dealDuration);

    if (!dealTitle || isNaN(price) || isNaN(duration)) {
      toast({ title: "Хатогӣ", description: "Лутфан ҳамаи майдонҳоро дуруст пур кунед", variant: "destructive" });
      return;
    }

    const deal: Deal = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      clientId: user.role === 'Client' ? user.id : 'unknown', // Simplification
      artisanId: listing.userId,
      title: dealTitle,
      price,
      durationDays: duration,
      status: 'Pending',
      senderId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If client is artisan, adjust IDs
    if (user.id === listing.userId) {
      // This is the artisan sending a deal to a client
      // We need to find the client from the messages
      const firstClientMsg = messages.find(m => m.senderId !== user.id);
      if (firstClientMsg) {
        deal.clientId = firstClientMsg.senderId;
      }
    } else {
      deal.clientId = user.id;
      deal.artisanId = listing.userId;
    }

    saveDeal(deal);
    setDeals([...deals, deal]);
    handleSendMessage(undefined, 'deal', deal.id);
    setIsDealDialogOpen(false);
    setDealTitle("");
    setDealPrice("");
    setDealDuration("");
    toast({ title: "Дархост фиристода шуд" });
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-4 max-w-3xl flex flex-col h-[calc(100vh-80px)]">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-white rounded-t-2xl border border-b-0 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
              <Hammer className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-secondary leading-tight truncate">{listing.userName}</h3>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", status === "Online" ? "bg-green-500" : "bg-muted-foreground")} />
                <p className="text-[10px] text-muted-foreground truncate">{status}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
             <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary text-white rounded-full px-4">
                  <Handshake className="h-4 w-4 mr-2" />
                  Шартнома
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-secondary">Дархости кор</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Номи кор</Label>
                    <Input placeholder="Масалан: Сохтани шкаф" value={dealTitle} onChange={e => setDealTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Нарх (TJS)</Label>
                      <Input type="number" placeholder="500" value={dealPrice} onChange={e => setDealPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Муҳлат (рӯз)</Label>
                      <Input type="number" placeholder="5" value={dealDuration} onChange={e => setDealDuration(e.target.value)} />
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground font-medium">Маблағ дар система то лаҳзаи тасдиқи иҷрои кор нигоҳ дошта мешавад.</p>
                  </div>
                  <Button onClick={handleCreateDeal} className="w-full bg-primary h-12 rounded-xl font-bold">ФИРИСТОДАН</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 bg-white border shadow-sm space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>Паёмҳои худро дар бораи эълон ин ҷо нависед.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const deal = msg.type === 'deal' ? deals.find(d => d.id === msg.dealId) : null;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'deal' && deal ? (
                    <Card className="w-full max-w-sm border-2 border-secondary/20 shadow-lg rounded-3xl overflow-hidden">
                      <div className="bg-secondary p-3 text-white flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest flex items-center">
                          <Handshake className="h-3 w-3 mr-2" /> ШАРТНОМА
                        </span>
                        <Badge variant="outline" className="text-[8px] border-white/30 text-white">{deal.status}</Badge>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <h4 className="font-black text-secondary text-lg leading-tight">{deal.title}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted p-2 rounded-xl flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-bold text-sm">{deal.price} TJS</span>
                          </div>
                          <div className="bg-muted p-2 rounded-xl flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-bold text-sm">{deal.durationDays} рӯз</span>
                          </div>
                        </div>

                        {deal.status === 'Pending' && deal.senderId !== user.id && (
                          <div className="pt-2 flex gap-2">
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Accepted')} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl">Қабул</Button>
                            <Button onClick={() => handleUpdateStatus(deal.id, 'Cancelled')} variant="ghost" className="flex-1 text-destructive">Рад</Button>
                          </div>
                        )}

                        {deal.status === 'Accepted' && user.id === deal.artisanId && (
                          <Button onClick={() => handleUpdateStatus(deal.id, 'Completed')} className="w-full bg-primary text-white rounded-xl">Кор иҷро шуд</Button>
                        )}

                        {deal.status === 'Completed' && user.id === deal.clientId && (
                          <Button onClick={() => handleUpdateStatus(deal.id, 'Confirmed')} className="w-full bg-green-500 text-white rounded-xl">Тасдиқи иҷрои кор</Button>
                        )}

                        {deal.status === 'Confirmed' && (
                          <div className="p-2 bg-green-50 text-green-700 rounded-xl text-center text-xs font-bold flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 mr-2" /> ШАРТНОМА БО МУВАФФАҚИЯТ АНҶОМ ЁФТ
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                      msg.senderId === user.id 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-muted text-secondary rounded-bl-none'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                        <p className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {msg.senderId === user.id && (
                          <CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-blue-200" : "text-white/70")} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white rounded-b-2xl border border-t-0 shadow-sm mb-4 md:mb-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              placeholder="Нависед..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-xl h-12"
            />
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 rounded-xl h-12 w-12 shrink-0">
              <Send className="h-5 w-5 text-white" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}