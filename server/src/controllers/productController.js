import Product from "../models/Product.js";
import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Get products with filters, search, pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    let product = await Product.findById(id);
    if (!product) {
      // Try finding by slug
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get all categories with product counts
// @route   GET /api/products/categories/list
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await memoryStore.categories.find();

    // Enrich with product counts
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat.name, isActive: true });
        return { ...cat, productCount: count };
      })
    );

    sendSuccess(res, enriched);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Search products (dedicated search endpoint)
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get questions and answers for a product
// @route   GET /api/products/:id/questions
// @access  Public
export const getProductQuestions = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Ask a new question about a product
// @route   POST /api/products/:id/questions
// @access  Public / Authenticated
export const askProductQuestion = async (req, res) => {
  try {
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

    sendSuccess(
      res,
      {
        question: newQ,
        questionDoc: newQ,
        message: "Đã gửi câu hỏi thành công! Người bán sẽ phản hồi sớm.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Upvote a helpful question or answer
// @route   POST /api/products/:id/questions/:questionId/vote
// @access  Public
export const voteProductQuestion = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Answer a product question (Shop / Admin / Community)
// @route   POST /api/products/:id/questions/:questionId/answers
// @access  Public / Authenticated
export const answerProductQuestion = async (req, res) => {
  try {
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

    sendSuccess(
      res,
      {
        question: q,
        answer: newAns,
        message: "Đã trả lời câu hỏi thành công!",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default {
  getProducts,
  getProductById,
  getCategories,
  searchProducts,
  getProductQuestions,
  askProductQuestion,
  voteProductQuestion,
  answerProductQuestion,
};

