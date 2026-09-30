/**
 * Review Controller — Đánh Giá Nâng Cao
 * Bao gồm: CRUD reviews, seller reply, report, rating stats
 */
import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20, rating: filterRating, hasImage, sortBy = "newest" } = req.query;

    let reviews = await memoryStore.reviews.find({ productId });

    // Filter by rating
    if (filterRating) {
      const ratingNum = parseInt(filterRating);
      reviews = reviews.filter((r) => r.rating === ratingNum);
    }

    // Filter by has image
    if (hasImage === "true") {
      reviews = reviews.filter((r) => r.images && r.images.length > 0);
    }

    // Sort
    if (sortBy === "highest") {
      reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "lowest") {
      reviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }
    // default: newest first (already sorted by date)

    // Pagination
    const total = reviews.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const paged = reviews.slice(start, start + limitNum);

    // Calculate stats
    const allReviews = await memoryStore.reviews.find({ productId });
    const avgRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
      : 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) ratingBreakdown[r.rating]++;
    });

    sendSuccess(res, {
      reviews: paged,
      stats: { total: allReviews.length, avgRating: Number(avgRating), ratingBreakdown },
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
    const { productId, rating, title, content, images } = req.body;

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
      images: Array.isArray(images) ? images : [],
      verifiedPurchase: true,
      date: new Date().toLocaleDateString("vi-VN"),
      createdAt: new Date().toISOString(),
      replies: [],
      reports: [],
      helpfulCount: 0,
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

// @desc    Reply to a review (Seller)
// @route   POST /api/reviews/:id/reply
// @access  Private (seller or admin)
export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id || req.user.id;

    if (!content || !content.trim()) {
      return sendError(res, "Nội dung phản hồi không được để trống", 400);
    }

    const review = await memoryStore.reviews.findOne({ _id: id });
    if (!review) return sendError(res, "Không tìm thấy đánh giá", 404);

    const reply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      author: req.user.fullName || "Người bán",
      role: req.user.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(review.replies)) review.replies = [];
    review.replies.push(reply);
    await review.save ? review.save() : null;

    sendSuccess(res, { reply, message: "Đã phản hồi đánh giá" }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
export const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id || req.user.id;

    if (!reason || !reason.trim()) {
      return sendError(res, "Lý do báo cáo không được để trống", 400);
    }

    const review = await memoryStore.reviews.findOne({ _id: id });
    if (!review) return sendError(res, "Không tìm thấy đánh giá", 404);

    if (!Array.isArray(review.reports)) review.reports = [];

    // Check if already reported by this user
    if (review.reports.some((r) => r.userId === userId)) {
      return sendError(res, "Bạn đã báo cáo đánh giá này rồi", 400);
    }

    review.reports.push({
      id: `report-${Date.now()}`,
      userId,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    await review.save ? review.save() : null;

    sendSuccess(res, { message: "Đã gửi báo cáo đánh giá", reportCount: review.reports.length });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Public
export const markReviewHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await memoryStore.reviews.findOne({ _id: id });
    if (!review) return sendError(res, "Không tìm thấy đánh giá", 404);

    review.helpfulCount = (review.helpfulCount || 0) + 1;
    await review.save ? review.save() : null;

    sendSuccess(res, { helpfulCount: review.helpfulCount });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default { getProductReviews, createReview, replyToReview, reportReview, markReviewHelpful };
