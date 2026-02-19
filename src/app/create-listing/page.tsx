"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, saveListing, User } from "@/lib/storage";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Plus } from "lucide-react";
import Image from "next/image";

const CATEGORIES = ["Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", "Дигар"];

export default function CreateListing() {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'Usto') {
      router.push("/");
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleAddImage = () => {
    if (imageUrls.length >= 5) {
      toast({
        title: "Маҳдудият",
        description: "Шумо метавонед танҳо то 5 сурат илова кунед",
        variant: "destructive",
      });
      return;
    }
    if (newImageUrl) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !description) {
      toast({
        title: "Хатогӣ",
        description: "Лутфан ҳамаи майдонҳоро пур кунед",
        variant: "destructive",
      });
      return;
    }

    // Use a default placeholder from the library if no images were provided by the user
    const defaultPlaceholder = PlaceHolderImages[1]?.imageUrl || "https://picsum.photos/seed/carpentry/600/400";

    const listing = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user!.id,
      userName: user!.name,
      title,
      category,
      description,
      images: imageUrls.length > 0 ? imageUrls : [defaultPlaceholder],
      createdAt: new Date().toISOString(),
    };

    saveListing(listing);
    toast({
      title: "Эълон гузошта шуд",
      description: "Эълони шумо бо муваффақият нашр шуд",
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-secondary">Эълони нав</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Номи касб ё хидмат</Label>
                <Input 
                  id="title" 
                  placeholder="Масалан: Дуредгари моҳир" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Интихоби категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Тавсифи хидматрасонӣ</Label>
                <Textarea 
                  id="description" 
                  placeholder="Дар бораи маҳорат ва таҷрибаи худ нависед..." 
                  className="min-h-[150px]"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <Label>Суратҳо (то 5 адад)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="URL-и сурат" 
                    value={newImageUrl} 
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  />
                  <Button type="button" onClick={handleAddImage} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                      <Image src={url} alt={`Preview ${index}`} fill className="object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length < 5 && (
                    <div className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                      <Camera className="h-6 w-6 mb-1 opacity-50" />
                      <span className="text-[10px]">{imageUrls.length}/5</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                  Нашри эълон
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Бекор кардан
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
