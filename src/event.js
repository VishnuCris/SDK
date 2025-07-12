import { API } from "./api/api";
import { Endpoints } from "./api/endpoints";
import { Session } from "./session";
import { Logger } from "./logger";
import { User } from './user';
import { Helpers } from "./utilities/helper";
import {UAParser} from 'ua-parser-js';
import pkg from '../package.json' assert { type: 'json' };



export class Event{
    constructor(clientId = null, apiKey = null, user){
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.user = user;
        this.helpers = new Helpers()
        this.session = new Session(clientId, apiKey)
        this.uaParser = new UAParser();
        this.inactivityTimeout = undefined;
    }

    autoWrapMethods() {
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
          .filter(name => typeof this[name] === "function" && name !== "constructor");
    
        for (const methodName of methodNames) {
          const originalMethod = this[methodName];
    
          this[methodName] = async (...args) => {
            try {
              return await originalMethod.apply(this, args);
            } catch (err) {
              Logger.logError(err, methodName);
              throw err; // Optional: rethrow if needed
            }
          };
        }
      }

    async getDefaultEventProperties(ignorable_properties = []){
        let properties = {}
        properties['timestamp'] = this.helpers.getCurrentTimeStamp()
        properties['session_id'] = this.session.getSession()['session_id']
        properties['session_start_time'] = this.session.getSession()['timestamp']
        // device infos
        let uaResult = this.uaParser.getResult();
        let firebase_token = ""
        if(window?.nexora && window?.nexora?.device){
            let device_details = await window?.nexora?.device.get()
            if(device_details?.firebase_token){
                firebase_token = device_details?.firebase_token
            }
        }
        // if(!ignorable_properties.includes('device')){
        properties['device'] = {
            "os_name" : uaResult.os.name || 'unknown',
            "os_version" : uaResult.os.version || 'unknown',
            "device" : uaResult.device.model || 'unknown',
            "device_type" : uaResult.device.type || 'desktop',
            "browser": uaResult.browser.name || 'unknown',
            "browser_version": uaResult.browser.version || 'unknown',
            "user_agent": navigator.userAgent || 'unknown',
            "firebase_token" : firebase_token,
            "platform" : "web",
            "app_platform" : uaResult.device.type || 'desktop',
        }
    //    }
        if(!ignorable_properties.includes('app')){
            properties['app'] = {
                "name": navigator.appName || 'unknown',
                "version": navigator.appVersion || 'unknown',
                // "build_number": "1234",
                "sdk_version": pkg.version || 'unknown'
            }
        }
        if(!ignorable_properties.includes('network')){
            properties['network'] = {
                "connection_type" : navigator?.connection?.effectiveType || 'unknown'
            }
        }
        if(!ignorable_properties.includes('network')){
            properties['context'] = {
                "locale" : navigator.language || 'en-US',
                "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
                "referrer" :  document.referrer || null,
                "utm_source": new URLSearchParams(window.location.search).get('utm_source')
            }
        }

        properties['client_id'] = this.clientId
        properties['platform'] = "web"

        return properties;
    }

    async push(event_name, payload){
        this.enqueEvents(
            {
                "event_name" : event_name,
                "metadata" : payload,
                ...await this.getDefaultEventProperties()
            }, 
            null,
            true
        )
    }

    async websiteLaunched(properties = {}){
        let event_properties = {
            "event_name": "website_launched",
            "metadata" : {}
        }
        // add additional event properties
        event_properties['metadata'] = {
            "initial_launch": true, // logic for taking this
            "from_background": false, // we can omit this after discussion
            "deep_link_url": null, // we can omit this after discussion
            "push_notification_id": null, // we can omit this after discussion
            "source_campaign": null,
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties()}
        // pushing in queue
        this.enqueEvents(event_properties, function(){
            this.sessionStarted();
            // this.user.create()            
        })
    }

