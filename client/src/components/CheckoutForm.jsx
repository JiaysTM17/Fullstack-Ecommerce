import React, { useState, useEffect } from 'react';
import '../styles/checkout.css';

const DEFAULT_PAYMENT_METHODS = [
  { id: 'COD', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi shipper giao hàng' },
  { id: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản qua mã QR ngân hàng nội địa' },
  { id: 'MOMO', label: 'Ví điện tử MoMo', desc: 'Quét mã MoMo để thanh toán tức thì' }
];

/**
 * CheckoutForm Component - Form thanh toán và thông tin khách hàng
 *
 * @param {Object} props
 * @param {function} props.onSubmit - Callback submit form: (formData)
 * @param {boolean} [props.loading=false] - Trạng thái đang gửi đơn hàng
 * @param {Object} [props.initialValues] - Giá trị khởi tạo
 * @param {Object} [props.externalErrors] - Lỗi từ phía server hoặc trang cha
 * @param {string} [props.submitButtonText='Đặt Hàng Ngay'] - Text trên nút submit
 * @param {Array} [props.paymentMethods] - Danh sách phương thức thanh toán
 */
const CheckoutForm = ({
  onSubmit,
  loading = false,
  initialValues = {},
  externalErrors = {},
  submitButtonText = 'Đặt Hàng Ngay',
  paymentMethods = DEFAULT_PAYMENT_METHODS
}) => {
  const [formData, setFormData] = useState({
    fullName: initialValues.fullName || '',
    phone: initialValues.phone || '',
    email: initialValues.email || '',
    address: initialValues.address || '',
    note: initialValues.note || '',
    paymentMethod: initialValues.paymentMethod || 'COD'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Cập nhật khi initialValues thay đổi
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialValues
      }));
    }
  }, [initialValues]);

  // Đồng bộ lỗi ngoài nếu có
  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...externalErrors
      }));
    }
  }, [externalErrors]);

  // Hàm validate từng trường
  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmed = typeof value === 'string' ? value.trim() : '';

    switch (name) {
      case 'fullName':
        if (!trimmed) {
          errorMsg = 'Vui lòng nhập họ và tên';
        } else if (trimmed.length < 2) {
          errorMsg = 'Họ và tên tối thiểu 2 ký tự';
        }
        break;

      case 'phone':
        if (!trimmed) {
          errorMsg = 'Vui lòng nhập số điện thoại';
        } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(trimmed)) {
          errorMsg = 'Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)';
        }
        break;

      case 'email':
        if (!trimmed) {
          errorMsg = 'Vui lòng nhập địa chỉ email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          errorMsg = 'Địa chỉ email không đúng định dạng';
        }
        break;

      case 'address':
        if (!trimmed) {
          errorMsg = 'Vui lòng nhập địa chỉ giao hàng cụ thể';
        } else if (trimmed.length < 5) {
          errorMsg = 'Địa chỉ quá ngắn, vui lòng nhập rõ số nhà, đường, quận/huyện';
        }
        break;

      default:
        break;
    }

    return errorMsg;
  };

  // Validate toàn bộ form
  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = ['fullName', 'phone', 'email', 'address'];

    fieldsToValidate.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: err
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: err
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Đánh dấu tất cả là touched
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      address: true,
      note: true
    });

    const isValid = validateAll();
    if (isValid && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="shopee-checkout-form-card">
      <div className="shopee-checkout-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <h3>Thông Tin Giao Hàng</h3>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Hàng 1: Họ tên + Số điện thoại */}
        <div className="shopee-form-row">
          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="fullName">
              Họ và tên <span className="shopee-form-label-required">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className={`shopee-form-input ${touched.fullName && errors.fullName ? 'has-error' : ''}`}
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
            {touched.fullName && errors.fullName && (
              <span className="shopee-form-error-msg">{errors.fullName}</span>
            )}
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="phone">
              Số điện thoại <span className="shopee-form-label-required">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={`shopee-form-input ${touched.phone && errors.phone ? 'has-error' : ''}`}
              placeholder="Ví dụ: 0912345678"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
            {touched.phone && errors.phone && (
              <span className="shopee-form-error-msg">{errors.phone}</span>
            )}
          </div>
        </div>

        {/* Hàng 2: Email */}
        <div className="shopee-form-group">
          <label className="shopee-form-label" htmlFor="email">
            Email nhận thông báo <span className="shopee-form-label-required">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`shopee-form-input ${touched.email && errors.email ? 'has-error' : ''}`}
            placeholder="Ví dụ: nguyenvana@gmail.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.email && errors.email && (
            <span className="shopee-form-error-msg">{errors.email}</span>
          )}
        </div>

        {/* Hàng 3: Địa chỉ nhận hàng */}
        <div className="shopee-form-group">
          <label className="shopee-form-label" htmlFor="address">
            Địa chỉ nhận hàng <span className="shopee-form-label-required">*</span>
          </label>
          <input
            id="address"
            name="address"
            type="text"
            className={`shopee-form-input ${touched.address && errors.address ? 'has-error' : ''}`}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.address && errors.address && (
            <span className="shopee-form-error-msg">{errors.address}</span>
          )}
        </div>

        {/* Hàng 4: Ghi chú đơn hàng */}
        <div className="shopee-form-group">
          <label className="shopee-form-label" htmlFor="note">
            Ghi chú giao hàng (tùy chọn)
          </label>
          <textarea
            id="note"
            name="note"
            className="shopee-form-textarea"
            placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi giao..."
            value={formData.note}
            onChange={handleChange}
            disabled={loading}
            rows={3}
          />
        </div>

        {/* Phương thức thanh toán */}
        <div className="shopee-payment-methods">
          <div className="shopee-payment-title">Phương thức thanh toán</div>
          <div className="shopee-payment-options">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`shopee-payment-option ${formData.paymentMethod === method.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={formData.paymentMethod === method.id}
                  onChange={handleChange}
                  disabled={loading}
                />
                <div>
                  <strong>{method.label}</strong>
                  {method.desc && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {method.desc}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Nút Submit */}
        <button
          type="submit"
          className="shopee-btn shopee-btn-primary shopee-checkout-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="shopee-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              <span>Đang xử lý đơn hàng...</span>
            </>
          ) : (
            submitButtonText
          )}
        </button>
      </form>
    </div>
  );
};

export default CheckoutForm;
