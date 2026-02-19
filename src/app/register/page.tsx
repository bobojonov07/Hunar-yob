"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveUser, setCurrentUser, UserRole } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon, Calendar, MapPin, Phone, Lock } from "lucide-react";

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
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !birthDate || !region || !phone) {
      toast({
        title: "Хатогӣ",
        description: "Лутфан ҳамаи майдонҳоро пур кунед",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Хатогӣ",
        description: "Рамзҳо мувофиқат намекунанд",
        variant: "destructive",
      });
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
      phone,
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    
    toast({
      title: "Муваффақият",
      description: "Шумо бо муваффақият сабти ном шудед!",
    });
    
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-10">
        <Card className="w-full max-w-lg border-border shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-secondary">Сабти ном</CardTitle>
            <CardDescription>Барои истифода аз хизматрасониҳо маълумоти худро ворид кунед</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Ному насаб</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    className="pl-10"
                    placeholder="Масалан: Алиев Валӣ" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Санаи таваллуд</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="birthDate" 
                      type="date"
                      className="pl-10"
                      value={birthDate} 
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Минтақа</Label>
                  <Select onValueChange={setRegion}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Интихоби минтақа" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Рақами телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      className="pl-10"
                      placeholder="+992 900 00 00 00" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Почтаи электронӣ</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="example@mail.tj" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Рамз</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-10"
                      placeholder="******" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Тасдиқи рамз</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      className="pl-10"
                      placeholder="******" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Шумо кистед?</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="Client" id="client" className="peer sr-only" />
                    <Label
                      htmlFor="client"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <UserIcon className="mb-3 h-6 w-6" />
                      Мизоҷ
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="Usto" id="usto" className="peer sr-only" />
                    <Label
                      htmlFor="usto"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Hammer className="mb-3 h-6 w-6" />
                      Усто
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-6">Сабти ном</Button>
              <p className="text-sm text-center text-muted-foreground">
                Аллакай аъзо ҳастед?{" "}
                <Link href="/login" className="text-primary hover:underline font-semibold">Ворид шавед</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
