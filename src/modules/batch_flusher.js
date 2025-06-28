

export default class BatchFlusher {
    constructor( buffer, dispatcher, config ) {
      this.buffer = buffer;
      this.dispatcher = dispatcher;
      this.config = config;
      this.flushInterval = this.config.get("flush_interval") || 10000; // ms
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
      if (this.buffer.isEmpty()) return;
  
      const events = [];
      for (let i = 0; i < this.batchSize && !this.buffer.isEmpty(); i++) {
        events.push(this.buffer.dequeue()); // get 1 by 1
      }
  
      try {
        await this.dispatcher.dispatch(events);
      } catch (e) {
        console.error("Dispatch failed", e);
        // Requeue or persist if needed
        events.forEach(event => this.buffer.enqueue(event));
      }
    }
  
    async tryImmediateFlush() {
      if (this.buffer.size() >= this.batchSize) {
        await this.flush();
      }
    }
  }
  