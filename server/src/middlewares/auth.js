import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { sendError } from "../utils/response.js";

/**
 * Middleware: authenticate
 * Trích xuất Bearer Token từ header Authorization, giải mã và gắn req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập để truy cập tài nguyên này (Thiếu Bearer Token)",
      });
    }

    const token = authHeader.split(" ")[1];

    // Hỗ trợ Dev/Demo Mock Token giúp người dùng test trên UI không bị chặn 401
    if (token && token.startsWith("mock_jwt_token_admin_finance")) {
      const financeAdmin = (await User.findById("user_admin_finance")) || (await User.findOne({ email: "finance.admin@shopee.vn" }));
      if (financeAdmin) { req.user = financeAdmin; return next(); }
    } else if (token && token.startsWith("mock_jwt_token_admin_ops")) {
      const opsAdmin = (await User.findById("user_admin_ops")) || (await User.findOne({ email: "ops.admin@shopee.vn" }));
      if (opsAdmin) { req.user = opsAdmin; return next(); }
    } else if (token && token.startsWith("mock_jwt_token_seller_inventory")) {
      const invStaff = (await User.findById("user_seller_staff_01")) || (await User.findOne({ email: "kho.genz@shopee.vn" }));
      if (invStaff) { req.user = invStaff; return next(); }
    } else if (token && token.startsWith("mock_jwt_token_seller_support")) {
      const supStaff = (await User.findById("user_seller_staff_02")) || (await User.findOne({ email: "cskh.genz@shopee.vn" }));
      if (supStaff) { req.user = supStaff; return next(); }
    } else if (token && token.startsWith("mock_jwt_token_admin")) {
      const adminUser = (await User.findById("user_admin_01")) || (await User.findOne({ role: "admin" }));
      if (adminUser) {
        req.user = adminUser;
        return next();
      }
    } else if (token && token.startsWith("mock_jwt_token_seller")) {
      const sellerUser = (await User.findById("user_seller_01")) || (await User.findOne({ role: "seller" }));
      if (sellerUser) {
        req.user = sellerUser;
        return next();
      }
    } else if (token && token.startsWith("mock_jwt_token_customer")) {
      const customerUser = (await User.findById("user_customer_01")) || (await User.findOne({ role: "customer" }));
      if (customerUser) {
        req.user = customerUser;
        return next();
      }
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Mã xác thực không hợp lệ.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản người dùng không còn tồn tại trong hệ thống.",
      });
    }

    if (!user.isActive || user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ trong quá trình xác thực danh tính.",
    });
  }
};

/**
 * Middleware: authorize
 * Kiểm tra xem vai trò của user có nằm trong danh sách được cấp quyền hay không
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực danh tính người dùng.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu vai trò: [${roles.join(", ")}], vai trò của bạn: [${req.user.role}].`,
      });
    }

    next();
  };
};

/**
 * Middleware: requirePermission
 * Kiểm tra phân quyền chi tiết (RBAC granular permissions)
 */
export const requirePermission = (...requiredPerms) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực danh tính người dùng.",
      });
    }

    // Super admin hoặc Shop Owner có toàn quyền bypass
    if (req.user.role === "admin" && (!req.user.adminRole || req.user.adminRole === "super_admin")) {
      return next();
    }
    if (req.user.role === "seller" && (!req.user.subRole || req.user.subRole === "owner")) {
      return next();
    }

    const userPerms = req.user.permissions || [];
    if (userPerms.includes("all")) {
      return next();
    }

    const hasPermission = requiredPerms.some((perm) => userPerms.includes(perm));
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Từ chối truy cập: Tài khoản của bạn cần một trong các quyền hạn [${requiredPerms.join(", ")}].`,
      });
    }

    next();
  };
};

/**
 * Middleware: requireShopAccess (hay verifyShopAccess)
 * Cô lập dữ liệu gian hàng của Seller, ngăn chặn truy cập trái phép chéo Shop.
 * Super Admin được toàn quyền giám sát.
 */
export const requireShopAccess = (paramName = "shopId") => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Chưa xác thực danh tính người dùng", 401);
    }

    // Super Admin có quyền giám sát toàn sàn
    if (req.user.role === "admin") {
      return next();
    }

    // Bắt buộc phải là seller
    if (req.user.role !== "seller" || !req.user.shopId) {
      return sendError(res, "Bạn không có quyền quản trị gian hàng (Yêu cầu tài khoản Người Bán)", 403);
    }

    const requestedShopId =
      req.params[paramName] ||
      req.params.shopId ||
      req.body[paramName] ||
      req.body.shopId ||
      req.query[paramName] ||
      req.query.shopId;

    if (requestedShopId && requestedShopId !== req.user.shopId) {
      return sendError(
        res,
        "Từ chối truy cập: Bạn không có quyền thao tác trên dữ liệu của gian hàng khác!",
        403
      );
    }

    next();
  };
};

export const verifyShopAccess = requireShopAccess;

/**
 * Middleware: optionalAuthenticate
 * Giống authenticate nhưng KHÔNG trả lỗi nếu không có token.
 * Nếu có token hợp lệ → gắn req.user. Nếu không → req.user = null.
 * Dùng cho endpoint hỗ trợ cả guest lẫn authenticated (ví dụ: đặt hàng)
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.id);
    if (user && user.isActive && user.status !== "banned") {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch {
    req.user = null;
    next();
  }
};

export default { authenticate, optionalAuthenticate, authorize, requireShopAccess, verifyShopAccess };
