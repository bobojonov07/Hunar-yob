
"use client"

import { useUser, useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hammer, LogOut, Heart, LogIn, UserPlus, Menu, Info, Search, MessageSquare, User, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const menuItems = [
    { label: "Асосӣ", icon: Home, href: "/" },
    { label: "Эълонҳо", icon: Search, href: "/listings" },
    { label: "Паёмҳо", icon: MessageSquare, href: "/messages", authRequired: true },
    { label: "Писандидаҳо", icon: Heart, href: "/favorites", authRequired: true },
    { label: "Профил", icon: User, href: "/profile", authRequired: true },
    { label: "Оиди барнома", icon: Info, href: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                <Menu className="h-6 w-6 text-secondary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="rounded-r-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white w-80">
              <SheetHeader className="p-10 bg-secondary text-white">
                <SheetTitle className="text-3xl font-black font-headline tracking-tighter text-white flex items-center gap-3">
                  <Hammer className="h-8 w-8 text-primary fill-primary/20" />
                  ҲУНАР ЁБ
                </SheetTitle>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Менюи барнома</p>
              </SheetHeader>
              <div className="p-6 space-y-2">
                {menuItems.map((item) => {
                  if (item.authRequired && !user) return null;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center gap-5 p-5 rounded-2xl hover:bg-muted transition-all group">
                        <item.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-black text-secondary tracking-tight">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
                {user && (
                  <button onClick={handleLogout} className="w-full flex items-center gap-5 p-5 rounded-2xl hover:bg-red-50 transition-all group text-red-500">
                    <LogOut className="h-6 w-6" />
                    <span className="font-black tracking-tight">Баромад</span>
                  </button>
                )}
              </div>
              <div className="absolute bottom-10 left-10 right-10">
                 <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 text-center">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Version 1.0.0</p>
                    <p className="text-[9px] font-medium text-muted-foreground mt-1">Таҳияшуда аз ҷониби TAJ.WEB</p>
                 </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black font-headline tracking-tighter text-secondary">Ҳунар Ёб</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          {user ? (
            <>
              <Link href="/favorites" className="hidden md:flex text-secondary hover:text-primary transition-colors items-center mr-2">
                <Heart className="h-5 w-5 mr-1" />
                <span className="text-sm font-black uppercase tracking-widest text-[10px]">Писандидаҳо</span>
              </Link>
              <Link href="/profile" className="hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                  <AvatarImage src={user.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white font-black text-xs uppercase">
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-secondary font-black uppercase tracking-widest text-[10px]">
                <Link href="/login">Воридшавӣ</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-white hover:bg-primary/90 font-black rounded-xl px-6 h-10 uppercase tracking-widest text-[10px] shadow-lg">
                <Link href="/register">Сабти ном</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
