import { NexoraCore } from './nexora';

export default class Nexora {
    constructor(clientId, passcode, apiDomain) {
        // If a Nexora wrapper is already present, return it
        if (window.nexora) {
            return window.nexora;
        }

        console.log('Initializing Nexora SDK...');

        // Create the NexoraCore instance
        this.nexora = new NexoraCore(clientId, passcode, apiDomain);
        //ndu
        // Save the Nexora wrapper (this) globally ana
        window.nexora = this.nexora; // nth i

        return window.nexora
    }
}

// Expose the Nexora class globally so other JS websites can use it
window.Nexora = Nexora;
