
import { Endpoints } from "../api/endpoints";
import { Logger } from "../logger";

export default class EventDispatcher {
    constructor(api = window?.nexora?.api, batchSize = window?.nexora?.config?.get('batch_size')) {
      this.batchSize = batchSize
      this.isSending = false;
      this.api = api
      this.Logger = new Logger()
    }
  
    async dispatchSystemEvents(events) {
      if (this.isSending || events.length === 0) return;
  
      this.isSending = true;
      const payload = events.slice(0, this.batchSize);
  
      try {
        await this.api.request(Endpoints.systemEvent, payload);
      } catch (e) {
        this.Logger.logError("Dispatch failed", e);
        throw e; // So caller can decide to retry or persist
      } finally {
        this.isSending = false;
      }
    }

    async dispatchCustomEvents(events){
      if (this.isSending || events.length === 0) return;
  
      this.isSending = true;
      const payload = events.slice(0, this.batchSize);
  
      try {
        await this.api.request(Endpoints.customEvent, payload);
      } catch (e) {
        this.Logger.logError("Dispatch failed", e);
        throw e; // So caller can decide to retry or persist
      } finally {
        this.isSending = false;
      }
    }
  }
  