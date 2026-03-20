
"use client"

import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  ChevronLeft, 
  Loader2, 
  Clock,
  Construction
} from "lucide-react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export default function VerifyPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (profile?.identificationStatus === 'Verified') router.push("/profile");
  }, [user, authLoading, profile, router]);

  if (authLoading || !profile) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
        </Button>

        <div className="space-y-8 animate-in fade-in duration-1000">
          <div className="mx-auto h-32 w-32 bg-yellow-50 rounded-[3rem] flex items-center justify-center shadow-inner relative">
            <Construction className="h-16 w-16 text-yellow-500 animate-bounce" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase">ДАР ҲОЛАТИ КОРКАРД</h1>
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20">
              <p className="text-xl font-medium text-muted-foreground leading-relaxed italic">
                "Ин бахш айни замон дар ҳолати такмилдиҳӣ қарор дорад ва дар ояндаи наздик дастрас мегардад. Ташаккур барои сабратон!"
              </p>
            </div>
          </div>
          <Button onClick={() => router.push("/profile")} className="bg-secondary h-16 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">БА ПРОФИЛ БАРГАРДЕД</Button>
        </div>
      </div>
    </div>
  );
}
