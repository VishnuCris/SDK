import { Storage } from "../storage";

export default class EventBuffer {
    constructor() {
      this.systemQueue = [];
      this.customEventsQueue = []
      this.storage = new Storage()
    }
  
    async enqueueSystemEvents(event) {
      this.systemQueue.push(event);
      let storedSystemQueue = [...await this.getSystemEvents(), event]
      await this.storage.set("system_events", storedSystemQueue)
    }

    async enqueueCustomEvents(event){
      this.customEventsQueue.push(event)
      let storedCustomQueue = [...await this.getCustomEvents(), event]
      await this.storage.set("custom_events", storedCustomQueue)
    }

    async getSystemEvents(){
      let system_events = await this.storage.get("system_events")
      if(system_events){
        return system_events
      }
      return []
    }
  
    async getCustomEvents(){
      let custom_events = await this.storage.get("custom_events")
      if(custom_events){
        return custom_events
      } 
      return []
    }

    async dequeueSystemEvents() {
      const events = [...await this.getSystemEvents()];
      this.systemQueue = [];
      await this.storage.set("system_events", [])
      return events;
    }

    async dequeueCustomEvents() {
      const events = [...this.getCustomEvents()];
      this.customEventsQueue = [];
      await this.storage.set("custom_events", [])
      return events;
    }
  
    async peekSystemEvent() {
      return [... await this.getSystemEvents()];
    }

    async peekCustomEvent() {
      return [... await this.getCustomEvents()];
    }

    async isSystemEventsEmpty() {
      return await this.getSystemEvents().length === 0;
    }

    async isCustomEventsEmpty(){
      return await this.getCustomEvents().length === 0;
    }
  
    async size() {
      return (await this.getSystemEvents().length + await this.getCustomEvents().length);
    }
  }
  