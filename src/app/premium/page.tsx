
"use client"

import { useState, useRef, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, PREMIUM_PRICE } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Crown, 
  Camera, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Award
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { compressImage, cn } from "@/lib/utils";

export default function PremiumPurchasePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [step, setStep] = useState(1);
  const [receipt, setReceipt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (profile?.isPremium) router.push("/profile");
  }, [user, authLoading, profile, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1200, 1.0);
        setReceipt(compressed);
      } catch (err) {
        console.error("Image compression error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    
    const requestData = {
      userId: user.uid,
      userName: profile.name,
      receiptImage: receipt,
      submittedAt: serverTimestamp(),
      status: 'Pending',
      price: PREMIUM_PRICE,
      durationMonths: 3
    };

    try {
      const requestRef = doc(db, "premium_requests", user.uid);
      await setDoc(requestRef, requestData);

      toast({ 
        title: "Дархост фиристода шуд", 
        description: "Пас аз тасдиқи чек, статуси Premium барои 3 моҳ фаъол мешавад." 
      });
      router.push("/profile");
    } catch (err: any) {
      toast({ title: "Хатогӣ ҳангоми фиристодан", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
        </Button>

        <div className="space-y-12">
          <div className="text-center space-y-4">
            <div className="mx-auto h-28 w-28 bg-yellow-50 rounded-[3rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-transparent animate-pulse" />
              <Crown className="h-16 w-16 text-yellow-500 relative z-10 group-hover:scale-110 transition-transform" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-secondary tracking-tighter uppercase leading-none">
              KORYOB <span className="text-primary">PREMIUM</span>
            </h1>
            <p className="text-xl font-bold text-muted-foreground italic">Имкониятҳои бемаҳдуд барои пешрафти шумо</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white p-8 space-y-6">
              <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-yellow-500" /> ЧӢ БА ДАСТ МЕОРЕД?
              </h2>
              <div className="space-y-5">
                {[
                  { icon: TrendingUp, title: "ЛИМИТИ 5 ЭЪЛОН", desc: "То 5 эълони хизматрасонӣ нашр кунед" },
                  { icon: Zap, title: "ЧАТИ БЕМЕҲДУД", desc: "Лимити паёмҳо то 5000 аломат зиёд мешавад" },
                  { icon: Award, title: "ДИЗАЙНИ МАХСУС", desc: "Профили шумо бо тилло медурахшад" },
                  { icon: ShieldCheck, title: "ЭЪТИМОДИ БАЛАНД", desc: "Мизоҷон ба Premium бештар бовар мекунанд" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-secondary uppercase text-xs tracking-widest">{item.title}</p>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white p-10 flex flex-col justify-center">
              {step === 1 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">НАРХИ МАХСУС</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-8xl font-black text-secondary tracking-tighter">{PREMIUM_PRICE}</span>
                      <span className="text-2xl font-bold text-primary">TJS</span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">БАРОИ 3 МОҲ (Ҳамагӣ 8 сомон дар моҳ)</p>
                  </div>

                  <div className="p-6 bg-muted/20 rounded-[2.5rem] space-y-2">
                    <p className="text-[10px] font-black uppercase opacity-60">ИНТИҚОЛ БА КОРТ:</p>
                    <p className="text-2xl font-black text-secondary tracking-tighter">975638778</p>
                    <p className="text-sm font-bold text-primary">Соҳиби корт: А Б</p>
                  </div>

                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full bg-primary h-20 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all text-lg"
                  >
                    МАН ПАРДОХТ КАРДАМ
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-tight">ТАСДИҚИ ЧЕК</h2>
                    <p className="text-sm text-muted-foreground font-medium">Сурати чеки пардохтро бор кунед:</p>
                  </div>

                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline" 
                    className="w-full h-48 border-dashed border-2 rounded-[2.5rem] flex flex-col gap-3 transition-all hover:bg-primary/5"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : (
                      receipt ? <CheckCircle2 className="h-12 w-12 text-green-500" /> : <Camera className="h-12 w-12 text-muted-foreground" />
                    )}
                    <span className="font-black text-xs uppercase tracking-widest">
                      {receipt ? "ЧЕК БОР ШУД" : "ИЛОВАИ СУРАТИ ЧЕК"}
                    </span>
                  </Button>

                  {receipt && (
                    <div className="h-40 w-full rounded-2xl bg-muted relative overflow-hidden shadow-lg mx-auto max-w-[250px]">
                      <Image src={receipt} fill alt="check" className="object-cover" />
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest">БОЗГАШТ</Button>
                    <Button 
                      disabled={!receipt || isLoading} 
                      onClick={handleSubmit} 
                      className="flex-[2] bg-secondary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                    >
                      ФИРИСТОДАН
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
