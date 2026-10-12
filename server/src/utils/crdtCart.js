/**
 * Conflict-Free Replicated Data Types (CRDTs) Multi-Device Cart
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 9 - Feature 156)
 * 
 * Vấn đề:
 * 1. Giỏ hàng mở đồng thời trên nhiều thiết bị (Điện thoại, Laptop, Tablet, v.v.).
 * 2. Mạng chập chờn offline-first: Người mua thêm/sửa hàng khi offline.
 * 3. Ghi đè toàn bộ giỏ hàng (Naive LWW Overwrites) gây mất sản phẩm (Lost Updates)
 *    hoặc xung đột khóa phân tán (Lock Contention) trong đợt Flash Sale triệu traffic.
 * 
 * Giải pháp CRDTs (State-based CvRDT):
 * 1. PNCounter: Vector đồng hồ dương/âm (Positive-Negative Counter) theo dõi số lượng thêm/bớt hàng.
 *    Net Quantity = max(0, sum(P) - sum(N)). Phép merge: max từng phần tử.
 * 2. LWWElementSet (Last-Write-Wins Element Set): Quản lý vòng đời thêm/xóa sản phẩm
 *    với nhãn thời gian logic: has(e) <=> addedAt >= removedAt.
 * 3. CrdtCart: Đồng bộ hóa giỏ hàng hai chiều hội tụ về cùng một trạng thái (Deterministic Convergence)
 *    mà không cần khóa trung tâm (Lock-free).
 * 
 * Chứng minh toán học Tính Nhất Quán Cuối Cùng Mạnh (Strong Eventual Consistency - SEC):
 * Không gian trạng thái (S, ⊔) tạo thành một Bounded Join-Semilattice:
 * - Giao hoán (Commutativity): A ⊔ B = B ⊔ A
 * - Kết hợp (Associativity): (A ⊔ B) ⊔ C = A ⊔ (B ⊔ C)
 * - Lũy đẳng (Idempotence): A ⊔ A = A
 */

/**
 * 1. PNCounter (Positive-Negative Counter)
 */
export class PNCounter {
  constructor(initialState = {}) {
    this.p = {};
    this.n = {};

    const pInit = initialState.p || initialState.pVector || {};
    const nInit = initialState.n || initialState.nVector || {};

    for (const [k, v] of Object.entries(pInit)) {
      this.p[k] = Math.max(0, Number(v) || 0);
    }
    for (const [k, v] of Object.entries(nInit)) {
      this.n[k] = Math.max(0, Number(v) || 0);
    }
  }

  increment(deviceId, delta = 1) {
    const d = String(deviceId || "default");
    const val = Math.max(0, Number(delta) || 0);
    this.p[d] = (this.p[d] || 0) + val;
    return this.value;
  }

  decrement(deviceId, delta = 1) {
    const d = String(deviceId || "default");
    const val = Math.max(0, Number(delta) || 0);
    this.n[d] = (this.n[d] || 0) + val;
    return this.value;
  }

  get value() {
    let sumP = 0;
    let sumN = 0;
    for (const v of Object.values(this.p)) sumP += v;
    for (const v of Object.values(this.n)) sumN += v;
    return Math.max(0, sumP - sumN);
  }

  merge(other) {
    if (!other) return this;
    const otherP = other.p || other.pVector || {};
    const otherN = other.n || other.nVector || {};

    for (const [k, v] of Object.entries(otherP)) {
      this.p[k] = Math.max(this.p[k] || 0, Number(v) || 0);
    }
    for (const [k, v] of Object.entries(otherN)) {
      this.n[k] = Math.max(this.n[k] || 0, Number(v) || 0);
    }
    return this;
  }

  toJSON() {
    const sortedP = {};
    for (const k of Object.keys(this.p).sort()) sortedP[k] = this.p[k];
    const sortedN = {};
    for (const k of Object.keys(this.n).sort()) sortedN[k] = this.n[k];
    return {
      p: sortedP,
      n: sortedN,
    };
  }

  static fromJSON(data) {
    if (!data) return new PNCounter();
    return new PNCounter(data);
  }
}

/**
 * 2. LWWElementSet (Last-Write-Wins Element Set)
 */
export class LWWElementSet {
  constructor(initialState = {}) {
    this.addSet = {};
    this.removeSet = {};

    const aInit = initialState.addSet || initialState.a || {};
    const rInit = initialState.removeSet || initialState.r || {};

    for (const [k, v] of Object.entries(aInit)) {
      this.addSet[k] = Number(v) || 0;
    }
    for (const [k, v] of Object.entries(rInit)) {
      this.removeSet[k] = Number(v) || 0;
    }
  }

