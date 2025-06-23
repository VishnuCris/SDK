
import {API} from './api/api.js';
import { Endpoints } from './api/endpoints';
import { Storage } from "./storage";
import { Helpers } from './utilities/helper';
import { Session } from './session';
import { Event } from './event';
import { Logger } from './logger';
export class User{
    constructor(clientId = null, passcode = null){
        this.clientId = clientId;
        this.passcode = passcode;
        this.api = new API(clientId, passcode)
        this.storage = new Storage();
        this.helpers = new Helpers();
        this.session = new Session(clientId, passcode);
        // this.event = new Event(clientId, passcode)
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

    async createUser(payload){
        // this.api.request(Endpoints.createUser, payload);
        let userId = await this.helpers.createUserID()
        this.storage.set(
            "user",
            {
                "id": userId,
                "timestamp":this.helpers.getCurrentTimeStamp()
            }
        )
        // create a session for the current user
        this.session.createSession()

    }

    async getUser(){
        let user = this.storage.get("user")
        if(!user){
            await this.createUser()
            return this.storage.get("user")
        }
        return user
    }

    async onUserLogin(userProperties){
        let user = this.storage.get("user")
        user = {...user,...userProperties}
        let response = await this.api.request(Endpoints.userlogin, user);
        this.storeUser(response.data) // in this response have to be user object may be change in the prespective of api logics
    }

    onUserLogout(){
        this.unStoreUser();
        this.api.request(Endpoints.userlogout); // discuss whether we have to hit api incase of logout
        // we have to look a logic for create new user on logout, by now if the application refreshed then user creation happened and website launch event called for new anonymous user or if we create a new user on logout but website launch event not called for new anonmous user in this case screen viewed event is called.
        // this.createUser();
        // this.event.website_launched()
    }

    async pushProfile(userProperties){
        let user = this.storage.get("user")
        user = {...user,...userProperties}
        let response = this.api.request(Endpoints.pushProfile, user); //  discuss whether we have to hit api incase of profilepush
        this.storeUser(response.data)
    }

    storeUser(userObject){
        this.storage.set(
            "user",
            userObject
        )
    }

    unStoreUser(){
        this.storage.remove("user")
    }

    isUserExists(){
        return this.storage.get('user')
    }
}