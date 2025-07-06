

export default class BatchFlusher {
    constructor( buffer = window.nexora.eventBuffer, dispatcher = window.nexora.eventDispatcher, config = window.nexora.config ) {
      this.buffer = buffer;
      this.dispatcher = dispatcher;
      this.config = config;
      this.flushInterval = this.config.get("flushInterval") || 2000; // ms
      this.batchSize = this.config.get("batchSize") || 10;
  
      this.timer = null;
    }
  
    start() {
        if (this.timer) return; // already scheduled
      
        const scheduleNextFlush = async () => {
          this.timer = null; // clear old timer before scheduling new one
          await this.flush(); // wait for flush to complete
          this.timer = setTimeout(scheduleNextFlush, this.flushInterval); // schedule next run
        };
      
        this.timer = setTimeout(scheduleNextFlush, this.flushInterval);
    }
      
    stop() {
      if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
      } 
    }
  
    async flush() {
      // add offline logic here
      let device = await window.nexora.device.get()
      console.log(device)
      console.log("((((isOnline))))")
      if ((await this.buffer.isSystemEventsEmpty() && await this.buffer.isCustomEventsEmpty() && await window.nexora.user.getFailedEvents()) || device?.offline){
        return;
      }
      const customEvents = await this.buffer.dequeueCustomEvents()
      const userFailedEvents = await window.nexora.user.dequeFailedEvents()
      const systemEvents = await this.buffer.dequeueSystemEvents()
      try {
        await this.dispatcher.dispatchSystemEvents(systemEvents);
      }catch(e){
        systemEvents.forEach(async (event) => await this.buffer.enqueueSystemEvents(event));
      }

      try{
        await this.dispatcher.dispatchCustomEvents(customEvents);
      }catch(e){
        customEvents.forEach(async (event) => await this.buffer.enqueueCustomEvents(event));
      }

      try{
        // user failed events
        await this.dispatcher.dispatchFailedUserEvents(userFailedEvents);
      }catch(e){
        console.log(userFailedEvents)
        console.log("((((((((((((((userFailedEvents inside flush))))))))))))))")
        userFailedEvents.forEach(async (event)  => await window.nexora.user.failedEvents(event?.event_properties, event?.endpoint));
      }
    }
  
    async tryImmediateFlush() {
      if (await this.buffer.size() >= this.batchSize) {
        await this.flush();
      }
    }
  }
  