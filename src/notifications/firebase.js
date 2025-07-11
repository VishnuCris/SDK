import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';

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
      if (permission !== 'granted') {
        console.warn('Notification permission not granted.');
        return;
      }
  
      // ✅ Explicitly register your service worker
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  
      // ✅ Now get token using the SW
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: swRegistration
      });
  
      if (token) {
        console.log("FCM Token:", token);
  
        const device_details = await window.nexora.device.get();
        if (!device_details?.firebase_token) {
          window.nexora.user.tokenPush(token);
  
          if (this.backendRegisterURL) {
            await fetch(this.backendRegisterURL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
          }
        }
      } else {
        console.warn("Failed to get FCM token.");
      }
  
    } catch (error) {
      console.error("Error setting up FCM:", error);
    }
  }
    

  _setupForegroundListener() {
    if (!this.messaging) {
      console.warn("Messaging not initialized");
      return;
    }
  
    onMessage(this.messaging, (payload) => {
      console.log("Foreground message received:", payload);
  
      const { title, body, image, icon } = payload.notification || {};
  
      if (Notification.permission === "granted") {
        new Notification(title || "New Message", {
          body: body || "",
          icon: icon || image || "/default-icon.png"
        });
      } else {
        console.warn("Notification permission not granted in foreground");
      }
    });
  }

    deleteFcmToken(){
      deleteToken(this.messaging).then(() => {
        console.log('FCM token deleted successfully');
      }).catch((err) => {
        console.error('Unable to delete FCM token:', err);
      });
    }
    
}
