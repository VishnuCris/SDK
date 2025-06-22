
import {API} from '.api/api.js';
import { Endpoints } from './api/endpoints';
import { Storage } from "./storage";
import { Helpers } from './utilities/helper';
import { Session } from './session';
export class User{
    constructor(clientId = null, passcode = null){
        this.clientId = clientId;
        this.passcode = passcode;
        this.api = new API(clientId, passcode)
        this.storage = new Storage();
        this.helpers = new Helpers();
        this.session = new Session(clientId, passcode);
    }

    async createUser(payload){
        // this.api.request(Endpoints.createUser, payload);
        this.storage.set(
            "user",
            {
                "id": this.helpers.createUserID(),
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
        this.createUser();
        this.api.request(Endpoints.userlogout); // discuss whether we have to hit api incase of logout
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
}