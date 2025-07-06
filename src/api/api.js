
import { Logger } from "../logger";

export class API{
    constructor(clientId = null, apiKey = null, apiDomain = null){
        this.apiDomain = "http://34.18.41.215:5000/v1";
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.headers = {
            'X-Client-ID': this.clientId,
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
        }
    }

    async request(url,payload={}){
        try {
            const response = await fetch(`http://34.18.41.215:5000/v1${url}`, {
              method: 'POST',
              headers: this.headers,
              body: JSON.stringify(payload),
              credentials: 'include'
            });
        
            if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
            }
        
            const result = await response.json();
        
            window.nexora.device.set({
              offline: false
            });
        
            if (!result.status) {
              throw new Error(result.error || 'API returned failure status');
            }
        
        
            return result?.data || (payload?.user || {});
        
          } catch (error) {
            console.log("************* inside api error ****************");
            await Logger.logError(error);
            await this.processErrorEvents(url, payload);
            throw error;  // rethrow so caller can handle
          }
    }

    async processErrorEvents(endpoint, payload){
        if(endpoint == "/events/profile"){
            await window.nexora.user.failedEvents(payload, endpoint)
        }
    }
}
