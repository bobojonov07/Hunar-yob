
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, getListings } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, MessageSquare, ChevronLeft, Calendar, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const allListings = getListings();
    const found = allListings.find(l => l.id === id);
    if (found) {
      setListing(found);
    }
  }, [id]);

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Бозгашт
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Images Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border">
              <Image 
                src={listing.images[activeImage]} 
                alt={listing.title} 
                fill 
                className="object-cover"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto py-2">
                {listing.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-70'}`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-10">
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-secondary mb-4">{listing.title}</h1>
              <div className="flex flex-wrap gap-4 mb-8">
                <Badge className="bg-primary text-white px-4 py-1">{listing.category}</Badge>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(listing.createdAt).toLocaleDateString('tg-TJ')}
                </div>
              </div>
              <div className="prose prose-orange max-w-none">
                <h3 className="text-xl font-bold mb-3">Дар бораи хидматрасонӣ:</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-border shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                    {listing.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{listing.userName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      Устои тасдиқшуда
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center text-secondary">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Макони фаъолият
                    </p>
                    <p className="text-muted-foreground pl-6">Душанбе, Тоҷикистон</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-white py-6 text-lg">
                      <Phone className="mr-2 h-5 w-5" />
                      +992 --- -- -- --
                    </Button>
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 py-6 text-lg">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Чат бо усто
                    </Button>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  Лутфан ҳангоми тамос бигӯед, ки эълонро аз платформаи "Ҳунар Ёб" пайдо кардед.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
