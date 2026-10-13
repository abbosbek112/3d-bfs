/**
 * High-performance, memory-safe FIFO Queue
 * Uses index offset pointer with automatic garbage compaction
 * Avoids O(N) Array.prototype.shift() overhead
 */
export class Queue {
  #items = [];
  #head = 0;

  constructor(initialItems = []) {
    if (Array.isArray(initialItems)) {
      this.#items = [...initialItems];
    }
  }

  enqueue(item) {
    this.#items.push(item);
  }

  dequeue() {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this.#items[this.#head];
    this.#head++;

    // Amortized garbage compaction
    if (this.#head > 64 && this.#head * 2 >= this.#items.length) {
      this.#items = this.#items.slice(this.#head);
      this.#head = 0;
    }

    return item;
  }

  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.#items[this.#head];
  }

  get size() {
    return this.#items.length - this.#head;
  }

  isEmpty() {
    return this.size === 0;
  }

  /**
   * Returns a snapshot of remaining items without mutating queue
   */
  toArray() {
    return this.#items.slice(this.#head);
  }

  clear() {
    this.#items = [];
    this.#head = 0;
  }
}
