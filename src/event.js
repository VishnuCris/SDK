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
        this.helpers = new Helpers();
        this.session = new Session(clientId, apiKey);
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
              throw err; 
            }
          };
        }
      }

    async getDefaultEventProperties(ignorable_properties = []){
        let properties = {}
        properties['timestamp'] = this.helpers.getCurrentTimeStamp()
        properties['session_id'] = this.session.getSession()['session_id']
        properties['session_start_time'] = this.session.getSession()['timestamp']
        let uaResult = this.uaParser.getResult();
        let firebase_token = ""
        if(window?.nexora && window?.nexora?.device){
            let device_details = await window?.nexora?.device.get()
            if(device_details?.firebase_token){
                firebase_token = device_details?.firebase_token
            }
        }
        // get device_id from storage
        let device_details = await window.nexora.device.get()
        let device_id = await device_details?.device_id
        if(!device_id){
            device_id = await window.nexora.device.get_device_id()
        }
        properties['device'] = {
            os_name: uaResult.os.name || '',
            os_version: uaResult.os.version || '',
            device: uaResult.device.model || '',
            device_type: uaResult.device.type || 'desktop',
            browser: uaResult.browser.name || '',
            browser_version: uaResult.browser.version || '',
            user_agent: navigator.userAgent || '',
            firebase_token: firebase_token, // make sure it's defined above
            platform: 'web',
            app_platform: uaResult.device.type || 'desktop',
            device_model: uaResult.device.model || '',
            device_brand: uaResult.device.vendor || '',        // ✅ Corrected
            device_manufacturer: uaResult.device.vendor || '', // ✅ Corrected
            device_id: device_id, // should be generated & stored persistently
            carrier: '' // ✅ Fixed typo: was "career"
        }
    //    }
        if(!ignorable_properties.includes('app')){
            properties['app'] = {
                "name": navigator.appName || '',
                "version": navigator.appVersion || '',
                "sdk_version": pkg.version || '',
                "build_number":process.env.BUILD_NUMBER || 'dev'
            }
        }
        if(!ignorable_properties.includes('network')){
            properties['network'] = {
                "connection_type" : navigator?.connection?.effectiveType || ''
            }
        }
        if(!ignorable_properties.includes('context')){
            properties['context'] = {
                "locale" : 'en-US',
                "timezone": 'GMT',
            }
        }

        properties['client_id'] = this.clientId
        properties['platform'] = "web"

        // mark event count in device
        let event_count = device_details?.event_count ? device_details.event_count + 1 : 1
        await window.nexora.device.set({
            "event_count" : event_count
        })
        // event screen viewed count
        let screen_viewed_count = device_details?.screen_viewed_count
        screen_viewed_count = screen_viewed_count ? screen_viewed_count + 1 : 1
        await window.nexora.device.set({
            "screen_viewed_count" : screen_viewed_count
        })
        return properties;
    }

    async push(event_name, payload){
        this.enqueEvents(
            {
                "event_name" : event_name,
                "event_properties" : payload,
                ...await this.getDefaultEventProperties()
            }, 
            null,
            true
        )
    }

    async websiteLaunched(properties = {}){
        let self = this
        let event_properties = {
            "event_name": "app_opened",
            "event_properties" : {}
        }
        event_properties['event_properties'] = {
            "initial_launch": true, 
            "from_background": false,
            "deep_link_url": "",
            "push_notification_id": "",
            "source_campaign": "",
            ...properties
        };
        event_properties = {...event_properties, ...await this.getDefaultEventProperties()}
        this.enqueEvents(event_properties, async function(){
            await self.sessionStarted();
        })
    }

    async screenViewed(properties = {}){
        console.log(await this.user.isExists())
        if(!(await this.user.isExists())){
            await this.websiteLaunched()
            await this.resetInactivityTimer()
        }
    }

    async websiteClosed(properties = {}){
        let event_properties = {
            "event_name": "website_closed",
            "event_properties" : {}
        }
        event_properties['event_properties'] = {
            "session_duration_ms": this.session.getSessionDuration(),
            "reason": "user_terminated",
            ...properties
        };
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        await this.enqueEvents(event_properties)
        await this.sessionEnded()            
        await window.nexora.batchFlusher.immediateFlush()
    }

    async sessionStarted(properties = {}){
        let event_properties = {
            "event_name": "session_started",
            "event_properties" : {}
        }
        let session_number = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            "new_user": window.nexora.user.isExists() ? false : true,
            "session_number": session_number,
            "is_first_session_today" : session_number == 1,
            ...properties
        };
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        this.enqueEvents(event_properties)
    }

    async sessionEnded(properties = {}){
        let event_properties = {
            "event_name": "session_ended",
            "event_properties" : {}
        }
        let device_details = await window.nexora.device.get()
        event_properties['event_properties'] = {
            "duration_ms": this.session.getSessionDuration(),
            "event_count":  device_details ? device_details?.event_count : 1, //need a logic,
            "screen_viewed_count" : device_details ? device_details?.screen_viewed_count : 1,
            ...properties
        };
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        this.enqueEvents(event_properties)

        // clear all session related values
        await window.nexora.device.set({
            "screen_viewed_count" : 0,
            "event_count" : 0,
        })
    }

    async notificationRecieved(properties = {}){
        let event_properties = {
            "event_name": "notification_recieved",
            "event_properties" : properties
        }
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        this.enqueEvents(event_properties)
    }

    async notificationOpened(properties = {}){
        let event_properties = {
            "event_name": "notification_opened",
            "event_properties" : properties
        }
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        //enque events
        this.enqueEvents(event_properties)
    }

    async notificationDismissed(properties = {}){
        let event_properties = {
            "event_name": "notification_dismissed",
            "event_properties" : properties
        }
        event_properties = {...event_properties, ...await this.getDefaultEventProperties(['network'])}
        this.enqueEvents(event_properties)
    }

    async deviceOnline(properties = {}){
        let event_properties = {
            "event_name": "device_online",
            "event_properties" : {
                "connection_type": navigator?.connection?.effectiveType,
                ...properties
            }
        }
        event_properties = {...event_properties, ...await this.getDefaultEventProperties()}
        await this.enqueEvents(event_properties)
        await window.nexora.device.set({
            "offline" : false
        })
    }

    async deviceOffline(properties = {}){
        let event_properties = {
            "event_name": "device_offline",
            "event_properties" : properties
        }
        event_properties = {...event_properties, ...await this.getDefaultEventProperties()}
        await this.enqueEvents(event_properties)
        await window.nexora.device.set({
            "offline" : true
        })
    }

    async resetInactivityTimer() {
        clearTimeout(this.inactivityTimeout);
        this.inactivityTimeout = setTimeout(() => {
            this.event.sessionEnded()
        }, 10000);
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
