import bcrypt from "bcryptjs";
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

    // SINGLE ACCOUNT ARCHITECTURE (Chuẩn Shopee):
    // Nếu tài khoản đã tồn tại mà đăng ký làm Người Bán (seller):
    // Cho phép kích hoạt / nâng cấp tài khoản Người Mua thành Người Bán mà không bắt tạo email mới!
    if (existingUser) {
      if (role === "seller") {
        if (existingUser.role === "seller" || existingUser.shopId) {
          return sendError(res, "Email này đã có gian hàng bán hàng trong hệ thống. Vui lòng đăng nhập Kênh Shop.", 409);
        }

        // Tiến hành kích hoạt mở Shop cho tài khoản Người Mua này
        if (!shopName || !shopName.trim()) {
          return sendError(res, "Tên gian hàng (shopName) là bắt buộc khi đăng ký mở Shop", 400);
        }

        const shopCount = await Shop.countDocuments();
        const createdShopId = `shop_${String(shopCount + 1).padStart(2, "0")}_${Date.now().toString().slice(-4)}`;
        const createdShopName = shopName.trim();
        const slug = createdShopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        await Shop.create({
          shopId: createdShopId,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          name: createdShopName,
          ownerId: existingUser._id || existingUser.id || normalizedEmail,
          phone: phone ? phone.trim() : (existingUser.phone || "0900000000"),
          address: shopAddress ? shopAddress.trim() : (address ? address.trim() : (existingUser.address || "Kho hàng")),
          description: `Gian hàng của ${existingUser.fullName}`,
          bankAccount: {
            bankName: "Vietcombank",
            accountNumber: "0071000000000",
            accountName: createdShopName.toUpperCase(),
          },
          commissionRate: 0.05,
          status: "active",
        });

        // Nâng cấp user
        existingUser.role = "seller";
        existingUser.shopId = createdShopId;
        existingUser.shopName = createdShopName;
        existingUser.shopAddress = shopAddress ? shopAddress.trim() : (existingUser.address || "");
        if (phone && !existingUser.phone) existingUser.phone = phone.trim();
        if (password) {
          existingUser.password = password.startsWith("$2") ? password : bcrypt.hashSync(password, 10);
        }
        await existingUser.save();

        const token = generateToken({
          id: existingUser._id || existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          shopId: existingUser.shopId,
        });

        const safeUser = existingUser.toSafeObject ? existingUser.toSafeObject() : existingUser;

        return res.status(200).json({
          success: true,
          token,
          user: safeUser,
          isUpgrade: true,
          message: `Kích hoạt mở gian hàng "${createdShopName}" thành công! Tài khoản của bạn hiện có thể vừa mua sắm vừa quản lý bán hàng.`,
        });
      }

      return sendError(res, "Email này đã được đăng ký tài khoản trong hệ thống. Vui lòng bấm Đăng Nhập.", 409);
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

// === Token blacklist (in-memory) for logout ===
const tokenBlacklist = new Set();

// === Password reset tokens (in-memory) ===
const resetTokens = new Map();

// @desc    Change password (authenticated user)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendError(res, "Vui lòng nhập mật khẩu cũ và mật khẩu mới", 400);
    }

    if (newPassword.length < 8) {
      return sendError(res, "Mật khẩu mới tối thiểu phải từ 8 ký tự", 400);
    }

    if (!/[A-Z]/.test(newPassword)) {
      return sendError(res, "Mật khẩu mới phải có ít nhất 1 chữ hoa", 400);
    }

    if (!/[0-9]/.test(newPassword)) {
      return sendError(res, "Mật khẩu mới phải có ít nhất 1 chữ số", 400);
    }

    const user = await User.findById(userId);
    if (!user) return sendError(res, "Không tìm thấy tài khoản", 404);

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return sendError(res, "Mật khẩu cũ không chính xác", 401);
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, { message: "Đổi mật khẩu thành công" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Request password reset (simulation — generates token)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return sendError(res, "Vui lòng nhập địa chỉ email tài khoản", 400);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, "Định dạng email không hợp lệ", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(
        res,
        `Không tìm thấy tài khoản nào khớp với email "${normalizedEmail}". Vui lòng kiểm tra lại địa chỉ email hoặc bấm Đăng Ký.`,
        404
      );
    }

    // Cooldown check (60s)
    const existing = resetTokens.get(normalizedEmail);
    if (existing && Date.now() - existing.createdAt < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - existing.createdAt)) / 1000);
      return sendError(res, `Vui lòng đợi ${waitSec} giây trước khi yêu cầu gửi lại mã OTP mới`, 429);
    }

    // Generate reset token (6-digit code)
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút

    resetTokens.set(normalizedEmail, {
      code: resetCode,
      expiresAt,
      createdAt: Date.now(),
      verified: false
    });

    console.log(`\n======================================================`);
    console.log(`[EMAIL SERVICE] GỬI MÃ KHÔI PHỤC MẬT KHẨU TỚI: ${normalizedEmail}`);
    console.log(`[EMAIL SERVICE] MÃ OTP BẢO MẬT (6 SỐ): >>> ${resetCode} <<<`);
    console.log(`[EMAIL SERVICE] Hết hạn sau: 15 phút | Tài khoản: ${user.fullName}`);
    console.log(`======================================================\n`);

    sendSuccess(res, {
      message: `Mã OTP khôi phục mật khẩu 6 số đã được gửi tới email ${normalizedEmail}. Vui lòng kiểm tra hộp thư.`,
      email: normalizedEmail,
      expiresInSeconds: 60,
      _devResetCode: process.env.NODE_ENV !== "production" ? resetCode : undefined,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-reset-code
// @access  Public
export const verifyResetCode = async (req, res) => {
  try {
    const { email, resetCode } = req.body;
    if (!email || !resetCode) {
      return sendError(res, "Email và mã OTP là bắt buộc", 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    const stored = resetTokens.get(normalizedEmail);

    if (!stored || stored.code !== String(resetCode).trim()) {
      return sendError(res, "Mã OTP xác thực không chính xác. Vui lòng kiểm tra lại hộp thư email.", 400);
    }

    if (Date.now() > stored.expiresAt) {
      resetTokens.delete(normalizedEmail);
      return sendError(res, "Mã OTP đã hết hạn sau 15 phút. Vui lòng yêu cầu mã mới.", 400);
    }

    stored.verified = true;
    sendSuccess(res, {
      message: "Xác thực mã OTP thành công. Vui lòng thiết lập mật khẩu mới.",
      verified: true
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return sendError(res, "Vui lòng cung cấp email, mã xác nhận và mật khẩu mới", 400);
    }

    if (newPassword.length < 8) {
      return sendError(res, "Mật khẩu mới tối thiểu phải từ 8 ký tự", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedToken = resetTokens.get(normalizedEmail);

    if (!storedToken || storedToken.code !== String(resetCode).trim()) {
      return sendError(res, "Mã xác nhận không hợp lệ hoặc đã hết hạn", 400);
    }

    if (Date.now() > storedToken.expiresAt) {
      resetTokens.delete(normalizedEmail);
      return sendError(res, "Mã xác nhận đã hết hạn (15 phút). Vui lòng yêu cầu mã mới.", 400);
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return sendError(res, "Không tìm thấy tài khoản", 404);

    // Mã hóa mật khẩu mới bằng bcrypt an toàn
    user.password = newPassword.startsWith("$2") ? newPassword : bcrypt.hashSync(newPassword, 10);
    await user.save();

    resetTokens.delete(normalizedEmail);

    sendSuccess(res, { message: "Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập." });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Private
export const refreshToken = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) return sendError(res, "Không tìm thấy tài khoản", 404);

    if (!user.isActive || user.status === "banned") {
      return sendError(res, "Tài khoản đã bị khóa", 403);
    }

    const newToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });

    sendSuccess(res, {
      token: newToken,
      message: "Token đã được làm mới",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Logout — invalidate current token
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      tokenBlacklist.add(token);

      // Auto-cleanup blacklist after 24h
      setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000);
    }

    sendSuccess(res, { message: "Đăng xuất thành công" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Export blacklist checker for auth middleware
export const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

// Registration OTP store: normalizedEmail -> { code, expiresAt, createdAt, verified }
const registrationOtps = new Map();

// @desc    Send 2FA Registration OTP to Email
// @route   POST /api/auth/send-registration-otp
// @access  Public
export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, fullName, role } = req.body;
    if (!email || !email.trim()) {
      return sendError(res, "Email là bắt buộc", 400);
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, "Định dạng email không hợp lệ", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    const isDemoEmail = Object.values(DEMO_EMAILS).includes(normalizedEmail);

    // Xử lý theo kiến trúc 1 Tài Khoản Dùng Chung (Shopee standard):
    if (role === "seller") {
      // Nếu đã có gian hàng bán hàng
      if (existingUser && (existingUser.role === "seller" || existingUser.shopId)) {
        return sendError(res, "Email này đã có gian hàng bán hàng trong hệ thống. Vui lòng bấm Đăng Nhập Kênh Shop.", 409);
      }
      // Nếu là Người Mua -> Cho phép gửi OTP để kích hoạt mở Gian Hàng!
    } else {
      // Người Mua đăng ký mới: chặn nếu email đã đăng ký
      if (existingUser || isDemoEmail) {
        return sendError(res, "Email này đã được đăng ký tài khoản trên hệ thống. Vui lòng bấm Đăng Nhập để tiếp tục.", 409);
      }
    }

    // Cooldown check (60s)
    const existing = registrationOtps.get(normalizedEmail);
    if (existing && Date.now() - existing.createdAt < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - existing.createdAt)) / 1000);
      return sendError(res, `Vui lòng đợi ${waitSec} giây trước khi yêu cầu gửi lại mã OTP mới`, 429);
    }

    // Generate random 6 digits
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    registrationOtps.set(normalizedEmail, {
      code: otpCode,
      expiresAt,
      createdAt: Date.now(),
      verified: false
    });

    console.log(`\n======================================================`);
    console.log(`[EMAIL SERVICE] GỬI MÃ XÁC THỰC 2FA TỚI EMAIL: ${normalizedEmail}`);
    console.log(`[EMAIL SERVICE] MÃ OTP BẢO MẬT (6 SỐ): >>> ${otpCode} <<<`);
    console.log(`[EMAIL SERVICE] Hết hạn sau: 5 phút | Khách hàng: ${fullName || 'Người dùng mới'}`);
    console.log(`======================================================\n`);

    sendSuccess(res, {
      message: `Mã OTP xác thực đã được gửi tới email ${normalizedEmail}. Vui lòng kiểm tra hộp thư.`,
      expiresInSeconds: 60,
      email: normalizedEmail,
      _devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Verify 2FA Registration OTP
// @route   POST /api/auth/verify-registration-otp
// @access  Public
export const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, "Email và mã OTP là bắt buộc", 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    const stored = registrationOtps.get(normalizedEmail);

    if (!stored || stored.code !== String(otp).trim()) {
      return sendError(res, "Mã OTP không chính xác. Vui lòng kiểm tra lại hộp thư email.", 400);
    }

    if (Date.now() > stored.expiresAt) {
      registrationOtps.delete(normalizedEmail);
      return sendError(res, "Mã OTP đã hết hạn sau 5 phút. Vui lòng gửi lại mã mới.", 400);
    }

    stored.verified = true;

    sendSuccess(res, {
      message: "Xác thực mã OTP bảo mật thành công",
      verified: true
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Check if email already exists in system (Realtime validation)
// @route   GET /api/auth/check-email
// @access  Public
export const checkEmailAvailability = async (req, res) => {
  try {
    const { email, role } = req.query;
    if (!email || !email.trim()) {
      return sendError(res, "Email là bắt buộc", 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    const isDemoEmail = Object.values(DEMO_EMAILS).includes(normalizedEmail);

    if (existingUser || isDemoEmail) {
      if (role === "seller") {
        const isAlreadySeller = existingUser && (existingUser.role === "seller" || existingUser.shopId);
        if (!isAlreadySeller) {
          return sendSuccess(res, {
            available: true,
            exists: true,
            canUpgradeToSeller: true,
            fullName: existingUser?.fullName || "",
            phone: existingUser?.phone || "",
            message: `Email này đã có tài khoản Người Mua (${existingUser?.fullName || 'Khách Hàng'}). Bạn có thể kích hoạt mở thêm Gian Hàng bán hàng ngay!`
          });
        } else {
          return sendSuccess(res, {
            available: false,
            exists: true,
            canUpgradeToSeller: false,
            message: "Email này đã có gian hàng bán hàng trong hệ thống. Vui lòng bấm Đăng Nhập Kênh Shop."
          });
        }
      }

      return sendSuccess(res, {
        available: false,
        exists: true,
        canUpgradeToSeller: false,
        message: "Email này đã được đăng ký tài khoản trong hệ thống. Vui lòng bấm Đăng Nhập."
      });
    }

    sendSuccess(res, {
      available: true,
      exists: false,
      canUpgradeToSeller: false,
      message: "Email hợp lệ, sẵn sàng để đăng ký."
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
