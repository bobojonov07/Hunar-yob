"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User } from "@/lib/storage";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Plus, ShieldCheck, Users, Briefcase, ChevronRight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Барномасоз", icon: "💻" },
  { name: "Дӯзанда", icon: "🧵" },
  { name: "Дуредгар", icon: "🪵" },
  { name: "Сантехник", icon: "🔧" },
  { name: "Барқчӣ", icon: "⚡" },
  { name: "Меъмор", icon: "🏗️" },
  { name: "Дигар", icon: "✨" }
];

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

  const heroPlaceholder = PlaceHolderImages[0] || { imageUrl: "https://picsum.photos/seed/artisan1/1200/600", imageHint: "artisan craft" };
  const cardPlaceholder = PlaceHolderImages[1] || { imageUrl: "https://picsum.photos/seed/carpentry/600/400", imageHint: "carpentry tools" };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      {/* Hero Section - Bold & Modern */}
      <section className="relative w-full py-24 lg:py-40 bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 scale-105 hover:scale-110 transition-transform duration-[10s]">
          <Image 
            src={heroPlaceholder.imageUrl} 
            alt="Hero Background" 
            fill 
            className="object-cover"
            priority
            data-ai-hint={heroPlaceholder.imageHint}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-transparent" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-4 py-1 text-sm font-bold animate-in fade-in slide-in-from-left-4 duration-500">
              #1 Платформаи ҳунармандон дар Тоҷикистон
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-black mb-6 leading-tight animate-in fade-in slide-in-from-left-6 duration-700">
              Маҳоратро <span className="text-primary italic">пайдо кун.</span> <br />
              Хидматро <span className="text-primary italic">фармоиш деҳ.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 opacity-90 leading-relaxed animate-in fade-in slide-in-from-left-8 duration-1000">
              Ҳунар Ёб — ин пул миёни шумо ва беҳтарин устоҳои кишвар. Боэътимод, зуд ва босифат.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white text-lg px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">
                <Link href={user ? (user.role === 'Usto' ? "/create-listing" : "/profile") : "/register"}>
                  {user?.role === 'Usto' ? "Эълон гузоштан" : "Ҳамроҳ шудан"}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 h-14 px-10 rounded-2xl">
                <Search className="mr-2 h-5 w-5" />
                Ҷустуҷӯ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid - "Derski" Icons */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-headline font-bold text-secondary mb-10 text-center">Категорияҳои маъмул</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
            {CATEGORIES.map((cat) => (
              <button key={cat.name} className="group flex flex-col items-center p-6 rounded-3xl bg-background hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all duration-300">
                <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-300">{cat.icon}</span>
                <span className="text-sm font-bold text-secondary">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Improved Listing Cards */}
      <main className="container mx-auto px-4 py-20 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <Zap className="h-5 w-5 fill-primary" />
              <span>ОХИРИН ЭЪЛОНҲО</span>
            </div>
            <h2 className="text-4xl font-headline font-black text-secondary">Устоҳои моҳир инҷоянд</h2>
            <p className="text-muted-foreground mt-2">Мутахассисони тасдиқшуда, ки омодаанд ба шумо кумак кунанд.</p>
          </div>
          
          {user?.role === 'Usto' && (
            <Button asChild className="bg-primary rounded-xl h-12 px-6">
              <Link href="/create-listing">
                <Plus className="mr-2 h-4 w-4" />
                ЭЪЛОНИ НАВ
              </Link>
            </Button>
          )}
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-border bg-white rounded-[2rem]">
                <div className="relative h-64 w-full">
                  <Image
                    src={listing.images[0] || cardPlaceholder.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    data-ai-hint={listing.images[0] ? undefined : cardPlaceholder.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-6 left-6 bg-primary/90 text-white border-none px-4 py-1 backdrop-blur-sm shadow-lg">
                    {listing.category}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      <Star className="h-3 w-3 fill-primary mr-1" />
                      5.0 (12)
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {new Date(listing.createdAt).toLocaleDateString('tg-TJ')}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-headline text-secondary group-hover:text-primary transition-colors line-clamp-1">
                    {listing.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-4">
                    {listing.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white text-[10px] font-bold">
                      {listing.userName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-secondary">{listing.userName}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 flex justify-between items-center bg-muted/5">
                  <div className="flex items-center text-xs text-muted-foreground font-medium">
                    <MapPin className="h-3 w-3 mr-1 text-primary" />
                    Душанбе
                  </div>
                  <Button variant="ghost" asChild className="text-primary font-bold group/btn">
                    <Link href={`/listing/${listing.id}`} className="flex items-center">
                      МУФАССАЛ
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Briefcase className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-3xl font-headline font-bold text-secondary mb-2">Ҳоло эълонҳо нестанд</h3>
            <p className="text-muted-foreground mb-8 max-w-md">Аввалин шуда эълон гузоред ва мизоҷонро пайдо кунед.</p>
            {user?.role === 'Usto' && (
              <Button asChild className="bg-primary px-10 h-12 rounded-xl">
                <Link href="/create-listing">Эълон гузоштан</Link>
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Why Us Section - Bold Design */}
      <section className="py-24 bg-secondary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/30 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-bold">Амният ва Боварӣ</h4>
              <p className="opacity-70 leading-relaxed">Ҳамаи устоҳо аз ҷониби мо тасдиқ карда мешаванд, то шумо хидмати беҳтарин гиред.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/30 -rotate-3 group hover:rotate-0 transition-transform duration-500">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-bold">Зуд ва Осон</h4>
              <p className="opacity-70 leading-relaxed">Дар чанд дақиқа устои лозимаро ёбед ва мустақиман бо ӯ тамос гиред.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/30 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-bold">Ҷомеаи Калон</h4>
              <p className="opacity-70 leading-relaxed">Ҳазорон корбарон ва садҳо устоҳои касбӣ аллакай бо мо ҳамкорӣ доранд.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Derski Stats */}
      <section className="py-20 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-around gap-10">
            <div className="text-center">
              <div className="text-5xl font-black text-secondary mb-2">1500+</div>
              <div className="text-primary font-bold tracking-widest uppercase text-xs">УСТОҲО</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-secondary mb-2">5000+</div>
              <div className="text-primary font-bold tracking-widest uppercase text-xs">МИЗОҶОН</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-secondary mb-2">12000+</div>
              <div className="text-primary font-bold tracking-widest uppercase text-xs">КОРҲОИ ТАЙЁР</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Solid & Professional */}
      <footer className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-8">
                <Briefcase className="h-8 w-8 text-primary" />
                <span className="text-3xl font-black font-headline tracking-tighter text-white">ҲУНАР ЁБ</span>
              </div>
              <p className="text-xl opacity-60 leading-relaxed max-w-md italic">
                "Мо боварӣ дорем, ки ҳар як маҳорат бояд дида шавад ва ҳар як мушкилӣ бояд устои худро ёбад."
              </p>
            </div>
            <div>
              <h5 className="text-lg font-bold mb-8 text-primary uppercase tracking-widest">Бахшҳо</h5>
              <ul className="space-y-4 font-medium opacity-80">
                <li><Link href="/" className="hover:text-primary transition-colors">Асосӣ</Link></li>
                <li><Link href="/messages" className="hover:text-primary transition-colors">Паёмҳо</Link></li>
                <li><Link href="/favorites" className="hover:text-primary transition-colors">Писандидаҳо</Link></li>
                <li><Link href="/profile" className="hover:text-primary transition-colors">Профил</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-bold mb-8 text-primary uppercase tracking-widest">Тамос</h5>
              <div className="space-y-4 opacity-80">
                <p>Душанбе, к. Рӯдакӣ 10</p>
                <p>+992 900 00 00 00</p>
                <p>info@hunaryob.tj</p>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm opacity-50 font-bold tracking-widest uppercase">
            <span>&copy; 2024 ҲУНАР ЁБ. ҲАМАИ ҲУҚУҚҲО ҲИФЗ ШУДААНД.</span>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
              <Link href="#" className="hover:text-white transition-colors">Telegram</Link>
              <Link href="#" className="hover:text-white transition-colors">Facebook</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}