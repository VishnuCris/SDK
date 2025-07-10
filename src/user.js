
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
        // this.api = new API(clientId, apiKey)
        this.api = api;
        this.storage = storage;
        this.helpers = new Helpers();
        this.session = new Session(clientId, apiKey);
        // this.event = new Event(clientId, apiKey)
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

    async create(userProperties = {}){
        // this.api.request(Endpoints.createUser, payload);
        let userId = await this.helpers.createUserID()
        let userObject = {
            // "nexora_id": userId,
            "id": userId,
            "timestamp":this.helpers.getCurrentTimeStamp(),
            "user_id" : ""
        }
        await this.storage.set("user",userObject)
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user'] = {...event_properties['user'], ...userObject}
        event_properties["event_name"] = EventName.profileCreate
        userProperties['metadata'] = {...userProperties, ...userObject}
        let responseData = await this.api.request(Endpoints.pushProfile, [event_properties]);
        // await this.store(responseData) // in this response have to be user object may be change in the prespective of api logics
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
        let responseData = await this.api.request(Endpoints.userlogin, [event_properties]);
        if(responseData)
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
        let responseData = await this.api.request(Endpoints.pushProfile, [event_properties]); //  discuss whether we have to hit api incase of profilepush
        if(responseData)
            await this.store(user)
    }

    async tokenPush(token){
        // check the token exists in storage if block the event
        const device_details  =  await window.nexora.device.get()
        let user = await this.storage.get("user")
        if((device_details && device_details?.firebase_token) || !user){
            return;
        }
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties["event_name"] = EventName.profileUpdate
        if(event_properties['device']){
            event_properties['device']['firebase_token'] = token
        }
        event_properties['user'] = user
        // set this token in device object
        await window.nexora.device.set({
            "firebase_token" : token
        })
        // raise push token
        await this.api.request(Endpoints.pushProfile, [event_properties]); //  discuss whether we have to hit api incase of profilepush
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