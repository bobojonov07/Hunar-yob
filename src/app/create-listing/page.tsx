"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CATEGORIES, UserProfile } from "@/lib/storage";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Upload, Crown, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";

export default function CreateListing() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (imageUrls.length + files.length > 5) {
      toast({ title: "Маҳдудият", description: "Танҳо то 5 сурат", variant: "destructive" });
      return;
    }
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    if (!title || !category || !description) {
      toast({ title: "Хатогӣ", description: "Ҳамаи майдонҳоро пур кунед", variant: "destructive" });
      return;
    }
    if (description.length < 160 || description.length > 250) {
      toast({ title: "Маҳдудият", description: "Тавсиф 160-250 аломат", variant: "destructive" });
      return;
    }

    const listingRef = doc(collection(db, "listings"));
    const defaultPlaceholder = PlaceHolderImages[1]?.imageUrl || "https://picsum.photos/seed/carpentry/600/400";
    
    const listingData = {
      id: listingRef.id,
      userId: user.uid,
      userName: profile.name,
      title,
      category,
      description,
      images: imageUrls.length > 0 ? imageUrls : [defaultPlaceholder],
      createdAt: serverTimestamp(),
      isVip: profile.isPremium || false,
      views: 0
    };

    setDoc(listingRef, listingData)
      .then(() => {
        toast({ title: "Эълон гузошта шуд" });
        router.push("/");
      })
      .catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: listingRef.path,
          operation: 'create',
          requestResourceData: listingData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (authLoading || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-5 w-5" />
          БОЗГАШТ
        </Button>

        {!profile.isPremium && (
          <Card className="mb-8 border-yellow-500/20 bg-yellow-500/5 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Crown className="h-10 w-10 text-yellow-500" />
              <div>
                <h3 className="font-black text-secondary">Premium харед!</h3>
                <p className="text-xs text-muted-foreground">Имконияти нашри то 5 эълон ва VIP-статуси автоматикӣ.</p>
              </div>
            </div>
            <Button asChild className="bg-yellow-500 text-white font-bold rounded-xl"><Link href="/profile">ХАРИДАН</Link></Button>
          </Card>
        )}

        <Card className="border-border shadow-sm rounded-[2rem]">
          <CardHeader><CardTitle className="text-3xl font-headline text-secondary">Эълони нав</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Номи касб ё хидмат</Label>
                <Input placeholder="Масалан: Дуредгари моҳир" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl" />
              </div>
              
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Интихоби категория" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ALL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Тавсифи хидматрасонӣ (160-250 аломат)</Label>
                <Textarea placeholder="Дар бораи маҳорат ва таҷрибаи худ..." className="min-h-[150px] rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} />
                <p className={`text-xs text-right ${description.length < 160 || description.length > 250 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {description.length} / 250 (камаш 160)
                </p>
              </div>

              <div className="space-y-4">
                <Label>Суратҳо (то 5 адад)</Label>
                <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" variant="outline" className="w-full h-24 border-dashed border-2 flex flex-col gap-2 rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span>Иловаи суратҳо аз галерея</span>
                </Button>
                
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                      <Image src={url} alt={`Preview ${index}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="submit" className="flex-1 bg-primary h-14 font-black rounded-xl shadow-lg">НАШРИ ЭЪЛОН</Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 h-14 rounded-xl">БЕКОР КАРДАН</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
