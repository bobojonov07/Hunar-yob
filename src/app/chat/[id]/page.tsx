"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User, getMessages, sendMessage, Message, markMessagesAsRead } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Hammer, CheckCheck, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("Online");
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

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
      markMessagesAsRead(found.id, currentUser.id);
    } else {
      router.push("/");
    }

    // Simulate status change
    const statuses = ["Online", "2 дақиқа пеш", "Online", "5 дақиқа пеш"];
    setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
  }, [id, router, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !listing) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      senderId: user.id,
      senderName: user.name,
      text: newMessage,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    sendMessage(message);
    setMessages([...messages, message]);
    setNewMessage("");
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
          <p className="text-[10px] text-muted-foreground hidden sm:block truncate ml-4 max-w-[150px]">{listing.title}</p>
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
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
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
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white rounded-b-2xl border border-t-0 shadow-sm mb-4 md:mb-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              placeholder="Нависед..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-xl"
            />
            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 rounded-xl shrink-0">
              <Send className="h-5 w-5 text-white" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
