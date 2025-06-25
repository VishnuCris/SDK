
import { Logger } from "../logger";

export class API{
    constructor(clientId = null, passcode = null, apiDomain = null){
        this.apiDomain = apiDomain ? apiDomain : window.nexoraCore?.apiDomain;
        this.clientId = clientId;
        this.passcode = passcode;
        this.logger = new Logger()
        this.headers = {
            'X-Nexora-Account-Id': this.clientId,
            'X-Nexora-Passcode': this.passcode,
            'Content-Type': 'application/json; charset=utf-8',
        }
    }

    async request(url,payload={}){
        // console the payloads and endpoints
        console.log(`${this.apiDomain}/${url}`)
        console.log(payload)
        console.log(this.headers)
        // fetch(`${this.api_domain}/${url}`, {
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
