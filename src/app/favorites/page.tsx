
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User } from "@/lib/storage";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Heart, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Favorites() {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    
    const allListings = getListings();
    const favIds = currentUser.favorites || [];
    const filtered = allListings.filter(l => favIds.includes(l.id));
    setFavorites(filtered);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-10 flex flex-col gap-6">
          <Button variant="ghost" onClick={() => router.back()} className="w-fit hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" />
            БОЗГАШТ
          </Button>
          <div>
            <h2 className="text-4xl font-headline font-black text-secondary tracking-tighter">Эълонҳои писандида</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-60">Эълонҳое, ки ба шумо маъқул шуданд</p>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {favorites.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-3xl transition-all duration-700 border-none bg-white rounded-[3rem] shadow-xl">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <Badge className="absolute top-6 left-6 bg-primary text-white border-none px-5 py-2 font-black rounded-2xl shadow-xl">
                    {listing.category}
                  </Badge>
                  <div className="absolute top-6 right-6 bg-white/95 p-3 rounded-2xl shadow-xl backdrop-blur-md">
                    <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                  </div>
                </div>
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-headline font-black text-secondary group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                    {listing.title}
                  </CardTitle>
                  <div className="flex items-center text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />
                    <span className="font-black text-secondary mr-3">5.0</span>
                    <span className="opacity-30 mr-3">|</span>
                    <span className="font-black text-primary">{listing.userName}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-10">
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed font-medium italic">
                    &ldquo;{listing.description}&rdquo;
                  </p>
                </CardContent>
                <CardFooter className="p-10 pt-6 flex justify-between items-center bg-muted/10 border-t mt-4">
                  <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em]">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    Душанбе
                  </div>
                  <Button variant="ghost" asChild className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 rounded-xl px-6 h-10">
                    <Link href={`/listing/${listing.id}`}>Муфассал</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-muted/50 shadow-inner group">
            <Heart className="h-20 w-20 mx-auto text-muted mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-2xl font-headline font-black text-secondary mb-4 opacity-40 uppercase tracking-widest">Рӯйхат холӣ аст</h3>
            <Button asChild className="bg-primary h-14 px-10 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
              <Link href="/">ҶУСТУҶӮИ УСТОҲО</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

