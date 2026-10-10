import Product from "../models/Product.js";
import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// @desc    Get products with filters, search, pagination
// @route   GET /api/products
// @access  Public
export const getProducts = catchAsync(async (req, res) => {
  const {
    keyword, category, brand, shopId,
    minPrice, maxPrice, rating, minRating,
    badge, fastDelivery, inStock,
    sort = "createdAt", order = "desc",
    page = 1, limit = 16,
  } = req.query;

  const query = { isActive: true, approvalStatus: "approved" };

  // Full-text search
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { brand: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
    ];
  }

  if (category && category !== "Tất cả") query.category = category;
  if (brand) query.brand = brand;
  if (shopId) query.shopId = shopId;
  if (badge) query.badge = badge;
  if (fastDelivery === "true" || fastDelivery === true) query.isFastDelivery = true;
  if (inStock === "true" || inStock === true) query.stock = { $gt: 0 };
  if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
  const effectiveRating = minRating || rating;
  if (effectiveRating) query.rating = { $gte: Number(effectiveRating) };

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 16));
  const skip = (pageNum - 1) * limitNum;

  let sortField = "createdAt";
  let sortDir = -1;

  if (sort === "price_asc") {
    sortField = "price";
    sortDir = 1;
  } else if (sort === "price_desc") {
    sortField = "price";
    sortDir = -1;
  } else if (sort === "sold_desc") {
    sortField = "sold";
    sortDir = -1;
  } else if (sort === "rating_desc") {
    sortField = "rating";
    sortDir = -1;
  } else if (sort === "newest" || sort === "createdAt") {
    sortField = "createdAt";
    sortDir = order === "asc" ? 1 : -1;
  } else if (sort) {
    sortField = sort;
    sortDir = order === "asc" ? 1 : -1;
  }

  const sortObj = { [sortField]: sortDir };

  const products = await Product.find(query).sort(sortObj).skip(skip).limit(limitNum);
  const total = await Product.countDocuments(query);

  sendSuccess(res, {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
export const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;

  let product = await Product.findById(id);
  if (!product) {
    product = await Product.findOne({ slug: id });
  }

  if (!product) {
    return sendError(res, "Không tìm thấy sản phẩm", 404);
  }

  // Get product reviews
  const reviews = await memoryStore.reviews.find({ productId: product._id });

  const result = product.toObject ? product.toObject() : { ...product };
  result.reviews = reviews;

  sendSuccess(res, result);
});

// @desc    Get all categories with product counts
// @route   GET /api/products/categories/list
// @access  Public
export const getCategories = catchAsync(async (req, res) => {
  const categories = await memoryStore.categories.find();

  // Enrich with product counts
  const enriched = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat.name, isActive: true });
      return { ...cat, productCount: count };
    })
  );

  sendSuccess(res, enriched);
});

// @desc    Search products (dedicated search endpoint)
// @route   GET /api/products/search
// @access  Public
export const searchProducts = catchAsync(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || !q.trim()) {
    return sendError(res, "Vui lòng nhập từ khóa tìm kiếm", 400);
  }

  const query = {
    isActive: true,
    approvalStatus: "approved",
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { shopName: { $regex: q, $options: "i" } },
    ],
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(query).sort({ sold: -1 }).skip(skip).limit(limitNum);
  const total = await Product.countDocuments(query);

  sendSuccess(res, {
    products,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    query: q,
  });
});

