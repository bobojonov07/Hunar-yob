
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
import { useCollection, useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

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
                    className="h-16 pl-16 pr-6 bg-white text-secondary rounded-[2.5rem] text-xl border-none focus-visible:ring-primary shadow-2xl font-bold placeholder:font-medium"
                    placeholder="Ҷустуҷӯи устоҳо..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
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
          </div>
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
                  </div>
                  <CardContent className="p-10">
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

      {/* Footer */}
      <footer className="bg-white pt-32 pb-20 border-t">
        <div className="container mx-auto px-4">
          <div className="pt-12 border-t text-[10px] text-muted-foreground font-black tracking-[0.6em] uppercase text-center opacity-50">
            &copy; 2024 ҲУНАР Ё Б. ТАҲИЯ ШУДААСТ ТАВАССУТИ TAJ.WEB
          </div>
        </div>
      </footer>
    </div>
  );
}
