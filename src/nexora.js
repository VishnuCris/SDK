
import { Event } from "./event";
import { Logger } from "./logger";

export class Nexora{
    constructor(clientId = null, passcode = null, apiDomain = window.apiDomain){
        this.clientId = clientId;
        this.passcode = passcode;
        this.apiDomain = apiDomain;
        // apply this api domain to windows
        window.apiDomain = apiDomain;
        this.event = new Event(clientId, passcode)
        // register all events
        this.registerAllEvents()
    }

    registerAllEvents(){
        this.listenWebsiteLaunchedEvent()
        this.listenWebsiteClosedhEvent()
        this.listenDeviceOnlineEvent()
        this.listenDeviceOfflineEvent()
        this.listenNoticationRecievedEvent()
        this.listenNotificationViewedEvent()
        this.listenNotificationDismissedEvent()
        this.handleGlobalExceptions()
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
            if(event?.data && event.data.json()) // if the notification is from nexora campign then it must contain data as json and we allow to record this event.
                this.event.notificationRecieved()
        });
          
    }

    listenNotificationViewedEvent(){
        window.addEventListener('notificationclick', (event) => {
            if(event?.data && event.data.json()) // if the notification is from nexora campign then it must contain data as json and we allow to record this event.
                this.event.notificationOpened()
        });
          
    }

    listenNotificationDismissedEvent(){
        window.addEventListener('notificationclose', (event) => {
            if(event?.data && event.data.json()) // if the notification is from nexora campign then it must contain data as json and we allow to record this event.
                this.event.notificationDismissed()
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