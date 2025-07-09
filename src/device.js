

import { Storage } from "./storage";
import { Helpers } from './utilities/helper';
import { Logger } from './logger';
export class Device{
    constructor(){
        this.storage = new Storage();
        this.helpers = new Helpers();
        this.properties = {}
    }

    async get(){
        this.properties = {...this.properties, ...await this.storage.get("device") || {}}
        return this.properties
    }

    async set(deviceObject){
        this.properties = {...this.properties, ...deviceObject}
        await this.storage.set("device", this.properties)
    }

}