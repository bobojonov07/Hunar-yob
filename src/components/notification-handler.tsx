'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken, getMessaging, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export function NotificationHandler() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const setupMessaging = async () => {
      try {
        const messaging = getMessaging();
        
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BPE_ВАПИД_КИ_ШУМО_АЗ_ФАЙРБЕЙС_МЕГИРЕД' // Инро аз Firebase Console > Cloud Messaging гиред
          });

          if (token) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
          }
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          toast({
            title: payload.notification?.title || "Паёми нав",
            description: payload.notification?.body || "Шумо паёми нав доред",
          });
        });

      } catch (error) {
        console.error('Messaging setup failed:', error);
      }
    };

    setupMessaging();
  }, [user, db, toast]);

  return null;
}
