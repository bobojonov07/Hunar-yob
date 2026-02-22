
"use client"

import { Navbar } from "@/components/navbar";
import { Hammer, ShieldCheck, Zap, Users, Globe, Briefcase, ChevronLeft, Instagram, MessageCircle, Send as TelegramIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-10 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" />
          БОЗГАШТ
        </Button>

        <section className="text-center space-y-8 mb-24">
          <div className="mx-auto h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <Hammer className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-black text-secondary tracking-tighter leading-none">ҲУНАР ЁБ</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Аввалин ва бузургтарин платформаи рақами яки Тоҷикистон барои пайдо кардани устоҳои моҳир ва пешниҳоди хидматҳои ҳунармандӣ.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
          <div className="p-10 bg-white rounded-[3rem] shadow-xl border-none space-y-6 transform hover:-translate-y-2 transition-all">
            <ShieldCheck className="h-12 w-12 text-green-500" />
            <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter">АМНИЯТИ КОМИЛ</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Мо низоми "Шартномаи Амниятӣ"-ро истифода мебарем. Маблағи шумо то анҷоми пурраи кор дар низоми мо ҳифз карда мешавад.
            </p>
          </div>
          <div className="p-10 bg-white rounded-[3rem] shadow-xl border-none space-y-6 transform hover:-translate-y-2 transition-all">
            <Zap className="h-12 w-12 text-primary" />
            <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter">СУРЪАТИ БАЛАНД</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Дигар лозим нест соатҳо дар ҷустуҷӯ бошед. Бо як пахш устои наздиктарини худро пайдо кунед ва мустақиман чат кунед.
            </p>
          </div>
        </div>

        <section className="space-y-12 bg-secondary text-white p-12 md:p-20 rounded-[4rem] shadow-3xl overflow-hidden relative mb-24">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter uppercase">ҲАДАФИ МО</h2>
            <p className="text-lg md:text-xl opacity-80 leading-relaxed font-medium">
              Мақсади асосии лоиҳаи "Ҳунар Ёб" — дастгирии ҳунармандони ватанӣ ва осон кардани ҳаёти мардуми Тоҷикистон мебошад. Мо боварӣ дорем, ки ҳар як маҳорат арзиш дорад ва ҳар як мушкилӣ бояд устои худро ёбад.
            </p>
            <div className="flex flex-wrap gap-8 pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                <span className="font-black uppercase tracking-widest text-xs">10,000+ КОРБАРОН</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-7 w-7 text-primary" />
                <span className="font-black uppercase tracking-widest text-xs">ТАМОМИ ТОҶИКИСТОН</span>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center space-y-10 mb-20">
          <h2 className="text-4xl font-headline font-black text-secondary uppercase tracking-tighter">БО МО ДАР ТАМОС БОШЕД</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-black transition-all">
              <a href="https://instagram.com/taj.web" target="_blank"><Instagram className="mr-3 h-6 w-6" /> INSTAGRAM</a>
            </Button>
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white font-black transition-all">
              <a href="https://t.me/+992200702032" target="_blank"><TelegramIcon className="mr-3 h-6 w-6" /> TELEGRAM</a>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em] pt-10">
            &copy; 2026 ҲУНАР Ё Б. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
          </p>
        </section>
      </main>
    </div>
  );
}
