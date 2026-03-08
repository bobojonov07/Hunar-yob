
"use client"

import { useState, useMemo, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, Transaction, TransactionType } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  Loader2, 
  Upload,
  CreditCard,
  History,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, query, where, orderBy, addDoc } from "firebase/firestore";
import { compressImage, cn } from "@/lib/utils";
import Image from "next/image";

export default function WalletPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const transactionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [db, user]);
  const { data: transactions = [], loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery as any);

  const [mode, setMode] = useState<'main' | 'deposit' | 'withdraw'>('main');
  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 800, 0.7);
      setReceiptImage(compressed);
      setIsSubmitting(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeposit = async () => {
    if (!user || !profile || !amount) return;
    setIsSubmitting(true);

    const depositRef = doc(db, "deposit_requests", user.uid);
    const depositData = {
      id: user.uid,
      userId: user.uid,
      userName: profile.name,
      amount: parseFloat(amount),
      receiptImage,
      status: 'Pending',
      submittedAt: serverTimestamp()
    };

    try {
      await setDoc(depositRef, depositData);
      
      // Сабти транзаксия ҳамчун Pending
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: parseFloat(amount),
        type: 'Deposit',
        status: 'Pending',
        description: "Пур кардани ҳисоб (дар баррасӣ)",
        createdAt: serverTimestamp()
      });

      toast({ title: "Дархост фиристода шуд", description: "Маблағ дар муддати 24 соат тасдиқ мешавад." });
      setMode('main');
      setAmount("");
      setReceiptImage("");
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: depositRef.path,
        operation: 'create',
        requestResourceData: depositData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !profile || !amount || !cardNumber) return;
    if (profile.balance < parseFloat(amount)) {
      toast({ title: "Маблағ нокифоя аст", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const withdrawRef = doc(db, "withdrawal_requests", user.uid);
    const withdrawData = {
      id: user.uid,
      userId: user.uid,
      userName: profile.name,
      amount: parseFloat(amount),
      cardNumber,
      status: 'Pending',
      submittedAt: serverTimestamp()
    };

    try {
      await setDoc(withdrawRef, withdrawData);
      
      // Сабти транзаксия
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: parseFloat(amount),
        type: 'Withdrawal',
        status: 'Pending',
        description: `Бозхонд ба корти ${cardNumber.slice(-4)}`,
        createdAt: serverTimestamp()
      });

      toast({ title: "Дархости бозхонд қабул шуд", description: "Маблағ дар муддати 24 соат ба корти шумо мерасад." });
      setMode('main');
      setAmount("");
      setCardNumber("");
    } catch (err) {
      toast({ title: "Хатогӣ дар сервер", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => mode === 'main' ? router.back() : setMode('main')} className="hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
          </Button>
          <h1 className="text-2xl font-black text-secondary tracking-tighter uppercase">ҲАМЁНИ МАН</h1>
        </div>

        {mode === 'main' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Balance Card */}
            <Card className="border-none shadow-3xl bg-secondary text-white rounded-[3rem] p-10 overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 blur-[80px] rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 opacity-70">
                  <Wallet className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Тавозуни умумӣ</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-black tracking-tighter">{(profile.balance || 0).toLocaleString()}</span>
                  <span className="text-2xl font-bold opacity-60">TJS</span>
                </div>
                <div className="mt-10 grid grid-cols-2 gap-4">
                  <Button onClick={() => setMode('deposit')} className="h-16 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest shadow-xl">
                    <ArrowUpRight className="mr-2 h-5 w-5" /> ПУР КАРДАН
                  </Button>
                  <Button onClick={() => setMode('withdraw')} variant="outline" className="h-16 rounded-2xl border-white/20 bg-white/5 text-white backdrop-blur-md font-black uppercase text-xs tracking-widest hover:bg-white/10">
                    <ArrowDownLeft className="mr-2 h-5 w-5" /> БОЗХОНД
                  </Button>
                </div>
              </div>
            </Card>

            {/* History */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-secondary uppercase tracking-tighter flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> ТАЪРИХИ АМАЛИЁТҲО
              </h3>
              <div className="space-y-3">
                {transactionsLoading ? (
                  <div className="text-center py-10 opacity-50">Боргузорӣ...</div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <Card key={tx.id} className="border-none shadow-sm rounded-2xl p-5 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center",
                          tx.type === 'Deposit' ? "bg-green-100 text-green-600" : 
                          tx.type === 'Withdrawal' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {tx.type === 'Deposit' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-black text-secondary text-sm leading-none mb-1">{tx.description}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            {tx.createdAt?.toDate()?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-black text-lg leading-none mb-1",
                          tx.type === 'Deposit' ? "text-green-600" : "text-red-600"
                        )}>
                          {tx.type === 'Deposit' ? '+' : '-'}{tx.amount}
                        </p>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase border-none px-2",
                          tx.status === 'Completed' ? "bg-green-50 text-green-600" : 
                          tx.status === 'Pending' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                        )}>
                          {tx.status === 'Completed' ? 'МУВАФФАҚ' : tx.status === 'Pending' ? 'ДАР ИНТИЗОР' : 'РАД ШУД'}
                        </Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                    <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Ҳоло таърих нест</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === 'deposit' && (
          <Card className="border-none shadow-3xl rounded-[3rem] p-10 bg-white space-y-8 animate-in slide-in-from-right-10 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-secondary tracking-tighter uppercase">ПУР КАРДАН</h2>
              <p className="text-sm text-muted-foreground font-medium italic">Маблағро ба суратҳисоб гузаронед ва чекро бор кунед.</p>
            </div>

            <div className="p-8 bg-secondary/5 rounded-[2.5rem] border-2 border-dashed border-secondary/20 space-y-6 text-center">
              <div className="flex justify-center"><CreditCard className="h-10 w-10 text-secondary" /></div>
              <div>
                <p className="text-[10px] font-black uppercase opacity-50 mb-1">Рақами Корт (Душанбе Сити):</p>
                <p className="text-3xl font-black text-secondary tracking-tighter">975638778</p>
                <p className="text-sm font-bold text-primary mt-2">Ном: А Б</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Маблағ (TJS)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Сурати чек</Label>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  className="w-full h-32 border-dashed border-2 rounded-2xl flex flex-col gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {receiptImage ? "ЧЕК БОР ШУД" : "ИЛОВАИ СУРАТИ ЧЕК"}
                  </span>
                </Button>
                {receiptImage && <div className="mt-4 relative h-32 w-32 mx-auto rounded-xl overflow-hidden shadow-md"><Image src={receiptImage} fill alt="receipt" className="object-cover" /></div>}
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-2xl border-2 border-dashed border-yellow-200 flex gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0" />
              <p className="text-[10px] font-black text-yellow-700 uppercase leading-relaxed">
                ДИҚҚАТ: Пур кардани ҳисоб дар муддати 24 соат пас аз тафтиши чек аз тарафи мо анҷом меёбад.
              </p>
            </div>

            <Button onClick={handleDeposit} disabled={isSubmitting || !amount || !receiptImage} className="w-full bg-primary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl">ФИРИСТОДАН</Button>
          </Card>
        )}

        {mode === 'withdraw' && (
          <Card className="border-none shadow-3xl rounded-[3rem] p-10 bg-white space-y-8 animate-in slide-in-from-left-10 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-secondary tracking-tighter uppercase">БОЗХОНДИ МАБЛАҒ</h2>
              <p className="text-sm text-muted-foreground font-medium italic">Маблағ ба корти шумо дар муддати 24 соат мерасад.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Рақами корт</Label>
                <Input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="h-14 rounded-2xl font-bold" maxLength={16} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Маблағ (TJS)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl font-bold" />
                <p className="text-[10px] font-black text-primary uppercase text-right">Мавҷуд: {profile.balance} TJS</p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-dashed border-blue-200 flex gap-4">
              <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
              <p className="text-[10px] font-black text-blue-700 uppercase leading-relaxed">
                МАЪЛУМОТ: Ҳангоми бозхонд, маблағ аз тавозуни шумо "банд" мешавад ва пас аз тасдиқ ба корт мерасад.
              </p>
            </div>

            <Button onClick={handleWithdraw} disabled={isSubmitting || !amount || !cardNumber} className="w-full bg-secondary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl">ДАРХОСТ ДОДАН</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
