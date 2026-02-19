"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, depositFunds } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, Landmark, History, Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Хатогӣ",
        description: "Лутфан маблағи дурустро ворид кунед",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const success = depositFunds(numAmount);
      if (success) {
        setUser(getCurrentUser());
        setAmount("");
        toast({
          title: "Муваффақият",
          description: `Тавозуни шумо бо ${numAmount} TJS пур карда шуд`,
        });
      }
      setLoading(false);
    }, 1500);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Бозгашт ба профил
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Balance Display */}
          <div className="md:col-span-2 space-y-8">
            <Card className="border-none shadow-xl bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Wallet className="h-64 w-64" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 opacity-80 mb-2">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">ҲАМЁНИ ШАХСӢ</span>
                </div>
                <CardTitle className="text-2xl font-headline">Тавозуни умумӣ</CardTitle>
              </CardHeader>
              <CardContent className="pb-10 pt-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-black">{(user.balance || 0).toLocaleString()}</span>
                  <span className="text-2xl font-bold opacity-60">TJS</span>
                </div>
              </CardContent>
              <div className="h-2 bg-primary w-full absolute bottom-0 left-0" />
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <History className="h-6 w-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Таърихи амалиёт</h4>
                    <p className="text-xs text-muted-foreground">Ҳамаи гузаришҳо ва пардохтҳо</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <CreditCard className="h-6 w-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Кортҳои пайваст</h4>
                    <p className="text-xs text-muted-foreground">Кортҳои бонкии шумо</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Амалиётҳои охирин
              </h3>
              <div className="bg-white rounded-2xl border border-border p-8 text-center">
                <p className="text-muted-foreground italic">Ҳоло ягон амалиёт сабт нашудааст.</p>
              </div>
            </div>
          </div>

          {/* Deposit Form */}
          <div className="md:col-span-1">
            <Card className="border-border shadow-lg sticky top-24 overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="text-xl">Пур кардани тавозун</CardTitle>
                <CardDescription>Маблағро ворид кунед ва усули пардохтро интихоб намоед</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeposit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Маблағ (TJS)</Label>
                    <div className="relative">
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-4 h-12 text-lg font-bold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Усули пардохт</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold">Корти бонкӣ (Корти Миллӣ)</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted cursor-pointer transition-colors opacity-50 grayscale">
                        <Landmark className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Ҳамёни электронӣ (Ба наздикӣ)</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 rounded-xl text-lg font-bold shadow-lg shadow-secondary/20"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Дар ҳоли иҷро...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        ПУР КАРДАН
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
              <div className="p-4 bg-muted/30 border-t text-[10px] text-center text-muted-foreground uppercase tracking-wider font-bold">
                Амалиётҳои мо бо протоколи SSL ҳифз карда мешаванд
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}