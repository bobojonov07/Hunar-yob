"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ChevronLeft } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast({
        title: "Огоҳӣ",
        description: "Лутфан бо шартҳои истифода ва сиёсати амният розӣ шавед",
        variant: "destructive",
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Хуш омадед",
        description: "Шумо бо муваффақият ворид шудед.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Хатогии воридшавӣ",
        description: "Почта ё рамзи нодуруст.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-6">
           <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" />
            БОЗГАШТ
          </Button>
        </div>
        
        <Card className="w-full max-w-md border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-16 pb-10 bg-muted/10">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-4xl font-black font-headline text-secondary tracking-tighter">ВОРИДШАВӢ</CardTitle>
            <CardDescription className="font-bold uppercase tracking-widest text-[10px] mt-2 opacity-60">Ба кабинети шахсии худ ворид шавед</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-8 pt-12 px-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black text-xs uppercase tracking-widest opacity-60">Почтаи электронӣ</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="example@mail.tj" 
                    className="pl-12 h-14 rounded-2xl bg-muted/20 border-muted font-bold"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="font-black text-xs uppercase tracking-widest opacity-60">Рамз</Label>
                  <Link href="/forgot-password" size="sm" className="text-[10px] text-primary font-black hover:underline uppercase tracking-widest">
                    Рамзро фаромӯш кардед?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="******" 
                    className="pl-12 pr-12 h-14 rounded-2xl bg-muted/20 border-muted font-bold"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Checkbox 
                  id="agreed" 
                  checked={agreed} 
                  onCheckedChange={(v) => setAgreed(!!v)} 
                  className="mt-1 h-6 w-6 rounded-lg"
                />
                <Label htmlFor="agreed" className="text-[10px] text-muted-foreground font-bold leading-relaxed">
                  Ман бо <span className="text-primary hover:underline">шартҳои истифода</span> ва <span className="text-primary hover:underline">сиёсати амният</span> розӣ ҳастам.
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pb-16 px-10 mt-4">
              <Button type="submit" className="w-full bg-primary h-16 text-xl font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-95">ВОРИД ШУДАН</Button>
              <p className="text-sm text-center text-muted-foreground font-bold">
                Ҳанӯз сабти ном нашудаед?{" "}
                <Link href="/register" className="text-primary font-black hover:underline">Сабти ном</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
