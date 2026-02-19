"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User } from "@/lib/storage";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Heart } from "lucide-react";
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
        <div className="mb-10">
          <h2 className="text-3xl font-headline font-bold text-secondary">Эълонҳои писандида</h2>
          <p className="text-muted-foreground">Эълонҳое, ки ба шумо маъқул шуданд</p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
                <div className="relative h-56 w-full">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-white border-none">
                    {listing.category}
                  </Badge>
                  <div className="absolute top-4 right-4 bg-white/80 p-2 rounded-full">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-headline text-secondary group-hover:text-primary transition-colors">
                    {listing.title}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-medium mr-2">5.0</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium">{listing.userName}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {listing.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    Душанбе, Тоҷикистон
                  </div>
                  <Button variant="link" asChild className="text-primary p-0">
                    <Link href={`/listing/${listing.id}`}>Муфассал</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
            <h3 className="text-2xl font-headline font-semibold text-secondary mb-2">Рӯйхат холӣ аст</h3>
            <p className="text-muted-foreground mb-6">Шумо ҳоло ягон эълонро ба писандидаҳо илова накардаед.</p>
            <Button asChild className="bg-primary">
              <Link href="/">Ҷустуҷӯи устоҳо</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
