
import { Logger } from "../logger";

export class API{
    constructor(clientId = null, passcode = null, apiDomain = null){
        this.apiDomain = "http://34.18.41.215:5000/v1";
        this.clientId = clientId;
        this.passcode = passcode;
        this.logger = new Logger()
        this.headers = {
            'X-Nexora-Client-ID': this.clientId,
            'X-Nexora-Key': this.passcode,
            'Content-Type': 'application/json; charset=utf-8',
        }
    }

    async request(url,payload={}){
        // console the payloads and endpoints
        payload["platform"] = "web"
        payload["client_id"] = this.clientId
        // console.log(`http://34.18.41.215:5000/v1/${url}`)
        console.log(payload)
        return {"data":payload}
        // console.log(this.headers)
        // fetch(`http://34.18.41.215:5000/v1/${url}`, {
        //     method: 'POST',
        //     headers: this.headers,
        //     body: JSON.stringify(payload)
        // })
        // .then(response => response.json())
        // .then(result => {
        //     if(!result.status)
        //         this.logger.error(result.error)
        //     return result
        // })
        // .catch(error => {
        //     this.logger.error(error)
        //     return {
        //         "status" : false,
        //         "error": error
        //     }
        // });
    }
}
