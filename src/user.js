
import {API} from '.api/api.js';
import { Endpoints } from './api/endpoints';
import { Storage } from "./storage";
import { Helpers } from './utilities/helper';
export class User{
    constructor(client_id = null, passcode = null){
        this.client_id = client_id;
        this.passcode = passcode;
        this.api = new API(client_id, passcode)
        this.storage = new Storage();
        this.helpers = new Helpers();
    }

    createUser(payload){
        // this.api.request(Endpoints.createUser, payload);
        this.storage.set(
            "user",
            {
                "id": this.helpers.createUserID(),
                "timestamp":this.helpers.getCurrentTimeStamp()
            }
        )
    }

    getUser(){
        // this.api.request(Endpoints.getUser, payload);
        return this.storage.get("user")
    }

    async onUserLogin(){
        let response = await this.api.request(Endpoints.userlogin, payload);
        this.storeUser(response.data)
    }

    onUserLogout(){
        this.api.request(Endpoints.userlogout, payload);
    }

    async pushProfile(){
        let response = this.api.request(Endpoints.pushProfile, payload);
        this.storeUser(response.data)
    }

    storeUser(user_object){
        this.storage.set(
            "user",
            user_object
        )
    }

    unStoreUser(){
        this.storage.remove("user")
    }
}