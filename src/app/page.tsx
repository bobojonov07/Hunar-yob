
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, getCurrentUser, User } from "@/lib/storage";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Plus, ShieldCheck, Users, Briefcase, ChevronRight, Zap, Crown, X, Filter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { name: "Барномасоз", icon: "💻" },
  { name: "Дӯзанда", icon: "🧵" },
  { name: "Дуредгар", icon: "🪵" },
  { name: "Сантехник", icon: "🔧" },
  { name: "Барқчӣ", icon: "⚡" },
  { name: "Меъмор", icon: "🏗️" },
  { name: "Дигар", icon: "✨" }
];

const REGIONS = ["Душанбе", "Хатлон", "Суғд", "ВМКБ", "Ноҳияҳои тобеи марказ"];

export default function Home() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
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
    
    // If NOT logged in, only show VIPs
    if (!user) {
      result = result.filter(l => l.isVip);
    }
    
    if (selectedCategory) {
      result = result.filter(l => l.category === selectedCategory);
    }
    
    if (selectedRegion) {
      // Note: region is stored in user profile, but we can filter by it if it was added to listing or assume Dushanbe
      // For simulation, let's assume listings have region or just filter if they are from that region
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
  }, [searchQuery, selectedCategory, selectedRegion, allListings, user]);

  if (!hydrated) return null;

  const vipListings = filteredListings.filter(l => l.isVip);
  const regularListings = user ? filteredListings.filter(l => !l.isVip) : [];

  const heroPlaceholder = PlaceHolderImages[0] || { imageUrl: "https://picsum.photos/seed/artisan1/1200/600", imageHint: "artisan craft" };
  const cardPlaceholder = PlaceHolderImages[1] || { imageUrl: "https://picsum.photos/seed/carpentry/600/400", imageHint: "carpentry tools" };

  const handleMoreInfoClick = (listingId: string) => {
    if (!user) {
      toast({
        title: "Вуруд лозим аст",
        description: "Барои дидани маълумоти пурра лутфан сабти ном кунед ё вориди акаунт шавед",
      });
      router.push("/login");
    } else {
      router.push(`/listing/${listingId}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative w-full py-24 lg:py-40 bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 scale-105">
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
        
        <div className="container relative mx-auto px-4 text-center md:text-left">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-4 py-1 text-sm font-bold">
              #1 Платформаи ҳунармандон дар Тоҷикистон
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-black mb-6 leading-tight">
              Маҳоратро <span className="text-primary italic">пайдо кун.</span> <br />
              Хидматро <span className="text-primary italic">фармоиш деҳ.</span>
            </h1>
            
            <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-4 max-w-4xl">
              <div className="md:col-span-8 relative">
                <Search className="absolute left-4 h-6 w-6 text-muted-foreground top-1/2 -translate-y-1/2" />
                <Input 
                  className="h-16 pl-14 pr-4 bg-white text-secondary rounded-2xl text-lg border-none shadow-2xl focus-visible:ring-primary"
                  placeholder="Ҷустуҷӯи усто..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="md:col-span-4">
                <Select onValueChange={(val) => setSelectedRegion(val === "all" ? null : val)}>
                  <SelectTrigger className="h-16 bg-white text-secondary rounded-2xl text-lg border-none shadow-2xl">
                    <SelectValue placeholder="Минтақа" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ҳамаи минтақаҳо</SelectItem>
                    {REGIONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-headline font-bold text-secondary">Категорияҳо</h2>
            {(selectedCategory || selectedRegion) && (
              <Button variant="ghost" size="sm" onClick={() => {setSelectedCategory(null); setSelectedRegion(null)}} className="text-primary font-bold">
                <X className="h-4 w-4 mr-1" /> Тоза кардан
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.name} 
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
                className={cn(
                  "group flex flex-col items-center p-4 rounded-2xl border transition-all duration-300",
                  selectedCategory === cat.name 
                    ? "bg-primary text-white border-primary shadow-lg scale-105" 
                    : "bg-background hover:bg-primary/5 border-border hover:border-primary/20"
                )}
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-bold truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Section */}
      {vipListings.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-yellow-50/50 to-transparent">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-yellow-600 font-black mb-8">
              <Crown className="h-6 w-6 fill-yellow-600" />
              <span className="tracking-widest uppercase text-lg">VIP ЭЪЛОНҲО</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {vipListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-yellow-400 bg-white rounded-[2rem] ring-2 ring-yellow-400/20">
                  <div className="relative h-64 w-full">
                    <Image
                      src={listing.images[0] || cardPlaceholder.imageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-yellow-500 text-white border-none shadow-lg px-3 py-1 animate-pulse">
                        <Crown className="h-3 w-3 mr-1 fill-white" />
                        VIP
                      </Badge>
                    </div>
                    <Badge className="absolute top-4 left-4 bg-primary/90 text-white border-none px-4 py-1 backdrop-blur-sm">
                      {listing.category}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-headline text-secondary group-hover:text-yellow-600 transition-colors line-clamp-1">
                      {listing.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user && (
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-4">
                        {listing.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {listing.userName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-secondary">{listing.userName}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-yellow-100 flex justify-between items-center bg-yellow-50/30">
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <MapPin className="h-3 w-3 mr-1 text-primary" />
                      Душанбе
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleMoreInfoClick(listing.id)}
                      className="text-yellow-600 font-bold group/btn"
                    >
                      МУФАССАЛ
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content - Regular Listings (ONLY for logged in users) */}
      {user && regularListings.length > 0 && (
        <main className="container mx-auto px-4 py-16 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                <Zap className="h-5 w-5 fill-primary" />
                <span>{selectedCategory ? `ЭЪЛОНҲО ДАР БАХШИ ${selectedCategory.toUpperCase()}` : 'ОХИРИН ЭЪЛОНҲО'}</span>
              </div>
              <h2 className="text-4xl font-headline font-black text-secondary">Устоҳои моҳир инҷоянд</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {regularListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all duration-500 border-border bg-white rounded-[2rem]">
                <div className="relative h-64 w-full">
                  <Image
                    src={listing.images[0] || cardPlaceholder.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-6 left-6 bg-primary/90 text-white border-none px-4 py-1 backdrop-blur-sm">
                    {listing.category}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
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
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      )}

      {/* Message for Guests */}
      {!user && (
        <section className="py-24 container mx-auto px-4">
          <div className="bg-secondary/5 rounded-[3rem] p-12 text-center border-2 border-dashed border-secondary/20">
            <h2 className="text-3xl font-headline font-black text-secondary mb-4">Барои дидани ҳамаи эълонҳо ворид шавед</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Дар Ҳунар Ёб шумо метавонед ҳазорҳо устоҳои моҳирро пайдо кунед. Сабти ном кунед, то маълумоти пурра ва имконияти мукотибаро ба даст оред.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-12 h-14">
                <Link href="/register">Сабти ном</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary/10 rounded-2xl px-12 h-14">
                <Link href="/login">Воридшавӣ</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Why Us Section */}
      <section className="py-24 bg-secondary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/30 rotate-3">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-bold">Амният ва Боварӣ</h4>
              <p className="opacity-70">Ҳамаи устоҳо аз ҷониби мо тасдиқ карда мешаванд.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/30 -rotate-3">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-bold">Зуд ва Осон</h4>
              <p className="opacity-70">Дар чанд дақиқа устои лозимаро ёбед.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/30 rotate-3">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-bold">Ҷомеаи Калон</h4>
              <p className="opacity-70">Ҳазорон корбарон аллакай бо мо ҳамкорӣ доранд.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-8">
                <Briefcase className="h-8 w-8 text-primary" />
                <span className="text-3xl font-black font-headline tracking-tighter text-white">ҲУНАР ЁБ</span>
              </div>
              <p className="text-xl opacity-60 italic max-w-md mx-auto md:mx-0">
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
          </div>
          <div className="pt-10 border-t border-white/10 text-sm opacity-50 font-bold tracking-widest uppercase text-center">
            &copy; 2024 ҲУНАР ЁБ. ҲАМАИ ҲУҚУҚҲО ҲИФЗ ШУДААНД.
          </div>
        </div>
      </footer>
    </div>
  );
}
