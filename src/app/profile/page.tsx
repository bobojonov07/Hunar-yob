
"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, getListings, Listing, deleteListing, updateUser, updateLastSeen, requestIdentification, buyPremium, PREMIUM_PRICE, ALL_REGIONS } from "@/lib/storage";
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
import { Settings, LogOut, Plus, Trash2, MapPin, Phone, Camera, Wallet, ArrowUpRight, CheckCircle2, ShieldAlert, ShieldCheck, Clock, Upload, Crown, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [newImage, setNewImage] = useState("");
  const [completion, setCompletion] = useState(0);
  
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isIdDialogOpen, setIsIdDialogOpen] = useState(false);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    updateLastSeen();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setEditName(currentUser.name);
    setEditPhone(currentUser.phone || "");
    setEditRegion(currentUser.region || "");
    setUserListings(getListings().filter(l => l.userId === currentUser.id));

    let points = 0;
    if (currentUser.name) points += 20;
    if (currentUser.email) points += 20;
    if (currentUser.phone) points += 20;
    if (currentUser.region) points += 20;
    if (currentUser.profileImage) points += 20;
    setCompletion(points);
  }, [router]);

  const handleBuyPremium = () => {
    const res = buyPremium();
    if (res.success) {
      setUser(getCurrentUser());
      toast({ title: res.message });
    } else {
      toast({ title: "Хатогӣ", description: res.message, variant: "destructive" });
    }
  };

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setIdPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitId = () => {
    if (!idPhotoPreview) return;
    if (requestIdentification(idPhotoPreview)) {
      setUser(getCurrentUser());
      setIsIdDialogOpen(false);
      toast({ title: "Дархост фиристода шуд" });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Нест кунем?")) {
      deleteListing(id);
      setUserListings(userListings.filter(l => l.id !== id));
      toast({ title: "Нест карда шуд" });
    }
  };

  const handleUpdateProfile = () => {
    if (user) {
      const updated = { ...user, name: editName, phone: editPhone, region: editRegion };
      updateUser(updated);
      setUser(updated);
      setIsEditDialogOpen(false);
      toast({ title: "Навсозӣ шуд" });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="flex justify-center mb-4 relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                    <AvatarImage src={user.profileImage} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-white font-black">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-0 right-1/2 translate-x-12 bg-secondary text-white p-2 rounded-full shadow-lg"><Camera className="h-4 w-4" /></button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl">
                      <DialogHeader><DialogTitle>Ивази сурат</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input placeholder="URL-и сурат" value={newImage} onChange={(e) => setNewImage(e.target.value)} />
                        <Button onClick={() => { if(user && newImage) { updateUser({...user, profileImage: newImage}); setUser({...user, profileImage: newImage}); setNewImage(""); toast({title:"Навсозӣ шуд"}); } }} className="w-full bg-primary">Сабт</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col items-center">
                  <CardTitle className="text-2xl font-black flex items-center gap-2">
                    {user.name}
                    {user.identificationStatus === 'Verified' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-primary text-primary px-4 py-1 font-black">{user.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                    {user.isPremium && <Badge className="bg-yellow-500 text-white px-4 py-1 font-black"><Crown className="h-3 w-3 mr-1" /> PREMIUM</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 px-8">
                <div className={`p-4 rounded-3xl border flex items-center gap-3 ${
                  user.identificationStatus === 'Verified' ? 'bg-green-50 border-green-200 text-green-700' :
                  user.identificationStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {user.identificationStatus === 'Verified' ? <ShieldCheck className="h-5 w-5" /> : 
                   user.identificationStatus === 'Pending' ? <Clock className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">{user.identificationStatus === 'Verified' ? 'Тасдиқшуда' : user.identificationStatus === 'Pending' ? 'Дар баррасӣ' : 'Идентификатсия лозим'}</p>
                  </div>
                  {user.identificationStatus === 'None' && (
                    <Dialog open={isIdDialogOpen} onOpenChange={setIsIdDialogOpen}>
                      <DialogTrigger asChild><Button size="sm" className="h-8 bg-red-500 text-white rounded-full text-[10px] font-black">ФАЪОЛ КАРДАН</Button></DialogTrigger>
                      <DialogContent className="rounded-3xl p-10">
                        <DialogHeader><DialogTitle className="text-2xl font-black">ИДЕНТИФИКАТСИЯ</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground font-medium">Барои истифодаи ҳамён ва шартномаҳо сурати шиносномаро бор кунед.</p>
                          <div className="aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden" onClick={() => idFileInputRef.current?.click()}>
                            {idPhotoPreview ? <Image src={idPhotoPreview} alt="Preview" width={400} height={200} className="object-cover w-full h-full" /> : <><Upload className="h-8 w-8 text-muted-foreground mb-2" /><span className="text-xs font-bold text-muted-foreground">Бор кардани сурат</span></>}
                          </div>
                          <input type="file" className="hidden" ref={idFileInputRef} onChange={handleIdPhotoChange} accept="image/*" />
                          <Button onClick={handleSubmitId} className="w-full bg-primary h-12 rounded-xl font-black shadow-lg">ФИРИСТОДАН</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1"><span>Пуррагии профил</span><span>{completion}%</span></div>
                  <Progress value={completion} className="h-2 bg-muted rounded-full" />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-3"><div className="bg-muted p-2 rounded-xl"><Phone className="h-4 w-4 text-primary" /></div><div><p className="text-[10px] font-black text-muted-foreground uppercase">Телефон</p><p className="text-sm font-bold">+992 {user.phone || "---"}</p></div></div>
                  <div className="flex items-center gap-3"><div className="bg-muted p-2 rounded-xl"><MapPin className="h-4 w-4 text-primary" /></div><div><p className="text-[10px] font-black text-muted-foreground uppercase">Минтақа</p><p className="text-sm font-bold">{user.region || "---"}</p></div></div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 p-8 pt-0">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline" className="w-full h-12 rounded-xl font-bold"><Settings className="mr-2 h-4 w-4" /> Танзимот</Button></DialogTrigger>
                  <DialogContent className="rounded-3xl p-10">
                    <DialogHeader><DialogTitle className="text-2xl font-black">ТАҲРИРИ ПРОФИЛ</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Label className="font-bold">Ному насаб</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 rounded-xl" />
                      <Label className="font-bold">Минтақа</Label>
                      <Select value={editRegion} onValueChange={setEditRegion}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Минтақа" /></SelectTrigger>
                        <SelectContent className="rounded-xl">{ALL_REGIONS.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                      </Select>
                      <Button onClick={handleUpdateProfile} className="w-full bg-primary h-12 rounded-xl font-black shadow-lg">САБТ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" className="w-full h-12 rounded-xl text-destructive font-bold" onClick={() => { localStorage.removeItem('hunar_yob_current_user'); router.push('/'); }}><LogOut className="mr-2 h-4 w-4" /> Баромад</Button>
              </CardFooter>
            </Card>

            {user.role === 'Usto' && !user.isPremium && (
              <Card className="border-none shadow-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-[2.5rem] p-8 space-y-4">
                <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-xl"><Crown className="h-6 w-6" /></div><h3 className="text-xl font-black">PREMIUM ХАРЕД</h3></div>
                <p className="text-xs font-medium opacity-90">Барои гузоштани то 5 эълон ва VIP-статуси автоматикӣ. Нарх: {PREMIUM_PRICE} TJS / моҳ.</p>
                <Button onClick={handleBuyPremium} className="w-full bg-white text-yellow-600 h-12 rounded-xl font-black shadow-lg">ФАЪОЛ КАРДАН</Button>
              </Card>
            )}

            <Card className="border-none shadow-xl bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-[2.5rem] p-8">
              <div className="flex justify-between items-start mb-6"><div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center"><Wallet className="h-6 w-6 text-primary" /></div><Badge className="bg-primary/20 text-primary border-none font-black text-[10px]">ҲАМЁН</Badge></div>
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Тавозуни ҷорӣ</p>
              <div className="flex items-baseline gap-2 mb-8"><span className="text-4xl font-black">{(user.balance || 0).toLocaleString()}</span><span className="text-xl font-bold opacity-60">TJS</span></div>
              <Button asChild className="w-full bg-primary h-12 rounded-xl font-black shadow-lg"><Link href="/wallet">ПУР КАРДАН <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-secondary flex items-center gap-3"><Zap className="h-8 w-8 text-primary" /> {user.role === 'Usto' ? 'ЭЪЛОНҲОИ МАН' : 'ПИСАНДИДАҲО'}</h2>
              {user.role === 'Usto' && (<Button asChild className="bg-primary h-12 rounded-xl font-black px-6 shadow-lg"><Link href="/create-listing"><Plus className="mr-2 h-4 w-4" /> ЭЪЛОНИ НАВ</Link></Button>)}
            </div>

            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {userListings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden border-none shadow-lg rounded-[2.5rem] bg-white group hover:shadow-2xl transition-all duration-500">
                    <div className="relative h-56 w-full">
                      <Image src={listing.images[0]} alt={listing.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      <Badge className="absolute top-4 left-4 bg-primary text-white border-none px-4 py-1 font-black rounded-full">{listing.category}</Badge>
                      {listing.isVip && <Badge className="absolute top-4 right-4 bg-yellow-500 text-white border-none px-4 py-1 font-black rounded-full shadow-lg">VIP</Badge>}
                    </div>
                    <CardHeader className="p-8 pb-4"><CardTitle className="text-xl font-black text-secondary line-clamp-1">{listing.title}</CardTitle></CardHeader>
                    <CardFooter className="p-8 pt-0 flex justify-between">
                      <Button variant="outline" asChild className="rounded-xl border-primary text-primary h-10 px-6 font-bold"><Link href={`/listing/${listing.id}`}>БИНЕД</Link></Button>
                      <Button variant="ghost" className="text-destructive h-10 w-10 p-0 rounded-xl" onClick={() => handleDelete(listing.id)}><Trash2 className="h-5 w-5" /></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/20 rounded-[3rem] border-4 border-dashed"><p className="text-muted-foreground font-black text-xl">ЭЪЛОНҲО ЁФТ НАШУДАНД.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
