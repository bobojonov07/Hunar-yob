"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, ALL_REGIONS, PREMIUM_PRICE, Listing } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, LogOut, Plus, Trash2, MapPin, Phone, Camera, ShieldAlert, ShieldCheck, Clock, Crown, Zap, ChevronLeft, Handshake, Star, CheckCircle2, Lock, Wallet, FileCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, collection, query, where, deleteDoc, serverTimestamp } from "firebase/firestore";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function Profile() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const listingsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "listings"), where("userId", "==", user.uid));
  }, [db, user]);
  const { data: userListings = [] } = useCollection<Listing>(listingsQuery as any);

  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isKycDialogOpen, setIsKycDialogOpen] = useState(false);
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditRegion(profile.region || "");
    }
  }, [profile]);

  const completion = useMemo(() => {
    if (!profile) return 0;
    let points = 0;
    if (profile.name) points += 20;
    if (profile.email) points += 20;
    if (profile.phone) points += 20;
    if (profile.region) points += 20;
    if (profile.profileImage) points += 20;
    return points;
  }, [profile]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userProfileRef) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        updateDoc(userProfileRef, { profileImage: base64String })
          .then(() => toast({ title: "Сурати профил навсозӣ шуд" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKycSubmit = async () => {
    if (!userProfileRef) return;
    setKycLoading(true);
    // Simulation of KYC processing
    setTimeout(async () => {
      await updateDoc(userProfileRef, { identificationStatus: 'Pending' });
      toast({ title: "Дархост фиристода шуд", description: "Маълумоти шумо дар давоми 24 соат баррасӣ мешавад." });
      setIsKycDialogOpen(false);
      setKycLoading(false);
    }, 2000);
  };

  const handleBuyPremium = async () => {
    if (!userProfileRef || !profile) return;
    if (profile.balance < PREMIUM_PRICE) {
      toast({ title: "Маблағ нокифоя аст", description: "Лутфан ҳамёнро пур кунед", variant: "destructive" });
      router.push("/wallet");
      return;
    }
    await updateDoc(userProfileRef, { 
      isPremium: true, 
      balance: profile.balance - PREMIUM_PRICE 
    });
    toast({ title: "Premium фаъол шуд!" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (authLoading || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-5 w-5" />
          БОЗГАШТ
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="flex justify-center mb-4 relative group">
                  <Avatar className="h-32 w-32 ring-8 ring-primary/5 shadow-2xl">
                    <AvatarImage src={profile.profileImage} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-white font-black">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-1/2 translate-x-12 bg-secondary text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform active:scale-95">
                    <Camera className="h-5 w-5" />
                  </button>
                  <input type="file" className="hidden" ref={profileFileInputRef} onChange={handleProfileImageChange} accept="image/*" />
                </div>
                <div className="flex flex-col items-center">
                  <CardTitle className="text-2xl font-black flex items-center gap-2 tracking-tighter text-secondary">
                    {profile.name}
                    {profile.identificationStatus === 'Verified' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-primary text-primary px-4 py-1 font-black rounded-xl uppercase tracking-widest text-[10px]">{profile.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                    {profile.isPremium && <Badge className="bg-yellow-500 text-white px-4 py-1 font-black rounded-xl text-[10px]"><Crown className="h-3 w-3 mr-1" /> PREMIUM</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 px-8">
                <Link href="/wallet" className="block p-6 bg-secondary text-white rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Тавозуни Ҳамён</span>
                    <Wallet className="h-5 w-5 opacity-60" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">{profile.balance || 0}</span>
                    <span className="text-sm font-bold opacity-60">TJS</span>
                  </div>
                </Link>

                <Dialog open={isKycDialogOpen} onOpenChange={setIsKycDialogOpen}>
                  <DialogTrigger asChild>
                    <button className={`w-full p-6 rounded-[2rem] border-2 border-dashed flex items-center gap-4 text-left transition-all hover:scale-[1.01] ${
                      profile.identificationStatus === 'Verified' ? 'bg-green-50 border-green-200 text-green-700' :
                      profile.identificationStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                      'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <div className="h-10 w-10 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
                        {profile.identificationStatus === 'Verified' ? <ShieldCheck className="h-6 w-6" /> : 
                         profile.identificationStatus === 'Pending' ? <Clock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{profile.identificationStatus === 'Verified' ? 'Тасдиқшуда' : profile.identificationStatus === 'Pending' ? 'Дар баррасӣ' : 'Тасдиқи шахсият'}</p>
                        <p className="text-[9px] font-medium opacity-60">Барои гирифтани нишони касбӣ пахш кунед</p>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl">
                    <DialogHeader><DialogTitle className="text-3xl font-black text-secondary tracking-tighter uppercase">ТАСДИҚИ ШАХСИЯТ (KYC)</DialogTitle></DialogHeader>
                    <div className="space-y-6 pt-6 text-center">
                      <div className="h-32 w-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                        <FileCheck className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Барои он ки мизоҷон ба шумо бештар бовар кунанд, лутфан акси шиносномаи худро боргузорӣ кунед. Мо маълумоти шуморо ҳифз мекунем.
                      </p>
                      <div className="border-2 border-dashed rounded-2xl p-8 hover:bg-muted/50 cursor-pointer transition-colors">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Боргузории акси шиноснома</span>
                      </div>
                      <Button onClick={handleKycSubmit} disabled={kycLoading} className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest">
                        {kycLoading ? "ДАР ҲОЛИ ФИРИСТОДАН..." : "ТАСДИҚ КАРДАН"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1 text-secondary opacity-60"><span>Пуррагии профил</span><span>{completion}%</span></div>
                  <Progress value={completion} className="h-3" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 p-8 pt-0">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest border-2"><Settings className="mr-3 h-5 w-5" /> Танзимот</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl">
                    <DialogHeader><DialogTitle className="text-3xl font-black text-secondary tracking-tighter uppercase">ТАҲРИРИ ПРОФИЛ</DialogTitle></DialogHeader>
                    <div className="space-y-6 pt-6">
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Ному насаб</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" />
                      </div>
                      <Button onClick={() => setIsEditDialogOpen(false)} className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest">САБТ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50" onClick={handleLogout}><LogOut className="mr-3 h-5 w-5" /> Баромад</Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-4xl font-black text-secondary flex items-center gap-4 tracking-tighter">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center"><Zap className="h-7 w-7 text-primary" /></div> 
                {profile.role === 'Usto' ? 'ЭЪЛОНҲОИ МАН' : 'ПИСАНДИДАҲО'}
              </h2>
              {profile.role === 'Usto' && (
                <Button asChild className="bg-primary h-14 rounded-2xl font-black px-8 shadow-xl uppercase tracking-widest transition-all hover:scale-[1.03]">
                  <Link href="/create-listing"><Plus className="mr-3 h-5 w-5" /> ЭЪЛОНИ НАВ</Link>
                </Button>
              )}
            </div>

            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {userListings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden border-none shadow-xl rounded-[3rem] bg-white group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image src={listing.images[0]} alt={listing.title} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <Badge className="absolute top-6 left-6 bg-primary/95 text-white border-none px-6 py-2.5 font-black rounded-2xl backdrop-blur-xl shadow-xl">{listing.category}</Badge>
                      {listing.isVip && <Badge className="absolute top-6 right-6 bg-yellow-500 text-white border-none px-6 py-2.5 font-black rounded-2xl shadow-xl animate-pulse">VIP</Badge>}
                    </div>
                    <CardHeader className="p-10 pb-4"><CardTitle className="text-2xl font-black text-secondary line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{listing.title}</CardTitle></CardHeader>
                    <CardFooter className="p-10 pt-0">
                      <Button variant="outline" asChild className="w-full rounded-2xl border-muted text-secondary h-12 px-6 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-secondary hover:text-white border-2">
                        <Link href={`/listing/${listing.id}`}>БИНЕД</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-muted/50 shadow-inner group">
                <Zap className="h-20 w-20 mx-auto text-muted mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-muted-foreground font-black text-xl uppercase tracking-[0.2em] opacity-40 text-center px-4">ЭЪЛОНҲО ЁФТ НАШУДАНД</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
