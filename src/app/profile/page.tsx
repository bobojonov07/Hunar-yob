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
import { Settings, LogOut, Plus, Trash2, MapPin, Phone, Camera, ShieldAlert, ShieldCheck, Clock, Upload, Crown, Zap, ChevronLeft, Handshake, Star, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, query, where, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
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
  const [isIdDialogOpen, setIsIdDialogOpen] = useState(false);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
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
        const updateData = { profileImage: base64String };
        updateDoc(userProfileRef, updateData)
          .then(() => toast({ title: "Сурати профил навсозӣ шуд" }))
          .catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userProfileRef.path,
              operation: 'update',
              requestResourceData: updateData
            }));
          });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBuyPremium = async () => {
    if (!userProfileRef || !profile) return;
    if (profile.balance < PREMIUM_PRICE) {
      toast({ title: "Маблағ нокифоя аст", description: "Лутфан ҳамёнро пур кунед", variant: "destructive" });
      return;
    }
    const updateData = { 
      isPremium: true, 
      balance: profile.balance - PREMIUM_PRICE 
    };
    updateDoc(userProfileRef, updateData)
      .then(() => toast({ title: "Premium фаъол шуд!" }))
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setIdPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitId = async () => {
    if (!idPhotoPreview || !userProfileRef) return;
    const updateData = { identificationStatus: 'Pending' };
    updateDoc(userProfileRef, updateData)
      .then(() => {
        setIsIdDialogOpen(false);
        toast({ title: "Дархост фиристода шуд" });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const handleDeleteListing = async (listingId: string) => {
    if (confirm("Нест кунем?")) {
      const listingRef = doc(db, "listings", listingId);
      deleteDoc(listingRef)
        .then(() => toast({ title: "Нест карда шуд" }))
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: listingRef.path,
            operation: 'delete'
          }));
        });
    }
  };

  const handleUpdateProfile = async () => {
    if (userProfileRef) {
      const updateData = { name: editName, region: editRegion };
      updateDoc(userProfileRef, updateData)
        .then(() => {
          setIsEditDialogOpen(false);
          toast({ title: "Навсозӣ шуд" });
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userProfileRef.path,
            operation: 'update',
            requestResourceData: updateData
          }));
        });
    }
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
                    {profile.identificationStatus === 'Verified' && <CheckCircle2 className="h-6 w-6 text-green-500 fill-green-50" />}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-primary text-primary px-4 py-1 font-black rounded-xl uppercase tracking-widest text-[10px]">{profile.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                    {profile.isPremium && <Badge className="bg-yellow-500 text-white px-4 py-1 font-black rounded-xl text-[10px]"><Crown className="h-3 w-3 mr-1" /> PREMIUM</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 px-8">
                <div className={`p-6 rounded-[2rem] border-2 border-dashed flex items-center gap-4 ${
                  profile.identificationStatus === 'Verified' ? 'bg-green-50 border-green-200 text-green-700' :
                  profile.identificationStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="h-10 w-10 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
                    {profile.identificationStatus === 'Verified' ? <ShieldCheck className="h-6 w-6" /> : 
                     profile.identificationStatus === 'Pending' ? <Clock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{profile.identificationStatus === 'Verified' ? 'Тасдиқшуда' : profile.identificationStatus === 'Pending' ? 'Дар баррасӣ' : 'Идентификатсия лозим'}</p>
                    <p className="text-[9px] font-medium opacity-60">Барои шартномаҳои бехатар</p>
                  </div>
                  {profile.identificationStatus === 'None' && (
                    <Dialog open={isIdDialogOpen} onOpenChange={setIsIdDialogOpen}>
                      <DialogTrigger asChild><Button size="sm" className="h-9 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black px-4">ФАЪОЛ</Button></DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl">
                        <DialogHeader><DialogTitle className="text-3xl font-black text-secondary tracking-tighter uppercase">ИДЕНТИФИКАТСИЯ</DialogTitle></DialogHeader>
                        <div className="space-y-6 pt-6">
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">Барои истифодаи пурраи ҳамён ва бастани шартномаҳои амниятӣ, лутфан сурати шиносномаро бор кунед.</p>
                          <div className="aspect-video border-4 border-dashed rounded-[2rem] bg-muted/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-muted/30 group" onClick={() => idFileInputRef.current?.click()}>
                            {idPhotoPreview ? <Image src={idPhotoPreview} alt="Preview" width={400} height={200} className="object-cover w-full h-full" /> : <><Upload className="h-10 w-10 text-muted-foreground mb-3 group-hover:scale-110 transition-transform" /><span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Бор кардани сурат</span></>}
                          </div>
                          <input type="file" className="hidden" ref={idFileInputRef} onChange={handleIdPhotoChange} accept="image/*" />
                          <Button onClick={handleSubmitId} className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest">ФИРИСТОДАН</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-3xl text-center">
                        <Handshake className="h-5 w-5 mx-auto text-primary mb-2" />
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">ШАРТНОМАҲО</p>
                        <p className="font-black text-xl">0</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-3xl text-center">
                        <Star className="h-5 w-5 mx-auto text-yellow-500 mb-2 fill-yellow-500" />
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">РЕЙТИНГ</p>
                        <p className="font-black text-xl">5.0</p>
                    </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1 text-secondary opacity-60"><span>Пуррагии профил</span><span>{completion}%</span></div>
                  <Progress value={completion} className="h-3" />
                </div>

                <div className="space-y-5 pt-6 border-t border-muted">
                  <div className="flex items-center gap-4"><div className="bg-primary/5 p-3 rounded-2xl"><Phone className="h-5 w-5 text-primary" /></div><div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Телефон</p><p className="text-sm font-black text-secondary">+992 {profile.phone || "---"}</p></div></div>
                  <div className="flex items-center gap-4"><div className="bg-primary/5 p-3 rounded-2xl"><MapPin className="h-5 w-5 text-primary" /></div><div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Минтақа</p><p className="text-sm font-black text-secondary">{profile.region || "---"}</p></div></div>
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
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Минтақа</Label>
                        <Select value={editRegion} onValueChange={setEditRegion}>
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-muted font-bold"><SelectValue placeholder="Минтақа" /></SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-3xl">{ALL_REGIONS.map(r => (<SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest">САБТ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50" onClick={handleLogout}><LogOut className="mr-3 h-5 w-5" /> Баромад</Button>
              </CardFooter>
            </Card>

            {profile.role === 'Usto' && !profile.isPremium && (
              <Card className="border-none shadow-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-[2.5rem] p-10 space-y-6 relative overflow-hidden group">
                <div className="flex items-center gap-4"><div className="bg-white/20 p-3 rounded-2xl backdrop-blur-xl shadow-lg"><Crown className="h-8 w-8" /></div><h3 className="text-2xl font-black tracking-tighter">PREMIUM ХАРЕД</h3></div>
                <p className="text-xs font-bold leading-relaxed opacity-90">Барои гузоштани то 5 эълон ва VIP-статуси автоматикӣ. Нархи обуна: <span className="text-xl font-black">{PREMIUM_PRICE} TJS</span> / моҳ.</p>
                <Button onClick={handleBuyPremium} className="w-full bg-white text-yellow-600 h-14 rounded-2xl font-black shadow-2xl hover:scale-[1.03] transition-all uppercase tracking-widest">ФАЪОЛ КАРДАН</Button>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-4xl font-black text-secondary flex items-center gap-4 tracking-tighter"><div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center"><Zap className="h-7 w-7 text-primary" /></div> {profile.role === 'Usto' ? 'ЭЪЛОНҲОИ МАН' : 'ПИСАНДИДАҲО'}</h2>
              {profile.role === 'Usto' && (<Button asChild className="bg-primary h-14 rounded-2xl font-black px-8 shadow-xl uppercase tracking-widest transition-all hover:scale-[1.03]"><Link href="/create-listing"><Plus className="mr-3 h-5 w-5" /> ЭЪЛОНИ НАВ</Link></Button>)}
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
                    <CardFooter className="p-10 pt-0 flex justify-between gap-4">
                      <Button variant="outline" asChild className="flex-1 rounded-2xl border-muted text-secondary h-12 px-6 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-secondary hover:text-white border-2"><Link href={`/listing/${listing.id}`}>БИНЕД</Link></Button>
                      <Button variant="ghost" className="text-red-400 h-12 w-12 p-0 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => handleDeleteListing(listing.id)}><Trash2 className="h-6 w-6" /></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-muted/50 shadow-inner group">
                <Zap className="h-20 w-20 mx-auto text-muted mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-muted-foreground font-black text-xl uppercase tracking-[0.2em] opacity-40">ЭЪЛОНҲО ЁФТ НАШУДАНД</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
