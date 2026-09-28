import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reviews = await memoryStore.reviews.find({ productId });
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const paged = reviews.slice(start, start + limitNum);

    // Calculate stats
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1) : 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) ratingBreakdown[r.rating]++; });

    sendSuccess(res, {
      reviews: paged,
      stats: { total, avgRating: Number(avgRating), ratingBreakdown },
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Create a review for a product
// @route   POST /api/reviews
// @access  Private (Must have purchased)
export const createReview = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, rating, title, content } = req.body;

    if (!productId || !rating) return sendError(res, "productId và rating là bắt buộc", 400);
    if (rating < 1 || rating > 5) return sendError(res, "Rating phải từ 1 đến 5", 400);

    // Check product exists
    const product = await memoryStore.products.findOne({ _id: productId });
    if (!product) return sendError(res, "Sản phẩm không tồn tại", 404);

    // Check if already reviewed
    const existing = await memoryStore.reviews.findOne({ productId, userId });
    if (existing) return sendError(res, "Bạn đã đánh giá sản phẩm này rồi", 400);

    const review = await memoryStore.reviews.create({
      productId,
      userId,
      author: req.user.fullName || "Khách hàng",
      avatar: req.user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      rating: Number(rating),
      title: title || "",
      content: content || "",
      verifiedPurchase: true,
      date: new Date().toLocaleDateString("vi-VN"),
    });

    // Update product rating
    const allReviews = await memoryStore.reviews.find({ productId });
    const avgRating = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1);
    await memoryStore.products.findByIdAndUpdate(product._id, {
      rating: Number(avgRating),
      reviewCount: allReviews.length,
    });

    sendSuccess(res, review, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default { getProductReviews, createReview };
