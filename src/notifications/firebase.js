import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export default class FirebasePushSDK {
  constructor(config) {
    if (!FirebasePushSDK.instance) {
      this.firebaseConfig = config.firebaseConfig;
      this.vapidKey = config.vapidKey;
      this.backendRegisterURL = config.backendRegisterURL; // Optional
      this._initFirebase();
      FirebasePushSDK.instance = this;
    }

    return FirebasePushSDK.instance;
  }

  _initFirebase() {
    this.app = initializeApp(this.firebaseConfig);
    this.messaging = getMessaging(this.app);
    this._registerServiceWorkerAndGenerateToken();
    this._setupForegroundListener();
  }

  async _registerServiceWorkerAndGenerateToken() {
    try {
      const permission = await Notification.requestPermission();
      console.log(permission)
      console.log("((((permission))))")
      if (permission !== 'granted') {
        console.warn('Notification permission not granted.');
        return;
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        // serviceWorkerRegistration: swRegistration
      });

      if (token) {
        console.log("FCM Token:", token);
        // set this token in device object
        await window.nexora.device.set({
          "firebase_token" : token
        })
        // trigger a event
        
        // Optionally register token to your backend
        if (this.backendRegisterURL) {
          await fetch(this.backendRegisterURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
        }
      } else {
        console.warn("Failed to get FCM token.");
      }

    } catch (error) {
      console.error("Error setting up FCM:", error);
    }
  }  

  _setupForegroundListener() {
      onMessage(this.messaging, (payload) => {
          console.log("Foreground message received:", payload);
          // You can also emit an event or callback here
          if (Notification.permission === "granted") {
            const { title, body, image, icon } = payload.notification || {};

            new Notification(title || "New Message", {
                body: body || "",
                icon: icon || image || "/default-icon.png"
            });
          }
      });
  }

    saveFirebaseConfigToIndexedDB = (config) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('FirebaseSDK', 1);
    
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('config')) {
            db.createObjectStore('config');
          }
        };
    
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('config', 'readwrite');
          const store = tx.objectStore('config');
          store.put(config, 'firebaseConfig');
          tx.oncomplete = resolve;
          tx.onerror = reject;
        };
    
        request.onerror = reject;
      });
    };
    
}
