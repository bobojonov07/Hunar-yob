
"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole, ALL_REGIONS, ARTISAN_REGISTRATION_FEE, UserProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon, Lock, Eye, EyeOff, Info, CheckCircle2, CreditCard, ShieldCheck, ScrollText } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<UserRole>("Client");
  const [agreed, setAgreed] = useState(false);
  
  const [cardNo, setCardNo] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Огоҳӣ", description: "Лутфан аввал бо қоидаҳо розӣ шавед", variant: "destructive" });
      return;
    }
    if (!name || !email || !password || !birthDate || !region || !phone) {
      toast({ title: "Хатогӣ", description: "Ҳамаи майдонҳоро пур кунед", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Хатогӣ", description: "Рамзҳо мувофиқат намекунанд", variant: "destructive" });
      return;
    }

    setStep(2);
    toast({ title: "Код фиристода шуд", description: "Коди тасдиқ (1234) ба рақами шумо фиристода шуд" });
  };

  const handleOtpConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "1234") {
      toast({ title: "Хатогӣ", description: "Коди тасдиқ нодуруст аст", variant: "destructive" });
      return;
    }

    if (role === 'Usto') {
      setStep(3);
    } else {
      finalizeRegistration();
    }
  };

  const finalizeRegistration = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profileData: UserProfile = {
        id: user.uid,
        name,
        email,
        role,
        phone: phone.replace(/\D/g, ""),
        region,
        balance: 0,
        identificationStatus: 'None',
        isArtisanFeePaid: role === 'Usto',
        isPremium: false,
        isBlocked: false,
        warningCount: 0,
        createdAt: serverTimestamp()
      };

      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, profileData).catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: profileData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      
      toast({ title: "Муваффақият", description: "Хуш омадед ба Ҳунар Ёб!" });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Хатогии сабти ном", description: error.message, variant: "destructive" });
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNo || !cardExp) {
      toast({ title: "Хатогӣ", description: "Маълумоти кортро пур кунед", variant: "destructive" });
      return;
    }
    
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      finalizeRegistration();
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-10">
        <Card className="w-full max-w-xl border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center bg-muted/10 pb-12 pt-16">
            <CardTitle className="text-5xl font-black font-headline text-secondary tracking-tighter">САБТИ НОМ</CardTitle>
            <CardDescription className="text-lg font-bold uppercase tracking-widest text-primary/60 mt-2">
              {step === 1 ? "Маълумоти худро ворид кунед" : 
               step === 2 ? "Рақами худро тасдиқ кунед" : "Пардохти ҳаққи сабти ном"}
            </CardDescription>
          </CardHeader>
          
          {step === 1 && (
            <form onSubmit={handleNextStep}>
              <CardContent className="space-y-8 pt-12 px-10">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Ному насаб</Label>
                  <Input className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="Алиев Валӣ" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Санаи таваллуд</Label>
                    <Input type="date" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Минтақа</Label>
                    <Select onValueChange={setRegion}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-muted font-bold"><SelectValue placeholder="Интихоби минтақа" /></SelectTrigger>
                      <SelectContent className="rounded-[2rem] border-none shadow-3xl">
                        {ALL_REGIONS.map(r => <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Телефон</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-sm font-black text-muted-foreground">+992</div>
                      <Input className="pl-16 h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="900000000" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={9} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Почта</Label>
                    <Input type="email" placeholder="example@mail.tj" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Рамз</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} className="pr-14 h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-muted-foreground">{showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Тасдиқи рамз</Label>
                    <Input type="password" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Шумо кистед?</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-2 gap-8">
                    <div>
                      <RadioGroupItem value="Client" id="client" className="peer sr-only" />
                      <Label htmlFor="client" className="flex flex-col items-center p-8 border-4 rounded-[2.5rem] cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all hover:scale-105 active:scale-95 shadow-sm">
                        <UserIcon className="mb-3 h-10 w-10 text-primary" />
                        <span className="font-black text-sm uppercase tracking-widest text-secondary">МИЗОҶ</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="Usto" id="usto" className="peer sr-only" />
                      <Label htmlFor="usto" className="flex flex-col items-center p-8 border-4 rounded-[2.5rem] cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all hover:scale-105 active:scale-95 shadow-sm">
                        <Hammer className="mb-3 h-10 w-10 text-primary" />
                        <span className="font-black text-sm uppercase tracking-widest text-secondary">УСТО</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20">
                  <Checkbox id="agreed" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-1 h-6 w-6 rounded-lg" />
                  <div className="space-y-2">
                    <Label htmlFor="agreed" className="text-[10px] text-muted-foreground font-bold leading-relaxed block">
                      Ман бо шартҳои истифода ва сиёсати махфияти барнома розӣ ҳастам.
                    </Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:underline">
                          <ScrollText className="h-4 w-4" /> ХОНДАНИ ҚОИДАҲО
                        </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[3rem] p-10 max-w-2xl border-none shadow-3xl bg-white">
                        <DialogHeader>
                          <DialogTitle className="text-3xl font-black text-secondary tracking-tighter uppercase">ҚОИДАҲО ВА МАХФИЯТ</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] pr-4 mt-6">
                          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                            <h4 className="font-black text-secondary uppercase tracking-widest text-xs">1. УМУМӢ</h4>
                            <p>Ин барнома барои пайваст кардани устоҳо ва мизоҷон дар Тоҷикистон сохта шудааст. Мо барои сифати хидматрасонии устоҳо масъулият надорем, аммо барои амнияти муомилаҳо кумак мекунем.</p>
                            
                            <h4 className="font-black text-secondary uppercase tracking-widest text-xs">2. ОДОБИ МУОШИРАТ</h4>
                            <p>Истифодаи дашном, ҳақорат ва муомилаи дағалона қатъиян манъ аст. Дар сурати шикояти мизоҷон, акаунти шумо бе огоҳӣ баста (Блок) мешавад.</p>
                            
                            <h4 className="font-black text-secondary uppercase tracking-widest text-xs">3. МАЪЛУМОТИ ШАХСӢ</h4>
                            <p>Мо маълумоти шуморо ба шахсони сеюм намедиҳем. Рақами телефони шумо танҳо ба мизоҷоне, ки бо шумо шартнома мебанданд, намоён мешавад.</p>
                            
                            <h4 className="font-black text-secondary uppercase tracking-widest text-xs">4. ПАРДОХТҲО</h4>
                            <p>Ҳаққи сабти номи устоҳо ({ARTISAN_REGISTRATION_FEE} сомонӣ) ва обунаи Premium барои нигоҳдории сервер ва рушди лоиҳа сарф мешавад ва баргардонида намешавад.</p>
                            
                            <p className="font-black text-primary italic pt-4">Бо пахш кардани тугмаи "Ман розӣ ҳастам", шумо тамоми масъулиятро ба дӯш мегиред.</p>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-16 px-10 mt-6">
                <Button 
                  type="submit" 
                  disabled={!agreed}
                  className={`w-full h-16 text-xl font-black rounded-[2rem] shadow-2xl transition-all ${agreed ? 'bg-primary hover:scale-[1.02]' : 'bg-muted opacity-50 cursor-not-allowed'}`}
                >
                  ДАВОМ ДОДАН
                </Button>
                <p className="text-sm text-center text-muted-foreground font-bold">Аллакай аъзо ҳастед? <Link href="/login" className="text-primary font-black">Ворид шавед</Link></p>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpConfirm}>
              <CardContent className="space-y-8 pt-16 text-center px-10">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter">ТАСДИҚИ ТЕЛЕФОН</h3>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">Мо ба рақами <b className="text-secondary">+992 {phone}</b> коди 4-рақама фиристодем. (Код: 1234)</p>
                <Input className="h-20 text-center text-5xl font-black tracking-[1em] rounded-[2.5rem] bg-muted/20 border-muted" placeholder="0000" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-16 px-10">
                <Button type="submit" className="w-full bg-primary h-16 text-xl font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02]">ТАСДИҚ ВА САБТ</Button>
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-full font-bold">Бозгашт</Button>
              </CardFooter>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePayment}>
              <CardContent className="space-y-8 pt-16 px-10">
                <div className="text-center mb-10">
                  <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                    <ShieldCheck className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-4xl font-black text-secondary tracking-tighter uppercase">ФАЪОЛКУНӢ</h3>
                  <p className="text-sm text-muted-foreground mt-3 font-bold">Барои сабти номи усто пардохти ҳатмии <b className="text-primary">{ARTISAN_REGISTRATION_FEE} TJS</b> лозим аст.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Рақами корт</Label>
                    <Input placeholder="4444 4444 4444 4444" value={cardNo} onChange={(e) => setCardNo(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted font-bold text-lg" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase tracking-widest opacity-60">Муҳлат</Label>
                      <Input placeholder="MM/YY" value={cardExp} onChange={(e) => setCardExp(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted font-bold text-lg" maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase tracking-widest opacity-60">CVC</Label>
                      <Input type="password" placeholder="***" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold text-lg" maxLength={3} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-16 px-10 mt-6">
                <Button type="submit" disabled={isPaying} className="w-full bg-primary h-16 text-xl font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02]">
                  {isPaying ? "ДАР ҲОЛИ ПАРДОХТ..." : `ПАРДОХТ ВА ФАЪОЛКУНӢ`}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
