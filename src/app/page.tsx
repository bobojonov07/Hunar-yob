
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
import { 
  Search, 
  MapPin, 
  Plus, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  ChevronRight, 
  Zap, 
  Crown, 
  X, 
  Instagram, 
  MessageCircle, 
  Send as TelegramIcon,
  ExternalLink,
  ArrowRight
} from "lucide-react";
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
      // Logic for region filtering if needed
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
      <section className="relative w-full py-28 lg:py-48 bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 scale-110 blur-[2px]">
          <Image 
            src={heroPlaceholder.imageUrl} 
            alt="Hero Background" 
            fill 
            className="object-cover"
            priority
            data-ai-hint={heroPlaceholder.imageHint}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-8 bg-primary/20 text-primary border-primary/30 backdrop-blur-xl px-6 py-2 text-sm font-black tracking-widest uppercase">
              #1 Платформаи устоҳо дар Тоҷикистон
            </Badge>
            <h1 className="text-6xl md:text-8xl font-headline font-black mb-8 leading-[1.1] tracking-tighter">
              Маҳоратро <span className="text-primary drop-shadow-[0_0_15px_rgba(255,127,80,0.5)]">ёб.</span> <br />
              Мушкилро <span className="text-primary italic">ҳал кун.</span>
            </h1>
            
            <div className="mt-12 bg-white/10 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-8 relative">
                  <Search className="absolute left-5 h-6 w-6 text-muted-foreground top-1/2 -translate-y-1/2" />
                  <Input 
                    className="h-16 pl-14 pr-4 bg-white text-secondary rounded-[2rem] text-lg border-none focus-visible:ring-primary shadow-inner"
                    placeholder="Масалан: Сантехник, Дуредгар..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="md:col-span-4">
                  <Select onValueChange={(val) => setSelectedRegion(val === "all" ? null : val)}>
                    <SelectTrigger className="h-16 bg-white text-secondary rounded-[2rem] text-lg border-none shadow-inner">
                      <SelectValue placeholder="Ҳамаи минтақаҳо" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
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
        </div>
      </section>

      {/* Partner Link Section */}
      <section className="bg-primary/10 py-6 border-y border-primary/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className="text-secondary font-bold text-lg">
            💼 Мехоҳед эълони кор кунед?
          </p>
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full font-black px-8">
            <a href="https://koryob.ru" target="_blank" rel="noopener noreferrer">
              БА KORYOB.RU РАВЕД
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-headline font-black text-secondary">Категорияҳо</h2>
              <p className="text-muted-foreground font-medium mt-2">Аз рӯи маҳорат ҷустуҷӯ кунед</p>
            </div>
            {(selectedCategory || selectedRegion) && (
              <Button variant="ghost" size="sm" onClick={() => {setSelectedCategory(null); setSelectedRegion(null)}} className="text-primary font-black hover:bg-primary/10">
                <X className="h-5 w-5 mr-1" /> ТОЗА КАРДАН
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.name} 
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
                className={cn(
                  "group flex flex-col items-center p-8 rounded-[2.5rem] border-2 transition-all duration-500",
                  selectedCategory === cat.name 
                    ? "bg-primary text-white border-primary shadow-2xl scale-105" 
                    : "bg-background hover:bg-primary/5 border-transparent hover:border-primary/20"
                )}
              >
                <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500 block">{cat.icon}</span>
                <span className="text-sm font-black tracking-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Section */}
      {vipListings.length > 0 && (
        <section className="py-24 bg-[#FDFCF0]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Crown className="h-7 w-7 text-white fill-white" />
                </div>
                <h2 className="text-4xl font-headline font-black text-secondary tracking-tighter">VIP УСТОҲО</h2>
              </div>
              <p className="text-yellow-600 font-black text-sm tracking-widest hidden md:block">ЭЪЛОНҲОИ БЕҲТАРИН</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {vipListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden group hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.3)] transition-all duration-700 border-yellow-400/50 bg-white rounded-[3rem] ring-4 ring-yellow-400/5">
                  <div className="relative h-72 w-full overflow-hidden">
                    <Image
                      src={listing.images[0] || cardPlaceholder.imageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-6 right-6 z-10">
                      <Badge className="bg-yellow-500 text-white border-none shadow-xl px-4 py-2 text-xs font-black rounded-full animate-bounce">
                        VIP PREMIUM
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute bottom-6 left-6 bg-white/90 text-secondary border-none px-4 py-1.5 font-black rounded-xl backdrop-blur-md">
                      {listing.category}
                    </Badge>
                  </div>
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl font-headline font-black text-secondary group-hover:text-yellow-600 transition-colors line-clamp-1">
                      {listing.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-8">
                    {user && (
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-6 font-medium">
                        {listing.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-yellow-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-yellow-500/20">
                        {listing.userName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-black text-secondary block">{listing.userName}</span>
                        <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">Устои Тасдиқшуда</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t border-yellow-100 flex justify-between items-center bg-yellow-50/50">
                    <div className="flex items-center text-xs text-muted-foreground font-black uppercase tracking-widest">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Душанбе
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleMoreInfoClick(listing.id)}
                      className="text-yellow-600 font-black group/btn hover:bg-yellow-100 rounded-2xl px-6"
                    >
                      БИНЕД
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content - Regular Listings */}
      {user && regularListings.length > 0 && (
        <main className="container mx-auto px-4 py-24 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 text-primary font-black tracking-widest uppercase text-sm mb-4">
                <Zap className="h-6 w-6 fill-primary" />
                <span>Охирин Эълонҳо</span>
              </div>
              <h2 className="text-5xl font-headline font-black text-secondary tracking-tighter">Устоҳои моҳири ҷавон ва бозаковат инҷоянд</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {regularListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-700 border-border bg-white rounded-[3rem]">
                <div className="relative h-72 w-full overflow-hidden">
                  <Image
                    src={listing.images[0] || cardPlaceholder.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <Badge className="absolute top-6 left-6 bg-primary/90 text-white border-none px-5 py-2 font-black rounded-xl backdrop-blur-md">
                    {listing.category}
                  </Badge>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-2xl font-headline font-black text-secondary group-hover:text-primary transition-colors line-clamp-1">
                    {listing.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-6 font-medium">
                    {listing.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center text-white text-xs font-black">
                      {listing.userName.charAt(0)}
                    </div>
                    <span className="text-sm font-black text-secondary">{listing.userName}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 border-t border-border/50 flex justify-between items-center bg-muted/5">
                  <div className="flex items-center text-xs text-muted-foreground font-black uppercase tracking-widest">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    Душанбе
                  </div>
                  <Button variant="ghost" asChild className="text-primary font-black group/btn hover:bg-primary/10 rounded-2xl px-6">
                    <Link href={`/listing/${listing.id}`} className="flex items-center">
                      МУФАССАЛ
                      <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      )}

      {/* Guest Message */}
      {!user && (
        <section className="py-32 container mx-auto px-4">
          <div className="bg-secondary/5 rounded-[4rem] p-16 text-center border-4 border-dashed border-secondary/10 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-secondary/5 rounded-full blur-3xl" />
            
            <h2 className="text-5xl font-headline font-black text-secondary mb-6 tracking-tighter">Мехоҳед ҳамаи устоҳоро бинед?</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed">Дар Ҳунар Ёб ҳазорон устоҳои моҳир интизори шумоянд. Сабти ном кунед, то маълумоти пурра ва имконияти мукотибаро ба даст оред.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] px-16 h-16 text-lg font-black shadow-xl shadow-primary/20">
                <Link href="/register">САБТИ НОМ</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary/10 rounded-[1.5rem] px-16 h-16 text-lg font-black border-2">
                <Link href="/login">ВОРИДШАВӢ</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Social & Contact Section */}
      <section className="py-24 bg-white border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-headline font-black text-secondary mb-4 tracking-tighter">БО МО ДАР ТАМОС БОШЕД</h2>
          <p className="text-muted-foreground mb-12 font-medium">Саволҳои худро дар шабакаҳои иҷтимоӣ пурсед</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white font-black">
              <a href="https://wa.me/992200702032" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-3 h-6 w-6" />
                WHATSAPP
              </a>
            </Button>
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-blue-400 text-blue-500 hover:bg-blue-400 hover:text-white font-black">
              <a href="https://t.me/+992200702032" target="_blank" rel="noopener noreferrer">
                <TelegramIcon className="mr-3 h-6 w-6" />
                TELEGRAM
              </a>
            </Button>
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-pink-500 text-pink-600 hover:bg-pink-500 hover:text-white font-black">
              <a href="https://instagram.com/taj.web" target="_blank" rel="noopener noreferrer">
                <Instagram className="mr-3 h-6 w-6" />
                INSTAGRAM
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32 text-center md:text-left">
            <div className="md:col-span-2">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-10">
                <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <span className="text-4xl font-black font-headline tracking-tighter text-white">ҲУНАР ЁБ</span>
              </div>
              <p className="text-2xl opacity-60 italic max-w-xl leading-relaxed">
                "Мо боварӣ дорем, ки ҳар як маҳорат бояд дида шавад ва ҳар як мушкилӣ бояд устои худро ёбад."
              </p>
            </div>
            <div>
              <h5 className="text-sm font-black mb-10 text-primary uppercase tracking-[0.3em]">Меню</h5>
              <ul className="space-y-6 font-black text-lg opacity-80">
                <li><Link href="/" className="hover:text-primary transition-colors">Асосӣ</Link></li>
                <li><Link href="/messages" className="hover:text-primary transition-colors">Паёмҳо</Link></li>
                <li><Link href="/favorites" className="hover:text-primary transition-colors">Писандидаҳо</Link></li>
                <li><Link href="/profile" className="hover:text-primary transition-colors">Профил</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-black mb-10 text-primary uppercase tracking-[0.3em]">Шарикон</h5>
              <ul className="space-y-6 font-black text-lg opacity-80">
                <li><a href="https://koryob.ru" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start">
                  KORYOB.RU <ExternalLink className="ml-2 h-4 w-4" />
                </a></li>
                <li><a href="https://instagram.com/taj.web" className="hover:text-primary transition-colors">TAJ.WEB</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 text-xs opacity-40 font-black tracking-[0.5em] uppercase text-center">
            &copy; 2024 ҲУНАР ЁБ. ТАҲИЯ ШУДААСТ ТАВАССУТИ TAJ.WEB
          </div>
        </div>
      </footer>
    </div>
  );
}
