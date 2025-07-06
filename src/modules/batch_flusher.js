

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
      if (await this.buffer.isSystemEventsEmpty() && await this.buffer.isCustomEventsEmpty()) return;
      
      const systemEvents = await this.buffer.dequeueSystemEvents()
      console.log(systemEvents)
      console.log("((((systemEvents))))")
      // const systemEvents = [];
      // for (let i = 0; i < this.batchSize && !await this.buffer.isSystemEventsEmpty(); i++) {
        // systemEvents.push(await this.buffer.dequeueSystemEvents()); // get 1 by 1
      // }

      const customEvents = await this.buffer.dequeueCustomEvents()
      console.log(customEvents)
      console.log("((((customEvents))))")
      // const customEvents = [];
      // for (let i = 0; i < this.batchSize && !this.buffer.isCustomEventsEmpty(); i++) {
      //   customEvents.push(await this.buffer.dequeueCustomEvents()); // get 1 by 1
      // }
  
      try {
        await this.dispatcher.dispatchSystemEvents(systemEvents);
        await this.dispatcher.dispatchCustomEvents(customEvents);
      } catch (e) {
        console.error("Dispatch failed", e);
        // Requeue or persist if needed
        systemEvents.forEach(async (event) => await this.buffer.enqueueSystemEvents(event));
        customEvents.forEach(async (event) => await this.buffer.enqueueCustomEvents(event));
      }
    }
  
    async tryImmediateFlush() {
      if (await this.buffer.size() >= this.batchSize) {
        await this.flush();
      }
    }
  }
  