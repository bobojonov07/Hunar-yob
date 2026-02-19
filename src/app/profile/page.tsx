
"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { User, getCurrentUser, getListings, Listing, deleteListing } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, Plus, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-border">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                    <AvatarFallback className="text-2xl bg-primary text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
                <Badge variant="outline" className="mt-2 border-primary text-primary px-4 py-1">
                  {user.role === 'Usto' ? 'Усто' : 'Мизоҷ'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Почтаи электронӣ</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Макон</p>
                  <p className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    Душанбе, Тоҷикистон
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Танзимот
                </Button>
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
                  <Card key={listing.id} className="overflow-hidden border-border group">
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
                      <CardTitle className="text-lg font-headline line-clamp-1">{listing.title}</CardTitle>
                    </CardHeader>
                    <CardFooter className="py-4 border-t flex justify-between">
                      <Button variant="outline" size="sm" asChild>
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
              <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                <p className="text-muted-foreground mb-4">Шумо ҳоло эълон надоред.</p>
                {user.role === 'Usto' && (
                  <Button asChild className="bg-primary">
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
