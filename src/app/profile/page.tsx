
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, ALL_REGIONS, Listing, PREMIUM_PRICE, Deal } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  LogOut, 
  Plus, 
  Camera, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ChevronLeft, 
  Wallet, 
  Loader2, 
  Heart, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  Ban,
  Zap,
  Crown,
  Gem,
  ArrowUpCircle,
  Briefcase,
  Scale
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, collection, query, where, deleteDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "@/firebase";
import { compressImage, cn } from "@/lib/utils";

export default function Profile() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const listingsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "listings"), where("userId", "==", user.uid));
  }, [db, user]);
  const { data: myListings = [] } = useCollection<Listing>(listingsQuery as any);

  const dealsQuery = useMemo(() => {
    if (!db || !user || !profile) return null;
    const field = profile.role === 'Usto' ? 'artisanId' : 'clientId';
    return query(collection(db, "deals"), where(field, "==", user.uid));
  }, [db, user, profile]);
  const { data: myDeals = [] } = useCollection<Deal>(dealsQuery as any);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (profile) { setEditName(profile.name); setEditRegion(profile.region || ""); } }, [profile]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userProfileRef) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 0.7);
        updateDoc(userProfileRef, { profileImage: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userProfileRef) return;
    setIsSaving(true);
    updateDoc(userProfileRef, { name: editName, region: editRegion }).then(() => {
      setIsSettingsOpen(false);
      toast({ title: "Навсозӣ шуд" });
    }).finally(() => setIsSaving(false));
  };

  const handleLogout = async () => { await signOut(auth); router.push("/"); };

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-secondary pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-white font-black"><ChevronLeft className="mr-2 h-5" /> БОЗГАШТ</Button>
          <Button variant="outline" className="rounded-2xl bg-white/5 text-white border-white/20 h-12" onClick={() => setIsSettingsOpen(true)}><Settings className="mr-2 h-5" /> ТАНЗИМОТ</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-3xl rounded-[3rem] p-10 bg-white">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-32 h-32">
                  <Avatar className="w-full h-full border-4 border-primary/20">
                    <AvatarImage src={profile.profileImage} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-secondary text-white p-2 rounded-xl shadow-xl"><Camera className="h-5 w-5" /></button>
                  <input type="file" className="hidden" ref={profileFileInputRef} onChange={handleProfileImageChange} />
                </div>
                <h2 className="text-3xl font-black flex items-center justify-center gap-2">{profile.name} {profile.identificationStatus === 'Verified' && <CheckCircle2 className="h-6 w-6 text-green-500" />}</h2>
                <Badge className="bg-primary h-8 px-4 font-black uppercase">{profile.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                <div className="pt-4"><button onClick={() => router.push("/wallet")} className="w-full bg-secondary p-6 rounded-[2rem] text-white text-left relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black uppercase opacity-60">Ҳамён</span><Wallet className="h-5 w-5 opacity-60" /></div>
                  <div className="flex items-baseline gap-2"><span className="text-4xl font-black">{profile.balance}</span><span className="text-sm opacity-60">TJS</span></div>
                </button></div>
                <Button variant="ghost" className="w-full text-red-500 font-black h-12" onClick={handleLogout}><LogOut className="mr-2 h-5" /> БАРОМАД</Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="deals" className="w-full">
              <TabsList className="bg-white/10 p-2 rounded-3xl h-16 w-full max-w-md">
                <TabsTrigger value="deals" className="flex-1 rounded-2xl font-black text-[10px] uppercase">Шартномаҳо ({myDeals.length})</TabsTrigger>
                <TabsTrigger value="listings" className="flex-1 rounded-2xl font-black text-[10px] uppercase">Эълонҳо ({myListings.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deals" className="mt-8 space-y-6">
                {myDeals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myDeals.map(deal => (
                      <Card key={deal.id} className="border-none shadow-3xl rounded-[2.5rem] bg-white p-8 group hover:scale-[1.02] transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="h-12 w-12 bg-secondary/5 rounded-2xl flex items-center justify-center"><Scale className="h-6 w-6 text-secondary" /></div>
                          <Badge className={cn("rounded-lg font-black text-[9px] uppercase h-7", deal.status === 'Active' ? "bg-green-500" : "bg-yellow-500")}>{deal.status}</Badge>
                        </div>
                        <h3 className="text-xl font-black text-secondary mb-4 uppercase">{deal.title}</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-muted/30 p-4 rounded-2xl"><p className="text-[9px] font-black opacity-50 uppercase mb-1">Маблағ</p><p className="text-xl font-black">{deal.price} TJS</p></div>
                          <div className="bg-muted/30 p-4 rounded-2xl"><p className="text-[9px] font-black opacity-50 uppercase mb-1">Мӯҳлат</p><p className="text-xl font-black">{deal.duration} рӯз</p></div>
                        </div>
                        <Button variant="outline" className="w-full rounded-2xl h-12 border-2 font-black uppercase text-[10px]" onClick={() => router.push(`/chat/${deal.listingId}?client=${deal.clientId}`)}>ЧАТИ ШАРТНОМА</Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-32 bg-white/5 rounded-[3rem] border-4 border-dashed border-white/20"><Scale className="h-16 w-16 mx-auto text-white opacity-20 mb-4" /><p className="text-white font-black uppercase opacity-40">ШАРТНОМАИ ФАЪОЛ НЕСТ</p></div>
                )}
              </TabsContent>

              <TabsContent value="listings" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myListings.map(listing => (
                    <Card key={listing.id} className="overflow-hidden border-none shadow-3xl rounded-[2.5rem] bg-white">
                      <div className="relative h-56 w-full"><Image src={listing.images[0]} alt={listing.title} fill className="object-cover" /></div>
                      <div className="p-6">
                        <h3 className="text-xl font-black mb-4 truncate">{listing.title}</h3>
                        <Button variant="outline" asChild className="w-full rounded-xl border-2 font-black uppercase text-[10px]"><Link href={`/listing/${listing.id}`}>ДИДАН</Link></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-3xl p-8 max-w-md">
          <DialogHeader><DialogTitle className="font-black uppercase">Танзимот</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Ном</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Минтақа</Label>
              <Select value={editRegion} onValueChange={setEditRegion}><SelectTrigger><SelectValue placeholder="Интихоб" /></SelectTrigger><SelectContent>{ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button onClick={handleUpdateProfile} disabled={isSaving} className="w-full bg-primary h-12 font-black uppercase">САБТ КАРДАН</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
