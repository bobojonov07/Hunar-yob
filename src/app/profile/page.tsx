
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, getListings, Listing, deleteListing, updateUser } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, LogOut, Plus, Trash2, MapPin, Phone, Calendar, Camera, Wallet, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

const REGIONS = ["Душанбе", "Хатлон", "Суғд", "ВМКБ", "Ноҳияҳои тобеи марказ"];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [newImage, setNewImage] = useState("");
  
  // Edit Profile States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
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
  }, [router]);

  const handleDelete = (id: string) => {
    if (confirm("Шумо мутмаин ҳастед, ки ин эълонро нест кардан мехоҳед?")) {
      deleteListing(id);
      setUserListings(userListings.filter(l => l.id !== id));
      toast({
        title: "Нест карда шуд",
        description: "Эълон бо муваффақият нест карда шуд",
      });
    }
  };

  const handleUpdateImage = () => {
    if (user && newImage) {
      const updated = { ...user, profileImage: newImage };
      updateUser(updated);
      setUser(updated);
      setNewImage("");
      toast({
        title: "Навсозӣ шуд",
        description: "Сурати профил бо муваффақият иваз карда шуд",
      });
    }
  };

  const handleUpdateProfile = () => {
    if (user) {
      if (editName.length < 3) {
        toast({ title: "Хатогӣ", description: "Ном бояд на кам аз 3 аломат бошад", variant: "destructive" });
        return;
      }
      if (editPhone.length !== 9) {
        toast({ title: "Хатогӣ", description: "Рақам бояд 9 рақам бошад", variant: "destructive" });
        return;
      }

      const updated = { 
        ...user, 
        name: editName, 
        phone: editPhone, 
        region: editRegion 
      };
      updateUser(updated);
      setUser(updated);
      setIsEditDialogOpen(false);
      toast({
        title: "Навсозӣ шуд",
        description: "Маълумоти профил бо муваффақият иваз карда шуд",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4 relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                    <AvatarImage src={user.profileImage} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-0 right-1/2 translate-x-12 bg-secondary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera className="h-4 w-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ивази сурати профил</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>URL-и сурат</Label>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            value={newImage}
                            onChange={(e) => setNewImage(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleUpdateImage} className="w-full bg-primary">Сабт кардан</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardTitle className="text-2xl font-headline font-bold">{user.name}</CardTitle>
                <Badge variant="outline" className="mt-2 border-primary text-primary px-4 py-1">
                  {user.role === 'Usto' ? 'Усто' : 'Мизоҷ'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Телефон</p>
                      <p className="text-sm font-medium">{user.phone || "Маълумот нест"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Минтақа</p>
                      <p className="text-sm font-medium">{user.region || "Маълумот нест"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Санаи таваллуд</p>
                      <p className="text-sm font-medium">{user.birthDate || "Маълумот нест"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-0">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-border">
                      <Settings className="mr-2 h-4 w-4" />
                      Танзимот
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Таҳрири профил</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="editName">Ному насаб</Label>
                        <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editPhone">Телефон (бе +992)</Label>
                        <Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} maxLength={9} />
                      </div>
                      <div className="space-y-2">
                        <Label>Минтақа</Label>
                        <Select value={editRegion} onValueChange={setEditRegion}>
                          <SelectTrigger>
                            <SelectValue placeholder="Интихоби минтақа" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full bg-primary">Сабти навсозиҳо</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    localStorage.removeItem('hunar_yob_current_user');
                    router.push('/');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Баромад
                </Button>
              </CardFooter>
            </Card>

            {/* Wallet Card */}
            <Card className="border-border shadow-md bg-gradient-to-br from-secondary to-secondary/80 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/20">Ҳамён</Badge>
                </div>
                <p className="text-sm opacity-60 mb-1">Тавозуни ҷорӣ</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-black">{(user.balance || 0).toLocaleString()}</span>
                  <span className="text-xl font-bold opacity-60">TJS</span>
                </div>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white border-none h-12 rounded-xl group">
                  <Link href="/wallet">
                    ПУР КАРДАН
                    <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* User Content Area */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-headline font-bold text-secondary">
                {user.role === 'Usto' ? 'Эълонҳои ман' : 'Эълонҳои писандида'}
              </h2>
              {user.role === 'Usto' && (
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/create-listing">
                    <Plus className="mr-2 h-4 w-4" />
                    Эълони нав
                  </Link>
                </Button>
              )}
            </div>

            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userListings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden border-border group hover:shadow-md transition-shadow">
                    <div className="relative h-48 w-full">
                      <Image 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-3 left-3 bg-primary text-white border-none">
                        {listing.category}
                      </Badge>
                    </div>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg font-headline line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</CardTitle>
                    </CardHeader>
                    <CardFooter className="py-4 border-t flex justify-between">
                      <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                        <Link href={`/listing/${listing.id}`}>Бингар</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(listing.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-muted/20 rounded-xl border-2 border-dashed flex flex-col items-center">
                <p className="text-muted-foreground mb-6 text-lg">Шумо ҳоло эълон надоред.</p>
                {user.role === 'Usto' && (
                  <Button asChild className="bg-primary px-8">
                    <Link href="/create-listing">Аввалин эълонро гузоред</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
