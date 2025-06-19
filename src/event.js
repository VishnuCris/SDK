import { API } from "./api/api";
import { Endpoints } from "./api/endpoints";
import { Storage } from "./storage";
import { Session } from "./session";
import { User } from './user';
import { Helpers } from "./utilities/helper";
import UAParser from 'ua-parser-js';
import pkg from '../package.json' assert { type: 'json' };



export class Event{
    constructor(clientId = null, passcode = null){
        this.clientId = clientId;
        this.passcode = passcode;
        this.api = new API(clientId, passcode)
        this.user = new User(this.clientId, this.passcode);
        this.helpers = new Helpers()
        this.session = new Session(clientId, passcode)
        this.uaParser = new  new UAParser();
    }

    get_default_event_properties(ignorable_properties = []){
        let properties = {}
        properties['timestamp'] = this.helpers.getCurrentTimeStamp()
        properties['user'] = this.user.getUser()
        properties['session_id'] = this.session.getSession()
        // device infos
        let deviceInfo = this.uaParser.getResult();
        if(!ignorable_properties.includes('device')){
            properties['device'] = {
                "os_name" : deviceInfo.os.name,
                "os_version" : deviceInfo.os.version,
                "device" : result.device.model || 'unknown',
                "device_type" : result.device.type || 'desktop',
                "browser": uaResult.browser.name,
                "browser_version": uaResult.browser.version,
                "userAgent": navigator.userAgent,
            }
        }
        if(!ignorable_properties.includes('app')){
            properties['app'] = {
                "name": navigator.appName,
                "version": navigator.appVersion,
                // "build_number": "1234",
                "sdk_version": pkg.version
            }
        }
        if(!ignorable_properties.includes('network')){
            properties['network'] = {
                "connection_type" : navigator.connection?.effectiveType || 'unknown'
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

        return properties;
    }

    push(event_name, payload){
        this.api.request(Endpoints.pushEvent, {
            "event_name" : event_name,
            "event_attributes" : payload
        })
    }

    website_launched(properties = {}){
        let event_properties = {
            "event_name": "launch_website",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(),...properties}
        // add additional event properties
        event_properties['event_properties'] = {
            "initial_launch": true,
            "from_background": false,
            "deep_link_url": null,
            "push_notification_id": null,
            "source_campaign": null
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)

    }

    screen_viewed(){
        
    }

    website_closed(){
        
    }

    session_started(){
       
    }

    session_ended(){
       
    }

    notification_recieved(){
       
    }

    notification_recieved(){
       
    }

    device_online(){
       
    }

    device_offline(){
       
    }
}
