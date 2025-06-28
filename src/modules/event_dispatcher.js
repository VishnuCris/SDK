

export default class EventDispatcher {
    constructor(endpoint, batchSize, api) {
      this.endpoint = endpoint;
      this.batchSize = batchSize;
      this.isSending = false;
      this.api = api
    }
  
    async dispatch(events) {
      if (this.isSending || events.length === 0) return;
  
      this.isSending = true;
      const payload = events.slice(0, this.batchSize);
  
      try {
        await this.api.request(this.endpoint, payload);
      } catch (e) {
        console.error("Dispatch failed", e);
        throw e; // So caller can decide to retry or persist
      } finally {
        this.isSending = false;
      }
    }
  }
  