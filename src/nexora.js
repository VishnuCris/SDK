
import { Event } from "./event";
import { API } from "./api/api";
import { User } from "./user";

export class Nexora{
    constructor(clientId = null, passcode = null, apiDomain = window.apiDomain){
        this.clientId = clientId;
        this.passcode = passcode;
        this.apiDomain = apiDomain;
        // apply this api domain to windows
        window.apiDomain = apiDomain;
        this.event = new Event(clientId, passcode)
        this.user = new User(clientId, passcode)
    }

    listenWebsiteLaunchedEvent(){
        window.addEventListener('load', () => {
            this.event.website_launched()
        });
          
    }

    listenWebsiteClosedhEvent(){
        window.addEventListener('beforeunload', () => {
            this.event.website_launched()
        });
          
    }

    // listenScreenViewedEvent(){ // screen view
    //     window.addEventListener('load', () => {
    //         this.event.website_launched()
    //     });
          
    // }

    // listenSessionStartsEvent(){ // session starts
    //     window.addEventListener('load', () => {
    //         this.event.website_launched()
    //     });
          
    // }

    // listenSessionEndsEvent(){ // session ends
    //     window.addEventListener('load', () => {
    //         this.event.website_launched()
    //     });
          
    // }

    listenDeviceOnlineEvent(){
        window.addEventListener('online', () => {
            this.event.device_online()
        });
          
    }

    listenDeviceOfflineEvent(){
        window.addEventListener('offline', () => {
            this.event.device_offline()
        });
          
    }

    listenNoticationRecievedEvent(){
        window.addEventListener('push', () => {
            this.event.notification_recieved()
        });
          
    }

    listenNotificationViewedEvent(){
        window.addEventListener('notificationclick', () => {
            this.event.notification_opened()
        });
          
    }

    listenNotificationDismissedEvent(){
        window.addEventListener('notificationclose', () => {
            this.event.website_launched()
        });
          
    }
}