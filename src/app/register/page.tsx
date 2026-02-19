
"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { saveUser, setCurrentUser, UserRole } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Client");
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        title: "Хатогӣ",
        description: "Лутфан ҳамаи майдонҳоро пур кунед",
        variant: "destructive",
      });
      return;
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password,
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    
    toast({
      title: "Муваффақият",
      description: "Шумо бо муваффақият сабти ном шудед!",
    });
    
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-20">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-secondary">Сабти ном</CardTitle>
            <CardDescription>Барои истифода аз хизматрасониҳо сабти ном кунед</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Ному насаб</Label>
                <Input 
                  id="name" 
                  placeholder="Масалан: Алиев Валӣ" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Почтаи электронӣ</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@mail.tj" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Рамз</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="******" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Шумо кистед?</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="Client" id="client" className="peer sr-only" />
                    <Label
                      htmlFor="client"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <UserIcon className="mb-3 h-6 w-6" />
                      Мизоҷ
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="Usto" id="usto" className="peer sr-only" />
                    <Label
                      htmlFor="usto"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Hammer className="mb-3 h-6 w-6" />
                      Усто
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Давом додан</Button>
              <p className="text-sm text-center text-muted-foreground">
                Аллакай аъзо ҳастед?{" "}
                <Link href="/login" className="text-primary hover:underline">Ворид шавед</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
