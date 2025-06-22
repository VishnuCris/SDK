
import { Logger } from "../logger";

export class API{
    constructor(client_id = null, passcode = null, api_domain = null){
        tbis.api_domain = api_domain ? api_domain : window.api_domain;
        this.client_id = client_id;
        this.passcode = passcode;
        this.logger = new Logger()
        this.headers = {
            'X-Nexora-Account-Id': this.account_id,
            'X-Nexora-Passcode': this.passcode,
            'Content-Type': 'application/json; charset=utf-8',
        }
    }

    request(url,payload={}){
        fetch(`${this.api_domain}/${url}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(result => {
            if(!result.status)
                this.logger.error(result.error)
            return result
        })
        .catch(error => {
            this.logger.error(error)
            return {
                "status" : false,
                "error": error
            }
        });
    }
}
