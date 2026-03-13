'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { Chat, UserProfile } from '@/lib/storage';

export function NotificationHandler() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  const lastUnreadCounts = useRef<Record<string, number>>({});

  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userRef as any);

  // 1. Мониторинги чатҳо барои огоҳии фаврӣ дар дохили сайт
  useEffect(() => {
    if (!user || !db || !profile?.notificationsEnabled) return;

    const qClient = query(collection(db, "chats"), where("clientId", "==", user.uid));
    const qArtisan = query(collection(db, "chats"), where("artisanId", "==", user.uid));

    const handleChatUpdate = (snapshot: any) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type === "modified") {
          const chat = { ...change.doc.data(), id: change.doc.id } as Chat;
          const currentUnread = chat.unreadCount?.[user.uid] || 0;
          const previousUnread = lastUnreadCounts.current[chat.id] || 0;

          if (currentUnread > previousUnread && !pathname.includes(chat.id)) {
            toast({
              title: "Паёми нав",
              description: chat.lastMessage || "Шумо паёми нав доред",
            });
            
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("HUNAR-YOB", {
                body: chat.lastMessage,
                icon: "/favicon.ico"
              });
            }
          }
          lastUnreadCounts.current[chat.id] = currentUnread;
        } else if (change.type === "added") {
          const chat = change.doc.data() as Chat;
          lastUnreadCounts.current[change.doc.id] = chat.unreadCount?.[user.uid] || 0;
        }
      });
    };

    const unsubClient = onSnapshot(qClient, handleChatUpdate);
    const unsubArtisan = onSnapshot(qArtisan, handleChatUpdate);

    return () => {
      unsubClient();
      unsubArtisan();
    };
  }, [user, db, pathname, toast, profile?.notificationsEnabled]);

  // 2. Танзими Push Notifications (FCM)
  useEffect(() => {
    if (!user || !profile?.notificationsEnabled || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const VAPID_KEY = 'BGVxKMXQsAoqyit-aDl7ye39XrvHg3yArY5iiU2Xbavitkd5nBdJpNhq2zqFlQcP3GaIIw6p7PsdLesUe8nsRXQ'; 

    const setupMessaging = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging();
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
          });

          if (token) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
          }
        }

        onMessage(messaging, (payload) => {
          console.log('Паёми фаврӣ қабул шуд:', payload);
          toast({
            title: payload.notification?.title || "Огоҳӣ",
            description: payload.notification?.body || "Шумо паёми нав доред",
          });
        });

      } catch (error) {
        console.error('Хатогӣ дар FCM:', error);
      }
    };

    setupMessaging();
  }, [user, db, toast, profile?.notificationsEnabled]);

  return null;
}
