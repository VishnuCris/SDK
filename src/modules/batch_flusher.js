

export default class BatchFlusher {
    constructor( buffer = window.nexora.eventBuffer, dispatcher = window.nexora.eventDispatcher, config = window.nexora.config ) {
      this.buffer = buffer;
      this.dispatcher = dispatcher;
      this.config = config;
      this.flushInterval = 2000; // ms
      this.batchSize = this.config.get("batch_size") || 10;
  
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
      if (this.buffer.isSystemEventsEmpty() && this.buffer.isCustomEventsEmpty()) return;
  
      const systemEvents = [];
      for (let i = 0; i < this.batchSize && !this.buffer.isSystemEventsEmpty(); i++) {
        systemEvents.push(this.buffer.dequeueSystemEvents()); // get 1 by 1
      }

      const customEvents = [];
      for (let i = 0; i < this.batchSize && !this.buffer.isCustomEventsEmpty(); i++) {
        customEvents.push(this.buffer.dequeueCustomEvents()); // get 1 by 1
      }
  
      try {
        await this.dispatcher.dispatchSystemEvents(systemEvents);
        await this.dispatcher.dispatchCustomEvents(customEvents);
      } catch (e) {
        console.error("Dispatch failed", e);
        // Requeue or persist if needed
        systemEvents.forEach(event => this.buffer.enqueueSystemEvents(event));
        customEvents.forEach(event => this.buffer.enqueueCustomEvents(event));
      }
    }
  
    async tryImmediateFlush() {
      if (this.buffer.size() >= this.batchSize) {
        await this.flush();
      }
    }
  }
  