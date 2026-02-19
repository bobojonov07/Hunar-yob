"use client"

import { useEffect, useState } from "react";
import { User, getCurrentUser, setCurrentUser } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hammer, LogOut, User as UserIcon, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Hammer className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold font-headline tracking-tight text-secondary">Ҳунар Ёб</span>
        </Link>

        <div className="flex items-center space-x-3 md:space-x-4">
          {user ? (
            <>
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-sm font-bold text-secondary">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{user.role === 'Usto' ? 'Усто' : 'Мизоҷ'}</span>
              </div>
              <Link href="/profile" className="hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={user.profileImage} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex border-secondary text-secondary hover:bg-secondary hover:text-white">
                <LogOut className="mr-2 h-4 w-4" />
                Баромад
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-secondary font-semibold">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Воридшавӣ
                </Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-white hover:bg-primary/90 font-semibold px-5">
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Сабти ном
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
