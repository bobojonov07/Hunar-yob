
"use client"

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/bottom-nav";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { NotificationHandler } from "@/components/notification-handler";
import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
        <FirebaseClientProvider>
          <NotificationHandler />
          <Heartbeat />
          {children}
          <BottomNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

// Simple component to update user's lastActive status
function Heartbeat() {
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (!user || !db) return;

    const updateStatus = () => {
      updateDoc(doc(db, "users", user.uid), {
        lastActive: serverTimestamp()
      }).catch(() => {});
    };

    updateStatus();
    const interval = setInterval(updateStatus, 4 * 60 * 1000); // Every 4 mins
    return () => clearInterval(interval);
  }, [user, db]);

  return null;
}
