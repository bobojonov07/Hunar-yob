
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
import { UserRole, ALL_REGIONS, UserProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, ScrollText, Mail } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleNextStep = async (e: React.FormEvent) => {
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

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const phoneQuery = query(collection(db, "users"), where("phone", "==", cleanPhone));
      const phoneSnap = await getDocs(phoneQuery);
      
      if (!phoneSnap.empty) {
        toast({ title: "Хатогӣ", description: "Ин рақами телефон аллакай истифода шудааст", variant: "destructive" });
        setLoading(false);
        return;
      }

      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      
      console.log(`Verification Code for ${email}: ${newOtp}`);
      
      toast({ 
        title: "Код фиристода шуд", 
        description: `Коди тасдиқ ба почтаи ${email} фиристода шуд. (Код: ${newOtp})` 
      });
      
      setStep(2);
    } catch (err) {
      toast({ title: "Хатогӣ", description: "Мушкилии техникӣ рӯй дод", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== generatedOtp) {
      toast({ title: "Хатогӣ", description: "Коди тасдиқ нодуруст аст", variant: "destructive" });
      return;
    }

    finalizeRegistration();
  };

  const finalizeRegistration = async () => {
    setLoading(true);
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
        isArtisanFeePaid: true,
        isPremium: false,
        isBlocked: false,
        warningCount: 0,
        createdAt: serverTimestamp()
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profileData);
      
      toast({ title: "Муваффақият", description: "Хуш омадед ба Ҳунар Ёб!" });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Хатогӣ", description: "Сабти ном нашуд. Лутфан дубора кӯшиш кунед.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-10">
        <Card className="w-full max-w-xl border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center bg-muted/10 pb-12 pt-16">
            <CardTitle className="text-5xl font-black font-headline text-secondary tracking-tighter">САБТИ НОМ</CardTitle>
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
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Телефон</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-sm font-black text-muted-foreground">+992</div>
                      <Input className="pl-16 h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="900000000" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={9} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Почта (Email)</Label>
                    <Input type="email" placeholder="example@mail.tj" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Рамз</Label>
                    <Input type="password" d="password" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Тасдиқи рамз</Label>
                    <Input type="password" id="confirm-password" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20">
                  <Checkbox id="agreed" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-1 h-6 w-6 rounded-lg" />
                  <Label htmlFor="agreed" className="text-[10px] text-muted-foreground font-bold leading-relaxed block">
                    Ман бо шартҳои истифода ва сиёсати махфияти барнома розӣ ҳастам.
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-16 px-10 mt-6">
                <Button type="submit" disabled={!agreed || loading} className="w-full h-16 text-xl font-black rounded-[2rem] shadow-2xl bg-primary">
                  ДАВОМ ДОДАН
                </Button>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpConfirm}>
              <CardContent className="space-y-8 pt-16 text-center px-10">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter">ТАСДИҚИ ПОЧТА</h3>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">Мо ба почтаи <b className="text-secondary">{email}</b> коди 4-рақамаи тасдиқро фиристодем.</p>
                <Input className="h-20 text-center text-5xl font-black tracking-[1em] rounded-[2.5rem] bg-muted/20 border-muted" placeholder="0000" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-16 px-10">
                <Button type="submit" disabled={loading} className="w-full bg-primary h-16 text-xl font-black rounded-[2rem] shadow-2xl">
                  {loading ? "ДАР ҲОЛИ САБТ..." : "ТАСДИҚ ВА САБТ"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-full font-bold">Бозгашт</Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
