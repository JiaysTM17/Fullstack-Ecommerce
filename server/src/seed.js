import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB, { isDbConnected } from "./config/db.js";
import User from "./models/User.js";
import Shop from "./models/Shop.js";
import Product from "./models/Product.js";
import memoryStore from "./models/memoryStore.js";

dotenv.config();

export const DEMO_USERS = [
  {
    email: "khachhang@shopee.vn",
    password: "password123",
    fullName: "Nguyễn Văn Khách",
    phone: "0901234567",
    role: "customer",
    address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    coins: 25000,
    isActive: true,
    status: "active",
  },
  {
    email: "shop.genz@shopee.vn",
    password: "password123",
    fullName: "Trần Thị Chủ Shop (Thời Trang)",
    phone: "0912345678",
    role: "seller",
    shopId: "shop_01",
    shopName: "Thời Trang GenZ Official",
    shopLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120",
    shopAddress: "Kho Tân Bình, TP. Hồ Chí Minh",
    coins: 50000,
    isActive: true,
    status: "active",
  },
  {
    email: "shop.tech@shopee.vn",
    password: "password123",
    fullName: "Lê Văn Chủ Shop (Công Nghệ)",
    phone: "0987654321",
    role: "seller",
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopLogo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120",
    shopAddress: "Kho Cầu Giấy, Hà Nội",
    coins: 50000,
    isActive: true,
    status: "active",
  },
  {
    email: "admin@shopee.vn",
    password: "password123",
    fullName: "Tổng Quản Trị Viên Sàn",
    phone: "0999999999",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    coins: 100000,
    isActive: true,
    status: "active",
  },
];

export const seedDatabase = async () => {
  console.log("Seeding demo accounts and shops...");

  // If MongoDB is connected, upsert demo accounts and shops in MongoDB
  if (isDbConnected()) {
    for (const u of DEMO_USERS) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`- Created user: ${u.email} (${u.role})`);
      }
    }

    for (const s of memoryStore.shopsStore) {
      const exists = await Shop.findOne({ shopId: s.shopId });
      if (!exists) {
        await Shop.create(s);
        console.log(`- Created shop: ${s.shopId} (${s.name})`);
      }
    }

    for (const p of memoryStore.productsStore) {
      const exists = await Product.findOne({ slug: p.slug });
      if (!exists) {
        await Product.create(p);
      }
    }
  }

  console.log("Seeding completed successfully.");
};

// Standalone execution
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  });
}

export default seedDatabase;
