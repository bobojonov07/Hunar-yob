"use client"

import { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, History, Plus, ArrowLeft, ShieldCheck, Lock, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

export default function WalletPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSecureDialogOpen, setIsSecureDialogOpen] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');

  const handleOpenSecure = (e: React.FormEvent, m: 'deposit' | 'withdraw') => {
    e.preventDefault();
    if (!profile) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Хатогӣ", description: "Маблағро дуруст ворид кунед", variant: "destructive" });
      return;
    }
    if (m === 'withdraw' && profile.balance < numAmount) {
      toast({ title: "Хатогӣ", description: "Маблағ нокифоя аст", variant: "destructive" });
      return;
    }
    setMode(m);
    setIsSecureDialogOpen(true);
  };

  const handleActionSecure = async () => {
    if (!userProfileRef || !profile) return;
    
    if (!passwordConfirm) {
      toast({ title: "Хатогии рамз", description: "Рамзро ворид кунед", variant: "destructive" });
      return;
    }

    setLoading(true);
    const numAmount = parseFloat(amount);
    const updateData = {
      balance: increment(mode === 'deposit' ? numAmount : -numAmount)
    };

    updateDoc(userProfileRef, updateData)
      .then(() => {
        toast({ title: mode === 'deposit' ? "Тавозун пур шуд" : "Маблағ бозхонд шуд" });
        setAmount("");
        setPasswordConfirm("");
        setIsSecureDialogOpen(false);
      })
      .catch(async (err: any) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      })
      .finally(() => setLoading(false));
  };

  if (!user || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0 font-black">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          БОЗГАШТ
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-none shadow-3xl bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 text-white overflow-hidden relative rounded-[2.5rem]">
              <div className="absolute -right-10 -bottom-10 opacity-10"><Wallet className="h-64 w-64" /></div>
              <CardHeader>
                <div className="flex items-center gap-2 opacity-80 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">ҲАМЁНИ ҲИФЗШУДА</span>
                </div>
                <CardTitle className="text-2xl font-headline font-black">Тавозуни ҷорӣ</CardTitle>
              </CardHeader>
              <CardContent className="pb-10 pt-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-black">{(profile.balance || 0).toLocaleString()}</span>
                  <span className="text-2xl font-bold opacity-60">TJS</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex gap-6 items-center">
              <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-black text-blue-900 uppercase text-xs tracking-[0.2em] mb-1">KORTI MILLI</h4>
                <p className="text-sm text-blue-700 font-medium leading-relaxed">Пайвастшавӣ ба ҳамаи бонкҳои Тоҷикистон (Алиф, Амонатбонк, Эсхата).</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-secondary flex items-center gap-3 tracking-tighter">
                <History className="h-6 w-6 text-primary" /> 
                ТАЪРИХИ АМАЛИЁТ
              </h3>
              <div className="bg-white rounded-[2.5rem] border-2 border-dashed p-16 text-center shadow-inner">
                <p className="text-muted-foreground italic font-medium">Ҳоло ягон амалиёт сабт нашудааст.</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-secondary/5">
              <Tabs defaultValue="deposit">
                <TabsList className="w-full h-16 bg-muted/30 rounded-none p-0">
                  <TabsTrigger value="deposit" className="flex-1 h-full rounded-none font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">ПУР КАРДАН</TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex-1 h-full rounded-none font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-secondary">ГИРИФТАН</TabsTrigger>
                </TabsList>
                <TabsContent value="deposit" className="p-8 pt-10">
                  <form onSubmit={(e) => handleOpenSecure(e, 'deposit')} className="space-y-8">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Маблағ (TJS)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-16 font-black text-3xl rounded-2xl bg-muted/20 border-muted" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-primary h-16 rounded-2xl text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                      <Plus className="h-6 w-6 mr-3" /> ПУР КАРДАН
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="withdraw" className="p-8 pt-10">
                  <form onSubmit={(e) => handleOpenSecure(e, 'withdraw')} className="space-y-8">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Маблағ барои бозхонд (TJS)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-16 font-black text-3xl rounded-2xl bg-muted/20 border-muted" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-secondary h-16 rounded-2xl text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                      <ArrowDownRight className="h-6 w-6 mr-3" /> ГИРИФТАН
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isSecureDialogOpen} onOpenChange={setIsSecureDialogOpen}>
        <DialogContent className="rounded-[3rem] p-12 border-none shadow-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-3xl font-black text-secondary tracking-tighter uppercase">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center"><Lock className="h-7 w-7 text-primary" /></div>
              ТАСДИҚИ АМНИЯТӢ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-6">
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">Барои амалиёти <b className="text-secondary text-lg">{amount} TJS</b>, лутфан рамзи худро ворид кунед.</p>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Рамзи акаунт</Label>
              <Input type="password" placeholder="******" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="h-16 rounded-2xl text-center text-2xl font-black bg-muted/20 border-muted" />
            </div>
            <Button onClick={handleActionSecure} disabled={loading} className="w-full bg-primary h-16 rounded-[2rem] font-black text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest">
              {loading ? "ДАР ҲОЛИ ИҶРО..." : "ТАСДИҚ ВА ИҶРО"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