// @desc    Get questions and answers for a product
// @route   GET /api/products/:id/questions
// @access  Public
export const getProductQuestions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const rawQuestions = await memoryStore.questions.find({
    $or: [{ productId: id }, { productId: String(id) }]
  });

  const normalized = (rawQuestions || []).map((q) => {
    const qId = q._id || q.id;
    const qText = q.question || q.questionText || "";
    const author = q.userName || q.customerName || "Khách hàng Mini Shopee";
    const votes = q.helpfulCount !== undefined ? q.helpfulCount : q.upvotes || 0;
    const date = q.createdAt || q.askedAt || new Date().toISOString();
    const answers = Array.isArray(q.answers) ? q.answers : [];
    const firstAnswer = answers[0] || null;

    return {
      _id: qId,
      id: qId,
      productId: id,
      userName: author,
      customerName: author,
      question: qText,
      questionText: qText,
      createdAt: date,
      askedAt: date,
      helpfulCount: votes,
      upvotes: votes,
      answers: answers.map((ans) => ({
        _id: ans._id || ans.id || `ans_${Date.now()}`,
        id: ans._id || ans.id || `ans_${Date.now()}`,
        authorName: ans.authorName || ans.answeredBy || "Người bán",
        isShopOwner: ans.isShopOwner !== undefined ? ans.isShopOwner : true,
        content: ans.content || ans.answer || "",
        createdAt: ans.createdAt || ans.answeredAt || date,
      })),
      isAnswered: q.isAnswered !== undefined ? q.isAnswered : answers.length > 0,
      answer: q.answer || (firstAnswer ? firstAnswer.content : null),
      answeredAt: q.answeredAt || (firstAnswer ? firstAnswer.createdAt : null),
      answeredBy: q.answeredBy || (firstAnswer ? firstAnswer.authorName : null),
    };
  });

  // Sort primarily by helpful votes, then newest first
  normalized.sort((a, b) => {
    const voteDiff = (b.helpfulCount || 0) - (a.helpfulCount || 0);
    if (voteDiff !== 0) return voteDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  sendSuccess(res, {
    productId: id,
    total: normalized.length,
    questions: normalized,
  });
});

// @desc    Ask a new question about a product
// @route   POST /api/products/:id/questions
// @access  Public / Authenticated
export const askProductQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { question, questionText, userName, customerName } = req.body;
  const qText = (question || questionText || "").trim();

  if (!qText) {
    return sendError(res, "Nội dung câu hỏi không được để trống", 400);
  }

  const author = req.user?.fullName || req.user?.name || customerName || userName || "Khách hàng Mini Shopee";
  const qId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newQ = await memoryStore.questions.create({
    _id: qId,
    id: qId,
    productId: id,
    userName: author.trim(),
    customerName: author.trim(),
    question: qText,
    questionText: qText,
    createdAt: now,
    askedAt: now,
    answers: [],
    helpfulCount: 0,
    upvotes: 0,
    isAnswered: false,
    answer: null,
    answeredAt: null,
    answeredBy: null,
    votedUsers: [],
  });

  logger.info(`Question asked on product ${id} by ${author}`, {
    requestId: req.requestId,
    productId: id,
    questionId: qId,
  });

  sendSuccess(
    res,
    {
      question: newQ,
      questionDoc: newQ,
      message: "Đã gửi câu hỏi thành công! Người bán sẽ phản hồi sớm.",
    },
    201
  );
});

// @desc    Upvote a helpful question or answer
// @route   POST /api/products/:id/questions/:questionId/vote
// @access  Public
export const voteProductQuestion = catchAsync(async (req, res) => {
  const { questionId } = req.params;
  const q = await memoryStore.questions.findOne({
    $or: [{ _id: questionId }, { id: questionId }]
  });
  if (!q) return sendError(res, "Không tìm thấy câu hỏi", 404);

  q.helpfulCount = (q.helpfulCount || q.upvotes || 0) + 1;
  q.upvotes = q.helpfulCount;
  await memoryStore.questions.findByIdAndUpdate(q._id || q.id, {
    helpfulCount: q.helpfulCount,
    upvotes: q.helpfulCount,
  });

  sendSuccess(res, {
    helpfulCount: q.helpfulCount,
    upvotes: q.helpfulCount,
    hasVoted: true,
    message: "Cảm ơn bạn đã bình chọn câu hỏi hữu ích!",
  });
});

