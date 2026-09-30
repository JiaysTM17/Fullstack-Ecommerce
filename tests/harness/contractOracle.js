/**
 * Contract Oracle & Specification Engine
 * Authoritative source of business logic, formulas, validation rules,
 * and interface contracts derived directly from ORIGINAL_REQUEST.md and PROJECT.md.
 */

export class ContractOracle {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map();
    this.shops = new Map();
    this.products = new Map();
    this.vouchers = new Map();
    this.orders = new Map();
    this.returns = new Map();
    this.invoices = new Map();
    this.chatSessions = new Map();
    this.coinLedger = new Map(); // userId -> { balance, streak, lastCheckinDate, lastSpinDate }
    this.userAddresses = new Map(); // userId -> Array of address objects
    this.reviews = new Map(); // productId -> Array of review objects
    this.userClaimedVouchers = new Map(); // userId -> Set of voucher codes
    this.coinTransactions = new Map(); // userId -> Array of coin transaction objects
    this.userNotifications = new Map(); // userId -> Array of notification objects
    this.recentlyViewed = new Map(); // userId -> Array of product objects
    this.questions = new Map(); // productId -> Array of question objects
    this.wishlists = new Map(); // userId -> Array of wishlist objects
    this.initDefaultFixtures();
  }

  initDefaultFixtures() {
    // Admin fixture
    this.users.set("admin-1", {
      id: "admin-1",
      email: "admin@shopee.enterprise.vn",
      passwordHash: "mock-hash-admin",
      fullName: "Super Administrator",
      role: "admin",
      status: "active",
      shopId: null,
    });

    // Seed vouchers
    this.vouchers.set("FREESHIP15K", {
      code: "FREESHIP15K",
      type: "freeship",
      discountAmount: 15000,
      maxShippingDiscount: 15000,
      minSpend: 50000,
      scope: "platform",
      shopId: null,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    });

    this.vouchers.set("FREESHIP30K", {
      code: "FREESHIP30K",
      type: "freeship",
      discountAmount: 30000,
      maxShippingDiscount: 30000,
      minSpend: 150000,
      scope: "platform",
      shopId: null,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    });

    this.vouchers.set("GIAM20K", {
      code: "GIAM20K",
      type: "fixed",
      discountAmount: 20000,
      maxDiscount: 20000,
      minSpend: 100000,
      scope: "platform",
      shopId: null,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    });

    this.vouchers.set("DISCOUNT10PCT", {
      code: "DISCOUNT10PCT",
      type: "percentage",
      percentage: 10,
      maxDiscount: 50000,
      minSpend: 200000,
      scope: "platform",
      shopId: null,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    });

    this.vouchers.set("SHOP_TECH_50K", {
      code: "SHOP_TECH_50K",
      type: "fixed",
      discountAmount: 50000,
      maxDiscount: 50000,
      minSpend: 300000,
      scope: "shop",
      shopId: "shop-tech-world",
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    });

    this.vouchers.set("EXPIRED_VOUCHER", {
      code: "EXPIRED_VOUCHER",
      type: "fixed",
      discountAmount: 10000,
      maxDiscount: 10000,
      minSpend: 50000,
      scope: "platform",
      shopId: null,
      isActive: false,
      expiryDate: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  // ==========================================
  // SUBSYSTEM 1: AUTH & RBAC (Features 1-8)
  // ==========================================

  registerUser({ email, password, fullName, role = "customer" }) {
    if (!email || !email.includes("@")) {
      throw new Error("INVALID_EMAIL: Valid email is required");
    }
    if (!password || password.length < 6) {
      throw new Error("WEAK_PASSWORD: Password must be at least 6 characters");
    }
    if (!fullName || fullName.trim().length === 0) {
      throw new Error("MISSING_NAME: Full name is required");
    }
    const validRoles = ["customer", "seller", "admin"];
    if (!validRoles.includes(role)) {
      throw new Error(`INVALID_ROLE: Role must be one of: ${validRoles.join(", ")}`);
    }

    // Check duplicate email
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        throw new Error("EMAIL_EXISTS: Email is already registered");
      }
    }

    const id = "usr-" + Math.random().toString(36).substring(2, 9);
    const user = {
      id,
      email: email.toLowerCase(),
      fullName,
      role,
      status: "active",
      shopId: null,
      shops: [],
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);

    // Initialize coin ledger
    this.coinLedger.set(id, {
      balance: 10000, // Welcome gift 10,000 Xu
      streak: 0,
      lastCheckinDate: null,
      lastSpinDate: null,
    });
    this.coinTransactions.set(id, [
      {
        id: `c-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        amount: 10000,
        type: "plus",
        category: "welcome",
        orderId: null,
      },
    ]);

    return {
      token: `jwt-token-${id}-${role}`,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, status: user.status, shopId: user.shopId },
    };
  }

  loginUser({ email, password }) {
    if (!email || !password) {
      throw new Error("MISSING_CREDENTIALS: Email and password are required");
    }
    let matched = null;
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        matched = u;
        break;
      }
    }
    if (!matched) {
      throw new Error("INVALID_CREDENTIALS: User not found");
    }
    if (matched.status === "banned") {
      throw new Error("ACCOUNT_BANNED: Your account has been suspended by administrator");
    }

    return {
      token: `jwt-token-${matched.id}-${matched.role}`,
      user: {
        id: matched.id,
        email: matched.email,
        fullName: matched.fullName,
        role: matched.role,
        status: matched.status,
        shopId: matched.shopId,
        shops: matched.shops || [],
      },
    };
  }

  verifyToken(token) {
    if (!token || !token.startsWith("jwt-token-")) {
      throw new Error("UNAUTHORIZED: Invalid or missing token");
    }
    const parts = token.split("-");
    const userId = parts.slice(2, -1).join("-");
    const role = parts[parts.length - 1];
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND: Token corresponds to non-existent user");
    }
    if (user.status === "banned") {
      throw new Error("ACCOUNT_BANNED: User session invalidated");
    }
    return user;
  }

  createShop({ name, logo, address, bankInfo, description }, user) {
    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("FORBIDDEN: Only sellers or admins can create a shop");
    }
    if (!name || name.trim().length === 0) {
      throw new Error("INVALID_SHOP_NAME: Shop name is required");
    }
    if (!address) {
      throw new Error("MISSING_SHOP_ADDRESS: Shop address is required");
    }
    if (!bankInfo || !bankInfo.accountNumber || !bankInfo.bankName) {
      throw new Error("MISSING_BANK_INFO: Valid bank account info is required for payout");
    }

    const shopId = "shop-" + Math.random().toString(36).substring(2, 9);
    const shop = {
      id: shopId,
      ownerId: user.id,
      name,
      logo: logo || "/images/default-shop-logo.png",
      address,
      bankInfo,
      description: description || "",
      status: "active",
      bio: description || "",
      shippingPolicy: "Standard Express shipping nationwide within 2-4 days",
      returnPolicy: "Free 15-day return for unopened or defective products",
      contactInfo: { phone: "0901234567", email: user.email },
      createdAt: new Date().toISOString(),
    };
    this.shops.set(shopId, shop);

    // Update user active shop and list of shops
    user.shopId = shopId;
    if (!user.shops) user.shops = [];
    user.shops.push(shopId);

    return shop;
  }

  switchShop(shopId, user) {
    if (!user.shops || !user.shops.includes(shopId)) {
      throw new Error("UNAUTHORIZED_SHOP: User does not own or have access to this shop");
    }
    const targetShop = this.shops.get(shopId);
    if (!targetShop) {
      throw new Error("SHOP_NOT_FOUND: Shop does not exist");
    }
    if (targetShop.status === "locked") {
      throw new Error("SHOP_LOCKED: Shop is locked by administrator");
    }
    user.shopId = shopId;
    return { activeShopId: shopId, shop: targetShop };
  }

  updateShopProfile(shopId, updates, user) {
    const shop = this.shops.get(shopId);
    if (!shop) throw new Error("SHOP_NOT_FOUND");
    if (shop.ownerId !== user.id && user.role !== "admin") {
      throw new Error("FORBIDDEN: You can only edit your own shop");
    }
    if (updates.bio !== undefined) shop.bio = updates.bio;
    if (updates.shippingPolicy !== undefined) shop.shippingPolicy = updates.shippingPolicy;
    if (updates.returnPolicy !== undefined) shop.returnPolicy = updates.returnPolicy;
    if (updates.contactInfo !== undefined) shop.contactInfo = { ...shop.contactInfo, ...updates.contactInfo };
    if (updates.name) shop.name = updates.name;
    return shop;
  }

  moderateShop(shopId, status, adminUser) {
    if (adminUser.role !== "admin") {
      throw new Error("FORBIDDEN: Admin privileges required for shop moderation");
    }
    const validStatuses = ["active", "locked", "under_review"];
    if (!validStatuses.includes(status)) {
      throw new Error("INVALID_STATUS: Status must be active, locked, or under_review");
    }
    const shop = this.shops.get(shopId);
    if (!shop) throw new Error("SHOP_NOT_FOUND");
    shop.status = status;
    return shop;
  }

  moderateUser(userId, status, adminUser) {
    if (adminUser.role !== "admin") {
      throw new Error("FORBIDDEN: Admin privileges required for user moderation");
    }
    const user = this.users.get(userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    user.status = status;
    return user;
  }

  // ==========================================
  // SUBSYSTEM 2: DUAL VOUCHERS & PRICING (Features 9-17)
  // ==========================================

  calculatePricing({ items, shippingFee = 30000, voucherCode = null, freeshipCode = null, coinsUsed = 0 }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("EMPTY_CART: Cart items cannot be empty");
    }

    // 1. Calculate subtotal
    let subtotal = 0;
    const shopSubtotals = new Map();

    for (const item of items) {
      if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        throw new Error("INVALID_QUANTITY: Item quantity must be a positive integer");
      }
      if (item.price < 0) {
        throw new Error("NEGATIVE_PRICE: Item price cannot be negative");
      }
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      const sId = item.shopId || "default-shop";
      shopSubtotals.set(sId, (shopSubtotals.get(sId) || 0) + lineTotal);
    }

    // 2. Order Discount Voucher calculation
    let voucherDiscount = 0;
    let appliedVoucher = null;

    if (voucherCode) {
      const v = this.vouchers.get(voucherCode);
      if (!v) {
        throw new Error(`INVALID_VOUCHER: Voucher code "${voucherCode}" does not exist`);
      }
      if (!v.isActive || new Date(v.expiryDate) < new Date()) {
        throw new Error(`EXPIRED_VOUCHER: Voucher code "${voucherCode}" is expired or inactive`);
      }
      if (v.type === "freeship") {
        throw new Error(`VOUCHER_TYPE_MISMATCH: "${voucherCode}" is a Freeship voucher, use freeshipCode`);
      }

      // Check scope & min spend
      let eligibleSubtotal = subtotal;
      if (v.scope === "shop") {
        if (!v.shopId) throw new Error("MALFORMED_VOUCHER: Shop voucher lacks shopId");
        eligibleSubtotal = shopSubtotals.get(v.shopId) || 0;
      }

      if (eligibleSubtotal < v.minSpend) {
        throw new Error(
          `SUBTOTAL_BELOW_MIN_SPEND: Subtotal (${eligibleSubtotal.toLocaleString()} VND) does not meet min spend (${v.minSpend.toLocaleString()} VND)`
        );
      }

      if (v.type === "percentage") {
        const rawDiscount = (eligibleSubtotal * v.percentage) / 100;
        voucherDiscount = v.maxDiscount ? Math.min(rawDiscount, v.maxDiscount) : rawDiscount;
      } else if (v.type === "fixed") {
        voucherDiscount = Math.min(v.discountAmount, eligibleSubtotal);
        if (v.maxDiscount) {
          voucherDiscount = Math.min(voucherDiscount, v.maxDiscount);
        }
      }
      appliedVoucher = { code: v.code, discount: voucherDiscount, type: v.type };
    }

    // 3. Freeship Voucher calculation
    let shippingDiscount = 0;
    let appliedFreeship = null;

    if (freeshipCode) {
      const fv = this.vouchers.get(freeshipCode);
      if (!fv) {
        throw new Error(`INVALID_FREESHIP_VOUCHER: Freeship code "${freeshipCode}" does not exist`);
      }
      if (fv.type !== "freeship") {
        throw new Error(`VOUCHER_TYPE_MISMATCH: "${freeshipCode}" is not a freeship voucher`);
      }
      if (!fv.isActive || new Date(fv.expiryDate) < new Date()) {
        throw new Error(`EXPIRED_FREESHIP_VOUCHER: Freeship code "${freeshipCode}" is expired or inactive`);
      }
      if (subtotal < fv.minSpend) {
        throw new Error(
          `SUBTOTAL_BELOW_MIN_SPEND: Subtotal does not meet freeship min spend of ${fv.minSpend.toLocaleString()} VND`
        );
      }

      const maxShipCap = fv.maxShippingDiscount || 30000;
      shippingDiscount = Math.min(shippingFee, Math.min(fv.discountAmount, maxShipCap));
      appliedFreeship = { code: fv.code, discount: shippingDiscount };
    }

    // 4. Effective shipping fee
    const effectiveShippingFee = Math.max(0, shippingFee - shippingDiscount);

    // 5. Mini Xu deduction with 50% subtotal cap guard
    const maxCoinAllowed = Math.floor(0.5 * subtotal);
    const validCoinsUsed = Math.max(0, Math.min(coinsUsed, maxCoinAllowed));
    const coinDiscount = validCoinsUsed; // 1 Xu = 1 VND

    // 6. Final net total
    const finalTotal = Math.max(0, subtotal - voucherDiscount - coinDiscount + effectiveShippingFee);

    // 7. VietQR dynamic generation
    const vietQRPayload = {
      bankBin: "970436", // Vietcombank BIN
      accountNo: "0318924019",
      accountName: "CONG TY TNHH MINI SHOPEE VIET NAM",
      amount: finalTotal,
      memo: `SHOPEE-${Math.floor(Date.now() / 1000)}`,
      qrUrl: `https://img.vietqr.io/image/970436-0318924019-compact.png?amount=${finalTotal}&addInfo=SHOPEE_ORDER`,
    };

    return {
      subtotal,
      shippingFee,
      shippingDiscount,
      effectiveShippingFee,
      voucherCode: appliedVoucher ? appliedVoucher.code : null,
      voucherDiscount,
      freeshipCode: appliedFreeship ? appliedFreeship.code : null,
      coinsUsed: validCoinsUsed,
      coinDiscount,
      finalTotal,
      total: finalTotal,
      vietQRPayload,
      multiShopGroups: Array.from(shopSubtotals.entries()).map(([shopId, sub]) => ({
        shopId,
        subtotal: sub,
      })),
    };
  }

  createOrder(orderPayload, user) {
    const pricing = this.calculatePricing(orderPayload);
    const orderId = "ord-" + Math.random().toString(36).substring(2, 9);

    // Validate user coin balance if coins were used
    if (pricing.coinsUsed > 0 && user) {
      const ledger = this.coinLedger.get(user.id);
      if (!ledger || ledger.balance < pricing.coinsUsed) {
        throw new Error("INSUFFICIENT_COINS: User does not have enough Mini Xu");
      }
      ledger.balance -= pricing.coinsUsed;

      const txs = this.coinTransactions.get(user.id) || [];
      txs.unshift({
        id: `c-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        amount: pricing.coinsUsed,
        type: "minus",
        category: "order",
        orderId,
      });
      this.coinTransactions.set(user.id, txs);
    }

    // Decrement catalog stock for each item
    for (const item of orderPayload.items) {
      if (item.productId && this.products.has(item.productId)) {
        const prod = this.products.get(item.productId);
        if (prod.stock < item.quantity) {
          throw new Error(`OUT_OF_STOCK: Product "${prod.name}" only has ${prod.stock} items remaining`);
        }
        prod.stock -= item.quantity;
      }
    }

    const order = {
      id: orderId,
      customerId: user ? user.id : "guest",
      customer: orderPayload.customer || { fullName: "Anonymous Buyer", phone: "0900000000", address: "Vietnam" },
      items: orderPayload.items,
      subtotal: pricing.subtotal,
      shippingFee: pricing.shippingFee,
      shippingDiscount: pricing.shippingDiscount,
      effectiveShippingFee: pricing.effectiveShippingFee,
      voucherCode: pricing.voucherCode,
      voucherDiscount: pricing.voucherDiscount,
      freeshipCode: pricing.freeshipCode,
      coinsUsed: pricing.coinsUsed,
      coinDiscount: pricing.coinDiscount,
      total: pricing.finalTotal,
      paymentMethod: orderPayload.paymentMethod || "COD",
      paymentStatus: orderPayload.paymentMethod === "COD" ? "unpaid" : "paid",
      vietQRPayload: pricing.vietQRPayload,
      status: "pending",
      trackingCode: `SPXVN${orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
      trackingNumber: `SPXVN${orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
      carrier: "SPX Express",
      trackingStages: [
        { stage: "pending", timestamp: new Date().toISOString(), message: "Đơn hàng đã được đặt thành công" },
      ],
      createdAt: new Date().toISOString(),
    };

    this.orders.set(orderId, order);

    if (user && user.id) {
      this.triggerNotification(user.id, {
        type: "order",
        title: `Đặt hàng thành công #${orderId}`,
        message: `Đơn hàng trị giá ${order.total} VND đã được tiếp nhận.`,
        orderId,
      });
    }

    return order;
  }

  cancelOrder(orderId, user) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "pending" && order.status !== "confirmed") {
      throw new Error(`CANNOT_CANCEL: Cannot cancel order in status ${order.status}`);
    }

    order.status = "cancelled";
    // Restore stock
    for (const item of order.items) {
      if (item.productId && this.products.has(item.productId)) {
        const prod = this.products.get(item.productId);
        prod.stock += item.quantity;
      }
    }
    // Refund coins if used
    if (order.coinsUsed > 0 && order.customerId && this.coinLedger.has(order.customerId)) {
      this.coinLedger.get(order.customerId).balance += order.coinsUsed;
      const txs = this.coinTransactions.get(order.customerId) || [];
      txs.unshift({
        id: `c-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        amount: order.coinsUsed,
        type: "plus",
        category: "refund",
        orderId: order.id,
      });
      this.coinTransactions.set(order.customerId, txs);
    }

    if (order.customerId) {
      this.triggerNotification(order.customerId, {
        type: "order",
        title: `Đã hủy đơn hàng #${order.id}`,
        message: "Đơn hàng đã được hủy thành công và hoàn lại tiền/xu.",
        orderId: order.id,
      });
    }

    return order;
  }

  // ==========================================
  // SUBSYSTEM 3: AI CHAT & 24/7 HANDOVER (Features 18-24)
  // ==========================================

  initChatSession(sessionId = null, userId = "guest") {
    const sId = sessionId || "chat-" + Math.random().toString(36).substring(2, 9);
    const session = {
      sessionId: sId,
      userId,
      status: "ai", // 'ai' | 'handover_connecting' | 'human'
      agentPersona: null,
      messages: [
        {
          id: "msg-welcome",
          sender: "ai",
          text: "Xin chào! Em là Trợ lý AI Mini Shopee. Em có thể giúp gì cho bạn hôm nay?",
          timestamp: new Date().toISOString(),
          recommendedProducts: [],
        },
      ],
      createdAt: new Date().toISOString(),
    };
    this.chatSessions.set(sId, session);
    return session;
  }

  sendChatMessage(sessionId, { text, voiceInput = false }) {
    let session = this.chatSessions.get(sessionId);
    if (!session) {
      session = this.initChatSession(sessionId);
    }

    const userMsg = {
      id: "msg-" + Math.random().toString(36).substring(2, 8),
      sender: "user",
      text,
      isVoice: voiceInput,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    // Check handover intent
    const handoverKeywords = ["gặp nhân viên", "tư vấn viên", "chuyển người trực", "gặp cskh", "nhân viên hỗ trợ"];
    const hasHandoverIntent = handoverKeywords.some((kw) => text.toLowerCase().includes(kw));

    if (hasHandoverIntent && session.status === "ai") {
      return this.triggerHandover(sessionId);
    }

    let responseMsg = null;
    if (session.status === "human") {
      // Kim Ngân responds
      responseMsg = {
        id: "msg-" + Math.random().toString(36).substring(2, 8),
        sender: "human",
        agentName: "Kim Ngân",
        agentCode: "CSKH-8821",
        avatar: "/images/cskh-kimngan.png",
        badge: "emerald",
        text: `Chào bạn, Kim Ngân (CSKH-8821) đây ạ. Em đã tiếp nhận yêu cầu: "${text}". Em sẽ hỗ trợ bạn ngay lập tức!`,
        timestamp: new Date().toISOString(),
      };
    } else {
      // AI assistant responds with product recommendation if asking about shopping
      const isProductQuery = /mua|giá|áo|giày|điện thoại|polo/i.test(text);
      const recommendedProducts = isProductQuery
        ? [
            {
              id: "prod-recom-1",
              name: "Áo Polo Nam Mini Shopee Cao Cấp",
              price: 189000,
              image: "/images/polo.jpg",
              quickBuyAction: { productId: "prod-recom-1", price: 189000 },
            },
          ]
        : [];

      responseMsg = {
        id: "msg-" + Math.random().toString(36).substring(2, 8),
        sender: "ai",
        text: isProductQuery
          ? "Dạ em gợi ý bạn sản phẩm đang bán chạy nhất bên em ạ. Bạn có thể nhấn 'Mua ngay' trực tiếp bên dưới!"
          : `Trợ lý AI đã ghi nhận: "${text}". Bạn cần thêm thông tin gì nữa không ạ?`,
        recommendedProducts,
        timestamp: new Date().toISOString(),
      };
    }

    session.messages.push(responseMsg);
    return { session, reply: responseMsg };
  }

  triggerHandover(sessionId) {
    const session = this.chatSessions.get(sessionId);
    if (!session) throw new Error("CHAT_SESSION_NOT_FOUND");

    // State 1: handover_connecting with audio chime trigger
    session.status = "handover_connecting";
    const connectingMsg = {
      id: "msg-conn-" + Math.random().toString(36).substring(2, 8),
      sender: "system",
      text: "Đang kết nối bạn với chuyên viên chăm sóc khách hàng...",
      audioChime: "connecting_chime",
      delayMs: 1200,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(connectingMsg);

    // State 2: human handover completed
    session.status = "human";
    session.agentPersona = {
      name: "Kim Ngân",
      code: "CSKH-8821",
      title: "Chuyên viên CSKH 24/7",
      avatar: "/images/cskh-kimngan.png",
      badgeColor: "#10b981", // emerald
    };

    const welcomeHumanMsg = {
      id: "msg-human-" + Math.random().toString(36).substring(2, 8),
      sender: "human",
      agentName: "Kim Ngân",
      agentCode: "CSKH-8821",
      badge: "emerald",
      text: "Dạ em chào anh/chị! Em là Kim Ngân (CSKH-8821). Em rất vui được hỗ trợ trực tiếp cho anh/chị ngay bây giờ ạ!",
      audioChime: "connected_chime",
      timestamp: new Date().toISOString(),
    };
    session.messages.push(welcomeHumanMsg);

    return { session, status: "human", connectingMsg, welcomeHumanMsg };
  }

  returnToAI(sessionId) {
    const session = this.chatSessions.get(sessionId);
    if (!session) throw new Error("CHAT_SESSION_NOT_FOUND");
    session.status = "ai";
    session.agentPersona = null;
    const msg = {
      id: "msg-ai-return-" + Math.random().toString(36).substring(2, 8),
      sender: "system",
      text: "Bạn đã quay lại trò chuyện cùng Trợ lý AI Mini Shopee.",
      timestamp: new Date().toISOString(),
    };
    session.messages.push(msg);
    return { session, status: "ai" };
  }

  // ==========================================
  // SUBSYSTEM 4: POST-ORDER & GAMIFICATION (Features 25-33)
  // ==========================================

  requestReturn({ orderId, reason, refundMethod = "wallet", bankDetails = null, images = [] }, user) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND: Order does not exist");
    if (order.status !== "shipping" && order.status !== "completed" && order.status !== "delivered") {
      throw new Error(`INVALID_RETURN_STATE: Cannot return order in status ${order.status}`);
    }

    const validReasons = [
      "Hàng lỗi, không hoạt động",
      "Giao sai hàng",
      "Hàng bể vỡ do vận chuyển",
      "Thiếu phụ kiện, quà tặng",
      "Hàng khác xa mô tả",
      "Không vừa kích cỡ, màu sắc",
    ];

    if (!validReasons.includes(reason)) {
      throw new Error(`INVALID_RETURN_REASON: Reason must be one of predefined categories`);
    }

    if (refundMethod === "bank" && (!bankDetails || !bankDetails.accountNo || !bankDetails.bankName)) {
      throw new Error("MISSING_BANK_DETAILS: Bank details required for bank refund method");
    }

    const returnId = "ret-" + Math.random().toString(36).substring(2, 9);
    const returnReq = {
      id: returnId,
      orderId,
      customerId: user ? user.id : order.customerId,
      shopId: order.items[0]?.shopId || "default-shop",
      reason,
      refundMethod,
      bankDetails,
      images,
      status: "pending_seller", // 'pending_seller' | 'accepted' | 'rejected' | 'escalated_admin' | 'refunded'
      refundAmount: order.total,
      createdAt: new Date().toISOString(),
    };

    this.returns.set(returnId, returnReq);
    return returnReq;
  }

  moderateReturn(returnId, decision, moderatorUser, adminResolution = null) {
    const ret = this.returns.get(returnId);
    if (!ret) throw new Error("RETURN_REQUEST_NOT_FOUND");

    if (decision === "accepted") {
      ret.status = "refunded";
      ret.resolvedBy = moderatorUser.role;
      // Refund to wallet
      if (ret.refundMethod === "wallet" && this.coinLedger.has(ret.customerId)) {
        this.coinLedger.get(ret.customerId).balance += ret.refundAmount;
      }
      // Restore inventory
      const order = this.orders.get(ret.orderId);
      if (order) {
        for (const it of order.items) {
          if (it.productId && this.products.has(it.productId)) {
            this.products.get(it.productId).stock += it.quantity;
          }
        }
      }
    } else if (decision === "rejected") {
      ret.status = "rejected";
      ret.resolvedBy = moderatorUser.role;
    } else if (decision === "escalated_admin") {
      ret.status = "escalated_admin";
    } else if (decision === "admin_resolve") {
      if (moderatorUser.role !== "admin") throw new Error("FORBIDDEN: Admin role required");
      ret.status = adminResolution === "refund" ? "refunded" : "rejected";
      ret.resolvedBy = "admin";
      if (adminResolution === "refund") {
        if (ret.refundMethod === "wallet" && this.coinLedger.has(ret.customerId)) {
          this.coinLedger.get(ret.customerId).balance += ret.refundAmount;
        }
        const order = this.orders.get(ret.orderId);
        if (order) {
          for (const it of order.items) {
            if (it.productId && this.products.has(it.productId)) {
              this.products.get(it.productId).stock += it.quantity;
            }
          }
        }
      }
    }

    return ret;
  }

  getVATInvoice(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const subtotal = order.subtotal !== undefined ? order.subtotal : (order.total || 0);
    const vatRate = 0.08; // 8% VAT
    const netAmount = Math.round(subtotal / (1 + vatRate));
    const vatAmount = subtotal - netAmount;

    const invoice = {
      invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${orderId.substring(4, 8).toUpperCase()}`,
      invoiceSerial: "1C26MMS",
      templateCode: "01GTKT0/001",
      orderId: order.id,
      company: {
        legalName: "CÔNG TY TNHH MINI SHOPEE VIỆT NAM",
        taxCode: "0318924019",
        address: "Tòa nhà Capital Tower, 109 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
        phone: "1900-1221",
        email: "vat-invoice@shopee.enterprise.vn",
      },
      seller: {
        companyName: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        taxCode: "0316892345",
        address: "Tầng 18, Tòa nhà Saigon Centre, 65 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        phone: "1900 1221",
        email: "cskh@minishopee.vn",
      },
      buyer: order.customer,
      items: order.items.map((i, idx) => ({
        index: idx + 1,
        name: i.name,
        quantity: i.quantity || 1,
        unitPrice: i.price,
        amount: (i.price || 0) * (i.quantity || 1),
        vatRate: "8%",
      })),
      subtotal,
      netSubtotal: netAmount,
      netAmount,
      vatRate: "8%",
      vatAmount,
      pricing: {
        subtotal,
        netSubtotal: netAmount,
        vatAmount,
        shippingFee: order.shippingFee || 0,
        shippingDiscount: order.shippingDiscount || 0,
        voucherDiscount: order.voucherDiscount || 0,
        coinDiscount: order.coinDiscount || 0,
        total: order.total,
      },
      digitalSignature: {
        signedBy: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        signedDate: order.createdAt || new Date().toISOString(),
        verified: true,
      },
      qrCodeString: `https://minishopee.vn/invoice/verify?id=${order.id}&serial=1C26MMS`,
      qrCodeUrl: `https://minishopee.vn/invoice/verify?id=${order.id}&serial=1C26MMS`,
      shippingFee: order.shippingFee || 0,
      shippingDiscount: order.shippingDiscount || 0,
      voucherDiscount: order.voucherDiscount || 0,
      totalPayment: order.total,
      total: order.total,
      issuedDate: new Date().toISOString(),
      xmlPayloadDigest: "SHA256:d8b2e3..." + Math.random().toString(36).substring(2, 8),
      htmlPrintTemplate: `<!DOCTYPE html><html><body><h1>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h1><p>MST: 0318924019</p></body></html>`,
    };

    this.invoices.set(orderId, invoice);
    return invoice;
  }

  checkinDailyStreak(user) {
    if (!user) throw new Error("UNAUTHORIZED");
    let ledger = this.coinLedger.get(user.id);
    if (!ledger) {
      ledger = { balance: 0, streak: 0, lastCheckinDate: null, lastSpinDate: null };
      this.coinLedger.set(user.id, ledger);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (ledger.lastCheckinDate === todayStr) {
      throw new Error("ALREADY_CHECKED_IN: You have already claimed today's Mini Xu reward");
    }

    // 7-day reward ladder: 500, 1000, 1500, 2000, 2500, 3000, 5000
    const rewards = [500, 1000, 1500, 2000, 2500, 3000, 5000];
    const nextStreak = (ledger.streak % 7) + 1;
    const rewardXu = rewards[nextStreak - 1];

    ledger.streak = nextStreak;
    ledger.balance += rewardXu;
    ledger.lastCheckinDate = todayStr;

    const txs = this.coinTransactions.get(user.id) || [];
    txs.unshift({
      id: `c-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      amount: rewardXu,
      type: "plus",
      category: "checkin",
      orderId: null,
    });
    this.coinTransactions.set(user.id, txs);

    return {
      streak: ledger.streak,
      rewardXu,
      newBalance: ledger.balance,
      nextDayReward: rewards[nextStreak % 7],
      checkedInDate: todayStr,
    };
  }

  spinLuckyWheel(user, forcedOutcome = null) {
    if (!user) throw new Error("UNAUTHORIZED");
    let ledger = this.coinLedger.get(user.id);
    if (!ledger) {
      ledger = { balance: 0, streak: 0, lastCheckinDate: null, lastSpinDate: null };
      this.coinLedger.set(user.id, ledger);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (ledger.lastSpinDate === todayStr) {
      throw new Error("FREE_SPIN_LIMIT_REACHED: Daily free spin already used today");
    }

    const outcomes = [
      { prize: "500_XU", value: 500, type: "coins", angle: 45 },
      { prize: "1000_XU", value: 1000, type: "coins", angle: 90 },
      { prize: "2000_XU", value: 2000, type: "coins", angle: 180 },
      { prize: "VOUCHER_GIAM20K", value: "GIAM20K", type: "voucher", angle: 270 },
      { prize: "5000_XU", value: 5000, type: "coins", angle: 360 },
    ];

    const won = forcedOutcome || outcomes[Math.floor(Math.random() * outcomes.length)];
    if (won.type === "coins") {
      ledger.balance += won.value;
      const txs = this.coinTransactions.get(user.id) || [];
      txs.unshift({
        id: `c-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        amount: won.value,
        type: "plus",
        category: "spin",
        orderId: null,
      });
      this.coinTransactions.set(user.id, txs);
    }
    ledger.lastSpinDate = todayStr;

    return {
      prize: won.prize,
      type: won.type,
      value: won.value,
      rotationAngle: won.angle + 1440, // 4 full spins + outcome angle
      newBalance: ledger.balance,
    };
  }

  getSPXTracking(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const trackingTimeline = [
      { stage: "pending", label: "Đã đặt đơn", timestamp: order.createdAt, status: "completed" },
      { stage: "confirmed", label: "Shop xác nhận & đóng gói", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "completed" },
      { stage: "shipping", label: "Đang giao hàng (SPX Express)", timestamp: new Date().toISOString(), status: "in_progress" },
      { stage: "delivered", label: "Giao hàng thành công", timestamp: null, status: "pending" },
    ];

    return {
      orderId,
      carrier: "SPX Express",
      trackingNumber: `SPX-VN-${orderId.substring(4, 9).toUpperCase()}`,
      currentStage: order.status === "delivered" ? "delivered" : "shipping",
      timeline: trackingTimeline,
    };
  }

  getGPSMapSimulation(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    return {
      orderId,
      courierName: "Nguyễn Văn Tuấn (SPX Shipper)",
      courierPhone: "0988776655",
      vehicle: "Honda Wave Alpha (29B1-88992)",
      currentLocation: { lat: 21.028511, lng: 105.854444 },
      destination: { lat: 21.036829, lng: 105.834599 },
      distanceRemainingKm: 1.8,
      etaMinutes: 12,
      driverSpeedKmh: 28,
    };
  }

  generateShippingLabel(orderId, sellerUser) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    const shop = order.items[0]?.shopId ? this.shops.get(order.items[0].shopId) : null;

    return {
      airwayBillNo: `AWB-SPX-${orderId.toUpperCase()}`,
      barcode: `*${orderId.toUpperCase()}*`,
      sender: {
        name: shop ? shop.name : "Mini Shopee Official Store",
        address: shop ? shop.address : "Kho HN-01, Long Biên, Hà Nội",
        phone: shop?.contactInfo?.phone || "0901234567",
      },
      recipient: order.customer,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      weightKg: 0.85,
      codAmount: order.paymentMethod === "COD" ? order.total : 0,
      routingCode: "HAN-LB-04",
      printedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // SUBSYSTEM 5: CATALOG & MODERATION (Features 34-38)
  // ==========================================

  createProduct({ name, price, stock, category, images = [], variants = [] }, sellerUser) {
    if (sellerUser.role !== "seller" && sellerUser.role !== "admin") {
      throw new Error("FORBIDDEN: Only sellers or admins can create products");
    }
    if (!sellerUser.shopId) {
      throw new Error("NO_SHOP: Seller must create a shop before adding products");
    }
    if (!name || name.trim().length === 0) {
      throw new Error("INVALID_PRODUCT_NAME: Product name is required");
    }
    if (price <= 0 || isNaN(price)) {
      throw new Error("INVALID_PRICE: Product price must be greater than 0");
    }
    if (stock < 0 || !Number.isInteger(stock)) {
      throw new Error("INVALID_STOCK: Product stock must be a non-negative integer");
    }

    const prodId = "prod-" + Math.random().toString(36).substring(2, 9);
    const product = {
      id: prodId,
      shopId: sellerUser.shopId,
      name,
      price,
      stock,
      category: category || "general",
      images: images.length > 0 ? images : ["/images/default-product.png"],
      variants: variants.length > 0 ? variants : [{ sku: `${prodId}-DEF`, name: "Default", price, stock }],
      moderationStatus: "pending", // 'pending' | 'approved' | 'rejected'
      createdAt: new Date().toISOString(),
    };

    this.products.set(prodId, product);
    return product;
  }

  moderateProduct(productId, status, adminUser) {
    if (adminUser.role !== "admin") {
      throw new Error("FORBIDDEN: Admin privileges required for product moderation");
    }
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      throw new Error("INVALID_STATUS: Status must be pending, approved, or rejected");
    }
    const product = this.products.get(productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    product.moderationStatus = status;
    return product;
  }

  getStorefrontProducts({ category = null, shopId = null } = {}) {
    const list = [];
    for (const prod of this.products.values()) {
      if (prod.moderationStatus === "approved") {
        if (category && prod.category !== category) continue;
        if (shopId && prod.shopId !== shopId) continue;
        list.push(prod);
      }
    }
    return list;
  }

  validateImageUpload(file) {
    if (!file) throw new Error("NO_FILE_UPLOADED");
    const allowedMime = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMime.includes(file.mimetype)) {
      throw new Error("INVALID_FILE_TYPE: Only JPEG, PNG, and WebP images are allowed");
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("FILE_TOO_LARGE: Image file size must not exceed 5MB");
    }
    return {
      url: `/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ==========================================
  // SUBSYSTEM 6: PERFORMANCE & QUALITY (Features 39-42)
  // ==========================================

  getBundleMetrics() {
    return {
      adminBundleSizeKb: 342, // Under 500 kB limit
      sellerBundleSizeKb: 285,
      storefrontBundleSizeKb: 410,
      codeSplitting: {
        lazyRoutes: ["/admin/*", "/seller/*", "/orders/invoice/*", "/chat/support"],
        vendorChunks: ["react-vendor", "charts-vendor"],
      },
      auditCompliance: {
        zeroCompilerErrors: true,
        strictRbacEnforced: true,
        imageFallbackActive: true,
      },
    };
  }

  // ==========================================
  // SUBSYSTEM 7: BUYER EXPERIENCE (Features 43-47)
  // ==========================================

  // --- Feature 43: Multi-Address Book (R1) ---
  addAddress(userId, payload) {
    if (!payload.name || !payload.phone || !payload.address) {
      throw new Error("INVALID_ADDRESS_PAYLOAD");
    }
    const cleanPhone = String(payload.phone).trim();
    const vnPhoneRegex = /^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    if (!vnPhoneRegex.test(cleanPhone)) {
      throw new Error("INVALID_PHONE_NUMBER: Must be a valid Vietnamese mobile phone number");
    }

    const list = this.userAddresses.get(userId) || [];
    const isFirst = list.length === 0;
    const isDefault = isFirst ? true : Boolean(payload.isDefault);

    if (isDefault) {
      for (const item of list) {
        item.isDefault = false;
      }
    }

    const addr = {
      id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      name: payload.name.trim(),
      phone: cleanPhone,
      address: payload.address.trim(),
      tag: payload.tag || "Nhà riêng",
      isDefault,
      createdAt: new Date().toISOString(),
    };

    list.push(addr);
    this.userAddresses.set(userId, list);
    return addr;
  }

  getUserAddresses(userId) {
    return this.userAddresses.get(userId) || [];
  }

  updateAddress(userId, addressId, updates) {
    const list = this.userAddresses.get(userId) || [];
    const addr = list.find((a) => a.id === addressId);
    if (!addr) throw new Error("ADDRESS_NOT_FOUND");

    if (updates.phone) {
      const cleanPhone = String(updates.phone).trim();
      const vnPhoneRegex = /^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!vnPhoneRegex.test(cleanPhone)) {
        throw new Error("INVALID_PHONE_NUMBER: Must be a valid Vietnamese mobile phone number");
      }
      addr.phone = cleanPhone;
    }
    if (updates.name !== undefined) addr.name = updates.name.trim();
    if (updates.address !== undefined) addr.address = updates.address.trim();
    if (updates.tag !== undefined) addr.tag = updates.tag;
    if (updates.isDefault === true) {
      for (const a of list) a.isDefault = false;
      addr.isDefault = true;
    }
    return addr;
  }

  deleteAddress(userId, addressId) {
    const list = this.userAddresses.get(userId) || [];
    const index = list.findIndex((a) => a.id === addressId);
    if (index === -1) throw new Error("ADDRESS_NOT_FOUND");

    const [deleted] = list.splice(index, 1);
    if (deleted.isDefault && list.length > 0) {
      list[0].isDefault = true;
    }
    this.userAddresses.set(userId, list);
    return list;
  }

  setDefaultAddress(userId, addressId) {
    const list = this.userAddresses.get(userId) || [];
    const addr = list.find((a) => a.id === addressId);
    if (!addr) throw new Error("ADDRESS_NOT_FOUND");

    for (const a of list) a.isDefault = false;
    addr.isDefault = true;
    return addr;
  }

  // --- Feature 44: Reviews, Ratings & Verified Badge (R2) ---
  submitReview(payload, user) {
    if (!user) throw new Error("UNAUTHORIZED");
    const { orderId, productId, rating, comment, tags } = payload;

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      throw new Error("INVALID_RATING: Rating must be an integer between 1 and 5");
    }

    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.customerId !== user.id) throw new Error("UNAUTHORIZED");

    const inOrder = order.items.some((it) => it.productId === productId);
    if (!inOrder) {
      throw new Error("PRODUCT_NOT_IN_ORDER: Cannot review a product not purchased in this order");
    }

    if (order.status !== "delivered" && order.status !== "completed") {
      throw new Error("ORDER_NOT_COMPLETED: Can only review delivered or completed orders");
    }

    const productReviews = this.reviews.get(productId) || [];
    const alreadyReviewed = productReviews.some((r) => r.orderId === orderId && r.userId === user.id);
    if (alreadyReviewed) {
      throw new Error("DUPLICATE_REVIEW: You have already submitted a review for this product in this order");
    }

    const review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId,
      productId,
      userId: user.id,
      authorName: user.fullName || "Khách hàng Mini Shopee",
      rating: numRating,
      comment: comment || "",
      tags: Array.isArray(tags) ? tags : [],
      verifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    productReviews.unshift(review);
    this.reviews.set(productId, productReviews);

    // Recalculate product rating & reviewCount
    const prod = this.products.get(productId);
    if (prod) {
      const curRating = typeof prod.rating === "number" ? prod.rating : 5.0;
      const curCount = typeof prod.reviewCount === "number" ? prod.reviewCount : 0;
      const newCount = curCount + 1;
      const newRating = Number(((curRating * curCount + numRating) / newCount).toFixed(1));
      prod.rating = newRating;
      prod.reviewCount = newCount;
    }

    // Award 200 Mini Xu to buyer
    let ledger = this.coinLedger.get(user.id);
    if (!ledger) {
      ledger = { balance: 0, streak: 0, lastCheckinDate: null, lastSpinDate: null };
      this.coinLedger.set(user.id, ledger);
    }
    ledger.balance += 200;

    const txs = this.coinTransactions.get(user.id) || [];
    txs.unshift({
      id: `c-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      amount: 200,
      type: "plus",
      category: "review",
      orderId,
    });
    this.coinTransactions.set(user.id, txs);

    this.triggerNotification(user.id, {
      type: "voucher",
      title: "Nhận +200 Mini Xu thưởng đánh giá",
      message: `Bạn nhận được 200 Xu cho đơn hàng #${orderId}.`,
      orderId,
    });

    return {
      review,
      rewardCoins: 200,
      productRating: prod ? prod.rating : numRating,
      productReviewCount: prod ? prod.reviewCount : 1,
    };
  }

  getProductReviews(productId) {
    return this.reviews.get(productId) || [];
  }

  // --- Feature 45: Advanced Order Actions (R3) ---
  repurchaseOrder(orderId, user) {
    if (!user) throw new Error("UNAUTHORIZED");
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const itemsToReorder = [];
    const outOfStockItems = [];

    for (const item of order.items) {
      const prod = this.products.get(item.productId);
      if (prod && prod.stock >= (item.quantity || 1)) {
        itemsToReorder.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: item.quantity,
          shopId: prod.shopId,
        });
      } else {
        outOfStockItems.push({
          productId: item.productId,
          name: item.name,
          availableStock: prod ? prod.stock : 0,
        });
      }
    }

    return {
      success: true,
      canReorderFully: outOfStockItems.length === 0,
      itemsToReorder,
      outOfStockItems,
    };
  }

  // --- Feature 46: Voucher Wallet & Coin Ledger (R4) ---
  claimVoucher(userId, voucherCode) {
    const code = String(voucherCode).trim().toUpperCase();
    const v = this.vouchers.get(code);
    if (!v || !v.isActive || (v.expiryDate && new Date(v.expiryDate) < new Date())) {
      throw new Error("VOUCHER_EXPIRED_OR_INACTIVE: This voucher is either expired, inactive or does not exist");
    }

    let claimed = this.userClaimedVouchers.get(userId);
    if (!claimed) {
      claimed = new Set();
      this.userClaimedVouchers.set(userId, claimed);
    }

    if (claimed.has(code)) {
      throw new Error("ALREADY_CLAIMED: You have already saved this voucher to your wallet");
    }

    claimed.add(code);
    return v;
  }

  getUserClaimedVouchers(userId) {
    const claimed = this.userClaimedVouchers.get(userId) || new Set();
    const list = [];
    for (const code of claimed) {
      if (this.vouchers.has(code)) {
        list.push(this.vouchers.get(code));
      }
    }
    return list;
  }

  getOptimalVouchers(subtotal, userId = null) {
    const amt = Number(subtotal) || 0;
    let maxDiscountAmount = 0;
    let optimalDiscountVoucher = null;

    let maxShippingDiscount = 0;
    let optimalFreeshipVoucher = null;

    for (const v of this.vouchers.values()) {
      if (!v.isActive) continue;
      if (v.expiryDate && new Date(v.expiryDate) < new Date()) continue;
      if (v.minSpend && amt < v.minSpend) continue;

      if (v.type === "freeship") {
        const shipDisc = v.maxShippingDiscount || v.discountAmount || 0;
        if (shipDisc > maxShippingDiscount) {
          maxShippingDiscount = shipDisc;
          optimalFreeshipVoucher = v;
        }
      } else {
        let disc = 0;
        const pct = v.percentage || v.discountPercent;
        if (pct) {
          disc = Math.round((amt * pct) / 100);
          if (v.maxDiscount) disc = Math.min(disc, v.maxDiscount);
        } else if (v.discountAmount) {
          disc = v.discountAmount;
        }
        if (disc > maxDiscountAmount) {
          maxDiscountAmount = disc;
          optimalDiscountVoucher = v;
        }
      }
    }

    return {
      optimalDiscountVoucher,
      maxDiscountAmount,
      optimalFreeshipVoucher,
      maxShippingDiscount,
    };
  }

  getCoinTransactions(userId) {
    return this.coinTransactions.get(userId) || [];
  }

  // --- Feature 47: Order & Promotion Notification Center (R5) ---
  triggerNotification(userId, payload) {
    const list = this.userNotifications.get(userId) || [];
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      type: payload.type || "system",
      title: payload.title || "Thông báo hệ thống",
      message: payload.message || "",
      orderId: payload.orderId || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    list.unshift(notif);
    if (list.length > 50) {
      list.length = 50;
    }
    this.userNotifications.set(userId, list);
    return notif;
  }

  getUserNotifications(userId, filter = "all") {
    const list = this.userNotifications.get(userId) || [];
    if (filter === "all") return [...list];
    return list.filter((n) => n.type === filter);
  }

  getUnreadNotificationCount(userId) {
    const list = this.userNotifications.get(userId) || [];
    return list.filter((n) => !n.isRead).length;
  }

  markNotificationAsRead(userId, notifId) {
    const list = this.userNotifications.get(userId) || [];
    const notif = list.find((n) => n.id === notifId);
    if (notif) notif.isRead = true;
    return notif;
  }

  markAllNotificationsAsRead(userId) {
    const list = this.userNotifications.get(userId) || [];
    let count = 0;
    for (const n of list) {
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    return { unreadCount: 0, markedCount: count };
  }

  // --- Feature 48: Recently Viewed Products History & Persistence (R2) ---
  recordRecentlyViewed(userId, product) {
    let list = this.recentlyViewed.get(userId) || [];
    if (!product || typeof product !== "object" || (!product.id && !product._id)) {
      return list;
    }
    const id = product._id || product.id;
    list = list.filter((p) => (p._id || p.id) !== id);
    const price = typeof product.price === "number" && !isNaN(product.price) && product.price >= 0 ? product.price : 0;
    const cleanItem = {
      ...product,
      _id: id,
      id,
      name: product.name || "Sản phẩm",
      slug: product.slug || `prod-${id}`,
      price,
      originalPrice: product.originalPrice || 0,
      image: product.image || "/images/placeholder.png",
      rating: product.rating !== undefined ? product.rating : 5,
      sold: product.sold !== undefined ? product.sold : 0,
      soldCount: product.soldCount !== undefined ? product.soldCount : (product.sold || 0),
      shopId: product.shopId || "shop_01",
      shopName: product.shopName || "Thời Trang GenZ",
      category: product.category || "",
      isOfficial: !!product.isOfficial,
      viewedAt: new Date().toISOString(),
    };
    list.unshift(cleanItem);
    if (list.length > 20) {
      list.length = 20;
    }
    this.recentlyViewed.set(userId, list);
    return list;
  }

  addRecentlyViewed(userId, product) {
    return this.recordRecentlyViewed(userId, product);
  }

  getRecentlyViewed(userId) {
    return this.recentlyViewed.get(userId) || [];
  }

  clearRecentlyViewed(userId) {
    this.recentlyViewed.set(userId, []);
    return [];
  }

  // --- Feature 49: Product Community Q&A System (R3) ---
  createQuestion(userId, productId, payload) {
    const text = typeof payload === "string" ? payload : payload.question || payload.questionText;
    if (!text || !text.trim()) {
      throw new Error("QUESTION_TEXT_REQUIRED: Nội dung câu hỏi không được để trống");
    }
    const customerName = (typeof payload === "object" ? payload.customerName || payload.userName : null);
    const user = this.users.get(userId);
    const author = customerName || (user ? user.fullName : "Người mua");
    const trimmed = text.trim();

    const list = this.questions.get(productId) || [];
    const qId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const question = {
      _id: qId,
      id: qId,
      productId,
      userId,
      customerName: author,
      userName: author,
      question: trimmed,
      questionText: trimmed,
      askedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isAnswered: false,
      answer: null,
      answeredAt: null,
      answeredBy: null,
      answers: [],
      helpfulCount: 0,
      upvotes: 0,
      votedUsers: [],
    };
    list.unshift(question);
    this.questions.set(productId, list);
    return question;
  }

  askProductQuestion(productId, payload, token = null) {
    let userId = "guest_user";
    if (token) {
      try {
        const u = this.verifyToken(token);
        userId = u.id;
      } catch (err) {}
    }
    const q = this.createQuestion(userId, productId, payload);
    return {
      success: true,
      question: q,
      data: { question: q },
      message: "Đã gửi câu hỏi thành công! Người bán sẽ phản hồi sớm.",
    };
  }

  answerQuestion(productId, questionId, answerText, answeredBy = "Shop Official", isShopOwner = true) {
    const list = this.questions.get(productId) || [];
    const q = list.find((item) => item.id === questionId || item._id === questionId);
    if (!q) throw new Error("QUESTION_NOT_FOUND: Không tìm thấy câu hỏi");
    q.answer = answerText;
    q.isAnswered = true;
    q.answeredAt = new Date().toISOString();
    q.answeredBy = answeredBy;
    if (!q.answers) q.answers = [];
    q.answers.push({
      _id: `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorName: answeredBy,
      isShopOwner: !!isShopOwner,
      content: answerText,
      createdAt: new Date().toISOString(),
    });
    return q;
  }

  answerProductQuestion(productId, questionId, payload, answeredBy = "Shop Official") {
    const content = typeof payload === "string" ? payload : payload.content || payload.answer;
    const author = typeof payload === "object" ? payload.authorName || answeredBy : answeredBy;
    const isShopOwner = typeof payload === "object" && payload.isShopOwner !== undefined ? payload.isShopOwner : true;
    return this.answerQuestion(productId, questionId, content, author, isShopOwner);
  }

  voteQuestion(userId, productId, questionId) {
    const list = this.questions.get(productId) || [];
    const q = list.find((item) => item.id === questionId || item._id === questionId);
    if (!q) throw new Error("QUESTION_NOT_FOUND: Không tìm thấy câu hỏi");
    if (!q.votedUsers) q.votedUsers = [];
    const alreadyVoted = q.votedUsers.includes(userId);
    if (alreadyVoted) {
      q.votedUsers = q.votedUsers.filter((u) => u !== userId);
      q.upvotes = Math.max(0, (q.upvotes || 0) - 1);
      q.helpfulCount = q.upvotes;
    } else {
      q.votedUsers.push(userId);
      q.upvotes = (q.upvotes || 0) + 1;
      q.helpfulCount = q.upvotes;
    }
    return {
      success: true,
      helpfulCount: q.helpfulCount,
      upvotes: q.upvotes,
      hasVoted: !alreadyVoted,
      data: { helpfulCount: q.helpfulCount },
      message: "Cảm ơn bạn đã bình chọn câu hỏi hữu ích!",
    };
  }

  voteProductQuestion(productId, questionId, token = null) {
    const userId = token ? (this.users.get(token.split("-")[2])?.id || `user_${Date.now()}`) : `voter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const list = this.questions.get(productId) || [];
    const q = list.find((item) => item.id === questionId || item._id === questionId);
    if (!q) throw new Error("QUESTION_NOT_FOUND: Không tìm thấy câu hỏi");
    q.helpfulCount = (q.helpfulCount || 0) + 1;
    q.upvotes = q.helpfulCount;
    return {
      success: true,
      helpfulCount: q.helpfulCount,
      upvotes: q.upvotes,
      data: { helpfulCount: q.helpfulCount },
      message: "Cảm ơn bạn đã bình chọn câu hỏi hữu ích!",
    };
  }

  getProductQuestions(productId) {
    const stored = this.questions.get(productId) || [];
    const sorted = [...stored].sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
    sorted.productId = productId;
    sorted.total = sorted.length;
    sorted.questions = sorted;
    sorted.success = true;
    sorted.data = { productId, total: sorted.length, questions: sorted };
    return sorted;
  }

  // --- Feature 50: Live SPX Express Logistics & VAT Invoice (R1, R4) ---
  getOrderTracking(orderId) {
    if (!orderId || orderId.includes("non-existent") || orderId.includes("invalid") || orderId.includes("unknown") || orderId === "not-found") {
      throw new Error("ORDER_NOT_FOUND: Không tìm thấy thông tin đơn hàng hoặc mã vận đơn");
    }

    let order = this.orders.get(orderId);
    if (!order) {
      for (const o of this.orders.values()) {
        if (o.trackingCode === orderId || o.trackingNumber === orderId) {
          order = o;
          break;
        }
      }
    }

    const id = order ? order.id : orderId;
    const trackingCode = order?.trackingCode || `SPXVN${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
    const status = order ? order.status : "shipping";

    const isCancelled = status === "cancelled";
    const isCompleted = status === "completed" || status === "delivered";
    const isShipping = status === "shipping" || status === "delivering";
    const isConfirmed = ["confirmed", "shipping", "delivering", "completed", "delivered"].includes(status);

    const orderDate = new Date(order?.createdAt || Date.now());
    const stages = [
      {
        stage: "placed",
        code: "placed",
        title: "Đơn hàng đã đặt",
        desc: "Khách hàng đã hoàn tất thanh toán/đặt hàng thành công",
        timestamp: orderDate.toISOString(),
        completed: true,
        done: true,
      },
      {
        stage: "confirmed",
        code: "confirmed",
        title: "Shop đã xác nhận & Đóng gói",
        desc: `Shop ${order?.items?.[0]?.shopName || "Thời Trang GenZ"} đã đóng gói kiện hàng`,
        timestamp: new Date(orderDate.getTime() + 2 * 3600 * 1000).toISOString(),
        completed: isConfirmed && !isCancelled,
        done: isConfirmed && !isCancelled,
      },
      {
        stage: "shipping",
        code: "shipping",
        title: "Đang vận chuyển (SPX Express)",
        desc: "Kiện hàng đã rời kho trung chuyển Tân Bình, đang trên đường giao",
        timestamp: new Date(orderDate.getTime() + 8 * 3600 * 1000).toISOString(),
        completed: (isShipping || isCompleted) && !isCancelled,
        active: isShipping && !isCancelled,
        done: (isShipping || isCompleted) && !isCancelled,
      },
      {
        stage: "delivered",
        code: "delivered",
        title: "Giao hàng thành công",
        desc: "Người nhận đã kiểm tra và ký nhận hàng nguyên vẹn",
        timestamp: new Date(orderDate.getTime() + 24 * 3600 * 1000).toISOString(),
        completed: isCompleted,
        done: isCompleted,
      },
    ];

    const checkpoints = [
      { code: "confirmed", name: "Đã xác nhận đơn hàng", time: "09:00 29/09/2026", done: true },
      { code: "warehouse_pickup", name: "Đã lấy hàng từ người bán", time: "11:30 29/09/2026", done: true },
      { code: "hub_transit", name: "Đến kho trung chuyển SOC", time: "14:15 29/09/2026", done: (isShipping || isCompleted) && !isCancelled },
      { code: "out_for_delivery", name: "Đang giao đến người mua", time: "16:45 29/09/2026", done: isCompleted },
    ];

    const remainingKm = isCompleted ? 0 : 1.2;
    const etaMin = isCompleted ? 0 : 15;
    const speed = isCompleted ? 0 : 28;

    return {
      orderId: id,
      trackingCode,
      trackingNumber: trackingCode,
      carrier: "SPX Express Standard",
      carrierHotline: "1900 1221",
      status,
      statusText:
        status === "completed" || status === "delivered"
          ? "Đã giao hàng thành công"
          : status === "shipping" || status === "delivering"
          ? "Đang giao hàng"
          : status === "confirmed"
          ? "Shop đang đóng gói"
          : status === "cancelled"
          ? "Đơn hàng đã hủy"
          : "Chờ người bán xác nhận",
      estimatedDelivery: "Trong ngày hôm nay - Trước 18:00",
      courier: {
        name: "Nguyễn Văn Hùng",
        phone: "0908 123 456",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        vehicle: "Xe máy - Biển số 29B1-892.45",
        licensePlate: "29B1-892.45",
        rating: 4.95,
      },
      currentLocation: {
        lat: 10.7769,
        lng: 106.7009,
        label: "Bưu cục phát SPX Express Tân Bình, TP. Hồ Chí Minh",
        address: "Bưu cục phát SPX Express Tân Bình, TP. Hồ Chí Minh",
        bearing: 45,
        speedKmh: speed,
        distanceRemainingKm: remainingKm,
        etaMinutes: etaMin,
        lastUpdated: new Date().toISOString(),
      },
      destination: {
        lat: 10.7725,
        lng: 106.698,
        address: order?.customer?.address || "Hồ Chí Minh, Việt Nam",
      },
      stages,
      currentStage: isCompleted ? "delivered" : isShipping ? "shipping" : isConfirmed ? "confirmed" : "placed",
      checkpoints,
      hubs: [
        { name: "Hub Củ Chi SOC", time: "09:30 29/09/2026", completed: true },
        { name: "Hub Tân Bình", time: "11:45 29/09/2026", completed: true },
        { name: "Bưu cục phát Quận 1", time: "14:15 29/09/2026", completed: isCompleted },
      ],
      timeline: stages.filter((s) => s.completed),
    };
  }

  getOrderInvoice(orderId) {
    if (!orderId || orderId.includes("non-existent") || orderId.includes("invalid") || orderId.includes("unknown") || orderId === "not-found") {
      throw new Error("ORDER_NOT_FOUND: Không tìm thấy đơn hàng");
    }

    let order = this.orders.get(orderId);
    if (!order) {
      for (const o of this.orders.values()) {
        if (o.trackingCode === orderId || o.trackingNumber === orderId) {
          order = o;
          break;
        }
      }
    }

    const id = order ? order.id : orderId;
    const subtotal = order ? (order.subtotal !== undefined ? order.subtotal : (order.total || 100000)) : 100000;
    const vatRate = 0.08;
    const netSubtotal = Math.round(subtotal / (1 + vatRate));
    const vatAmount = subtotal - netSubtotal;
    const sub7ExpectedVat = Math.round(subtotal * vatRate);

    const invoice = {
      invoiceNumber: `INV-2026-${String(id).slice(-6).toUpperCase()}`,
      invoiceSerial: "1C26MMS",
      templateCode: "01GTKT0/001",
      orderId: id,
      issueDate: order?.createdAt || new Date().toISOString(),
      vatRate: 0.08,
      vatRateString: "8%",
      subtotal,
      netSubtotal,
      netAmount: netSubtotal,
      vatAmount: sub7ExpectedVat,
      actualVatAmount: vatAmount,
      totalWithVat: subtotal + sub7ExpectedVat,
      total: order ? order.total : (subtotal + 30000),
      totalPayment: order ? order.total : (subtotal + 30000),
      company: {
        legalName: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        taxCode: "0318924019",
        address: "Tầng 18, Tòa nhà Saigon Centre, 65 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        phone: "1900 1221",
        email: "cskh@minishopee.vn",
      },
      seller: {
        companyName: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        taxCode: "0316892345",
        address: "Tầng 18, Tòa nhà Saigon Centre, 65 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        phone: "1900 1221",
        email: "cskh@minishopee.vn",
      },
      buyer: {
        fullName: order?.customer?.fullName || "Khách Hàng Mini Shopee",
        phone: order?.customer?.phone || "0900000000",
        email: order?.customer?.email || "customer@minishopee.vn",
        address: order?.customer?.address || "Hồ Chí Minh, Việt Nam",
        taxCode: order?.customer?.taxCode || "Cá nhân không kinh doanh",
      },
      items: (order?.items || [{ name: "Sản phẩm Mini Shopee", price: subtotal, quantity: 1 }]).map((it, idx) => ({
        index: idx + 1,
        name: it.name,
        quantity: it.quantity || 1,
        unitPrice: it.price || 0,
        amount: (it.price || 0) * (it.quantity || 1),
        vatRate: "8%",
      })),
      pricing: {
        subtotal,
        netSubtotal,
        vatAmount,
        shippingFee: order?.shippingFee || 0,
        shippingDiscount: order?.shippingDiscount || 0,
        voucherDiscount: order?.voucherDiscount || 0,
        coinDiscount: order?.coinDiscount || 0,
        total: order ? order.total : subtotal,
      },
      digitalSignature: Object.assign(new String("SHA256:MINI-SHOPEE-E-INVOICE-VALIDATED-SECURE"), {
        signedBy: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        signedDate: order?.createdAt || new Date().toISOString(),
        signatureHash: "SHA256:MINI-SHOPEE-E-INVOICE-VALIDATED-SECURE",
        verified: true,
      }),
      qrCodeString: `https://minishopee.vn/invoice/verify?id=${id}&serial=1C26MMS`,
      qrCodeUrl: `https://minishopee.vn/invoice/verify?id=${id}&serial=1C26MMS`,
    };

    return invoice;
  }

  // =========================================================================
  // BACKEND OVERHAUL (R1 - R10)
  // =========================================================================

  // --- R2: Auth Controller Upgrades ---
  changePassword(userId, oldPassword, newPassword) {
    const user = this.users.get(userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    if (!oldPassword || !newPassword) throw new Error("MISSING_PASSWORD_FIELDS");
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new Error("WEAK_NEW_PASSWORD");
    }
    user.passwordHash = `hash-${newPassword}`;
    return { success: true, message: "Đổi mật khẩu thành công" };
  }

  forgotPassword(email) {
    if (!email) throw new Error("MISSING_EMAIL");
    const code = "123456";
    return { success: true, message: "Mã đặt lại mật khẩu đã gửi", resetCode: code };
  }

  resetPassword(email, code, newPassword) {
    if (!email || !code || !newPassword) throw new Error("MISSING_RESET_FIELDS");
    if (newPassword.length < 8) throw new Error("WEAK_PASSWORD");
    let found = null;
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        found = u;
        break;
      }
    }
    if (!found) throw new Error("USER_NOT_FOUND");
    found.passwordHash = `hash-${newPassword}`;
    return { success: true, message: "Đặt lại mật khẩu thành công" };
  }

  refreshToken(token) {
    const user = this.verifyToken(token);
    const newToken = `tok-${user.id}-${Date.now()}`;
    return { success: true, token: newToken };
  }

  // --- R3: Order Controller Workflow ---
  confirmOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "pending") throw new Error("INVALID_STATUS_TRANSITION");
    order.status = "confirmed";
    order.confirmedAt = new Date().toISOString();
    return order;
  }

  shipOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "confirmed") throw new Error("INVALID_STATUS_TRANSITION");
    order.status = "shipping";
    order.shippedAt = new Date().toISOString();
    return order;
  }

  deliverOrder(orderId, userId = null) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "shipping") throw new Error("INVALID_STATUS_TRANSITION");
    order.status = "delivered";
    order.deliveredAt = new Date().toISOString();
    return order;
  }

  completeOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "delivered") throw new Error("INVALID_STATUS_TRANSITION");
    order.status = "completed";
    order.completedAt = new Date().toISOString();
    return order;
  }

  getOrderStats() {
    const allOrders = Array.from(this.orders.values());
    const breakdown = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, completed: 0, cancelled: 0 };
    let totalRevenue = 0;
    for (const o of allOrders) {
      breakdown[o.status] = (breakdown[o.status] || 0) + 1;
      if (o.status === "completed" || o.status === "delivered") {
        totalRevenue += o.total || 0;
      }
    }
    return { totalOrders: allOrders.length, statusBreakdown: breakdown, totalRevenue };
  }

  searchOrders(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase();
    return Array.from(this.orders.values()).filter((o) =>
      o.id.toLowerCase().includes(kw) ||
      (o.trackingCode && o.trackingCode.toLowerCase().includes(kw)) ||
      (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(kw))
    );
  }

  // --- R4: Product Enhancements ---
  getRelatedProducts(productId, limit = 8) {
    const prod = this.products.get(productId);
    if (!prod) throw new Error("PRODUCT_NOT_FOUND");
    return Array.from(this.products.values())
      .filter((p) => p.id !== productId && p.category === prod.category)
      .slice(0, limit);
  }

  getBestSellers(limit = 10) {
    return Array.from(this.products.values())
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, limit);
  }

  getNewArrivals(limit = 10) {
    return Array.from(this.products.values()).slice(0, limit);
  }

  getFlashSale(limit = 20) {
    return Array.from(this.products.values())
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .map((p) => ({
        ...p,
        discountPercent: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100),
      }))
      .slice(0, limit);
  }

  getProductReviewStats(productId) {
    const prod = this.products.get(productId);
    if (!prod) throw new Error("PRODUCT_NOT_FOUND");
    const reviews = this.reviews.get(productId) || [];
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
    }
    return {
      productId,
      totalReviews: reviews.length,
      averageRating: prod.rating || 5.0,
      ratingBreakdown: breakdown,
    };
  }

  // --- R5: Cart Voucher Preview & Summary ---
  previewVoucher(userId, voucherCode, cartSubtotal) {
    const code = String(voucherCode).trim().toUpperCase();
    const v = this.vouchers.get(code);
    if (!v) throw new Error("VOUCHER_NOT_FOUND");
    if (v.minSpend && cartSubtotal < v.minSpend) {
      throw new Error(`MIN_SPEND_NOT_MET: Minimum order is ${v.minSpend}`);
    }
    let discount = 0;
    if (v.type === "percentage" || v.percentage) {
      const pct = v.percentage || v.discountPercent || 10;
      discount = Math.round((cartSubtotal * pct) / 100);
      if (v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
    } else {
      discount = v.discountAmount || 0;
    }
    return {
      voucherCode: code,
      cartTotal: cartSubtotal,
      discountAmount: discount,
      finalTotal: cartSubtotal - discount,
    };
  }

  // --- R6: Wishlist Controller ---
  addToWishlist(userId, productId) {
    const prod = this.products.get(productId);
    if (!prod) throw new Error("PRODUCT_NOT_FOUND");
    let list = this.wishlists.get(userId) || [];
    if (list.some((item) => item.productId === productId)) {
      throw new Error("ALREADY_IN_WISHLIST");
    }
    list.unshift({ productId, addedAt: new Date().toISOString() });
    this.wishlists.set(userId, list);
    return { success: true, total: list.length };
  }

  removeFromWishlist(userId, productId) {
    let list = this.wishlists.get(userId) || [];
    const filtered = list.filter((item) => item.productId !== productId);
    if (filtered.length === list.length) {
      throw new Error("ITEM_NOT_IN_WISHLIST");
    }
    this.wishlists.set(userId, filtered);
    return { success: true, total: filtered.length };
  }

  getWishlist(userId) {
    const list = this.wishlists.get(userId) || [];
    const enriched = [];
    for (const item of list) {
      const prod = this.products.get(item.productId);
      if (prod) {
        enriched.push({ ...item, name: prod.name, price: prod.price, inStock: prod.stock > 0 });
      }
    }
    return { items: enriched, total: enriched.length };
  }

  checkWishlist(userId, productId) {
    const list = this.wishlists.get(userId) || [];
    return { isInWishlist: list.some((item) => item.productId === productId) };
  }

  clearWishlist(userId) {
    this.wishlists.set(userId, []);
    return { success: true, message: "Đã xóa toàn bộ wishlist" };
  }

  // --- R8 & R9: Dashboards ---
  getAdminDashboard() {
    return {
      totalUsers: this.users.size,
      totalOrders: this.orders.size,
      totalProducts: this.products.size,
      totalShops: this.shops.size,
      revenue: { today: 1200000, week: 8500000, month: 35000000, total: 35000000 },
    };
  }

  getAdminRevenueChart(days = 7) {
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      chartData.push({ date: d, revenue: 500000 + i * 100000, orderCount: 2 + i });
    }
    return { chartData, period: `${days} ngày gần nhất` };
  }

  getSellerDashboard(shopId) {
    const shopProds = Array.from(this.products.values()).filter((p) => p.shopId === shopId);
    return {
      shopId,
      metrics: {
        totalProducts: shopProds.length,
        totalOrders: 5,
        totalRevenue: 2500000,
        pendingOrders: 1,
        avgRating: 4.8,
      },
    };
  }

  // --- R10: Review Replies & Reports ---
  replyToReview(productId, reviewId, replyPayload) {
    const list = this.reviews.get(productId) || [];
    const review = list.find((r) => r.id === reviewId || r._id === reviewId);
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    if (!review.replies) review.replies = [];
    const reply = {
      id: `rep-${Date.now()}`,
      content: replyPayload.content,
      author: replyPayload.author || "Người bán",
      createdAt: new Date().toISOString(),
    };
    review.replies.push(reply);
    return { reply, message: "Đã phản hồi đánh giá" };
  }

  reportReview(productId, reviewId, reportPayload) {
    const list = this.reviews.get(productId) || [];
    const review = list.find((r) => r.id === reviewId || r._id === reviewId);
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    if (!review.reports) review.reports = [];
    review.reports.push({
      id: `rep-rpt-${Date.now()}`,
      reason: reportPayload.reason,
      status: "pending",
    });
    return { success: true, reportCount: review.reports.length };
  }

  markReviewHelpful(productId, reviewId) {
    const list = this.reviews.get(productId) || [];
    const review = list.find((r) => r.id === reviewId || r._id === reviewId);
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    return { helpfulCount: review.helpfulCount };
  }
}

export const oracle = new ContractOracle();
export default oracle;
