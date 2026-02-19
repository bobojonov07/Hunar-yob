import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: 'Ҳунар Ёб - Пайдо кардани устоҳои моҳир',
  description: 'Платформаи муосир барои пайдо кардани устоҳо ва пешниҳоди хидматҳои ҳунармандӣ дар Тоҷикистон',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen pb-16 md:pb-0">
        {children}
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
