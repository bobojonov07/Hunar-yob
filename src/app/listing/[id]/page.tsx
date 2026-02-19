"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings, toggleFavorite, getCurrentUser, User, getReviews, saveReview, Review } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, MessageSquare, ChevronLeft, Calendar, User as UserIcon, Heart, Share2, Star } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const allListings = getListings();
    const found = allListings.find(l => l.id === id);
    if (found) {
      setListing(found);
      setReviews(getReviews(found.id));
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser && currentUser.favorites) {
      setIsFavorite(currentUser.favorites.includes(id as string));
    }
  }, [id]);

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

  const handleCall = () => {
    if (listing?.userPhone) {
      window.location.href = `tel:+992${listing.userPhone}`;
    } else {
      toast({
        title: "Рақам дастрас нест",
        description: "Мутаассифона рақами телефони ин усто сабт нашудааст",
        variant: "destructive"
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Вуруд лозим аст", description: "Барои гузоштани баҳо вориди акаунт шавед", variant: "destructive" });
      return;
    }

    if (newReview.length < 60 || newReview.length > 150) {
      toast({
        title: "Маҳдудият",
        description: "Шарҳ бояд аз 60 то 150 ҳарф бошад",
        variant: "destructive"
      });
      return;
    }

    const review: Review = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing!.id,
      userId: user.id,
      userName: user.name,
      rating,
      comment: newReview,
      createdAt: new Date().toISOString()
    };

    saveReview(review);
    setReviews([review, ...reviews]);
    setNewReview("");
    toast({
      title: "Ташаккур",
      description: "Баҳои шумо бо муваффақият қабул шуд",
    });
  };

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Бозгашт
          </Button>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handleShare} className="flex-1 md:flex-none">
              <Share2 className="mr-2 h-4 w-4" />
              Мубодила
            </Button>
            <Button 
              variant="outline" 
              onClick={handleFavoriteToggle}
              className={`flex-1 md:flex-none rounded-full px-6 ${isFavorite ? 'border-red-500 text-red-500 bg-red-50' : 'border-border'}`}
            >
              <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
              {isFavorite ? "Дар писандидаҳо" : "Ба писандидаҳо"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border bg-muted">
              <Image 
                src={listing.images[activeImage]} 
                alt={listing.title} 
                fill 
                className="object-cover"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto py-2">
                {listing.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImage === idx ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-70'}`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-secondary mb-4">{listing.title}</h1>
              <div className="flex flex-wrap gap-4 mb-8">
                <Badge className="bg-primary text-white px-4 py-1">{listing.category}</Badge>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(listing.createdAt).toLocaleDateString('tg-TJ')}
                </div>
              </div>
              <div className="prose prose-orange max-w-none">
                <h3 className="text-xl font-bold mb-3 text-secondary">Дар бораи хидматрасонӣ:</h3>
                <p className="text-lg leading-relaxed text-muted-foreground bg-white p-6 rounded-xl border">
                  {listing.description}
                </p>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Reviews Section */}
            <div className="space-y-8">
              <h3 className="text-2xl font-headline font-bold text-secondary">Баҳо ва шарҳҳо</h3>
              
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Баҳо диҳед</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`h-8 w-8 cursor-pointer transition-colors ${s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                          onClick={() => setRating(s)}
                        />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Таҷрибаи худро нависед (60-150 ҳарф)..." 
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        className="min-h-[100px] bg-white"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {newReview.length} / 150 (камаш 60 ҳарф)
                      </p>
                    </div>
                    <Button type="submit" className="bg-primary text-white">Ирсол</Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <Card key={rev.id} className="border-border shadow-none bg-background">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-secondary">
                              {rev.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold">{rev.userName}</p>
                              <div className="flex text-yellow-500">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-500" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString('tg-TJ')}
                          </span>
                        </div>
                        <p className="text-muted-foreground italic">&ldquo;{rev.comment}&rdquo;</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-10">Ҳанӯз шарҳе нест. Аввалин шуда баҳо диҳед!</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-border shadow-md overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-sm">
                    {listing.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-secondary">{listing.userName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit mt-1">
                      <UserIcon className="h-3 w-3 mr-1" />
                      Устои тасдиқшуда
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold mb-2 flex items-center text-secondary">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Макони фаъолият
                    </p>
                    <p className="text-muted-foreground pl-6 text-sm">Душанбе, Тоҷикистон</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      onClick={handleCall}
                      className="w-full bg-secondary hover:bg-secondary/90 text-white py-7 text-lg rounded-xl transition-all hover:scale-[1.02]"
                    >
                      <Phone className="mr-3 h-6 w-6" />
                      Занг задан
                    </Button>
                    <Button 
                      onClick={() => router.push(`/chat/${listing.id}`)}
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary/10 py-7 text-lg rounded-xl transition-all hover:scale-[1.02]"
                    >
                      <MessageSquare className="mr-3 h-6 w-6" />
                      Чат бо усто
                    </Button>
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
