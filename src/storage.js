import { Logger } from "./logger";

export class Storage{
    constructor(){

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

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    get(key) {
        const val = localStorage.getItem(key);
        try {
            return JSON.parse(val);
        } catch {
            return null;
        }
    }
    remove(key) {
        localStorage.removeItem(key);
    }
}