
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, toggleFavorite, getCurrentUser, User, getReviews, saveReview, Review, makeListingVip, incrementViews, updateLastSeen, reportUser } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  ChevronLeft, 
  Calendar, 
  User as UserIcon, 
  Heart, 
  Share2, 
  Star, 
  Crown, 
  Eye,
  CheckCircle2,
  Flag
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    updateLastSeen();
    const allListings = getListings();
    const found = allListings.find(l => l.id === id);
    if (found) {
      setListing(found);
      setReviews(getReviews(found.id));
      incrementViews(found.id);
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser && currentUser.favorites) {
      setIsFavorite(currentUser.favorites.includes(id as string));
    }
  }, [id]);

  const isOwner = user?.id === listing?.userId;

  const handleFavoriteToggle = () => {
    if (!user) {
      toast({ title: "Вуруд лозим аст", description: "Барои илова ба писандидаҳо вориди акаунт шавед", variant: "destructive" });
      router.push("/login");
      return;
    }
    
    const success = toggleFavorite(listing!.id);
    if (success) {
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? "Хориҷ карда шуд" : "Илова шуд",
        description: isFavorite ? "Эълон аз рӯйхати писандидаҳо хориҷ шуд" : "Эълон ба рӯйхати писандидаҳо илова шуд",
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Пайванд нусхабардорӣ шуд",
      description: "Шумо метавонед онро бо дигарон мубодила кунед",
    });
  };

  const handleReport = () => {
    if (!listing) return;
    const res = reportUser(listing.userId);
    if (res.success) toast({ title: res.message });
  };

  const handleCall = () => {
    if (isOwner) {
      toast({ title: "Хатогӣ", description: "Шумо ба худатон занг зада наметавонед", variant: "destructive" });
      return;
    }
    if (listing?.userPhone) {
      window.location.href = `tel:+992${listing.userPhone}`;
    } else {
      toast({ title: "Рақам дастрас нест", variant: "destructive" });
    }
  };

  const handleVipUpgrade = () => {
    if (!listing) return;
    const res = makeListingVip(listing.id);
    if (res.success) {
      setListing({ ...listing, isVip: true });
      toast({ title: "Муваффақият", description: res.message });
    } else {
      toast({ title: "Хатогӣ", description: res.message, variant: "destructive" });
    }
  };

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" />
            БОЗГАШТ
          </Button>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={handleShare} className="flex-1 md:flex-none rounded-2xl h-12 font-bold">
              <Share2 className="mr-2 h-4 w-4" />
              МУБОДИЛА
            </Button>
            <Button variant="outline" onClick={handleReport} className="flex-1 md:flex-none rounded-2xl h-12 text-red-400 border-red-100 hover:bg-red-50">
              <Flag className="mr-2 h-4 w-4" />
              ШИКОЯТ
            </Button>
            {!isOwner && (
              <Button 
                variant="outline" 
                onClick={handleFavoriteToggle}
                className={`flex-1 md:flex-none rounded-2xl h-12 px-6 ${isFavorite ? 'border-red-500 text-red-500 bg-red-50' : 'border-border'}`}
              >
                <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                {isFavorite ? "ПИСАНДИДА" : "БА ПИСАНДИДАҲО"}
              </Button>
            )}
            {isOwner && !listing.isVip && (
              <Button onClick={handleVipUpgrade} className="bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-2xl h-12 shadow-xl">
                <Crown className="mr-2 h-5 w-5 fill-white" />
                VIP КАРДАН (20 TJS)
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="relative rounded-[3rem] overflow-hidden shadow-3xl border-none bg-muted ring-8 ring-white/50">
              <Carousel className="w-full">
                <CarouselContent>
                  {listing.images.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video">
                        <Image 
                          src={img} 
                          alt={`${listing.title} - ${index + 1}`} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {listing.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-8 bg-white/20 backdrop-blur-xl border-none text-white h-12 w-12" />
                    <CarouselNext className="right-8 bg-white/20 backdrop-blur-xl border-none text-white h-12 w-12" />
                  </>
                )}
              </Carousel>
              {listing.isVip && (
                <div className="absolute top-8 right-8 pointer-events-none">
                  <Badge className="bg-yellow-500 text-white text-xl px-8 py-3 shadow-3xl font-black rounded-full animate-pulse">
                    <Crown className="mr-2 h-6 w-6 fill-white" />
                    VIP ЭЪЛОН
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <h1 className="text-4xl md:text-6xl font-headline font-black text-secondary tracking-tighter leading-none">{listing.title}</h1>
                <div className="flex items-center text-primary bg-primary/5 px-6 py-2 rounded-full border border-primary/10 shadow-sm">
                  <Eye className="h-5 w-5 mr-3" />
                  <span className="text-sm font-black uppercase tracking-widest">{listing.views || 0} ТАМОШО</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-primary text-white px-6 py-2 text-sm font-black rounded-2xl shadow-lg">{listing.category}</Badge>
                <div className="flex items-center text-muted-foreground text-xs font-bold bg-muted/30 px-4 py-2 rounded-2xl">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(listing.createdAt).toLocaleDateString('tg-TJ')}
                </div>
              </div>
              <div className="prose prose-orange max-w-none">
                <h3 className="text-2xl font-black mb-4 text-secondary tracking-tight">ТАВСИФИ ХИДМАТРАСОНӢ:</h3>
                <p className="text-xl leading-relaxed text-muted-foreground bg-white p-10 rounded-[3rem] border shadow-sm whitespace-pre-wrap italic font-medium">
                  &ldquo;{listing.description}&rdquo;
                </p>
              </div>
            </div>

            <Separator className="my-16 opacity-50" />

            {/* Reviews Section */}
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-headline font-black text-secondary tracking-tighter">БАҲО ВА ШАРҲҲО</h3>
                <Badge variant="outline" className="border-primary text-primary font-black px-4 py-1">ТАНҲО ПАС АЗ КОР</Badge>
              </div>
              
              <div className="space-y-8">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <Card key={rev.id} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                      <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center font-black text-secondary text-xl shadow-inner">
                              {rev.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-lg text-secondary leading-none mb-2">{rev.userName}</p>
                              <div className="flex text-yellow-500 gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < rev.rating ? 'fill-yellow-500' : 'text-muted opacity-50'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {new Date(rev.createdAt).toLocaleDateString('tg-TJ')}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed font-medium italic">&ldquo;{rev.comment}&rdquo;</p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-green-600 uppercase tracking-widest">
                          <ShieldCheck className="h-4 w-4" /> ТАСДИҚШУДА АЗ ШАРТНОМА
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-4 border-dashed border-muted">
                    <Star className="h-16 w-16 mx-auto text-muted mb-4 opacity-50" />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Ҳанӯз шарҳе нест</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-none shadow-3xl overflow-hidden rounded-[3rem] bg-white ring-1 ring-secondary/5">
              <div className={`h-3 ${listing.isVip ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-primary'} w-full`} />
              <CardContent className="p-10">
                <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-muted">
                  <div className="h-20 w-20 rounded-[1.5rem] bg-secondary flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-2xl transform -rotate-3">
                    {listing.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-secondary tracking-tighter leading-none mb-2">{listing.userName}</h3>
                    <p className="text-[10px] font-black flex items-center bg-green-50 text-green-600 px-3 py-1 rounded-full w-fit uppercase tracking-widest">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      УСТОИ ТАСДИҚШУДА
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-black mb-3 flex items-center text-secondary uppercase tracking-[0.2em]">
                      <MapPin className="h-5 w-5 mr-3 text-primary" />
                      МАКОНИ ФАЪОЛИЯТ
                    </p>
                    <p className="text-muted-foreground pl-8 text-sm font-bold">Душанбе, Тоҷикистон</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {!isOwner ? (
                      <>
                        <Button 
                          onClick={handleCall}
                          className="w-full bg-secondary hover:bg-secondary/90 text-white h-20 text-xl font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
                        >
                          <Phone className="mr-4 h-7 w-7" />
                          ЗАНГ ЗАДАН
                        </Button>
                        <Button 
                          onClick={() => router.push(`/chat/${listing.id}`)}
                          variant="outline" 
                          className="w-full border-primary border-2 text-primary hover:bg-primary/5 h-20 text-xl font-black rounded-[2rem] transition-all hover:scale-[1.03] active:scale-95"
                        >
                          <MessageSquare className="mr-4 h-7 w-7" />
                          ЧАТ БО УСТО
                        </Button>
                      </>
                    ) : (
                      <div className="text-center p-8 bg-muted/30 rounded-[2rem] text-sm text-muted-foreground font-black uppercase tracking-widest italic border-2 border-dashed">
                        Ин эълони шумост
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
