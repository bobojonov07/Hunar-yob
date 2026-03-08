
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
  Info,
  Loader2,
  Lock,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { 
  doc, 
  collection, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { UserProfile, Deal, Listing } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CreateDealPage() {
  const { id: listingId } = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const targetClientId = searchParams.get("client");
  
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing } = useDoc<Listing>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || !db || !listingId) return;
    const clientId = targetClientId || user.uid;
    const otherId = user.uid === listing?.userId ? clientId : listing?.userId;
    
    if (otherId) {
      getDoc(doc(db, "users", otherId)).then(snap => {
        if (snap.exists()) setOtherParty(snap.data() as UserProfile);
      });
    }
  }, [db, user, listing, targetClientId, listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !otherParty || !listing || !listingId) return;

    if (profile.identificationStatus !== 'Verified') {
      toast({ title: "Верификатсия лозим аст", variant: "destructive" });
      return;
    }

    if (parseFloat(price) > profile.balance) {
      toast({ title: "Маблағ нокифоя аст", description: "Лутфан ҳисобро пур кунед", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const dealRef = doc(collection(db, "deals"));
    const dealId = dealRef.id;

    const dealData: Deal = {
      id: dealId,
      listingId: listingId as string,
      clientId: targetClientId || user.uid,
      artisanId: listing.userId,
      title,
      price: parseFloat(price),
      duration: parseInt(duration),
      status: 'Pending',
      createdAt: serverTimestamp()
    };

    try {
      // 1. Create the deal document
      await setDoc(dealRef, dealData);

      // 2. Add message to chat
      const chatId = `${listingId}_${dealData.clientId}`;
      const msgRef = doc(collection(db, "chats", chatId, "messages"));
      await setDoc(msgRef, {
        id: msgRef.id,
        chatId,
        senderId: user.uid,
        senderName: profile.name,
        text: "Дархости шартнома фиристода шуд",
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'deal',
        dealId,
        isPremiumSender: profile.isPremium || false
      });

      // 3. Update chat last message
      await setDoc(doc(db, "chats", chatId), {
        lastMessage: "Дархости шартнома",
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherParty.id}`]: increment(1)
      }, { merge: true });

      toast({ title: "Шартнома сохта шуд" });
      router.push(`/chat/${listingId}?client=${dealData.clientId}`);
    } catch (err) {
      toast({ title: "Хатогӣ", variant: "destructive" });
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
            <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase leading-none">СОХТАНИ ШАРТНОМА</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Шартномаи амниятӣ бо {otherParty?.name}</p>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200 rounded-[2rem] p-6 border-2 border-dashed">
            <ShieldCheck className="h-6 w-6 text-yellow-600" />
            <AlertTitle className="text-yellow-700 font-black uppercase text-xs tracking-widest mb-2">КАФОЛАТИ ПЛАТФОРМА</AlertTitle>
            <AlertDescription className="text-yellow-600 font-bold text-[11px] leading-relaxed">
              Маблағи шумо дар система то тасдиқи анҷоми кор аз тарафи шумо маҳфуз мемонад. Мо амнияти 100%-и ин муомиларо кафолат медиҳем.
            </AlertDescription>
          </Alert>

          <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 pb-8">
              <CardTitle className="text-xl font-black text-secondary uppercase">ТАФСИЛОТИ ШАРТНОМА</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">НОМИ КОР / ЛОИҲА</Label>
                  <Input 
                    placeholder="Масалан: Ремонти хонаи 3-ҳуҷрагӣ" 
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
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">ТАВСИФИ ПУРРА ВА ШАРТҲО</Label>
                  <Textarea 
                    placeholder="Тамоми шартҳоро муфассал нависед..." 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="min-h-[150px] rounded-2xl p-6 bg-muted/20 border-none"
                  />
                </div>

                <div className="p-6 bg-blue-50 rounded-[2.5rem] flex items-start gap-4 border-2 border-dashed border-blue-100">
                  <Lock className="h-6 w-6 text-blue-500 shrink-0" />
                  <p className="text-[10px] font-black text-blue-600 uppercase leading-relaxed">
                    Маблағи {price || "0"} TJS аз тавозуни шумо гирифта шуда, то анҷоми шартнома дар суратҳисоби бетарафи "KORYOB 2" нигоҳ дошта мешавад.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !title || !price || !duration} 
                  className="w-full h-16 bg-primary font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-[1.02] transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "ФИРИСТОДАНИ ШАРТНОМА"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
