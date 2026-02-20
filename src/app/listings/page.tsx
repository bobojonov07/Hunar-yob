
"use client"

import { useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, ALL_CATEGORIES } from "@/lib/storage";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ChevronRight, Crown, Zap, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function ListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const q = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(50));
  }, [db]);

  const { data: allListings = [], loading } = useCollection<Listing>(q as any);

  const filteredListings = useMemo(() => {
    let result = allListings;
    
    if (!user) {
      result = result.filter(l => l.isVip);
    }
    
    if (selectedCategory) {
      result = result.filter(l => l.category === selectedCategory);
    }
    
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(queryStr) || 
        l.description.toLowerCase().includes(queryStr) ||
        l.userName.toLowerCase().includes(queryStr)
      );
    }
    
    return result;
  }, [searchQuery, selectedCategory, allListings, user]);

  const handleMoreInfoClick = (listingId: string) => {
    if (!user) {
      toast({ title: "Вуруд лозим аст" });
      router.push("/login");
    } else {
      router.push(`/listing/${listingId}`);
    }
  };

  const vipListings = filteredListings.filter(l => l.isVip);
  const regularListings = user ? filteredListings.filter(l => !l.isVip) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" />
            БОЗГАШТ
          </Button>
          <h1 className="text-4xl font-black text-secondary tracking-tighter">ҲАМАИ ЭЪЛОНҲО</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Ҷустуҷӯи устоҳо..." 
                className="pl-12 h-12 rounded-2xl"
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
              {ALL_CATEGORIES.slice(0, 7).map(cat => (
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

        {loading ? (
          <div className="text-center py-20 opacity-50">Боргузорӣ...</div>
        ) : (
          <>
            {vipListings.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-2xl font-black text-secondary">VIP ЭЪЛОНҲО</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {vipListings.map(listing => (
                    <Card key={listing.id} className="overflow-hidden bg-white rounded-[2.5rem] shadow-xl">
                      <div className="relative h-64 w-full">
                        <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                        <Badge className="absolute top-4 right-4 bg-yellow-500 text-white font-black rounded-full">VIP</Badge>
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
                        <Button onClick={() => handleMoreInfoClick(listing.id)} variant="ghost" className="text-yellow-600 font-black">
                          БИНЕД <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-8">
                <Zap className="h-6 w-6 text-primary fill-primary" />
                <h2 className="text-2xl font-black text-secondary">ОХИРИН ЭЪЛОНҲО</h2>
              </div>
              {regularListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularListings.map(listing => (
                    <Card key={listing.id} className="overflow-hidden bg-white rounded-[2.5rem] shadow-md">
                      <div className="relative h-64 w-full">
                        <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
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
          </>
        )}
      </div>
    </div>
  );
}
import { ChevronLeft } from "lucide-react";
