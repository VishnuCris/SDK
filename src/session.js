
import { Storage } from "./storage";
import { Helpers } from "./utilities/helper";
import { Logger } from "./logger";

export class Session{
    constructor(clientId = null, passcode = null){
        this.clientId = clientId;
        this.passcode = passcode;
        this.storage = new Storage();
        this.helpers = new Helpers();
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

    createSession(sessionOccurence = 0){
        const timestamp = this.helpers.getCurrentTimeStamp();
        const randomPart = Math.random().toString(36).substring(2, 10); // 8-char random string
        const sessionId =  `sess-${timestamp}-${randomPart}`;

        this.setSession("nexora_session", JSON.stringify({
            "session_id":sessionId,
            "timestamp":timestamp,
            "session_number" : sessionOccurence + 1
        }));
    }

    getSession(){
        const session = sessionStorage.getItem('nexora_session');
        if(!session){
            this.createSession();
            return JSON.parse(sessionStorage.getItem('nexora_session'));
        }
        return JSON.parse(session);
    }

    setSession(key, value){
        sessionStorage.setItem(key, value);
    }

    endSession(key){
        sessionStorage.removeItem(key);
    }

    getSessionDuration(){
        let session = this.getSession()
        return this.helpers.getDateTimeDifference(session['timestamp'])
    }

    getSessionOccurence(){
        let session = this.getSession()
        return session['session_number']
    }
}