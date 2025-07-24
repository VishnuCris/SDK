import { Logger } from "./logger";
import localforage from "localforage";

export class Storage{
    constructor(){
      this.localForage = localforage;
      this.localForage.config({
        name: "WebEventSDK",
        storeName: "eventQueue", // used as IndexedDB object store name
      })
      this.localForage.setDriver(this.localForage.INDEXEDDB)
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

    async set(key, value) {
        await this.localForage.setItem(key, value);
    }
    async get(key) {
        const val = await this.localForage.getItem(key);
        return val;
    }
    async remove(key) {
      await this.localForage.removeItem(key);
    }
    async clear(key) {
      await this.localForage.clear();
    }
}