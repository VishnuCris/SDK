import { NexoraCore } from './nexora';

class Nexora {
    constructor(clientId, apiKey, apiDomain) {
        if (Nexora._instance) {
            return Nexora._instance;
        }

        const instance = new NexoraCore(clientId, apiKey, apiDomain);
        window.nexora = instance;
        Nexora._instance = this;
        return this;

    }

    static getInstance() {
        if (!Nexora._instance) {
            throw new Error('[Nexora] SDK not initialized');
        }
        return Nexora._instance;
    }
    
    static getCore() {
        if (!window.nexora) {
            throw new Error('[Nexora] NexoraCore not initialized');
        }
        return window.nexora;
    }


    static ensureInitialized() {
        if (!window.nexora) {
        throw new Error('[Nexora] SDK not initialized. Please initialize first.');
        }
        return window.nexora;
    }
      
}

// Expose the Nexora class globally

// Optionally attach to window for global access (for MPA + easy debug)
if (typeof window !== 'undefined') {
    window.Nexora = Nexora;
}
  
  export default Nexora;