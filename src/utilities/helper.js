
export class Helpers{
    constructor(){

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
      
}