  add(element, timestamp = Date.now()) {
    const e = String(element);
    const ts = Number(timestamp) || Date.now();
    this.addSet[e] = Math.max(this.addSet[e] || 0, ts);
    return this;
  }

  remove(element, timestamp = Date.now()) {
    const e = String(element);
    const ts = Number(timestamp) || Date.now();
    this.removeSet[e] = Math.max(this.removeSet[e] || 0, ts);
    return this;
  }

  has(element) {
    const e = String(element);
    const tAdd = this.addSet[e] || 0;
    const tRemove = this.removeSet[e] || 0;
    return tAdd >= tRemove && tAdd > 0;
  }

  elements() {
    const result = [];
    for (const e of Object.keys(this.addSet).sort()) {
      if (this.has(e)) result.push(e);
    }
    return result;
  }

  merge(other) {
    if (!other) return this;
    const otherA = other.addSet || other.a || {};
    const otherR = other.removeSet || other.r || {};

    for (const [k, v] of Object.entries(otherA)) {
      this.addSet[k] = Math.max(this.addSet[k] || 0, Number(v) || 0);
    }
    for (const [k, v] of Object.entries(otherR)) {
      this.removeSet[k] = Math.max(this.removeSet[k] || 0, Number(v) || 0);
    }
    return this;
  }

  toJSON() {
    const sortedAdd = {};
    for (const k of Object.keys(this.addSet).sort()) sortedAdd[k] = this.addSet[k];
    const sortedRemove = {};
    for (const k of Object.keys(this.removeSet).sort()) sortedRemove[k] = this.removeSet[k];
    return {
      addSet: sortedAdd,
      removeSet: sortedRemove,
    };
  }

  static fromJSON(data) {
    if (!data) return new LWWElementSet();
    return new LWWElementSet(data);
  }
}

/**
 * 3. CrdtCart (Unified Conflict-Free Replicated Shopping Cart)
 */
export class CrdtCart {
  constructor(options = {}) {
    this.cartId = String(options.cartId || "default_cart");
    this.userId = String(options.userId || "default_user");
    this.items = new Map();

    if (options.items) {
      if (Array.isArray(options.items)) {
        for (const item of options.items) {
          this._loadItemEntry(item);
        }
      } else if (typeof options.items === "object") {
        for (const [pId, item] of Object.entries(options.items)) {
          this._loadItemEntry({ productId: pId, ...item });
        }
      }
    }
  }

  _loadItemEntry(raw) {
    const pId = String(raw.productId || raw.id || raw._id);
    const pCounter = new PNCounter(raw.pCounter || { p: raw.pVector, n: raw.nVector });
    const lwwSet = new LWWElementSet(raw.lwwSet || { addSet: raw.addSet, removeSet: raw.removeSet });

    const addedAt = Math.max(
      Number(raw.addedAt) || 0,
      lwwSet.addSet[pId] || 0
    );
    const removedAt = Math.max(
      Number(raw.removedAt) || 0,
      lwwSet.removeSet[pId] || 0
    );

    if (addedAt > 0) lwwSet.addSet[pId] = addedAt;
    if (removedAt > 0) lwwSet.removeSet[pId] = removedAt;

    this.items.set(pId, {
      productId: pId,
      metadata: raw.metadata || {
        name: raw.name || "Sản phẩm",
        price: Number(raw.price) || 0,
        originalPrice: Number(raw.originalPrice) || Number(raw.price) || 0,
        image: raw.image || "",
        shopId: raw.shopId || "unknown_shop",
        shopName: raw.shopName || "",
      },
      pCounter,
      lwwSet,
      addedAt,
      removedAt,
      lastUpdatedDeviceId: raw.deviceId || raw.lastUpdatedDeviceId || "default",
    });
  }

  _getOrCreateItem(productId, productDetails = {}) {
    const pId = String(productId);
    if (!this.items.has(pId)) {
      this.items.set(pId, {
        productId: pId,
        metadata: {
          name: productDetails.name || "Sản phẩm",
          price: Number(productDetails.price) || 0,
          originalPrice: Number(productDetails.originalPrice) || Number(productDetails.price) || 0,
          image: productDetails.image || "",
          shopId: productDetails.shopId || "unknown_shop",
          shopName: productDetails.shopName || "",
          selectedColor: productDetails.selectedColor || null,
          selectedSize: productDetails.selectedSize || null,
        },
        pCounter: new PNCounter(),
        lwwSet: new LWWElementSet(),
        addedAt: 0,
        removedAt: 0,
        lastUpdatedDeviceId: "default",
      });
    }
    return this.items.get(pId);
  }

