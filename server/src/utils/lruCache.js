/**
 * Doubly Linked List Node for LRU Cache
 */
class LRUNode {
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.prev = null;
    this.next = null;
  }
}

/**
 * LRU Cache (Least Recently Used) with Time-To-Live (TTL)
 * Provides O(1) get, put, and delete operations via Hash Table + Doubly Linked List.
 * Automatically evicts the least recently used element when reaching maxSize.
 */
export class LRUCache {
  constructor(maxSize = 100, defaultTtlMs = 60 * 1000) {
    if (maxSize <= 0) throw new Error("maxSize must be greater than 0");
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();

    // Sentinel dummy head and tail nodes
    this.head = new LRUNode(null, null);
    this.tail = new LRUNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Remove an existing node from the doubly linked list
  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  // Insert node right after head (most recently used)
  _addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // Move existing node to head
  _moveToHead(node) {
    this._remove(node);
    this._addToHead(node);
  }

  // Pop the least recently used node from tail
  _popTail() {
    const lruNode = this.tail.prev;
    this._remove(lruNode);
    return lruNode;
  }

  /**
   * Get value by key in O(1)
   */
  get(key) {
    const node = this.cache.get(key);
    if (!node) return null;

    // Check TTL expiration
    if (node.expiresAt && node.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }

    // Move to front as most recently used
    this._moveToHead(node);
    return node.value;
  }

  /**
   * Put value by key in O(1) with optional custom TTL
   */
  put(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;

    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      node.expiresAt = expiresAt;
      this._moveToHead(node);
      return;
    }

    const newNode = new LRUNode(key, value, expiresAt);
    this.cache.set(key, newNode);
    this._addToHead(newNode);

    if (this.cache.size > this.maxSize) {
      const evicted = this._popTail();
      if (evicted && evicted.key !== null) {
        this.cache.delete(evicted.key);
      }
    }
  }

  delete(key) {
    const node = this.cache.get(key);
    if (node) {
      this._remove(node);
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  has(key) {
    const val = this.get(key);
    return val !== null;
  }

  get size() {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Return keys in MRU to LRU order (useful for debugging/testing)
   */
  keys() {
    const result = [];
    let curr = this.head.next;
    while (curr !== this.tail) {
      if (!curr.expiresAt || curr.expiresAt >= Date.now()) {
        result.push(curr.key);
      }
      curr = curr.next;
    }
    return result;
  }
}

export const catalogLruCache = new LRUCache(200, 5 * 60 * 1000); // 200 items, 5 min TTL
