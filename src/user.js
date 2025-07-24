
import {API} from './api/api.js';
import { Endpoints } from './api/endpoints';
import { Storage } from "./storage";
import { Helpers } from './utilities/helper';
import { Session } from './session';
import { Event } from './event';
import { Logger } from './logger';
import { EventName } from './api/eventname.js';
export class User{
    constructor(clientId = null, apiKey = null, api = window.nexora?.api, storage=null){
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.api = api;
        this.storage = storage;
        this.helpers = new Helpers();
        this.session = new Session(clientId, apiKey);
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

    async create(userProperties = {}){
        let userId = await this.helpers.createUserID()
        let userObject = {  
            // "id": userId,
            "nexora_id": userId,
            "timestamp":this.helpers.getCurrentTimeStamp(),
            "user_id" : ""
        }
     
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user'] = {...event_properties['user'], ...userObject}
        event_properties["event_name"] = EventName.profileCreate
        userProperties['metadata'] = {...userProperties, ...userObject}
        console.log(userProperties)
        await this.storage.set("user",userObject)
        await this.api.request(Endpoints.pushProfile, [event_properties]);
        this.session.createSession()

    }

    async get(){
        let user = await this.storage.get("user")
        if(!user){
          await this.create()
          user = await this.storage.get("user")
        }
        return user
    }

    async login(userProperties){
        let user = await this.storage.get("user")
        user = {...user,...userProperties}
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user'] = {...event_properties['user'], ...user}
        event_properties["event_name"] = EventName.profileUpdate
        userProperties['metadata'] = userProperties
        await this.api.request(Endpoints.userlogin, [event_properties]);
        await this.store(user)
    }

    async logout(userProperties = {}){
        await this.unStore();
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user'] = {...event_properties['user'], ...userObject}
        event_properties["event_name"] = "user_logout"
        userProperties['metadata'] = userProperties
        await this.api.request(Endpoints.userlogout); // discuss whether we have to hit api incase of logout
        // we have to look a logic for create new user on logout, by now if the application refreshed then user creation happened and website launch event called for new anonymous user or if we create a new user on logout but website launch event not called for new anonmous user in this case screen viewed event is called.
        await this.create();
        await this.event.website_launched()
    }

    async pushProfile(userProperties){
        let user = await this.storage.get("user")
        user['additional_properties'] = userProperties
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user']['additional_properties'] = user['additional_properties']
        event_properties["event_name"] = EventName.profileUpdate
        userProperties['metadata'] = userProperties
        await this.api.request(Endpoints.pushProfile, [event_properties]); //  discuss whether we have to hit api incase of profilepush
        await this.store(user)
    }

    async tokenPush(token, retries = 0){
        // check the token exists in storage if block the event
        let user = await this.storage.get("user")
        if(!user){
            retries += 1
            if(retries > 3){
                await this.create()
            }
            return await this.tokenPush(token, retries);
        }
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties["event_name"] = EventName.profileUpdate
        if(event_properties['device']){
            event_properties['device']['firebase_token'] = token
        }
        event_properties['user'] = user
        await window.nexora.device.set({
            "firebase_token" : token
        })
        await this.api.request(Endpoints.pushProfile, [event_properties]);
    }

    async store(userObject){
        await this.storage.set(
            "user",
            userObject
        )
    }

    async unStore(){
        await this.storage.remove("user")
    }

    async isExists(){
        return await this.storage.get('user')
    }

    async failedEvents(event_properties){
        let failed = await this.getFailedEvents()
        failed = [...failed, event_properties]
        await this.storage.set("user_failed_events", failed)
    }

    async getFailedEvents(){
        return await this.storage.get("user_failed_events") || []
    }

    async dequeFailedEvents(){
        const events = [...await this.getFailedEvents()];
        await this.storage.set("user_failed_events", [])
        return events;
    }
}