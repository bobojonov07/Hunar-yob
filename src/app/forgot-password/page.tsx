"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Mail, ArrowLeft, Key } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [foundPassword, setFoundPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (user) {
      setFoundPassword(user.password || "");
      setStep(2);
      toast({
        title: "Ёфт шуд",
        description: "Маълумоти воридшавии шумо барқарор шуд",
      });
    } else {
      toast({
        title: "Хатогӣ",
        description: "Корбар бо ин почта ёфт нашуд",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-secondary">Барқарории рамз</CardTitle>
            <CardDescription>
              {step === 1 
                ? "Почтаи худро ворид кунед, то рамзатонро бинед" 
                : "Рамзи шумо бо муваффақият ёфт шуд"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <form onSubmit={handleRecover} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Почтаи электронӣ</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="example@mail.tj" 
                      className="pl-10"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Барқарор кардан</Button>
              </form>
            ) : (
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center space-y-3">
                <Key className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Рамзи шумо:</p>
                <p className="text-3xl font-black text-secondary tracking-tighter">{foundPassword}</p>
                <p className="text-xs text-muted-foreground pt-4">Шумо метавонед акнун ворид шавед.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {step === 2 && (
              <Button asChild className="w-full bg-secondary hover:bg-secondary/90">
                <Link href="/login">Воридшавӣ</Link>
              </Button>
            )}
            <Button variant="ghost" asChild className="w-full text-muted-foreground">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Бозгашт ба воридшавӣ
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}