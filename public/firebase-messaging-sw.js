
// Scripts for Firebase Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDLVl5KMbif7lmHbKejig0jM7i_1qX-Wq4",
  authDomain: "hunar-tj-e58cd.firebaseapp.com",
  projectId: "hunar-tj-e58cd",
  storageBucket: "hunar-tj-e58cd.firebasestorage.app",
  messagingSenderId: "213511973181",
  appId: "1:213511973181:web:cf22735a6e164b58b47d54"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
