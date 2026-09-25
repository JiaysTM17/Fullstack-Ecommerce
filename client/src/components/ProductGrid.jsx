import React from 'react';
import ProductCard from './ProductCard';
import Loading from './Loading';
import EmptyState from './EmptyState';
import '../styles/product.css';

/**
 * ProductGrid Component - Danh sách lưới sản phẩm
 *
 * @param {Object} props
 * @param {Array} [props.products=[]] - Danh sách sản phẩm cần render
 * @param {boolean} [props.loading=false] - Trạng thái đang tải dữ liệu
 * @param {function} [props.onAddToCart] - Callback khi click thêm vào giỏ
 * @param {function} [props.onViewDetail] - Callback khi click xem chi tiết sản phẩm
 * @param {string} [props.emptyTitle='Không tìm thấy sản phẩm'] - Tiêu đề khi không có sản phẩm
 * @param {string} [props.emptyDescription='Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc'] - Mô tả khi trống
 * @param {function} [props.onResetFilter] - Callback nút thao tác khi trống
 * @param {function} [props.formatCurrency] - Hàm tùy chỉnh định dạng tiền tệ
 */
const ProductGrid = ({
  products = [],
  loading = false,
  onAddToCart,
  onViewDetail,
  emptyTitle = 'Không tìm thấy sản phẩm',
  emptyDescription = 'Thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc của bạn.',
  onResetFilter,
  formatCurrency
}) => {
  // Trạng thái đang tải dữ liệu
  if (loading) {
    return <Loading type="skeleton-grid" count={10} />;
  }

  // Trạng thái danh sách rỗng
  if (!products || products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionText={onResetFilter ? 'Xem tất cả sản phẩm' : undefined}
        onAction={onResetFilter}
      />
    );
  }

  return (
    <div className="shopee-product-grid">
      {products.map((product) => {
        const key = product._id || product.id || product.slug || Math.random();
        return (
          <ProductCard
            key={key}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetail={onViewDetail}
            formatCurrency={formatCurrency}
          />
        );
      })}
    </div>
  );
};

export default ProductGrid;
