importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDLVl5KMbif7lmHbKejig0jM7i_1qX-Wq4",
  authDomain: "hunar-tj-e58cd.firebaseapp.com",
  projectId: "hunar-tj-e58cd",
  storageBucket: "hunar-tj-e58cd.firebasestorage.app",
  messagingSenderId: "213511973181",
  appId: "1:213511973181:web:cf22735a6e164b58b47d54"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Паём дар пасманзар қабул шуд:', payload);

  const notificationTitle = payload.notification.title || 'HUNAR-YOB';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
