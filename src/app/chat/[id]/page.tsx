"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User, getMessages, sendMessage, Message } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Hammer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
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
      setMessages(getMessages(found.id));
    } else {
      router.push("/");
    }
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
      createdAt: new Date().toISOString()
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
              <Hammer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-secondary leading-tight">{listing.userName}</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{listing.title}</p>
            </div>
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
                  <p className="text-[10px] mt-1 opacity-70 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white rounded-b-2xl border border-t-0 shadow-sm">
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

import { MessageSquare } from "lucide-react";
