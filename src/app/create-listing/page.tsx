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
import { Camera, X, Upload, ChevronLeft, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { compressImage } from "@/lib/utils";
import Link from "next/link";

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
    
    // САНҶИШҲОИ САХТ (Validation)
    if (imageUrls.length < 1) {
      toast({ title: "Хатогӣ", description: "Лутфан ҳадди ақал 1 сурат бор кунед", variant: "destructive" });
      return;
    }
    if (!title || !category) {
      toast({ title: "Хатогӣ", description: "Майдонҳои унвон ва категорияро пур кунед", variant: "destructive" });
      return;
    }
    if (description.length < 150) {
      toast({ title: "Тавсиф хеле кӯтоҳ аст", description: "Тавсиф бояд ҳадди ақал 150 аломат бошад", variant: "destructive" });
      return;
    }
    if (description.length > 250) {
      toast({ title: "Тавсиф хеле дароз аст", description: "Тавсиф набояд аз 250 аломат зиёд бошад", variant: "destructive" });
      return;
    }
    
    const listingRef = doc(collection(db, "listings"));
    
    const listingData = {
      id: listingRef.id,
      userId: user.uid,
      userName: profile.name,
      userPhone: profile.phone || "",
      title,
      category,
      description,
      images: imageUrls,
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

        {/* ПАЁМ БАРОИ KORYOB.RU */}
        <div className="mb-8 p-6 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2rem] flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <ExternalLink className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-secondary leading-tight">Агар хоҳед эълони корӣ кунед (коргар кобед), ба вебсайти шарики мо гузаред:</p>
            <Link href="https://koryob.ru" target="_blank" className="text-primary font-black uppercase tracking-widest text-xs hover:underline mt-1 inline-block">KORYOB.RU</Link>
          </div>
        </div>

        <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10 pb-8">
            <CardTitle className="text-3xl font-headline font-black text-secondary tracking-tighter">ЭЪЛОНИ НАВ</CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Маҳорати худро ба ҳама нишон диҳед</p>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Суратҳо (ҳадди ақал 1)</Label>
                  <span className="text-[10px] font-bold text-muted-foreground">{imageUrls.length}/5</span>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" disabled={isCompressing} variant="outline" className="w-full h-32 border-dashed border-2 flex flex-col gap-2 rounded-2xl transition-all hover:bg-primary/5 hover:border-primary/30" onClick={() => fileInputRef.current?.click()}>
                  {isCompressing ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                  <span className="font-bold text-xs uppercase tracking-widest">{isCompressing ? 'Фишурдани суратҳо...' : 'Иловаи суратҳо'}</span>
                </Button>
                
                <div className="grid grid-cols-5 gap-3 mt-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md group">
                      <Image src={url} alt={`Preview ${index}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-black text-xs uppercase tracking-widest opacity-60">Номи касб ё хидмат</Label>
                <Input placeholder="Масалан: Дуредгари моҳир" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" />
              </div>
              
              <div className="space-y-2">
                <Label className="font-black text-xs uppercase tracking-widest opacity-60">Категория</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-muted font-bold"><SelectValue placeholder="Интихоби категория" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {ALL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Тавсифи хидматрасонӣ</Label>
                  <span className={cn(
                    "text-[10px] font-black tracking-widest",
                    description.length < 150 || description.length > 250 ? "text-red-500" : "text-green-500"
                  )}>
                    {description.length} / 150-250
                  </span>
                </div>
                <Textarea 
                  placeholder="Дар бораи маҳорат ва таҷрибаи худ муфассал нависед (ҳадди ақал 150 аломат)..." 
                  className="min-h-[180px] rounded-2xl bg-muted/20 border-muted font-medium p-6" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
                <p className="text-[9px] text-muted-foreground font-medium italic">* Тавсифи муфассал бовариро зиёд мекунад.</p>
              </div>

              <div className="pt-6 flex gap-4">
                <Button type="submit" className="flex-1 bg-primary h-16 font-black rounded-[2rem] shadow-2xl uppercase tracking-widest transition-transform hover:scale-[1.02]">НАШРИ ЭЪЛОН</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
