

export default class EventBuffer {
    constructor() {
      this.systemQueue = [];
      this.customEventsQueue = []
    }
  
    enqueueSystemEvents(event) {
      this.systemQueue.push(event);
    }

    enqueueCustomEvents(event){
      this.customEventsQueue.push(event)
    }
  
    dequeueSystemEvents() {
      const events = [...this.systemQueue];
      this.systemQueue = [];
      return events;
    }

    dequeueCustomEvents() {
      const events = [...this.customEventsQueue];
      this.customEventsQueue = [];
      return events;
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.systemQueue.shift();
    }
  
    peekSystemEvent() {
      return [...this.systemQueue];
    }

    peekCustomEvent() {
      return [...this.customEventsQueue];
    }

    isSystemEventsEmpty() {
      return this.systemQueue.length === 0;
    }

    isCustomEventsEmpty(){
      return this.customEventsQueue.length === 0;
    }
  
    size() {
      return (this.systemQueue.length + this.customEventsQueue.length);
    }
  }
  