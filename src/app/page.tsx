
"use client"

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
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
  Briefcase, 
  ChevronRight, 
  Zap, 
  Crown, 
  X, 
  Instagram, 
  MessageCircle, 
  Send as TelegramIcon,
  ExternalLink,
  ArrowRight,
  Info,
  Sparkles,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { findArtisan } from "@/ai/flows/find-artisan-flow";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const listingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);

  const { data: allListings = [] } = useCollection(listingsQuery);

  const filteredListings = useMemo(() => {
    let result = allListings;
    
    if (!user) {
      result = result.filter(l => l.isVip);
    }
    
    if (selectedCategory) {
      result = result.filter(l => l.category === selectedCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [allListings, user, selectedCategory, searchQuery]);

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

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setAiLoading(true);
    try {
      const response = await findArtisan({ query: searchQuery });
      setAiResponse(response);
      if (response.suggestedCategory) {
        setSelectedCategory(response.suggestedCategory);
      }
    } catch (error) {
      toast({ title: "AI Хатогӣ", description: "Ёвар муваққатан кор намекунад", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative w-full py-32 lg:py-56 bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 scale-110 blur-[3px] motion-safe:animate-[pulse_10s_infinite]">
          <Image 
            src={heroPlaceholder.imageUrl} 
            alt="Hero Background" 
            fill 
            className="object-cover"
            priority
            data-ai-hint={heroPlaceholder.imageHint}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-10 bg-primary/20 text-primary border-primary/30 backdrop-blur-2xl px-8 py-2.5 text-xs font-black tracking-[0.3em] uppercase rounded-full">
              Платформаи рақами яки устоҳо дар Тоҷикистон
            </Badge>
            <h1 className="text-6xl md:text-9xl font-headline font-black mb-10 leading-[0.95] tracking-tighter drop-shadow-sm">
              МАҲОРАТРО <span className="text-primary">ЁБ.</span> <br />
              <span className="italic opacity-90">ҲАЛ КУН.</span>
            </h1>
            
            <div className="mt-12 bg-white/5 backdrop-blur-3xl p-3 rounded-[3rem] border border-white/10 shadow-3xl max-w-4xl mx-auto transition-all hover:scale-[1.01]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8 relative">
                  <Search className="absolute left-6 h-6 w-6 text-muted-foreground top-1/2 -translate-y-1/2" />
                  <Input 
                    className="h-16 pl-16 pr-24 bg-white text-secondary rounded-[2.5rem] text-xl border-none focus-visible:ring-primary shadow-2xl font-bold placeholder:font-medium"
                    placeholder="Масалан: Сохтани шкаф..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button 
                    onClick={handleAiSearch}
                    disabled={aiLoading}
                    className="absolute right-2 top-2 h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-xs gap-2"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI ҲАЛ КУНАД
                  </Button>
                </div>
                <div className="md:col-span-4">
                  <Select onValueChange={(val) => setSelectedRegion(val === "all" ? null : val)}>
                    <SelectTrigger className="h-16 bg-white text-secondary rounded-[2.5rem] text-xl border-none shadow-2xl font-bold">
                      <SelectValue placeholder="Минтақаҳо" />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-none shadow-3xl">
                      <SelectItem value="all" className="font-bold">Ҳамаи минтақаҳо</SelectItem>
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {aiResponse && (
              <div className="mt-8 p-8 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 text-left animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Sparkles className="h-6 w-6" />
                  <span className="font-black uppercase tracking-widest text-xs">HUNAR-BOT ТАВСИЯ МЕДИҲАД:</span>
                </div>
                <p className="text-xl font-bold mb-4">{aiResponse.recommendation}</p>
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <p className="text-xs font-medium italic opacity-80">{aiResponse.advice}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAiResponse(null)} className="mt-4 text-white/50 hover:text-white font-bold h-8">ТОЗА КАРДАН</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Koryob Partner Section */}
      <section className="bg-primary py-8 overflow-hidden relative group">
        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-white fill-white/20" />
            <p className="text-white font-black text-2xl tracking-tight">
              МЕХОҲЕД ЭЪЛОНИ КОР КУНЕД?
            </p>
          </div>
          <Button asChild variant="outline" className="bg-white text-primary border-none hover:bg-secondary hover:text-white rounded-full font-black px-12 h-14 text-lg shadow-xl transition-all active:scale-95">
            <a href="https://koryob.ru" target="_blank" rel="noopener noreferrer">
              БА KORYOB.RU РАВЕД
              <ExternalLink className="ml-3 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Category Section */}
      <section className="py-28 bg-white relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-5xl font-headline font-black text-secondary tracking-tighter">КАТЕГОРИЯҲО</h2>
              <p className="text-muted-foreground font-bold mt-2 uppercase tracking-widest text-xs">Маҳорати лозимаро интихоб кунед</p>
            </div>
            {(selectedCategory || selectedRegion) && (
              <Button variant="ghost" size="lg" onClick={() => {setSelectedCategory(null); setSelectedRegion(null); setAiResponse(null)}} className="text-primary font-black hover:bg-primary/5 rounded-2xl">
                <X className="h-6 w-6 mr-2" /> ТОЗА КАРДАН
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-8">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.name} 
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
                className={cn(
                  "group flex flex-col items-center p-10 rounded-[3rem] border-2 transition-all duration-500 hover:shadow-2xl",
                  selectedCategory === cat.name 
                    ? "bg-primary text-white border-primary shadow-2xl scale-110" 
                    : "bg-background/30 hover:bg-white border-transparent hover:border-primary/20"
                )}
              >
                <span className="text-6xl mb-6 group-hover:scale-125 transition-transform duration-500 block">{cat.icon}</span>
                <span className="text-xs font-black tracking-[0.1em] uppercase">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Showcase */}
      {vipListings.length > 0 && (
        <section className="py-32 bg-[#F9F9F4] border-y">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/30 transform -rotate-6">
                  <Crown className="h-9 w-9 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-5xl font-headline font-black text-secondary tracking-tighter">VIP УСТОҲО</h2>
                  <p className="text-yellow-600 font-black text-xs uppercase tracking-widest">Беҳтарин пешниҳодҳои ҷорӣ</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {vipListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-700 border-yellow-400/30 bg-white rounded-[3.5rem] ring-8 ring-yellow-400/5">
                  <div className="relative h-80 w-full overflow-hidden">
                    <Image
                      src={listing.images[0] || cardPlaceholder.imageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-8 right-8 z-10">
                      <Badge className="bg-yellow-500 text-white border-none shadow-2xl px-6 py-2.5 text-[10px] font-black rounded-full animate-bounce">
                        VIP PREMIUM
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                      <Badge className="bg-white/95 text-secondary border-none px-5 py-2 font-black rounded-2xl w-fit">
                        {listing.category}
                      </Badge>
                      <h3 className="text-2xl font-black text-white line-clamp-1">{listing.title}</h3>
                    </div>
                  </div>
                  <CardContent className="p-10">
                    {user && (
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-8 font-medium italic">
                        &ldquo;{listing.description}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xl font-black shadow-xl">
                        {listing.userName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-lg font-black text-secondary block leading-none">{listing.userName}</span>
                        <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-[0.2em] mt-2 block">Профили Тасдиқшуда</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 border-t border-yellow-100 flex justify-between items-center bg-yellow-50/30">
                    <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Душанбе
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleMoreInfoClick(listing.id)}
                      className="text-yellow-600 font-black group/btn hover:bg-yellow-100 rounded-2xl px-8 h-12"
                    >
                      БИНЕД
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Listings */}
      {user && regularListings.length > 0 && (
        <main className="container mx-auto px-4 py-32 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-primary font-black tracking-[0.4em] uppercase text-xs mb-6">
                <Zap className="h-7 w-7 fill-primary" />
                <span>Охирин Пешниҳодҳо</span>
              </div>
              <h2 className="text-6xl font-headline font-black text-secondary tracking-tighter leading-tight">Ҳамаи устоҳои моҳири кишвар дар инҷо ҷамъ омадаанд</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
            {regularListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-3xl transition-all duration-700 border-none bg-white rounded-[4rem] shadow-xl">
                <div className="relative h-80 w-full overflow-hidden">
                  <Image
                    src={listing.images[0] || cardPlaceholder.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <Badge className="absolute top-8 left-8 bg-primary/95 text-white border-none px-6 py-2.5 font-black rounded-2xl backdrop-blur-xl">
                    {listing.category}
                  </Badge>
                </div>
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-3xl font-headline font-black text-secondary group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                    {listing.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed mb-10 font-medium">
                    {listing.description}
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-white text-base font-black">
                      {listing.userName.charAt(0)}
                    </div>
                    <span className="text-lg font-black text-secondary">{listing.userName}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-10 border-t border-border/40 flex justify-between items-center bg-muted/10">
                  <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    Душанбе
                  </div>
                  <Button variant="ghost" asChild className="text-primary font-black group/btn hover:bg-primary/10 rounded-2xl px-10 h-14">
                    <Link href={`/listing/${listing.id}`} className="flex items-center">
                      MUFASSAL
                      <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform duration-500" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      )}

      {/* Social Contact Section */}
      <section className="py-32 bg-secondary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-headline font-black mb-6 tracking-tighter">БО МО ДАР ТАМОС БОШЕД</h2>
          <p className="text-xl opacity-60 mb-16 max-w-2xl mx-auto font-medium">Савол ё пешниҳод доред? Дар шабакаҳои иҷтимоӣ ба мо нависед</p>
          <div className="flex flex-wrap justify-center gap-8">
            <Button asChild variant="outline" className="h-20 px-12 rounded-[2rem] border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500 hover:text-white font-black text-xl transition-all hover:scale-105 active:scale-95">
              <a href="https://wa.me/992200702032" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-4 h-8 w-8" />
                WHATSAPP
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 px-12 rounded-[2rem] border-2 border-blue-400 bg-transparent text-blue-400 hover:bg-blue-400 hover:text-white font-black text-xl transition-all hover:scale-105 active:scale-95">
              <a href="https://t.me/+992200702032" target="_blank" rel="noopener noreferrer">
                <TelegramIcon className="mr-4 h-8 w-8" />
                TELEGRAM
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 px-12 rounded-[2rem] border-2 border-pink-500 bg-transparent text-pink-500 hover:bg-pink-500 hover:text-white font-black text-xl transition-all hover:scale-105 active:scale-95">
              <a href="https://instagram.com/taj.web" target="_blank" rel="noopener noreferrer">
                <Instagram className="mr-4 h-8 w-8" />
                INSTAGRAM
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-32 pb-20 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-10">
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <span className="text-5xl font-black font-headline tracking-tighter text-secondary">ҲУНАР ЁБ</span>
              </div>
              <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed mb-8">
                Мо боварӣ дорем, ки ҳар як маҳорат бояд дида шавад ва ҳар як мушкилӣ бояд устои худро ёбад. Ин платформа барои рушди ҳунармандӣ дар Тоҷикистон сохта шудааст.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-black mb-10 text-primary uppercase tracking-[0.4em]">Меню</h5>
              <ul className="space-y-6 font-black text-lg text-secondary">
                <li><Link href="/" className="hover:text-primary transition-colors">Асосӣ</Link></li>
                <li><Link href="/messages" className="hover:text-primary transition-colors">Паёмҳо</Link></li>
                <li><Link href="/favorites" className="hover:text-primary transition-colors">Писандидаҳо</Link></li>
                <li><Link href="/profile" className="hover:text-primary transition-colors">Профил</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-black mb-10 text-primary uppercase tracking-[0.4em]">Шарикон</h5>
              <ul className="space-y-6 font-black text-lg text-secondary">
                <li><a href="https://koryob.ru" target="_blank" className="hover:text-primary transition-colors flex items-center">
                  KORYOB.RU <ExternalLink className="ml-2 h-4 w-4" />
                </a></li>
                <li><a href="https://instagram.com/taj.web" target="_blank" className="hover:text-primary transition-colors">TAJ.WEB</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t text-[10px] text-muted-foreground font-black tracking-[0.6em] uppercase text-center opacity-50">
            &copy; 2024 ҲУНАР ЁБ. ТАҲИЯ ШУДААСТ ТАВАССУТИ TAJ.WEB
          </div>
        </div>
      </footer>
    </div>
  );
}
