"use client"

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  Scale, 
  ShieldCheck, 
  Loader2, 
  Lock, 
  Wallet,
  AlertTriangle,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { 
  doc, 
  collection, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  increment,
  query,
  where 
} from "firebase/firestore";
import { UserProfile, Deal, Listing } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateDealPage() {
  const { id: initialListingId } = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const targetClientId = searchParams.get("client");
  
  const [selectedListingId, setSelectedListingId] = useState<string>(initialListingId as string || "");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);

  // Fetch initial listing to identify the artisan
  const initialListingRef = useMemo(() => initialListingId ? doc(db, "listings", initialListingId as string) : null, [db, initialListingId]);
  const { data: initialListing } = useDoc<Listing>(initialListingRef as any);

  const artisanId = useMemo(() => {
    if (!initialListing) return null;
    return initialListing.userId;
  }, [initialListing]);

  // Fetch all listings of the artisan
  const artisanListingsQuery = useMemo(() => {
    if (!db || !artisanId) return null;
    return query(collection(db, "listings"), where("userId", "==", artisanId));
  }, [db, artisanId]);
  const { data: artisanListings = [] } = useCollection<Listing>(artisanListingsQuery as any);

  useEffect(() => {
    if (!user || !db || !artisanId) return;
    const clientId = targetClientId || (profile?.role === 'Client' ? user.uid : "");
    const otherId = user.uid === artisanId ? (targetClientId || "") : artisanId;
    
    if (otherId) {
      getDoc(doc(db, "users", otherId)).then(snap => {
        if (snap.exists()) setOtherParty({ ...snap.data(), id: snap.id } as UserProfile);
      });
    }
  }, [db, user, artisanId, targetClientId, profile]);

  const selectedListing = useMemo(() => {
    return artisanListings.find(l => l.id === selectedListingId);
  }, [artisanListings, selectedListingId]);

  useEffect(() => {
    if (selectedListing && !title) {
      setTitle(selectedListing.title);
    }
  }, [selectedListing, title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !otherParty || !selectedListingId || !artisanId) return;

    if (profile.identificationStatus !== 'Verified') {
      toast({ title: "Верификатсия лозим аст", description: "Аввал профилро тасдиқ кунед", variant: "destructive" });
      return;
    }

    if (profile.role === otherParty.role) {
      toast({ 
        title: "Имконнопазир", 
        description: `Ҳамсуҳбат ${otherParty.name} нақши шуморо дорад. Шартнома танҳо байни Мизоҷ ва Усто имконпазир аст.`, 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    const dealRef = doc(collection(db, "deals"));
    const dealId = dealRef.id;

    const dealData: Deal = {
      id: dealId,
      listingId: selectedListingId,
      clientId: profile.role === 'Client' ? user.uid : otherParty.id,
      artisanId: profile.role === 'Usto' ? user.uid : otherParty.id,
      title,
      price: parseFloat(price),
      duration: parseInt(duration),
      status: 'Pending',
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(dealRef, dealData);

      const chatId = `${selectedListingId}_${dealData.clientId}`;
      const msgRef = doc(collection(db, "chats", chatId, "messages"));
      await setDoc(msgRef, {
        id: msgRef.id,
        chatId,
        senderId: user.uid,
        senderName: profile.name,
        text: `Дархости шартнома: ${title}`,
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'deal',
        dealId,
      });

      await setDoc(doc(db, "chats", chatId), {
        id: chatId,
        listingId: selectedListingId,
        clientId: dealData.clientId,
        artisanId: dealData.artisanId,
        lastMessage: "Дархости шартнома",
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherParty.id}`]: increment(1)
      }, { merge: true });

      toast({ title: "Дархост фиристода шуд" });
      router.push(`/chat/${selectedListingId}?client=${dealData.clientId}`);
    } catch (err) {
      toast({ title: "Хатогӣ ҳангоми сохтан", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
        </Button>

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Scale className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase leading-none">ДАРХОСТИ ШАРТНОМА</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Бо {otherParty?.name}</p>
          </div>

          {profile.role === otherParty?.role && (
            <Alert variant="destructive" className="rounded-[2rem] border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-black uppercase text-xs">МАНЪИ ШАРТНОМА</AlertTitle>
              <AlertDescription className="text-[10px] font-bold uppercase">
                Ҳамсуҳбат {otherParty?.name} нақши {otherParty?.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}-ро дорад. Шартнома танҳо байни Мизоҷ ва Усто имконпазир аст.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200 rounded-[2rem] p-6 border-2 border-dashed">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <AlertTitle className="text-blue-700 font-black uppercase text-xs tracking-widest mb-2">РОЗИГИИ ТАРАФАЙН</AlertTitle>
            <AlertDescription className="text-blue-600 font-bold text-[11px] leading-relaxed">
              Шартнома танҳо пас аз қабули мизоҷ ва пардохти маблағ фаъол мешавад. То он замон ягон маблағ аз ҳисоб гирифта намешавад.
            </AlertDescription>
          </Alert>

          <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 pb-8">
              <CardTitle className="text-xl font-black text-secondary uppercase">ТАФСИЛОТИ КОР</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">ИНТИХОБИ ЭЪЛОН (ХИДМАТ)</Label>
                  <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold bg-muted/20 border-none">
                      <SelectValue placeholder="Интихоби эълон" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {artisanListings.map(listing => (
                        <SelectItem key={listing.id} value={listing.id} className="font-bold">
                          {listing.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">НОМИ ЛОИҲА</Label>
                  <Input 
                    placeholder="Масалан: Сохтани шкаф" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="h-14 rounded-2xl font-bold bg-muted/20 border-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">НАРХ (TJS)</Label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                        className="pl-12 h-14 rounded-2xl font-bold bg-muted/20 border-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">МӮҲЛАТ (РӮЗ)</Label>
                    <Input 
                      type="number" 
                      placeholder="7" 
                      value={duration} 
                      onChange={e => setDuration(e.target.value)} 
                      className="h-14 rounded-2xl font-bold bg-muted/20 border-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">ШАРТҲО ВА ТАВСИФ</Label>
                  <Textarea 
                    placeholder="Тамоми шартҳоро нависед..." 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="min-h-[150px] rounded-2xl p-6 bg-muted/20 border-none"
                  />
                </div>

                <div className="p-6 bg-yellow-50 rounded-[2.5rem] flex items-start gap-4 border-2 border-dashed border-yellow-100">
                  <Lock className="h-6 w-6 text-yellow-500 shrink-0" />
                  <p className="text-[10px] font-black text-yellow-600 uppercase leading-relaxed">
                    Пас аз қабули мизоҷ, маблағи {price || "0"} TJS дар Escrow-и платформа банд мешавад.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !title || !price || !duration || !selectedListingId || profile.role === otherParty?.role} 
                  className="w-full h-16 bg-primary font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-[1.02] transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "ФИРИСТОДАНИ ДАРХОСТ"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
