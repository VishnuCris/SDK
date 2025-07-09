
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

export class NexoraCore{    
    constructor(clientId, apiKey, apiDomain){
        // instance of api
        this.api = new API(clientId, apiKey, apiDomain)
        // instance of user
        this.user = new User(this.clientId, this.apiKey, this.api);
        // instance of event
        this.event = new Event(clientId, apiKey, this.user)
        // instance of device
        this.device = new Device()
        // set config of sdk
        this.config = new SDKConfig();
        // create instance for event modules
        this.eventBuffer = new EventBuffer()
        this.eventDispatcher = new EventDispatcher(
            this.api,
            this.config.get('batch_size'),
        )
        this.batchFlusher = new BatchFlusher(this.eventBuffer, this.eventDispatcher, this.config)
        // register all events
        this.registerSystemEvents()
        // start batch flusher
        this.batchFlusher.start();
        // notifications
        this.FirebasePushSDK = FirebasePushSDK;
    }

    registerSystemEvents(){
        this.listenWebsiteLaunchedEvent()
        this.listenWebsiteClosedhEvent()
        this.listenDeviceOnlineEvent()
        this.listenDeviceOfflineEvent()
        this.listenNoticationRecievedEvent()
        this.listenNotificationViewedEvent()
        this.listenNotificationDismissedEvent()
        this.handleGlobalExceptions()
        this.listenFirebaseServiceWorkerMessages()
    }

    listenWebsiteLaunchedEvent(){
        window.addEventListener('load', () => {
            this.event.screenViewed()
        });
    }

    listenWebsiteClosedhEvent(){
        window.addEventListener('beforeunload', () => {
            this.event.websiteClosed()
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

    listenNoticationRecievedEvent(){
        window.addEventListener('push', (event) => {
            console.log("inside notification push")
            console.log(event)
            if(event?.data && event.data.json()) // if the notification is from nexora campign then it must contain data as json and we allow to record this event.
                this.event.notificationRecieved()
        });
          
    }

    listenNotificationViewedEvent(){
        window.addEventListener('notificationclick', (event) => {
            console.log("inside notification click")
            console.log(event)
            if(event?.data && event.data.json()) // if the notification is from nexora campign then it must contain data as json and we allow to record this event.
                this.event.notificationOpened()
        });
          
    }

    listenNotificationDismissedEvent(){
        window.addEventListener('notificationclose', (event) => {
            console.log("inside notification close")
            console.log(event)
            if(event?.data && event.data.json()) // if the notification is from nexora campign then it must contain data as json and we allow to record this event.
                this.event.notificationDismissed()
        });
          
    }

    listenFirebaseServiceWorkerMessages() {
        if (!navigator.serviceWorker) return;
      
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log(event)
            console.log("(((event)))")
          const { messageType, notification } = event.data || {};
          console.log("[Nexora SDK] SW message received:", messageType, notification);
      
          switch (messageType) {
            case 'push-received':
              this.event.notificationRecieved(notification);
              break;
            case 'notification_opened':
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

    // get config of sdk

}