// @desc    Answer a product question (Shop / Admin / Community)
// @route   POST /api/products/:id/questions/:questionId/answers
// @access  Public / Authenticated
export const answerProductQuestion = catchAsync(async (req, res) => {
  const { id, questionId } = req.params;
  const { content, answerText, authorName, answeredBy, isShopOwner } = req.body;
  const text = (content || answerText || "").trim();

  if (!text) {
    return sendError(res, "Nội dung câu trả lời không được để trống", 400);
  }

  const q = await memoryStore.questions.findOne({
    $or: [{ _id: questionId }, { id: questionId }]
  });
  if (!q) return sendError(res, "Không tìm thấy câu hỏi", 404);

  const author = authorName || answeredBy || req.user?.fullName || req.user?.name || "Shop Official";
  const now = new Date().toISOString();
  const ansId = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const newAns = {
    _id: ansId,
    id: ansId,
    authorName: author,
    answeredBy: author,
    isShopOwner: isShopOwner !== undefined ? Boolean(isShopOwner) : true,
    content: text,
    answer: text,
    createdAt: now,
    answeredAt: now,
  };

  if (!Array.isArray(q.answers)) {
    q.answers = [];
  }
  q.answers.push(newAns);
  q.isAnswered = true;
  q.answer = text;
  q.answeredAt = now;
  q.answeredBy = author;

  await memoryStore.questions.findByIdAndUpdate(q._id || q.id, {
    answers: q.answers,
    isAnswered: true,
    answer: text,
    answeredAt: now,
    answeredBy: author,
  });

  logger.info(`Question ${questionId} answered by ${author}`, {
    requestId: req.requestId,
    questionId,
    author,
  });

  sendSuccess(
    res,
    {
      question: q,
      answer: newAns,
      message: "Đã trả lời câu hỏi thành công!",
    },
    201
  );
});

// @desc    Get related products (same category, exclude self)
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 8 } = req.query;

  let product = await Product.findById(id);
  if (!product) product = await Product.findOne({ slug: id });
  if (!product) return sendError(res, "Sản phẩm không tồn tại", 404);

  const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
    approvalStatus: "approved",
  })
    .sort({ sold: -1, rating: -1 })
    .limit(limitNum);

  sendSuccess(res, { products: related, total: related.length });
});

// @desc    Get best-selling products
// @route   GET /api/products/best-sellers
// @access  Public
export const getBestSellers = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const products = await Product.find({
    isActive: true,
    approvalStatus: "approved",
  })
    .sort({ sold: -1 })
    .limit(limitNum);

  sendSuccess(res, { products, total: products.length });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
export const getNewArrivals = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const products = await Product.find({
    isActive: true,
    approvalStatus: "approved",
  })
    .sort({ createdAt: -1 })
    .limit(limitNum);

  sendSuccess(res, { products, total: products.length });
});

// @desc    Get flash sale products with real-time slot countdown, stock depletion and rush alerts
// @route   GET /api/products/flash-sale
// @access  Public
export const getFlashSale = catchAsync(async (req, res) => {
  const { limit = 20, slot = "slot-1" } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const allProducts = await Product.find({
    isActive: true,
    approvalStatus: "approved",
  });

  // Calculate standard time slots and remaining countdown
  const now = new Date();
  const currentHour = now.getHours();
  let nextSlotHour = 24;
  if (currentHour < 9) nextSlotHour = 9;
  else if (currentHour < 12) nextSlotHour = 12;
  else if (currentHour < 16) nextSlotHour = 16;
  else if (currentHour < 20) nextSlotHour = 20;

  const targetDate = new Date(now);
  if (nextSlotHour === 24) {
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(9, 0, 0, 0);
  } else {
    targetDate.setHours(nextSlotHour, 0, 0, 0);
  }
  const remainingSeconds = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

  // Filter products where originalPrice > price (on sale)
  const flashSaleProducts = allProducts
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .map((p, idx) => {
      const obj = p.toObject ? p.toObject() : p;
      const discountPercent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      const stock = Math.max(0, Number(obj.stock) || 0);
      const sold = Number(obj.sold) || 0;
      const initialPool = Math.max(1, stock + sold);
      const percentSold = Math.min(99, Math.max(15, Math.round((sold / initialPool) * 100)));

      // Burning deal status (stock depletion broadcast)
      let depletionStatus = "AVAILABLE"; // AVAILABLE | BURNING_OUT | CRITICAL_LOW | SOLD_OUT
      if (stock === 0) {
        depletionStatus = "SOLD_OUT";
      } else if (stock <= 3 || percentSold >= 90) {
        depletionStatus = "CRITICAL_LOW";
      } else if (stock <= 10 || percentSold >= 70) {
        depletionStatus = "BURNING_OUT";
      }

      return {
        ...obj,
        discountPercent,
        savedAmount: p.originalPrice - p.price,
        percentSold,
        depletionStatus,
        isBurningOut: depletionStatus === "BURNING_OUT" || depletionStatus === "CRITICAL_LOW",
        slotId: slot,
      };
    })
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, limitNum);

  sendSuccess(res, {
    slot,
    countdown: {
      hours: Math.floor(remainingSeconds / 3600),
      minutes: Math.floor((remainingSeconds % 3600) / 60),
      seconds: remainingSeconds % 60,
      totalSeconds: remainingSeconds,
    },
    products: flashSaleProducts,
    total: flashSaleProducts.length,
    criticalCount: flashSaleProducts.filter((p) => p.isBurningOut).length,
  });
});

