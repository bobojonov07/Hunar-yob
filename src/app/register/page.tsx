
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
import { saveUser, setCurrentUser, UserRole, getUsers, ALL_REGIONS, ARTISAN_REGISTRATION_FEE } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon, Calendar, Lock, Eye, EyeOff, Info, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Хатогӣ", description: "Лутфан бо шартҳои истифода розӣ шавед", variant: "destructive" });
      return;
    }
    if (!name || !email || !password || !birthDate || !region || !phone) {
      toast({ title: "Хатогӣ", description: "Лутфан ҳамаи майдонҳоро пур кунед", variant: "destructive" });
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
      setStep(3); // Go to payment for Artisan
    } else {
      finalizeRegistration();
    }
  };

  const finalizeRegistration = () => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password,
      birthDate,
      region,
      phone: phone.replace(/\D/g, ""),
      favorites: [],
      balance: 0,
      identificationStatus: 'None',
      isArtisanFeePaid: role === 'Usto'
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    toast({ title: "Муваффақият", description: "Хуш омадед ба Ҳунар Ёб!" });
    router.push("/");
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
        <Card className="w-full max-w-xl border-border shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center bg-muted/20 pb-10 pt-12">
            <CardTitle className="text-4xl font-black font-headline text-secondary tracking-tighter">САБТИ НОМ</CardTitle>
            <CardDescription className="text-base font-medium">
              {step === 1 ? "Маълумоти худро ворид кунед" : 
               step === 2 ? "Рақами худро тасдиқ кунед" : "Пардохти ҳаққи сабти ном"}
            </CardDescription>
          </CardHeader>
          
          {step === 1 && (
            <form onSubmit={handleNextStep}>
              <CardContent className="space-y-6 pt-10">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold">Ному насаб</Label>
                  <Input id="name" className="h-12 rounded-xl" placeholder="Алиев Валӣ" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Санаи таваллуд</Label>
                    <Input type="date" className="h-12 rounded-xl" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Минтақа</Label>
                    <Select onValueChange={setRegion}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Интихоби минтақа" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Телефон</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-3 text-sm font-bold text-muted-foreground">+992</div>
                      <Input className="pl-16 h-12 rounded-xl" placeholder="900000000" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={9} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Почтаи электронӣ</Label>
                    <Input type="email" placeholder="example@mail.tj" className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Рамз</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} className="pr-12 h-12 rounded-xl" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-muted-foreground">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Тасдиқи рамз</Label>
                    <Input type="password" className="h-12 rounded-xl" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="font-bold">Шумо кистед?</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-2 gap-6">
                    <div>
                      <RadioGroupItem value="Client" id="client" className="peer sr-only" />
                      <Label htmlFor="client" className="flex flex-col items-center p-6 border-2 rounded-2xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all">
                        <UserIcon className="mb-2 h-6 w-6 text-primary" />
                        <span className="font-black text-xs uppercase">МИЗОҶ</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="Usto" id="usto" className="peer sr-only" />
                      <Label htmlFor="usto" className="flex flex-col items-center p-6 border-2 rounded-2xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all">
                        <Hammer className="mb-2 h-6 w-6 text-primary" />
                        <span className="font-black text-xs uppercase">УСТО</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {role === 'Usto' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-[10px] font-bold text-yellow-700 flex items-center gap-2">
                      <Info className="h-4 w-4 shrink-0" />
                      Барои устоҳо ҳаққи сабти номи ҳатмӣ {ARTISAN_REGISTRATION_FEE} сомонӣ мебошад.
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-3 pt-4">
                  <Checkbox id="agreed" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                  <Label htmlFor="agreed" className="text-xs text-muted-foreground font-medium">
                    Ман бо <span className="text-primary hover:underline">шартҳои истифода</span> ва <span className="text-primary hover:underline">сиёсати маҳфият</span> розӣ ҳастам.
                  </Label>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed flex items-start gap-4">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Барномасоз барои мундариҷаи эълонҳо, сифати хидматрасонӣ ва муомилаҳо ҷавобгар нест. Барнома танҳо барои кумак сохта шудааст.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-12">
                <Button type="submit" className="w-full bg-primary h-14 text-lg font-black rounded-2xl shadow-xl">ДАВОМ ДОДАН</Button>
                <p className="text-sm text-center text-muted-foreground">Аллакай аъзо ҳастед? <Link href="/login" className="text-primary font-black">Ворид шавед</Link></p>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpConfirm}>
              <CardContent className="space-y-6 pt-10 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-black">Коди тасдиқро ворид кунед</h3>
                <p className="text-sm text-muted-foreground">Мо ба рақами <b>+992 {phone}</b> коди 4-рақама фиристодем.</p>
                <Input className="h-16 text-center text-3xl font-black tracking-[1em] rounded-2xl" placeholder="0000" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} />
                <Button type="button" variant="link" className="text-primary font-bold">Кодро бозпас фиристед</Button>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-12">
                <Button type="submit" className="w-full bg-primary h-14 text-lg font-black rounded-2xl shadow-xl">ТАСДИҚ</Button>
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-full">Бозгашт</Button>
              </CardFooter>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePayment}>
              <CardContent className="space-y-6 pt-10">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black text-secondary">ФАЪОЛКУНИИ АКАУНТ</h3>
                  <p className="text-sm text-muted-foreground mt-2">Барои сабти номи усто пардохти ҳатмии <b>{ARTISAN_REGISTRATION_FEE} TJS</b> лозим аст.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-[2rem] flex gap-4 mb-4">
                    <CreditCard className="h-10 w-10 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-blue-900 uppercase text-[10px] tracking-widest mb-1">KORTI MILLI</h4>
                      <p className="text-[10px] text-blue-700">Танҳо устоҳои воқеӣ сабти ном мешаванд.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Рақами корт</Label>
                    <Input placeholder="4444 4444 4444 4444" value={cardNo} onChange={(e) => setCardNo(e.target.value)} className="h-12 rounded-xl" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Муҳлати эътибор</Label>
                      <Input placeholder="MM/YY" value={cardExp} onChange={(e) => setCardExp(e.target.value)} className="h-12 rounded-xl" maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">CVC</Label>
                      <Input type="password" placeholder="***" className="h-12 rounded-xl" maxLength={3} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-12">
                <Button type="submit" disabled={isPaying} className="w-full bg-primary h-14 text-lg font-black rounded-2xl shadow-xl">
                  {isPaying ? "ДАР ҲОЛИ ПАРДОХТ..." : `ПАРДОХТ ВА САБТИ НОМ`}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground px-10 leading-relaxed italic">
                  Ин маблағ барои филтр кардани шахсони беҳунар ва таъмини амнияти платформа ҷамъоварӣ карда мешавад.
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
