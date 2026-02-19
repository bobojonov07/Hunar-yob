
"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers, setCurrentUser } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      setCurrentUser(user);
      toast({
        title: "Хуш омадед",
        description: `Салом, ${user.name}!`,
      });
      router.push("/");
    } else {
      toast({
        title: "Хатогӣ",
        description: "Почта ё рамзи нодуруст",
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
            <CardTitle className="text-3xl font-headline text-secondary">Воридшавӣ</CardTitle>
            <CardDescription>Ба кабинети шахсии худ ворид шавед</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Ворид шудан</Button>
              <p className="text-sm text-center text-muted-foreground">
                Ҳанӯз сабти ном нашудаед?{" "}
                <Link href="/register" className="text-primary hover:underline">Сабти ном</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