// @desc    Get review statistics for a product
// @route   GET /api/products/:id/review-stats
// @access  Public
export const getProductReviewStats = catchAsync(async (req, res) => {
  const { id } = req.params;

  let product = await Product.findById(id);
  if (!product) product = await Product.findOne({ slug: id });
  if (!product) return sendError(res, "Sản phẩm không tồn tại", 404);

  const reviews = await memoryStore.reviews.find({ productId: id });
  const total = reviews.length;

  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;
  let withImages = 0;
  let withComment = 0;

  for (const review of reviews) {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingBreakdown[review.rating]++;
      sumRating += review.rating;
    }
    if (review.images && review.images.length > 0) withImages++;
    if (review.content || review.comment) withComment++;
  }

  sendSuccess(res, {
    productId: id,
    totalReviews: total,
    averageRating: total > 0 ? Number((sumRating / total).toFixed(1)) : 0,
    ratingBreakdown,
    withImages,
    withComment,
    ratingPercentages: Object.fromEntries(
      Object.entries(ratingBreakdown).map(([star, count]) => [
        star,
        total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      ])
    ),
  });
});

// @desc    Lấy phiên Livestream bán hàng đang hoạt động kèm sản phẩm ghim
// @route   GET /api/products/live-stream/active
// @access  Public
export const getActiveLiveStreamSessions = catchAsync(async (req, res) => {
  // Lấy các sản phẩm có giảm giá flash hoặc bán chạy để làm sản phẩm ghim livestream
  const allProducts = await Product.find({ isActive: true, approvalStatus: "approved" });
  const featured = (allProducts || []).slice(0, 4).map((p) => ({
    id: p.id || p._id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice || Math.round(p.price * 1.3),
    discountPercent: p.discount || Math.round((( (p.originalPrice || p.price * 1.3) - p.price) / (p.originalPrice || p.price * 1.3)) * 100) || 25,
    image: p.image || p.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    stock: p.stock || 50,
    sold: p.sold || 120,
    shopName: p.shopName || "Shopee Mall Official",
  }));

  const session = {
    id: "live_session_main",
    title: "🔥 ĐẠI TIỆC LIVESTREAM: SĂN DEAL ĐỘC QUYỀN GIẢM 50% & VOUCHER 100K",
    host: {
      name: "Kim Ngân & Trâm Anh",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
      badge: "Shopee Live Star ⭐",
    },
    viewerCount: 1845,
    likeCount: 24500,
    pinnedProduct: featured[0] || null,
    showcaseProducts: featured,
    liveVoucher: {
      code: "LIVEHOT50",
      discountText: "Giảm 50.000Đ cho đơn từ 200.000Đ",
      expiresInMinutes: 15,
    },
    mockChatMessages: [
      { id: "msg_1", user: "minh_thanh99", text: "Áo này size L cao 1m75 mặc vừa không shop ơi?", time: "Vừa xong" },
      { id: "msg_2", user: "ngan_ha_vip", text: "Đã chốt 2 chiếc màu be rồi nha, chất đẹp lắm!", time: "10s trước" },
      { id: "msg_3", user: "tuan_tran_dn", text: "Shop ghim lại đôi giày sneaker với ạ", time: "25s trước" },
      { id: "msg_4", user: "hoang_yen_sg", text: "Áp được voucher LIVEHOT50 luôn nè mn", time: "40s trước" },
    ],
  };

  return sendSuccess(res, { session }, 200, "Lấy thông tin phiên livestream thành công");
});

export default {
  getProducts,
  getProductById,
  getCategories,
  searchProducts,
  getProductQuestions,
  askProductQuestion,
  voteProductQuestion,
  answerProductQuestion,
  getRelatedProducts,
  getBestSellers,
  getNewArrivals,
  getFlashSale,
  getProductReviewStats,
  getActiveLiveStreamSessions,
};
