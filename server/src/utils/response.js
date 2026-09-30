/**
 * Response Utility — Hàm tiện ích trả response chuẩn hóa
 * Cung cấp format thống nhất cho toàn API
 */

/**
 * Trả response thành công
 * @param {object} res - Express response
 * @param {any} data - Dữ liệu trả về
 * @param {number} [statusCode=200] - HTTP status code
 */
const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

/**
 * Trả response lỗi
 * @param {object} res - Express response
 * @param {string} message - Thông báo lỗi
 * @param {number} [statusCode=500] - HTTP status code
 */
const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};

/**
 * Trả response với pagination
 * @param {object} res - Express response
 * @param {object} params - { data, total, page, limit }
 */
const sendPaginated = (res, { data, total, page = 1, limit = 20 }) => {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Trả response 201 Created
 */
const sendCreated = (res, data, message = "Tạo mới thành công") => {
  res.status(201).json({ success: true, data, message });
};

/**
 * Trả response 204 No Content
 */
const sendNoContent = (res) => {
  res.status(204).send();
};

export { sendSuccess, sendError, sendPaginated, sendCreated, sendNoContent };
