
const defaultConfig = {
    batchSize: 10,
    flushInterval: 10000,
    // endpoint: "/api/events"
  };

class SDKConfig {
    constructor(userConfig = {}) {
      this.config = { ...defaultConfig, ...userConfig };
    }
  
    get(key) {
      return this.config[key];
    }
  
    set(key, value) {
      this.config[key] = value;
    }
  }
  
  export default SDKConfig;
  