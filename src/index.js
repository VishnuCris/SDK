// import {Nexora} from './nexora'

// window.Nexora = Nexora

// export default Nexora


import {NexoraCore} from './nexora'

export default class Nexora{
    constructor(clientId = null, passcode = null, apiDomain = window.mexoraCore?.apiDomain){
        if(!window.nexoraCore){
            this.nexoraCore = new NexoraCore(clientId, passcode, apiDomain)
            window.nexoraCore = this.nexoraCore
        }
    }
}

window.Nexora = Nexora