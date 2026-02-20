"use client"

import { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, History, Plus, ArrowLeft, ShieldCheck, Lock, ArrowDownRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function WalletPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSecureDialogOpen, setIsSecureDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
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

    if (m === 'deposit') {
      if (cardNumber.length < 16 || !cardExpiry || cardCVC.length < 3) {
        toast({ title: "Хатогии корт", description: "Маълумоти кортро пурра ворид кунед", variant: "destructive" });
        return;
      }
    }

    if (m === 'withdraw') {
      if (profile.balance < numAmount) {
        toast({ title: "Хатогӣ", description: "Маблағ нокифоя аст", variant: "destructive" });
        return;
      }
    }
    setMode(m);
    setIsSecureDialogOpen(true);
  };

  const handleActionSecure = async () => {
    if (!userProfileRef || !profile || !user) return;
    
    if (!passwordConfirm) {
      toast({ title: "Хатогии рамз", description: "Рамзро ворид кунед", variant: "destructive" });
      return;
    }

    setLoading(true);
    const numAmount = parseFloat(amount);
    
    try {
      // 1. Update Profile Balance
      const updateData = {
        balance: increment(mode === 'deposit' ? numAmount : -numAmount)
      };
      await updateDoc(userProfileRef, updateData);

      // 2. Create Transaction Record
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: numAmount,
        type: mode === 'deposit' ? 'Deposit' : 'Withdrawal',
        status: 'Completed',
        method: mode === 'deposit' ? `Card ending in ${cardNumber.slice(-4)}` : 'Bank Transfer',
        createdAt: serverTimestamp()
      });

      setIsSecureDialogOpen(false);
      setIsSuccessDialogOpen(true);
      setAmount("");
      setCardNumber("");
      setCardExpiry("");
      setCardCVC("");
      setPasswordConfirm("");
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userProfileRef.path,
        operation: 'update',
        requestResourceData: { balance: amount },
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ArrowLeft className="mr-2 h-6 w-6" /> 
          БОЗГАШТ
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: BALANCE & INFO */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-3xl bg-gradient-to-br from-secondary via-secondary to-primary/90 text-white overflow-hidden relative rounded-[3rem] p-10">
              <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12"><Wallet className="h-80 w-80" /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 opacity-80 mb-6 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Ҳисоби ҳифзшуда</span>
                </div>
                <h2 className="text-2xl font-black mb-2 opacity-70">Тавозуни ҷорӣ:</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-8xl font-black tracking-tighter">{(profile.balance || 0).toLocaleString()}</span>
                  <span className="text-3xl font-bold opacity-60">TJS</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-white rounded-[2.5rem] shadow-xl border border-muted/50 flex flex-col gap-4">
                <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <Plus className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <h4 className="font-black text-secondary text-sm uppercase tracking-widest mb-1">Пур кардан</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Пур кардани фаврӣ тавассути Корти Миллӣ, Alif, Humo ва Visa.</p>
                </div>
              </div>
              <div className="p-8 bg-white rounded-[2.5rem] shadow-xl border border-muted/50 flex flex-col gap-4">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <ArrowDownRight className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-secondary text-sm uppercase tracking-widest mb-1">Бозхонд (Вывод)</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Гирифтани маблағ ба корти бонкӣ дар давоми 24 соат.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-secondary flex items-center gap-4 tracking-tighter">
                <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center"><History className="h-5 w-5" /></div>
                ОХИРИН АМАЛИЁТҲО
              </h3>
              <div className="bg-white rounded-[3rem] border-4 border-dashed p-20 text-center shadow-inner group">
                <History className="h-16 w-16 mx-auto text-muted mb-4 opacity-30 group-hover:scale-110 transition-transform" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-50">Таърихи амалиёт холӣ аст</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIONS */}
          <div className="lg:col-span-5">
            <Card className="border-none shadow-3xl rounded-[3.5rem] overflow-hidden bg-white ring-1 ring-secondary/5 sticky top-24">
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="w-full h-20 bg-muted/20 rounded-none p-2 gap-2">
                  <TabsTrigger value="deposit" className="flex-1 h-full rounded-[2rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg">
                    ПУР КАРДАН
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex-1 h-full rounded-[2rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-lg">
                    БОЗХОНД
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="p-10 space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Маблағи воридотӣ (TJS)</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="h-20 font-black text-5xl rounded-3xl bg-muted/10 border-none px-6 focus:ring-primary" 
                      />
                    </div>

                    <div className="p-8 bg-muted/10 rounded-[2.5rem] space-y-6 border border-muted-foreground/10">
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Рақами корт</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
                          <Input 
                            placeholder="0000 0000 0000 0000" 
                            maxLength={16}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="h-14 pl-14 rounded-2xl bg-white border-none font-bold" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Муҳлат</Label>
                          <Input 
                            placeholder="MM/YY" 
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="h-14 rounded-2xl bg-white border-none font-bold text-center" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">CVC</Label>
                          <Input 
                            type="password" 
                            placeholder="***" 
                            maxLength={3}
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value)}
                            className="h-14 rounded-2xl bg-white border-none font-bold text-center" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={(e) => handleOpenSecure(e, 'deposit')} className="w-full bg-primary h-20 rounded-[2.5rem] text-xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest">
                    <Plus className="h-7 w-7 mr-3" /> ТАСДИҚ ВА ПУР КАРДАН
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="p-10 space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2 text-center p-8 bg-red-500/5 rounded-[2.5rem] border-2 border-dashed border-red-500/10">
                       <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                       <p className="text-xs font-bold text-red-600 leading-relaxed uppercase tracking-widest">Диққат: Бозхонд танҳо ба корте, ки қаблан истифода шуда буд, имконпазир аст.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Маблағ барои гирифтан (TJS)</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="h-20 font-black text-5xl rounded-3xl bg-muted/10 border-none px-6" 
                      />
                    </div>
                  </div>

                  <Button onClick={(e) => handleOpenSecure(e, 'withdraw')} className="w-full bg-secondary h-20 rounded-[2.5rem] text-xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest">
                    <ArrowDownRight className="h-7 w-7 mr-3" /> ТАСДИҚ ВА ГИРИФТАН
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* SECURITY DIALOG */}
      <Dialog open={isSecureDialogOpen} onOpenChange={setIsSecureDialogOpen}>
        <DialogContent className="rounded-[3rem] p-12 border-none shadow-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-3xl font-black text-secondary tracking-tighter uppercase">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              ТАСДИҚИ АМНИЯТӢ
            </DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed pt-4">
              Барои амалиёти <b className="text-secondary text-lg">{amount} TJS</b>, лутфан рамзи худро барои тасдиқи шахсият ворид кунед.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 pt-6">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Рамзи акаунт</Label>
              <Input 
                type="password" 
                placeholder="******" 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)} 
                className="h-16 rounded-2xl text-center text-3xl font-black bg-muted/20 border-muted tracking-[0.5em]" 
              />
            </div>
            <Button 
              onClick={handleActionSecure} 
              disabled={loading} 
              className="w-full bg-primary h-20 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
            >
              {loading ? "ДАР ҲОЛИ ИҶРО..." : "ТАСДИҚ ВА ИҶРО"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="rounded-[4rem] p-16 border-none shadow-3xl max-w-md text-center">
          <div className="mx-auto h-24 w-24 bg-green-500 rounded-[2rem] flex items-center justify-center shadow-3xl shadow-green-500/40 mb-10 animate-bounce">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <h3 className="text-4xl font-black text-secondary tracking-tighter uppercase mb-4">МУВАФФАҚИЯТ!</h3>
          <p className="text-muted-foreground font-bold leading-relaxed mb-10">
            Амалиёт бо муваффақият анҷом ёфт. Маблағ ба тавозуни шумо илова карда шуд.
          </p>
          <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full bg-secondary h-16 rounded-2xl font-black uppercase tracking-widest">
            ФАҲМО
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
