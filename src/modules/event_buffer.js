

export default class EventBuffer {
    constructor() {
      this.queue = [];
    }
  
    enqueue(event) {
      this.queue.push(event);
    }
  
    dequeueAll() {
      const events = [...this.queue];
      this.queue = [];
      return events;
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.queue.shift();
    }
  
    peek() {
      return [...this.queue];
    }
  
    isEmpty() {
      return this.queue.length === 0;
    }
  
    size() {
      return this.queue.length;
    }
  }
  