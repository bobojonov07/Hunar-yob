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
import { saveUser, setCurrentUser, UserRole, getUsers } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon, Calendar, MapPin, Phone, Lock, Eye, EyeOff, Info } from "lucide-react";

const REGIONS = ["Душанбе", "Хатлон", "Суғд", "ВМКБ", "Ноҳияҳои тобеи марказ"];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("Client");
  const [agreed, setAgreed] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast({ title: "Хатогӣ", description: "Лутфан бо шартҳои истифода розӣ шавед", variant: "destructive" });
      return;
    }

    if (!name || !email || !password || !birthDate || !region || !phone) {
      toast({ title: "Хатогӣ", description: "Лутфан ҳамаи майдонҳоро пур кунед", variant: "destructive" });
      return;
    }

    if (name.length < 3) {
      toast({ title: "Хатогӣ", description: "Ном бояд на кам аз 3 аломат бошад", variant: "destructive" });
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    if (age < 18) {
      toast({ title: "Хатогӣ", description: "Сабти ном танҳо барои шахсони аз 18-сола боло", variant: "destructive" });
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 9) {
      toast({ title: "Хатогӣ", description: "Рақами телефон бояд рости 9 рақам бошад", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Хатогӣ", description: "Рамзҳо мувофиқат намекунанд", variant: "destructive" });
      return;
    }

    const existingUsers = getUsers();
    const isDuplicate = existingUsers.some(u => u.email === email || u.phone === phoneDigits);
    if (isDuplicate) {
      toast({ title: "Хатогӣ", description: "Ин почта ё рақами телефон аллакай истифода шудааст", variant: "destructive" });
      return;
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password,
      birthDate,
      region,
      phone: phoneDigits,
      favorites: [],
      balance: 0
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    
    toast({ title: "Муваффақият", description: "Хуш омадед ба Ҳунар Ёб!" });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-10">
        <Card className="w-full max-w-xl border-border shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center bg-muted/20 pb-10 pt-12">
            <CardTitle className="text-4xl font-black font-headline text-secondary tracking-tighter">САБТИ НОМ</CardTitle>
            <CardDescription className="text-base font-medium">Маълумоти худро барои оғоз ворид кунед</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6 pt-10">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold">Ному насаб</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="name" 
                    className="pl-12 h-12 rounded-xl"
                    placeholder="Алиев Валӣ" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="font-bold">Санаи таваллуд</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="birthDate" 
                      type="date"
                      className="pl-12 h-12 rounded-xl"
                      value={birthDate} 
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region" className="font-bold">Минтақа</Label>
                  <Select onValueChange={setRegion}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Интихоби минтақа" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Телефон (бе +992)</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-3 text-sm font-bold text-muted-foreground">+992</div>
                    <Input 
                      id="phone" 
                      className="pl-16 h-12 rounded-xl"
                      placeholder="900000000" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={9}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Почтаи электронӣ</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="example@mail.tj" 
                    className="h-12 rounded-xl"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold">Рамз</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      className="pl-12 pr-12 h-12 rounded-xl"
                      placeholder="******" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-bold">Тасдиқи рамз</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="pl-12 pr-12 h-12 rounded-xl"
                      placeholder="******" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3 text-muted-foreground hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="font-bold">Шумо кистед?</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-2 gap-6">
                  <div>
                    <RadioGroupItem value="Client" id="client" className="peer sr-only" />
                    <Label
                      htmlFor="client"
                      className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-6 hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all duration-300"
                    >
                      <UserIcon className="mb-3 h-8 w-8 text-primary" />
                      <span className="font-black text-secondary">МИЗОҶ</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="Usto" id="usto" className="peer sr-only" />
                    <Label
                      htmlFor="usto"
                      className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-6 hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all duration-300"
                    >
                      <Hammer className="mb-3 h-8 w-8 text-primary" />
                      <span className="font-black text-secondary">УСТО</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-start space-x-3 pt-4">
                <Checkbox 
                  id="agreed" 
                  checked={agreed} 
                  onCheckedChange={(v) => setAgreed(!!v)} 
                  className="mt-1 rounded-md h-5 w-5"
                />
                <Label htmlFor="agreed" className="text-sm leading-relaxed text-muted-foreground font-medium cursor-pointer">
                  Ман бо <span className="text-primary hover:underline">шартҳои истифода</span> ва <span className="text-primary hover:underline">сиёсати маҳфият</span> розӣ ҳастам.
                </Label>
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Барномасоз барои мундариҷаи эълонҳо ҷавобгар нест. Ин барнома танҳо бо мақсади кумак ба ҳамватанон дар пайдо кардани устоҳои моҳир сохта шудааст.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pb-12">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-8 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                САБТИ НОМ ШАВЕД
              </Button>
              <p className="text-base text-center text-muted-foreground font-medium">
                Аллакай аъзо ҳастед?{" "}
                <Link href="/login" className="text-primary hover:underline font-black">Ворид шавед</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
