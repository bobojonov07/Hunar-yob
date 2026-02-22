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
import { Camera, X, Upload, ChevronLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { compressImage } from "@/lib/utils";

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
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (imageUrls.length + files.length > 5) {
      toast({ title: "Маҳдудият", description: "Танҳо то 5 сурат", variant: "destructive" });
      return;
    }

    setIsCompressing(true);
    const newImages: string[] = [];
    
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const compressed = await new Promise<string>((resolve) => {
        reader.onloadend = async () => {
          const res = await compressImage(reader.result as string, 800, 0.7);
          resolve(res);
        };
        reader.readAsDataURL(file);
      });
      newImages.push(compressed);
    }

    setImageUrls(prev => [...prev, ...newImages]);
    setIsCompressing(false);
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
    
    const listingRef = doc(collection(db, "listings"));
    const defaultPlaceholder = PlaceHolderImages[1]?.imageUrl || "https://picsum.photos/seed/carpentry/600/400";
    
    const listingData = {
      id: listingRef.id,
      userId: user.uid,
      userName: profile.name,
      userPhone: profile.phone || "",
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
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: listingRef.path,
          operation: 'create',
          requestResourceData: listingData,
        }));
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

        <Card className="border-border shadow-sm rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-secondary">Эълони нав</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label>Суратҳо (то 5 адад)</Label>
                <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" disabled={isCompressing} variant="outline" className="w-full h-24 border-dashed border-2 flex flex-col gap-2 rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                  {isCompressing ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                  <span>{isCompressing ? 'Фишурдани суратҳо...' : 'Иловаи суратҳо аз галерея'}</span>
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

              <div className="space-y-2">
                <Label>Номи касб ё хидмат</Label>
                <Input placeholder="Масалан: Дуредгари моҳир" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl" />
              </div>
              
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Интихоби категория" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ALL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Тавсифи хидматрасонӣ</Label>
                <Textarea placeholder="Дар бораи маҳорат ва таҷрибаи худ..." className="min-h-[150px] rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="submit" className="flex-1 bg-primary h-14 font-black rounded-xl shadow-lg uppercase">НАШРИ ЭЪЛОН</Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 h-14 rounded-xl font-black uppercase">БЕКОР КАРДАН</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
