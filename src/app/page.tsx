
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User } from "@/lib/storage";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setListings(getListings());
    setUser(getCurrentUser());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative w-full py-20 lg:py-32 bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src={PlaceHolderImages[0].imageUrl} 
            alt="Hero Background" 
            fill 
            className="object-cover"
            priority
          />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">
            Беҳтарин устоҳоро дар <span className="text-primary">Ҳунар Ёб</span> пайдо кунед
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            Платформаи боэътимод барои пайваст кардани мизоҷон бо устоҳои моҳири Тоҷикистон.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white text-lg px-8">
              <Link href={user?.role === 'Usto' ? "/profile" : "/register"}>
                {user?.role === 'Usto' ? "Эълон гузоштан" : "Ҳамроҳ шудан"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-secondary">Эълонҳои охирин</h2>
            <p className="text-muted-foreground">Устоҳоеро пайдо кунед, ки ба шумо лозиманд</p>
          </div>
          
          {user?.role === 'Usto' && (
            <Button asChild className="bg-primary">
              <Link href="/create-listing">
                <Plus className="mr-2 h-4 w-4" />
                Эълони нав
              </Link>
            </Button>
          )}
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
                <div className="relative h-56 w-full">
                  <Image
                    src={listing.images[0] || PlaceHolderImages[1].imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-white border-none">
                    {listing.category}
                  </Badge>
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
            <h3 className="text-2xl font-headline font-semibold text-secondary mb-2">Ҳоло эълонҳо нестанд</h3>
            <p className="text-muted-foreground mb-6">Аввалин шуда эълон гузоред ё дертар баргардед.</p>
            {user?.role === 'Usto' && (
              <Button asChild className="bg-primary">
                <Link href="/create-listing">Эълон гузоштан</Link>
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 mt-20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-4">Ҳунар Ёб</h3>
            <p className="opacity-80">
              Беҳтарин платформа барои пайдо кардани ҳунармандон дар тамоми Тоҷикистон.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Бахшҳо</h4>
            <ul className="space-y-2 opacity-80">
              <li><Link href="/" className="hover:text-primary">Асосӣ</Link></li>
              <li><Link href="/listings" className="hover:text-primary">Ҳамаи эълонҳо</Link></li>
              <li><Link href="/about" className="hover:text-primary">Дар бораи мо</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Тамос</h4>
            <p className="opacity-80">Душанбе, к. Рӯдакӣ 10</p>
            <p className="opacity-80">Тел: +992 900 00 00 00</p>
            <p className="opacity-80">Email: info@hunaryob.tj</p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center opacity-60 text-sm">
          &copy; 2024 Ҳунар Ёб. Ҳамаи ҳуқуқҳо ҳифз шудаанд.
        </div>
      </footer>
    </div>
  );
}
