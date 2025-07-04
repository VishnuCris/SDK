
import {API} from './api/api.js';
import { Endpoints } from './api/endpoints';
import { Storage } from "./storage";
import { Helpers } from './utilities/helper';
import { Session } from './session';
import { Event } from './event';
import { Logger } from './logger';
export class User{
    constructor(clientId = null, passcode = null, api = window.nexora?.api){
        this.clientId = clientId;
        this.passcode = passcode;
        // this.api = new API(clientId, passcode)
        this.api = api
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

    async create(payload){
        // this.api.request(Endpoints.createUser, payload);
        let userId = await this.helpers.createUserID()
        let userObject = {
            "nexora_id": userId,
            "timestamp":this.helpers.getCurrentTimeStamp()
        }
        await this.storage.set(
            "user",
            userObject
        )
        let response = await this.api.request(Endpoints.userRegister, userObject);
        await this.store(response.data) // in this response have to be user object may be change in the prespective of api logics
        // create a session for the current user
        this.session.createSession()

    }

    async get(){
        let user = await this.storage.get("user")
        console.log(user)
        if(!user){
            await this.create()
            return await this.storage.get("user")
        }
        return user
    }

    async login(userProperties){
        let user = await this.storage.get("user")
        user = {...user,...userProperties}
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user'] = {...event_properties['user'], ...user}
        event_properties["evemt_name"] = "user_login"
        let response = await this.api.request(Endpoints.userlogin, event_properties);
        if(response?.data)
            await this.store(response.data) // in this response have to be user object may be change in the prespective of api logics
    }

    async logout(){
        await this.unStore();
        this.api.request(Endpoints.userlogout); // discuss whether we have to hit api incase of logout
        // we have to look a logic for create new user on logout, by now if the application refreshed then user creation happened and website launch event called for new anonymous user or if we create a new user on logout but website launch event not called for new anonmous user in this case screen viewed event is called.
        // this.createUser();
        // this.event.website_launched()
    }

    async pushProfile(userProperties){
        let user = await this.storage.get("user")
        user['additional_properties'] = userProperties
        let event_properties = await nexora.event.getDefaultEventProperties()
        event_properties['user']['additional_properties'] = user['additional_properties']
        event_properties["evemt_name"] = "profile_push"
        let response = this.api.request(Endpoints.pushProfile, event_properties); //  discuss whether we have to hit api incase of profilepush
        if(response?.data)
            await this.store(response.data)
    }

    async store(userObject){
        console.log(userObject)
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
}