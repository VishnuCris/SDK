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
        properties['session_id'] = this.session.getSession()['session_id']
        properties['session_start_time'] = this.session.getSession()['timestamp']
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
            "event_name": "website_launched",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties()}
        // add additional event properties
        event_properties['event_properties'] = {
            "initial_launch": true, // logic for taking this
            "from_background": false, // we can omit this after discussion
            "deep_link_url": null, // we can omit this after discussion
            "push_notification_id": null, // we can omit this after discussion
            "source_campaign": null,
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)

    }

    screen_viewed(properties = {}){
        let event_properties = {
            "event_name": "screen_viewed",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        event_properties['event_properties'] = {
            "screen_name": document.title,                    // You can also use custom mapping
            "url": window.location.href,
            "referrer": document.referrer || null,           // Previous page URL
            viewDurationSeconds: 0, // we have to take by listening other events (beforeload)    
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    website_closed(properties = {}){
        let event_properties = {
            "event_name": "website_closed",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        event_properties['event_properties'] = {
            "session_duration_ms": this.session.getSessionDuration(),
            "reason": "user_terminated",
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    session_started(properties = {}){
        let event_properties = {
            "event_name": "session_started",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            "duration_ms": event_properties['user']?.is_logged_in ? false : true,
            "session_number": this.session.getSessionOccurence(),
            "screens_viewed_count": "1", //need to think a logic for this
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    session_ended(properties = {}){
        let event_properties = {
            "event_name": "session_ended",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        event_properties['event_properties'] = {
            "session_duration_ms": this.session.getSessionDuration(),
            "reason": "user_terminated",
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    notification_recieved(properties = {}){ // need to look for events to capture this
        let event_properties = {
            "event_name": "notification_recieved",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            "notification_id": "notif_promo_xyz789",
            "campaign_id": "cmp_summer_sale_2025",
            "notification_type": "push",
            "title": "Big Summer Sale!",
            "body": "Shop now and get 50% off on all electronics!",
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    notification_opened(properties = {}){
        let event_properties = {
            "event_name": "notification_opened",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            "notification_id": "notif_promo_xyz789",
            "campaign_id": "cmp_summer_sale_2025",
            "action_id": null,
            "deep_link_url": "your_app://products?category=electronics",
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    notification_dismissed(properties = {}){
        let event_properties = {
            "event_name": "notification_dismissed",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties(['network'])}
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            "notification_id": "notif_promo_xyz789",
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    device_online(properties = {}){
        let event_properties = {
            "event_name": "device_online",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties()}
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            "connection_type": event_properties["network"]["connection_type"],
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }

    device_offline(properties = {}){
        let event_properties = {
            "event_name": "device_offline",
        }
        // default properties
        event_properties = {...event_properties,...this.get_default_event_properties()}
        // add additional event properties
        let sessionOccurence = this.session.getSessionOccurence()
        event_properties['event_properties'] = {
            ...properties
        };
        // push event
        this.api.request(Endpoints.pushEvent, event_properties)
    }
}
