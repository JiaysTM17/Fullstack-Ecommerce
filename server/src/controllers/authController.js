import User from "../models/User.js";
import Shop from "../models/Shop.js";
import { generateToken } from "../utils/jwt.js";
import { sendError, sendSuccess } from "../utils/response.js";

const DEMO_EMAILS = {
  customer: "khachhang@shopee.vn",
  seller_fashion: "shop.genz@shopee.vn",
  seller_tech: "shop.tech@shopee.vn",
  admin: "admin@shopee.vn",
};

// @desc    Register a new customer or seller account
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, role, shopName, shopAddress, address } = req.body;

    if (!fullName || !fullName.trim()) {
      return sendError(res, "Họ và tên là bắt buộc", 400);
    }
    if (!email || !email.trim()) {
      return sendError(res, "Email là bắt buộc", 400);
    }
    if (!password || password.length < 6) {
      return sendError(res, "Mật khẩu tối thiểu phải từ 6 ký tự", 400);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, "Định dạng email không hợp lệ", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, "Email này đã được đăng ký tài khoản trong hệ thống", 400);
    }

    // Prevent privilege escalation: only allow 'customer' or 'seller'
    let assignedRole = "customer";
    if (role === "seller") {
      assignedRole = "seller";
    }

    let createdShopId = null;
    let createdShopName = null;

    if (assignedRole === "seller") {
      if (!shopName || !shopName.trim()) {
        return sendError(res, "Tên gian hàng (shopName) là bắt buộc khi đăng ký tài khoản Người Bán", 400);
      }

      const shopCount = await Shop.countDocuments();
      createdShopId = `shop_${String(shopCount + 1).padStart(2, "0")}_${Date.now().toString().slice(-4)}`;
      createdShopName = shopName.trim();

      const slug = createdShopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await Shop.create({
        shopId: createdShopId,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        name: createdShopName,
        ownerId: normalizedEmail,
        phone: phone ? phone.trim() : "0900000000",
        address: shopAddress ? shopAddress.trim() : (address ? address.trim() : "Kho hàng"),
        description: `Gian hàng của ${fullName.trim()}`,
        bankAccount: {
          bankName: "Vietcombank",
          accountNumber: "0071000000000",
          accountName: createdShopName.toUpperCase(),
        },
        commissionRate: 0.05,
        status: "active",
      });
    }

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : "",
      role: assignedRole,
      shopId: createdShopId,
      shopName: createdShopName,
      shopAddress: shopAddress ? shopAddress.trim() : "",
      address: address ? address.trim() : "",
      coins: assignedRole === "seller" ? 50000 : 25000,
      isActive: true,
      status: "active",
    });

    const token = generateToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      shopId: newUser.shopId,
    });

    const safeUser = newUser.toSafeObject ? newUser.toSafeObject() : newUser;

    return res.status(201).json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Login existing user and return JWT
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Vui lòng nhập đầy đủ email và mật khẩu", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(res, "Email hoặc mật khẩu không chính xác", 401);
    }

    if (!user.isActive || user.status === "banned") {
      return sendError(
        res,
        "Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động. Vui lòng liên hệ CSKH.",
        403
      );
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, "Email hoặc mật khẩu không chính xác", 401);
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;

    return res.status(200).json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated)
export const me = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, "Không tìm thấy thông tin tài khoản", 404);
    }

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    return sendSuccess(res, safeUser);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private (Authenticated)
export const profile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, "Không tìm thấy người dùng", 404);
    }

    const { fullName, phone, address, avatar, savedAddresses, shopName, shopLogo, shopAddress } = req.body;

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (avatar) user.avatar = avatar;
    if (Array.isArray(savedAddresses)) user.savedAddresses = savedAddresses;

    // Allowed for sellers only
    if (user.role === "seller") {
      if (shopName) user.shopName = shopName.trim();
      if (shopLogo) user.shopLogo = shopLogo;
      if (shopAddress) user.shopAddress = shopAddress.trim();
    }

    // Role, coins, email, shopId, and status are protected and cannot be changed here!

    await user.save();
    const safeUser = user.toSafeObject ? user.toSafeObject() : user;

    return res.status(200).json({
      success: true,
      user: safeUser,
      message: "Đã lưu thay đổi thông tin cá nhân thành công",
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    1-Click Demo Login
// @route   POST /api/auth/demo
// @access  Public
export const demo = async (req, res) => {
  try {
    const { roleKey } = req.body;
    const targetEmail = DEMO_EMAILS[roleKey] || DEMO_EMAILS.customer;

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return sendError(res, `Tài khoản demo ${roleKey} không tồn tại`, 404);
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;

    return res.status(200).json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export default { register, login, me, profile, demo };