  addItem(deviceId, product, quantity = 1, timestamp = Date.now()) {
    const pId = String(typeof product === "object" && product !== null ? (product.id || product._id || product.productId) : product);
    const details = typeof product === "object" && product !== null ? product : {};
    const ts = Number(timestamp) || Date.now();
    const qty = Math.max(1, Number(quantity) || 1);
    const d = String(deviceId || "default");

    const item = this._getOrCreateItem(pId, details);
    if (details.name) item.metadata.name = details.name;
    if (typeof details.price === "number") item.metadata.price = details.price;
    if (details.image) item.metadata.image = details.image;
    if (details.shopId) item.metadata.shopId = details.shopId;
    if (details.shopName) item.metadata.shopName = details.shopName;

    // If re-adding an item that was previously removed, offset prior quantity
    if (item.removedAt >= item.addedAt && item.removedAt > 0 && item.pCounter.value > 0) {
      item.pCounter.decrement(d, item.pCounter.value);
    }

    item.pCounter.increment(d, qty);
    item.lwwSet.add(pId, ts);
    item.addedAt = Math.max(item.addedAt, ts);
    item.lastUpdatedDeviceId = d;

    return this;
  }

  removeItem(deviceId, productId, timestamp = Date.now()) {
    const pId = String(productId);
    const ts = Number(timestamp) || Date.now();
    const d = String(deviceId || "default");

    if (this.items.has(pId)) {
      const item = this.items.get(pId);
      item.lwwSet.remove(pId, ts);
      item.removedAt = Math.max(item.removedAt, ts);
      item.lastUpdatedDeviceId = d;
    }
    return this;
  }

  updateQuantity(deviceId, productId, delta, timestamp = Date.now()) {
    const pId = String(productId);
    const ts = Number(timestamp) || Date.now();
    const d = String(deviceId || "default");
    const dVal = Number(delta) || 0;

    const item = this._getOrCreateItem(pId);
    if (dVal > 0) {
      item.pCounter.increment(d, dVal);
      item.lwwSet.add(pId, ts);
      item.addedAt = Math.max(item.addedAt, ts);
    } else if (dVal < 0) {
      const decAmount = Math.min(Math.abs(dVal), item.pCounter.value);
      if (decAmount > 0) {
        item.pCounter.decrement(d, decAmount);
      }
      if (item.pCounter.value <= 0) {
        item.lwwSet.remove(pId, ts);
        item.removedAt = Math.max(item.removedAt, ts);
      } else {
        item.lwwSet.add(pId, ts);
        item.addedAt = Math.max(item.addedAt, ts);
      }
    }
    item.lastUpdatedDeviceId = d;
    return this;
  }

  setQuantity(deviceId, productId, targetQty, timestamp = Date.now()) {
    const pId = String(productId);
    const ts = Number(timestamp) || Date.now();
    const target = Number(targetQty) || 0;

    const item = this._getOrCreateItem(pId);
    const currentQty = item.pCounter.value;
    const delta = target - currentQty;

    if (delta !== 0) {
      this.updateQuantity(deviceId, pId, delta, ts);
    }
    if (target <= 0) {
      this.removeItem(deviceId, pId, ts);
    }
    return this;
  }