    async screenViewed(properties = {}){
        if(this.user.isExists()){
            // this.sessionStarted()
            let event_properties = {
                "event_name": "screen_viewed",
                "metadata" : {}
            }
            // add additional event properties
            event_properties['metadata'] = {
                "screen_name": document.title,                    // You can also use custom mapping
                "url": window.location.href,
                "referrer": document.referrer || null,           // Previous page URL
                viewDurationSeconds: 0, // we have to take by listening other events (beforeload)    
                ...properties
            };
            // default properties
            event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
            // pushing in queue
            this.enqueEvents(event_properties)
        }else{
            this.websiteLaunched()
            this.resetInactivityTimer()
        }
    }

    async websiteClosed(properties = {}){
        let event_properties = {
            "event_name": "website_closed",
            "metadata" : {}
        }
        // add additional event properties
        event_properties['metadata'] = {
            "session_duration_ms": this.session.getSessionDuration(),
            "reason": "user_terminated",
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        // pushing in queue
        this.enqueEvents(event_properties, function(){
            this.endSession()            
        })
    }

    async sessionStarted(properties = {}){
        let event_properties = {
            "event_name": "session_started",
            "metadata" : {}
        }
        // add additional event properties
        event_properties['metadata'] = {
            "duration_ms": event_properties['user']?.is_logged_in ? false : true,
            "session_number": this.session.getSessionOccurence(),
            "screens_viewed_count": "1", //need to think a logic for this
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        // pushing in queue
        this.enqueEvents(event_properties)
    }

    async sessionEnded(properties = {}){
        let event_properties = {
            "event_name": "session_ended",
            "metadata" : {}
        }
        // add additional event properties
        event_properties['metadata'] = {
            "session_duration_ms": this.session.getSessionDuration(),
            "reason": "user_terminated",
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        // enque events
        this.enqueEvents(event_properties)
    }

    async notificationRecieved(properties = {}){ // need to look for events to capture this
        let event_properties = {
            "event_name": "notification_recieved",
            "metadata" : {}
        }
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['metadata'] = {
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        // enque events
        this.enqueEvents(event_properties)
    }

    async notificationOpened(properties = {}){
        let event_properties = {
            "event_name": "notification_opened",
            "metadata" : {}
        }
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['metadata'] = {
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        //enque events
        this.enqueEvents(event_properties)
    }

    async notificationDismissed(properties = {}){
        let event_properties = {
            "event_name": "notification_dismissed",
            "metadata" : {}
        }
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['metadata'] = {
            // "notification_id": "notif_promo_xyz789",
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        // enque events
        this.enqueEvents(event_properties)
    }

    async deviceOnline(properties = {}){
        let event_properties = {
            "event_name": "device_online",
            "metadata" : {}
        }
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['metadata'] = {
            "connection_type": event_properties?.network?.connection_type,
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties()}
        // qnque events
        await this.enqueEvents(event_properties)
        await window.nexora.device.set({
            "offline" : false
        })
    }

    async deviceOffline(properties = {}){
        let event_properties = {
            "event_name": "device_offline",
            "metadata" : {}
        }
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['metadata'] = {
            ...properties
        };
        // default properties
        event_properties = {...event_properties, ...await this.getDefaultEventProperties()}
        // enque events
        await this.enqueEvents(event_properties)
        await window.nexora.device.set({
            "offline" : true
        })
    }

    async resetInactivityTimer() {
        clearTimeout(this.inactivityTimeout);
        this.inactivityTimeout = setTimeout(() => {
            this.event.sessionEnded()
        }, 20 * 60 * 1000); // 20 minutes
    }

    async enqueEvents(event_properties, executables = null, is_custom_events = false){
        // pushing in queue
        event_properties["user"] = await this.user.get()
        if(is_custom_events){
            window.nexora.eventBuffer.enqueueCustomEvents(
                event_properties,
            )
        }else{
            window.nexora.eventBuffer.enqueueSystemEvents(
                event_properties,
            )
        }
        // call the callbacks
        if(executables)
            executables();
        // flush batch if event size reached threshold size
        window.nexora.batchFlusher.tryImmediateFlush()
    }
}
