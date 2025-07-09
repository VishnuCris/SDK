importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const readConfigFromIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FirebaseSDK', 1);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('config', 'readonly');
      const store = tx.objectStore('config');
      const getRequest = store.get('firebaseConfig');

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = reject;
    };

    request.onerror = reject;
  });
};

readConfigFromIndexedDB()
  .then((firebaseConfig) => {
    if (!firebaseConfig) throw new Error("Firebase config not found in IndexedDB");

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Background message:', payload);
      const { title, body, icon, image } = payload.notification || {};
      self.registration.showNotification(title || 'Notification', {
        body: body || '',
        icon: icon || image || '/firebase-logo.png',
      });
    });
  })
  .catch((err) => {
    console.error("Failed to load Firebase config in service worker:", err);
  });
