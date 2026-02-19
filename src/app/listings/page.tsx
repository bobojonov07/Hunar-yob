
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User } from "@/lib/storage";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ChevronRight, Crown, Zap, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", "Дигар"];

export default function ListingsPage() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const data = getListings();
    setAllListings(data);
    setFilteredListings(data);
    setUser(getCurrentUser());
    setHydrated(true);
  }, []);

  useEffect(() => {
    let result = allListings;
    
    // Guest users only see VIPs on main, but here we show what's allowed
    if (!user) {
      result = result.filter(l => l.isVip);
    }
    
    if (selectedCategory) {
      result = result.filter(l => l.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(query) || 
        l.description.toLowerCase().includes(query) ||
        l.userName.toLowerCase().includes(query)
      );
    }
    
    setFilteredListings(result);
  }, [searchQuery, selectedCategory, allListings, user]);

  const handleMoreInfoClick = (listingId: string) => {
    if (!user) {
      toast({
        title: "Вуруд лозим аст",
        description: "Барои дидани маълумоти пурра лутфан вориди акаунт шавед",
      });
      router.push("/login");
    } else {
      router.push(`/listing/${listingId}`);
    }
  };

  if (!hydrated) return null;

  const vipListings = filteredListings.filter(l => l.isVip);
  const regularListings = user ? filteredListings.filter(l => !l.isVip) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 space-y-6">
          <h1 className="text-4xl font-black font-headline text-secondary tracking-tighter">ҲАМАИ ЭЪЛОНҲО</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Ҷустуҷӯи устоҳо..." 
                className="pl-12 h-12 rounded-2xl border-border shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <Button 
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="rounded-full px-6 whitespace-nowrap"
              >
                Ҳама
              </Button>
              {CATEGORIES.map(cat => (
                <Button 
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full px-6 whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* VIP Section */}
        {vipListings.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-black text-secondary">VIP ЭЪЛОНҲО</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {vipListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden border-yellow-400/50 bg-white rounded-[2.5rem] shadow-xl ring-4 ring-yellow-400/5">
                  <div className="relative h-64 w-full">
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                    <Badge className="absolute top-4 right-4 bg-yellow-500 text-white border-none px-4 py-1 font-black rounded-full">VIP</Badge>
                  </div>
                  <CardContent className="p-6">
                    <Badge className="mb-3 bg-primary/10 text-primary border-none">{listing.category}</Badge>
                    <h3 className="text-xl font-black text-secondary line-clamp-1 mb-2">{listing.title}</h3>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="h-10 w-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white font-black">{listing.userName.charAt(0)}</div>
                      <span className="font-bold text-secondary">{listing.userName}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 border-t flex justify-between items-center bg-yellow-50/30">
                    <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <MapPin className="h-3 w-3 mr-1 text-primary" /> Душанбе
                    </div>
                    <Button onClick={() => handleMoreInfoClick(listing.id)} variant="ghost" className="text-yellow-600 font-black">
                      БИНЕД <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Section */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Zap className="h-6 w-6 text-primary fill-primary" />
            <h2 className="text-2xl font-black text-secondary">ОХИРИН ЭЪЛОНҲО</h2>
          </div>
          {regularListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden border-none bg-white rounded-[2.5rem] shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative h-64 w-full">
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                    <Badge className="absolute top-4 left-4 bg-white/90 text-secondary border-none px-4 py-1 font-black rounded-full backdrop-blur-sm">
                      {listing.category}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-black text-secondary line-clamp-1 mb-2">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{listing.description}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-white font-black">{listing.userName.charAt(0)}</div>
                      <span className="font-bold text-secondary">{listing.userName}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 border-t flex justify-between items-center bg-muted/10">
                    <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <MapPin className="h-3 w-3 mr-1 text-primary" /> Душанбе
                    </div>
                    <Button asChild variant="ghost" className="text-primary font-black">
                      <Link href={`/listing/${listing.id}`}>МУФАССАЛ <ChevronRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
              <p className="text-muted-foreground font-bold">Эълоне ёфт нашуд.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
