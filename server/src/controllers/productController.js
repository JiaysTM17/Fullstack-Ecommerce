import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Get all products with filters, search, sort, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page, limit } = req.query;

    const query = { isActive: true };

    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !Number.isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice && !Number.isNaN(Number(maxPrice))) {
        query.price.$lte = Number(maxPrice);
      }
      if (Object.keys(query.price).length === 0) {
        delete query.price;
      }
    }

    let sortOption = {};
    if (sort === "price_asc") sortOption.price = 1;
    else if (sort === "price_desc") sortOption.price = -1;
    else if (sort === "sold") sortOption.sold = -1;
    else if (sort === "rating") sortOption.rating = -1;
    else sortOption.createdAt = -1;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limitNum)
      .skip(skip);

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

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    sendSuccess(res, product);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return sendError(res, "Product not found", 404);
    }
    sendError(res, error.message, 500);
  }
};

export { getProducts, getProductById };
