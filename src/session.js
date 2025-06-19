
import { Storage } from "./storage";
import { Helpers } from "./utilities/helper";

export class Session{
    constructor(clientId = null, passcode = null){
        this.clientId = clientId;
        this.passcode = passcode;
        this.storage = new Storage();
        this.helpers = new Helpers();
    }

    createSession(){
        const timestamp = this.helpers.getCurrentTimeStamp();
        const randomPart = Math.random().toString(36).substring(2, 10); // 8-char random string
        const sessionId =  `sess-${timestamp}-${randomPart}`;

        this.setSession("nexora_session", sessionId);
    }

    getSession(key){
        const session = sessionStorage.getItem('nexora_session');
        if(!session){
            this.createSession();
            return sessionStorage.getItem('nexora_session');
        }
        return session;
    }

    setSession(key, value){
        sessionStorage.setItem(key, value);
    }

    endSession(key){
        sessionStorage.removeItem(key);
    }
}