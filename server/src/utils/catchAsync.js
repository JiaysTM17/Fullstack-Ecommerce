/**
 * catchAsync — Wrapper DRY cho async route handlers
 * Tự động bắt lỗi và forward tới error handler middleware
 * Giảm boilerplate try/catch trong mọi controller
 *
 * @param {Function} fn - async route handler (req, res, next) => Promise
 * @returns {Function} wrapped handler
 *
 * @example
 *   export const getProducts = catchAsync(async (req, res) => {
 *     const products = await Product.find();
 *     sendSuccess(res, products);
 *   });
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
