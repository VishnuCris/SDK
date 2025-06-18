import { API } from "./api/api";
import { Endpoints } from "./api/endpoints";
import { Storage } from "./storage";

export class Event{
    constructor(client_id = null, passcode = null){
        this.client_id = client_id;
        this.passcode = passcode;
        this.api = new API(client_id, passcode)
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
            "timestamp": "2025-06-02T17:00:00.123Z",
            "user": {
                "id": "anon_user_abc123",
                "known_id": null,
                "email": null,
                "phone": null
            },
            "session_id": "sess_initial_jkl456",
            "device": {
                "os_name": "iOS",
                "os_version": "17.5.1",
                "model": "iPhone15,2",
                "manufacturer": "Apple",
                "carrier": "Jio"
            },
            "app": {
                "version": "1.2.0",
                "build_number": "1234",
                "sdk_version": "1.0.0"
            },
            "network": {
                "connection_type": "wifi",
                "ip_address": "192.168.1.101"
            },
            "context": {
                "locale": "en-IN",
                "timezone": "Asia/Kolkata",
                "referrer": "utm_source=organic&utm_medium=appstore"
            },
            "event_properties": {
                "initial_launch": true,
                "from_background": false,
                "deep_link_url": null,
                "push_notification_id": null,
                "source_campaign": null
            }
        }

        // add additional event properties
        event_properties = {...event_properties, ...properties}

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
