
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
}