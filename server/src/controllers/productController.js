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
    const questions = await memoryStore.questions.find({
      $or: [{ productId: id }, { productId: String(id) }]
    });

    sendSuccess(res, {
      productId: id,
      total: questions.length,
      questions: questions.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0)),
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
    const { question, userName } = req.body;

    if (!question || !question.trim()) {
      return sendError(res, "Nội dung câu hỏi không được để trống", 400);
    }

    const author = req.user?.fullName || req.user?.name || userName || "Khách hàng Mini Shopee";
    const newQ = await memoryStore.questions.create({
      _id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: id,
      userName: author.trim(),
      question: question.trim(),
      createdAt: new Date().toISOString(),
      answers: [],
      helpfulCount: 0,
    });

    sendSuccess(res, { question: newQ, message: "Đã gửi câu hỏi thành công! Người bán sẽ phản hồi sớm." }, 201);
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
    const q = await memoryStore.questions.findOne({ _id: questionId });
    if (!q) return sendError(res, "Không tìm thấy câu hỏi", 404);

    q.helpfulCount = (q.helpfulCount || 0) + 1;
    await memoryStore.questions.findByIdAndUpdate(q._id, { helpfulCount: q.helpfulCount });

    sendSuccess(res, { helpfulCount: q.helpfulCount, message: "Cảm ơn bạn đã bình chọn câu hỏi hữu ích!" });
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
};
