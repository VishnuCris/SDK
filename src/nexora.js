
import { Event } from "./event";
import { API } from "./api/api";
import { User } from "./user";

export class Nexora{
    constructor(client_id = null, passcode = null, api_domain){
        this.client_id = client_id;
        this.passcode = passcode;
        this.api_domain = api_domain;
        // apply this api domain to windows
        window.api_domain = api_domain;
        this.event = new Event(client_id, passcode)
        this.user = new User(client_id, passcode)
    }
}