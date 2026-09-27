/**
 * Standardized Test Fixtures and Test Data Generators
 * Used across Tier 1, Tier 2, Tier 3, and Tier 4 test suites.
 */

export const FIXTURES = {
  users: {
    customer: {
      email: "buyer_test@shopee.vn",
      password: "Password123!",
      fullName: "Nguyễn Văn Mua",
      role: "customer",
    },
    sellerA: {
      email: "seller_tech@shopee.vn",
      password: "SellerPassword123!",
      fullName: "Trần Văn Shop A",
      role: "seller",
    },
    sellerB: {
      email: "seller_fashion@shopee.vn",
      password: "SellerPassword456!",
      fullName: "Lê Thị Shop B",
      role: "seller",
    },
    admin: {
      email: "admin@shopee.enterprise.vn",
      password: "SuperAdminPassword123!",
      fullName: "Super Administrator",
      role: "admin",
    },
  },

  shops: {
    shopTech: {
      name: "Tech World Official",
      logo: "/images/shop-tech.png",
      address: "123 Cầu Giấy, Hà Nội",
      bankInfo: {
        bankName: "Vietcombank",
        accountNumber: "00110022334455",
        accountHolder: "TRAN VAN SHOP A",
      },
      description: "Chuyên thiết bị công nghệ chính hãng 100%",
    },
    shopFashion: {
      name: "Trendy Fashion VN",
      logo: "/images/shop-fashion.png",
      address: "456 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh",
      bankInfo: {
        bankName: "Techcombank",
        accountNumber: "19033445566778",
        accountHolder: "LE THI SHOP B",
      },
      description: "Thời trang thiết kế cao cấp đón đầu xu hướng",
    },
  },

  products: {
    phoneCase: {
      name: "Ốp Lưng Chống Sốc iPhone 15 Pro Max",
      price: 120000,
      stock: 50,
      category: "electronics",
      variants: [
        { sku: "CASE-BLK", name: "Đen Nhám", price: 120000, stock: 30 },
        { sku: "CASE-CLR", name: "Trong Suốt", price: 120000, stock: 20 },
      ],
    },
    poloShirt: {
      name: "Áo Polo Nam Cotton Thêu Logo",
      price: 250000,
      stock: 40,
      category: "fashion",
      variants: [
        { sku: "POLO-WHT-M", name: "Trắng - Size M", price: 250000, stock: 20 },
        { sku: "POLO-BLK-L", name: "Đen - Size L", price: 250000, stock: 20 },
      ],
    },
    mechanicalKeyboard: {
      name: "Bàn Phím Cơ Không Dây 3 Chế Độ",
      price: 850000,
      stock: 15,
      category: "electronics",
    },
  },

  vouchers: {
    freeship15k: "FREESHIP15K",
    freeship30k: "FREESHIP30K",
    fixed20k: "GIAM20K",
    percent10: "DISCOUNT10PCT",
    shopTech50k: "SHOP_TECH_50K",
    expired: "EXPIRED_VOUCHER",
  },
};

export function createRandomEmail(prefix = "user") {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}@shopee.test.vn`;
}

export function generateCartPayload(items, options = {}) {
  return {
    items: items.map((it) => ({
      productId: it.productId || "prod-mock",
      name: it.name || "Test Product",
      price: it.price !== undefined ? it.price : 100000,
      quantity: it.quantity !== undefined ? it.quantity : 1,
      shopId: it.shopId,
    })),
    shippingFee: options.shippingFee !== undefined ? options.shippingFee : 30000,
    voucherCode: options.voucherCode || null,
    freeshipCode: options.freeshipCode || null,
    coinsUsed: options.coinsUsed || 0,
    customer: options.customer || {
      fullName: "Nguyễn Văn Mua",
      phone: "0912345678",
      address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
      email: "buyer_test@shopee.vn",
    },
    paymentMethod: options.paymentMethod || "COD",
  };
}

export default {
  FIXTURES,
  createRandomEmail,
  generateCartPayload,
};
