
import { API } from "./api/api";
import { Endpoints } from "./api/endpoints";
import { Event } from "./event";
import { Logger } from "./logger";
import BatchFlusher from "./modules/batch_flusher";
import EventBuffer from "./modules/event_buffer";
import EventDispatcher from "./modules/event_dispatcher";
import SDKConfig from "./modules/sdk_config";
import { User } from "./user";
import { Device } from "./device";
import FirebasePushSDK from "./notifications/firebase";
import { Storage } from "./storage";

export class NexoraCore{    
    constructor(clientId, apiKey, apiDomain){
        this.api = new API(clientId, apiKey, apiDomain)
        this.storage = new Storage();
        this.user = new User(this.clientId, this.apiKey, this.api, this.storage);
        this.event = new Event(clientId, apiKey, this.user)
        this.device = new Device()
        this.config = new SDKConfig();
        this.eventBuffer = new EventBuffer()
        this.eventDispatcher = new EventDispatcher(
            this.api,
            this.config.get('batch_size'),
        )
        this.batchFlusher = new BatchFlusher(this.eventBuffer, this.eventDispatcher, this.config)
        this.registerSystemEvents()
        this.batchFlusher.start();
        this.FirebasePushSDK = FirebasePushSDK;
        this.visibilityHiddenAt = 0;
    }

    registerSystemEvents(){
        // this.listenWebsiteLaunchedEvent()
        this.listenWebsiteClosedhEvent()
        this.listenDeviceOnlineEvent()
        this.listenDeviceOfflineEvent()
        this.listenFirebaseServiceWorkerMessages()
        this.handleGlobalExceptions()
    }

    onDOMReady(){
        let self = this
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // DOM already ready — call immediately
            self.listenWebsiteLaunchedEvent()
          } else {
            window.addEventListener('DOMContentLoaded', () => {
                self.listenWebsiteLaunchedEvent()
            });
          }
    }
    
    listenWebsiteLaunchedEvent(){
        // alert("inside load event")
        console.log("inside load event")
        this.event.screenViewed()
    }

    listenWebsiteClosedhEvent(){
        // window.addEventListener('beforeunload', () => {
        //     console.log("inside on beforeunload")
        //     this.event.websiteClosed()
        // });
        let self = this
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              self.visibilityHiddenAt = Date.now();
            }
        });
        
        window.addEventListener('pagehide', (event) => {
        const now = Date.now();
        
        if (now - self.visibilityHiddenAt < 200) {
            // Heuristic: Tab closed (not just backgrounded)
            console.log('[SDK] Tab was closed.');
            this.event.websiteClosed()
        }
        });
          
    }
      
    listenDeviceOnlineEvent(){
        window.addEventListener('online', () => {
            this.event.deviceOnline()
        });
          
    }

    listenDeviceOfflineEvent(){
        window.addEventListener('offline', () => {
            this.event.deviceOffline()
        });
          
    }

    listenFirebaseServiceWorkerMessages() {
        console.log(navigator.serviceWorker)
        console.log("((((((navigator.serviceWorker))))))")
        if (!navigator.serviceWorker) return;
      
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log("inside messae ---------------")
            const { messageType, notification } = event.data || {};
            console.log(messageType)
            console.log(notification)
            console.log("[Nexora SDK] SW message received:", messageType, notification);
        
            switch (messageType) {
            case 'push-received':
                this.event.notificationRecieved(notification);
                break;
            case 'notification-clicked':
                this.event.notificationOpened(notification);
                break;
            case 'notification_dismissed':
                this.event.notificationDismissed(notification);
                break;
            }
        });
      }
      

    handleGlobalExceptions(){
        window.addEventListener("error", (event) => {
            Logger.logError(event.error || event.message, "global_error");
        });
          
        window.addEventListener("unhandledrejection", (event) => {
            Logger.logError(event.reason, "unhandled_promise_rejection");
        });
    }

}