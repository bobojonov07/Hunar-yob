
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, depositFunds, withdrawFunds } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, History, Plus, ArrowLeft, ShieldCheck, Lock, ShieldAlert, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSecureDialogOpen, setIsSecureDialogOpen] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  
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

  const handleOpenSecure = (e: React.FormEvent, m: 'deposit' | 'withdraw') => {
    e.preventDefault();
    if (user?.identificationStatus !== 'Verified') {
      toast({ title: "Амният", description: "Аввал идентификатсия кунед", variant: "destructive" });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Хатогӣ", description: "Маблағро дуруст ворид кунед", variant: "destructive" });
      return;
    }
    setMode(m);
    setIsSecureDialogOpen(true);
  };

  const handleActionSecure = () => {
    if (passwordConfirm !== user?.password) {
      toast({ title: "Хатогии рамз", variant: "destructive" });
      return;
    }

    setLoading(true);
    setIsSecureDialogOpen(false);
    
    setTimeout(() => {
      if (mode === 'deposit') {
        depositFunds(parseFloat(amount));
        toast({ title: "Тавозун пур шуд" });
      } else {
        const res = withdrawFunds(parseFloat(amount));
        if (res.success) toast({ title: res.message });
        else toast({ title: "Хатогӣ", description: res.message, variant: "destructive" });
      }
      setUser(getCurrentUser());
      setAmount("");
      setPasswordConfirm("");
      setLoading(false);
    }, 1500);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Бозгашт</Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-none shadow-xl bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 text-white overflow-hidden relative rounded-[2.5rem]">
              <div className="absolute -right-10 -bottom-10 opacity-10"><Wallet className="h-64 w-64" /></div>
              <CardHeader>
                <div className="flex items-center gap-2 opacity-80 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">ҲАМЁНИ ҲИФЗШУДА</span>
                </div>
                <CardTitle className="text-2xl font-headline">Тавозуни ҷорӣ</CardTitle>
              </CardHeader>
              <CardContent className="pb-10 pt-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-black">{(user.balance || 0).toLocaleString()}</span>
                  <span className="text-2xl font-bold opacity-60">TJS</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-blue-50 border border-blue-200 rounded-[2rem] flex gap-4">
              <CreditCard className="h-10 w-10 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest mb-1">KORTI MILLI</h4>
                <p className="text-sm text-blue-700">Ҳамаи амалиётҳо бо кортҳои миллии ҳамаи бонкҳои Тоҷикистон (Алиф, Амонатбонк, Эсхата) ҳифз карда мешаванд.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2"><History className="h-5 w-5" /> Таърихи амалиёт</h3>
              <div className="bg-white rounded-3xl border border-border p-8 text-center"><p className="text-muted-foreground italic">Ҳоло ягон амалиёт сабт нашудааст.</p></div>
            </div>
          </div>

          <div className="md:col-span-1">
            {user.identificationStatus !== 'Verified' ? (
              <Card className="border-red-200 bg-red-50 p-8 text-center space-y-4 rounded-3xl">
                <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="font-black text-red-900 uppercase text-xs">ҲАМЁН БАСТА АСТ</h3>
                <p className="text-xs text-red-700 font-medium">Барои фаъол кардани ҳамён ва гузаронидани маблағ бо Korti Milli, лутфан идентификатсия кунед.</p>
                <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold"><Link href="/profile">ТАСДИҚИ ШАХСИЯТ</Link></Button>
              </Card>
            ) : (
              <Card className="border-border shadow-lg rounded-[2rem] overflow-hidden">
                <Tabs defaultValue="deposit">
                  <TabsList className="w-full h-14 bg-muted/50 rounded-none border-b">
                    <TabsTrigger value="deposit" className="flex-1 h-full rounded-none font-bold">ПУР КАРДАН</TabsTrigger>
                    <TabsTrigger value="withdraw" className="flex-1 h-full rounded-none font-bold">ГИРИФТАН</TabsTrigger>
                  </TabsList>
                  <TabsContent value="deposit" className="p-6">
                    <form onSubmit={(e) => handleOpenSecure(e, 'deposit')} className="space-y-6">
                      <Label className="font-bold">Маблағ (TJS)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 font-black text-xl rounded-xl" />
                      <div className="grid grid-cols-1 gap-2">
                        <Button type="submit" disabled={loading} className="w-full bg-primary h-14 rounded-xl text-lg font-black shadow-lg"><Plus className="h-5 w-5 mr-2" /> ПУР КАРДАН</Button>
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="withdraw" className="p-6">
                    <form onSubmit={(e) => handleOpenSecure(e, 'withdraw')} className="space-y-6">
                      <Label className="font-bold">Маблағ барои бозхонд (TJS)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 font-black text-xl rounded-xl" />
                      <Button type="submit" disabled={loading} className="w-full bg-secondary h-14 rounded-xl text-lg font-black shadow-lg"><ArrowDownRight className="h-5 w-5 mr-2" /> ГИРИФТАН</Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isSecureDialogOpen} onOpenChange={setIsSecureDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-10">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-2xl font-black"><Lock className="h-6 w-6 text-primary" /> ТАСДИҚИ АМНИЯТӢ</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4">
            <p className="text-sm text-muted-foreground font-medium">Барои {mode === 'deposit' ? 'пур кардани' : 'гирифтани'} <b>{amount} TJS</b>, лутфан рамзи воридшавии худро тасдиқ кунед.</p>
            <Input type="password" placeholder="Рамзи шумо" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="h-14 rounded-2xl text-center text-xl" />
            <Button onClick={handleActionSecure} disabled={loading} className="w-full bg-primary h-14 rounded-2xl font-black text-lg">
              {loading ? "ДАР ҲОЛИ ИҶРО..." : "ТАСДИҚ ВА ИҶРО"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
