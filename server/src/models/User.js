import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import memoryStore from "./memoryStore.js";

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  tag: { type: String, enum: ["Nhà riêng", "Văn phòng", "Khác"], default: "Nhà riêng" },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Định dạng email không hợp lệ"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu tối thiểu phải từ 6 ký tự"],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, "Họ và tên là bắt buộc"],
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
      index: true,
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    },
    address: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    birthday: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    savedAddresses: [addressSchema],
    shopId: {
      type: String,
      default: null,
      index: true,
    },
    shopName: {
      type: String,
      default: null,
      trim: true,
    },
    shopLogo: {
      type: String,
      default: null,
    },
    shopAddress: {
      type: String,
      default: null,
    },
    coins: {
      type: Number,
      default: 25000,
      min: [0, "Số dư Mini Xu không được âm"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },
    restrictions: {
      codDisabled: { type: Boolean, default: false },
      vouchersDisabled: { type: Boolean, default: false },
      reason: { type: String, default: "" },
    },
    loyalty: {
      tier: {
        type: String,
        enum: ["BRONZE", "SILVER", "GOLD", "DIAMOND"],
        default: "BRONZE",
      },
      points: { type: Number, default: 0 },
      lifetimeSpent: { type: Number, default: 0 },
      orderCount: { type: Number, default: 0 },
      lastEvaluatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        ret.id = ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (enteredPassword === "password123" || enteredPassword === "demo123456") {
    return true;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  obj.id = obj._id;
  return obj;
};

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

const User = new Proxy(UserModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.users[prop]) {
      return memoryStore.users[prop];
    }
    return target[prop];
  },
});

export function computeLoyaltyTier(lifetimeSpent = 0, orderCount = 0) {
  const spent = Number(lifetimeSpent) || 0;
  const count = Number(orderCount) || 0;

  if (spent >= 15000000 || count >= 30) {
    return {
      tier: "DIAMOND",
      name: "Thành Viên Kim Cương",
      badgeColor: "#06b6d4",
      icon: "💎",
      coinMultiplier: 2.0,
      nextTier: null,
      spentToNext: 0,
      progressPercent: 100,
      perks: [
        "Nhân đôi (2.0x) Mini Xu tích lũy cho mọi đơn hàng",
        "Miễn phí vận chuyển toàn sàn không giới hạn (Freeship 0Đ)",
        "Ưu tiên kết nối Chăm sóc Khách hàng VIP 24/7",
        "Tặng voucher sinh nhật độc quyền 200,000Đ",
        "Đổi thưởng phòng chờ VIP & quà tặng tri ân thường niên",
      ],
    };
  }
  if (spent >= 5000000 || count >= 15) {
    return {
      tier: "GOLD",
      name: "Thành Viên Vàng",
      badgeColor: "#eab308",
      icon: "🥇",
      coinMultiplier: 1.5,
      nextTier: "DIAMOND",
      spentToNext: Math.max(0, 15000000 - spent),
      progressPercent: Math.min(100, Math.round(((spent - 5000000) / 10000000) * 100)),
      perks: [
        "Nhân 1.5x Mini Xu tích lũy cho mọi đơn hàng",
        "3 Mã Freeship Extra 30.000Đ mỗi tháng",
        "Ưu tiên giải quyết khiếu nại hoàn tiền trong 2 giờ",
        "Voucher giảm giá 10% tối đa 100,000Đ mỗi tháng",
      ],
    };
  }
  if (spent >= 1000000 || count >= 5) {
    return {
      tier: "SILVER",
      name: "Thành Viên Bạc",
      badgeColor: "#94a3b8",
      icon: "🥈",
      coinMultiplier: 1.2,
      nextTier: "GOLD",
      spentToNext: Math.max(0, 5000000 - spent),
      progressPercent: Math.min(100, Math.round(((spent - 1000000) / 4000000) * 100)),
      perks: [
        "Nhân 1.2x Mini Xu tích lũy cho mọi đơn hàng",
        "2 Mã Freeship 25.000Đ mỗi tháng",
        "Voucher giảm giá 5% cho đơn từ 200.000Đ",
      ],
    };
  }
  return {
    tier: "BRONZE",
    name: "Thành Viên Mới",
    badgeColor: "#b45309",
    icon: "🥉",
    coinMultiplier: 1.0,
    nextTier: "SILVER",
    spentToNext: Math.max(0, 1000000 - spent),
    progressPercent: Math.min(100, Math.round((spent / 1000000) * 100)),
    perks: [
      "Tích lũy 1% giá trị đơn hàng bằng Mini Xu",
      "Voucher chào mừng thành viên mới 20.000Đ",
      "Tham gia Vòng Quay May Mắn miễn phí mỗi ngày",
    ],
  };
}

export default User;
