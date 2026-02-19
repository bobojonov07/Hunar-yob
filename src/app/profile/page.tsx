
"use client"

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, getListings, Listing, deleteListing, updateUser, updateLastSeen, requestIdentification } from "@/lib/storage";
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
import { Settings, LogOut, Plus, Trash2, MapPin, Phone, Calendar, Camera, Wallet, ArrowUpRight, CheckCircle2, ShieldAlert, ShieldCheck, Clock, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

const REGIONS = ["Душанбе", "Хатлон", "Суғд", "ВМКБ", "Ноҳияҳои тобеи марказ"];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [newImage, setNewImage] = useState("");
  const [completion, setCompletion] = useState(0);
  
  // Edit Profile States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Identification States
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
    
    const listings = getListings().filter(l => l.userId === currentUser.id);
    setUserListings(listings);

    let points = 0;
    if (currentUser.name) points += 20;
    if (currentUser.email) points += 20;
    if (currentUser.phone) points += 20;
    if (currentUser.region) points += 20;
    if (currentUser.profileImage) points += 20;
    setCompletion(points);
  }, [router]);

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitId = () => {
    if (!idPhotoPreview) {
      toast({ title: "Хатогӣ", description: "Лутфан сурати шиносномаро бор кунед", variant: "destructive" });
      return;
    }
    const success = requestIdentification(idPhotoPreview);
    if (success) {
      setUser(getCurrentUser());
      setIsIdDialogOpen(false);
      toast({ title: "Дархост фиристода шуд", description: "Маълумоти шумо барои тасдиқ фиристода шуд" });
    }
  };

  // Mock auto-verify for demo purposes (In real app, admin does this)
  const handleAutoVerify = () => {
    if (user) {
      const updated = { ...user, identificationStatus: 'Verified' as const };
      updateUser(updated);
      setUser(updated);
      toast({ title: "Тасдиқ шуд", description: "Профили шумо бо муваффақият тасдиқ гардид" });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Шумо мутмаин ҳастед, ки ин эълонро нест кардан мехоҳед?")) {
      deleteListing(id);
      setUserListings(userListings.filter(l => l.id !== id));
      toast({ title: "Нест карда шуд" });
    }
  };

  const handleUpdateImage = () => {
    if (user && newImage) {
      const updated = { ...user, profileImage: newImage };
      updateUser(updated);
      setUser(updated);
      setNewImage("");
      toast({ title: "Навсозӣ шуд" });
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
            <Card className="border-border shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4 relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                    <AvatarImage src={user.profileImage} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-white">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-0 right-1/2 translate-x-12 bg-secondary text-white p-2 rounded-full shadow-lg"><Camera className="h-4 w-4" /></button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Ивази сурати профил</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input placeholder="URL-и сурат" value={newImage} onChange={(e) => setNewImage(e.target.value)} />
                        <Button onClick={handleUpdateImage} className="w-full bg-primary">Сабт</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col items-center">
                  <CardTitle className="text-2xl font-headline font-bold flex items-center gap-2">
                    {user.name}
                    {user.identificationStatus === 'Verified' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </CardTitle>
                  <Badge variant="outline" className="mt-2 border-primary text-primary px-4 py-1">{user.role === 'Usto' ? 'Усто' : 'Мизоҷ'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Identification Status Banner */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  user.identificationStatus === 'Verified' ? 'bg-green-50 border-green-200 text-green-700' :
                  user.identificationStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {user.identificationStatus === 'Verified' ? <ShieldCheck className="h-5 w-5" /> : 
                   user.identificationStatus === 'Pending' ? <Clock className="h-5 w-5" /> : 
                   <ShieldAlert className="h-5 w-5" />}
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest">
                      {user.identificationStatus === 'Verified' ? 'Тасдиқшуда' : 
                       user.identificationStatus === 'Pending' ? 'Дар баррасӣ' : 'Идентификатсия лозим'}
                    </p>
                    <p className="text-[10px] opacity-80">
                      {user.identificationStatus === 'Verified' ? 'Профили шумо 100% ҳифз шудааст.' :
                       user.identificationStatus === 'Pending' ? 'Лутфан интизор шавед.' : 'Ҳамёнро фаъол созед.'}
                    </p>
                  </div>
                  {user.identificationStatus === 'None' && (
                    <Dialog open={isIdDialogOpen} onOpenChange={setIsIdDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-8 bg-red-500 text-white rounded-full text-[10px]">ФАЪОЛ КАРДАН</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Идентификатсияи шахсият</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">Барои истифодаи ҳамён ва бастан шартномаҳо, лутфан сурати шиносномаи худро бор кунед.</p>
                          <div 
                            className="aspect-video border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 overflow-hidden"
                            onClick={() => idFileInputRef.current?.click()}
                          >
                            {idPhotoPreview ? (
                              <Image src={idPhotoPreview} alt="Passport Preview" width={400} height={200} className="object-cover w-full h-full" />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-xs font-bold text-muted-foreground">Бор кардани сурат</span>
                              </>
                            )}
                          </div>
                          <input type="file" className="hidden" ref={idFileInputRef} onChange={handleIdPhotoChange} accept="image/*" />
                          <Button onClick={handleSubmitId} className="w-full bg-primary font-bold">ФИРИСТОДАН</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {user.identificationStatus === 'Pending' && (
                     <Button size="sm" onClick={handleAutoVerify} className="h-8 bg-yellow-500 text-white rounded-full text-[10px] whitespace-nowrap">АВТО-ТАСДИҚ (TEST)</Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Пуррагии профил</span>
                    <span>{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-2 bg-muted" />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md"><Phone className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">Телефон</p><p className="text-sm font-medium">{user.phone || "Маълумот нест"}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md"><MapPin className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">Минтақа</p><p className="text-sm font-medium">{user.region || "Маълумот нест"}</p></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-0">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start"><Settings className="mr-2 h-4 w-4" /> Танзимот</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Таҳрири профил</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Label>Ному насаб</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <Label>Телефон (9 рақам)</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} maxLength={9} />
                      <Label>Минтақа</Label>
                      <Select value={editRegion} onValueChange={setEditRegion}>
                        <SelectTrigger><SelectValue placeholder="Интихоби минтақа" /></SelectTrigger>
                        <SelectContent>{REGIONS.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                      </Select>
                      <Button onClick={handleUpdateProfile} className="w-full bg-primary">Сабти навсозиҳо</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { localStorage.removeItem('hunar_yob_current_user'); router.push('/'); }}><LogOut className="mr-2 h-4 w-4" /> Баромад</Button>
              </CardFooter>
            </Card>

            <Card className="border-border shadow-md bg-gradient-to-br from-secondary to-secondary/80 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center"><Wallet className="h-6 w-6 text-primary" /></div>
                  <Badge className="bg-primary/20 text-primary border-primary/20">Ҳамён</Badge>
                </div>
                <p className="text-sm opacity-60 mb-1">Тавозуни ҷорӣ</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-black">{(user.balance || 0).toLocaleString()}</span>
                  <span className="text-xl font-bold opacity-60">TJS</span>
                </div>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl">
                  <Link href="/wallet">ПУР КАРДАН <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-headline font-bold text-secondary">{user.role === 'Usto' ? 'Эълонҳои ман' : 'Эълонҳои писандида'}</h2>
              {user.role === 'Usto' && (<Button asChild className="bg-primary"><Link href="/create-listing"><Plus className="mr-2 h-4 w-4" /> Эълони нав</Link></Button>)}
            </div>

            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userListings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden border-border group hover:shadow-md transition-shadow">
                    <div className="relative h-48 w-full">
                      <Image src={listing.images[0]} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <Badge className="absolute top-3 left-3 bg-primary text-white border-none">{listing.category}</Badge>
                    </div>
                    <CardHeader className="py-4"><CardTitle className="text-lg font-headline line-clamp-1">{listing.title}</CardTitle></CardHeader>
                    <CardFooter className="py-4 border-t flex justify-between">
                      <Button variant="outline" size="sm" asChild className="border-primary text-primary"><Link href={`/listing/${listing.id}`}>Бингар</Link></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(listing.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-muted/20 rounded-xl border-2 border-dashed flex flex-col items-center">
                <p className="text-muted-foreground mb-6 text-lg">Шумо ҳоло эълон надоред.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
