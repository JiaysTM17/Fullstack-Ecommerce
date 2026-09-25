const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9,11}$/;

export function validateCheckoutForm(values) {
  const errors = {};

  if (!values.fullName?.trim()) {
    errors.fullName = "Vui long nhap ho ten";
  }

  if (!values.phone?.trim()) {
    errors.phone = "Vui long nhap so dien thoai";
  } else if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "So dien thoai can co 9-11 chu so";
  }

  if (!values.email?.trim()) {
    errors.email = "Vui long nhap email";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Email khong hop le";
  }

  if (!values.address?.trim()) {
    errors.address = "Vui long nhap dia chi";
  }

  return errors;
}

export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}
