
import { Logger } from "../logger";
export class Helpers{
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

    async createUserID(){
        // return `nexora-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        return await generateHashedId();
    }

    getCurrentTimeStamp(){
        return  new Date().toISOString();
    }
    
    getDeviceInfo = () => {
        return [
          navigator.userAgent,
          navigator.platform,
          navigator.language,
          screen.width,
          screen.height,
          Intl.DateTimeFormat().resolvedOptions().timeZone
        ].join('|');
      };
      
      generateHashedId = async () => {
        const infoString = getDeviceInfo();
        const encoded = new TextEncoder().encode(infoString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `nexora-${Date.now()}-${hashHex.slice(0, 12)}`;
      };
      
      getDateTimeDifference(dateIsoString){
        const fixedDate = new Date(dateIsoString);
        const now = new Date(); // current time
        const diffMs = now - fixedDate; // difference in milliseconds
        // Convert milliseconds to units
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours   = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays    = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (seconds < 60) {
          return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else if (minutes < 60) {
          return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (hours < 24) {
          return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
          return `${days} day${days !== 1 ? 's' : ''}`;
        }
      }
}