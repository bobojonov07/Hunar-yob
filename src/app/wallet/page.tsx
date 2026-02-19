
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, depositFunds } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, Landmark, History, Plus, ArrowLeft, ShieldCheck, Lock, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSecureDialogOpen, setIsSecureDialogOpen] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  
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

  const handleOpenSecure = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.identificationStatus !== 'Verified') {
      toast({ title: "Хатогии амният", description: "Лутфан аввал дар профил идентификатсия кунед", variant: "destructive" });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Хатогӣ", description: "Маблағи дуруст ворид кунед", variant: "destructive" });
      return;
    }
    setIsSecureDialogOpen(true);
  };

  const handleDepositSecure = () => {
    if (passwordConfirm !== user?.password) {
      toast({ title: "Хатогии рамз", description: "Рамзи воридшавӣ нодуруст аст", variant: "destructive" });
      return;
    }

    setLoading(true);
    setIsSecureDialogOpen(false);
    
    setTimeout(() => {
      const success = depositFunds(parseFloat(amount));
      if (success) {
        setUser(getCurrentUser());
        setAmount("");
        setPasswordConfirm("");
        toast({ title: "Муваффақият", description: "Тавозун бо муваффақият пур карда шуд" });
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Бозгашт ба профил
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-none shadow-xl bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-10"><Wallet className="h-64 w-64" /></div>
              <CardHeader>
                <div className="flex items-center gap-2 opacity-80 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">ҲАМЁНИ ҲИФЗШУДА</span>
                </div>
                <CardTitle className="text-2xl font-headline">Тавозуни умумӣ</CardTitle>
              </CardHeader>
              <CardContent className="pb-10 pt-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-black">{(user.balance || 0).toLocaleString()}</span>
                  <span className="text-2xl font-bold opacity-60">TJS</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-blue-50 border border-blue-200 rounded-[2rem] flex gap-4">
              <ShieldCheck className="h-10 w-10 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest mb-1">Амнияти 100%</h4>
                <p className="text-sm text-blue-700">Ҳамаи амалиётҳо бо шифргузории SSL ва тасдиқи шахсият ҳифз карда мешаванд. Ҳакерҳо ба маблағи шумо дастрасӣ пайдо карда наметавонанд.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">Таърихи амалиёт</h3>
              <div className="bg-white rounded-2xl border border-border p-8 text-center">
                <p className="text-muted-foreground italic">Ҳоло ягон амалиёт сабт нашудааст.</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            {user.identificationStatus !== 'Verified' ? (
              <Card className="border-red-200 bg-red-50 p-6 text-center space-y-4 rounded-3xl">
                <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="font-black text-red-900">ҲАМЁН БАСТА АСТ</h3>
                <p className="text-xs text-red-700">Барои фаъол кардани ҳамён ва гузаронидани маблағ, лутфан дар профил идентификатсия кунед.</p>
                <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl">
                  <Link href="/profile">ТАСДИҚИ ШАХСИЯТ</Link>
                </Button>
              </Card>
            ) : (
              <Card className="border-border shadow-lg overflow-hidden rounded-3xl">
                <div className="h-2 bg-primary w-full" />
                <CardHeader>
                  <CardTitle className="text-xl">Пур кардан</CardTitle>
                  <CardDescription>Маблағи дилхоҳро ворид кунед</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOpenSecure} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Маблағ (TJS)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 font-bold" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-secondary h-12 rounded-xl text-lg font-bold">
                      <Plus className="h-5 w-5 mr-2" /> ПУР КАРДАН
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isSecureDialogOpen} onOpenChange={setIsSecureDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Тасдиқи амниятӣ</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Барои гузаронидани <b>{amount} TJS</b>, лутфан рамзи воридшавии худро тасдиқ кунед.</p>
            <Input 
              type="password" 
              placeholder="Рамзи шумо" 
              value={passwordConfirm} 
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Button onClick={handleDepositSecure} disabled={loading} className="w-full bg-primary h-12 rounded-xl font-bold">
              {loading ? "Дар ҳоли иҷро..." : "ТАСДИҚ ВА ПАРДОХТ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