  /**
   * Phép Merge Join-Semilattice: Giao hoán, Kết hợp, Lũy đẳng
   */
  merge(remoteCartState) {
    if (!remoteCartState) return this;

    let remoteItems = null;
    if (remoteCartState instanceof CrdtCart) {
      remoteItems = remoteCartState.items;
    } else if (remoteCartState.items) {
      if (Array.isArray(remoteCartState.items)) {
        remoteItems = new Map();
        for (const item of remoteCartState.items) {
          const pId = String(item.productId || item.id);
          remoteItems.set(pId, item);
        }
      } else if (typeof remoteCartState.items === "object") {
        remoteItems = new Map(Object.entries(remoteCartState.items));
      }
    }

    if (!remoteItems) return this;

    for (const [pId, remoteItem] of remoteItems.entries()) {
      const localItem = this._getOrCreateItem(pId, remoteItem.metadata);

      // 1. Merge PNCounter
      localItem.pCounter.merge(remoteItem.pCounter || {
        p: remoteItem.pVector || remoteItem.p,
        n: remoteItem.nVector || remoteItem.n,
      });

      // 2. Read Timestamps BEFORE merging LWWElementSet to avoid local AddedAt pollution
      const remoteAddedAt = Number(remoteItem.addedAt) || (remoteItem.lwwSet?.addSet?.[pId]) || 0;
      const remoteRemovedAt = Number(remoteItem.removedAt) || (remoteItem.lwwSet?.removeSet?.[pId]) || 0;
      const localAddedAt = Number(localItem.addedAt) || (localItem.lwwSet?.addSet?.[pId]) || 0;

      // 3. Merge LWWElementSet
      localItem.lwwSet.merge(remoteItem.lwwSet || {
        addSet: remoteItem.addSet,
        removeSet: remoteItem.removeSet,
      });

      const remoteDev = String(remoteItem.deviceId || remoteItem.lastUpdatedDeviceId || "");
      const localDev = String(localItem.lastUpdatedDeviceId || localItem.deviceId || "");

      // Deterministic 3-Tier LWW tie-breaker:
      // 1. Primary: compare logical timestamp (higher addedAt wins)
      // 2. Secondary: compare device ID (lexicographically greater deviceId wins)
      // 3. Tertiary: compare serialized metadata (guarantees commutativity even if same device mutated at same millisecond)
      const isRemoteNewer = (remoteAddedAt > localAddedAt) ||
        (remoteAddedAt === localAddedAt && remoteDev > localDev) ||
        (remoteAddedAt === localAddedAt && remoteDev === localDev &&
         JSON.stringify(remoteItem.metadata || {}) > JSON.stringify(localItem.metadata || {}));

      if (isRemoteNewer && remoteItem.metadata) {
        localItem.metadata = { ...localItem.metadata, ...remoteItem.metadata };
        localItem.lastUpdatedDeviceId = remoteDev || localDev;
      }

      localItem.addedAt = Math.max(localItem.addedAt, remoteAddedAt);
      localItem.removedAt = Math.max(localItem.removedAt, remoteRemovedAt);
      if (localItem.addedAt > 0) localItem.lwwSet.addSet[pId] = localItem.addedAt;
      if (localItem.removedAt > 0) localItem.lwwSet.removeSet[pId] = localItem.removedAt;
    }

    return this;
  }

  getCartItems() {
    const result = [];
    const sortedKeys = Array.from(this.items.keys()).sort();
    for (const pId of sortedKeys) {
      const item = this.items.get(pId);
      const isPresent = item.addedAt >= item.removedAt && item.addedAt > 0;
      const quantity = item.pCounter.value;

      if (isPresent && quantity > 0) {
        result.push({
          id: pId,
          productId: pId,
          name: item.metadata.name,
          price: item.metadata.price,
          originalPrice: item.metadata.originalPrice,
          image: item.metadata.image,
          shopId: item.metadata.shopId,
          shopName: item.metadata.shopName,
          selectedColor: item.metadata.selectedColor,
          selectedSize: item.metadata.selectedSize,
          quantity,
          subtotal: item.metadata.price * quantity,
          addedAt: item.addedAt,
          removedAt: item.removedAt,
          lastUpdated: Math.max(item.addedAt, item.removedAt),
          deviceId: item.lastUpdatedDeviceId,
        });
      }
    }
    return result;
  }

  getTotals() {
    const items = this.getCartItems();
    let totalItems = 0;
    let subtotal = 0;

    for (const it of items) {
      totalItems += it.quantity;
      subtotal += it.subtotal;
    }

    return {
      totalItems,
      itemCount: totalItems,
      subtotal,
      uniqueSkus: items.length,
      distinctItems: items.length,
    };
  }

  clear(deviceId, timestamp = Date.now()) {
    const ts = Number(timestamp) || Date.now();
    const d = String(deviceId || "default");
    for (const item of this.items.values()) {
      item.lwwSet.remove(item.productId, ts);
      item.removedAt = Math.max(item.removedAt, ts);
      item.lastUpdatedDeviceId = d;
    }
    return this;
  }

  toJSON() {
    const itemsObj = {};
    const sortedKeys = Array.from(this.items.keys()).sort();
    for (const pId of sortedKeys) {
      const item = this.items.get(pId);
      const pCountJson = item.pCounter.toJSON();
      itemsObj[pId] = {
        productId: pId,
        metadata: item.metadata,
        pCounter: pCountJson,
        pVector: pCountJson.p,
        nVector: pCountJson.n,
        lwwSet: item.lwwSet.toJSON(),
        addedAt: item.addedAt,
        removedAt: item.removedAt,
        deviceId: item.lastUpdatedDeviceId,
      };
    }

    return {
      cartId: this.cartId,
      userId: this.userId,
      items: itemsObj,
    };
  }

  static fromJSON(data) {
    if (!data) return new CrdtCart();
    return new CrdtCart(data);
  }
}
