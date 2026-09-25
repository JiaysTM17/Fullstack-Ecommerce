import { apiRequest, buildQueryString } from "./api";

function normalizeProductList(payload) {
  if (Array.isArray(payload)) {
    return { products: payload, pagination: null };
  }

  const data = payload?.data;

  if (Array.isArray(data)) {
    return {
      products: data,
      pagination: payload.pagination || null,
    };
  }

  if (Array.isArray(data?.products)) {
    return {
      products: data.products,
      pagination: data.pagination || payload.pagination || null,
    };
  }

  return {
    products: [],
    pagination: payload?.pagination || null,
  };
}

function normalizeProductDetail(payload) {
  return payload?.data || payload || null;
}

export async function getProducts(params = {}) {
  const payload = await apiRequest(`/api/products${buildQueryString(params)}`);
  return normalizeProductList(payload);
}

export async function getProductById(productId) {
  const payload = await apiRequest(`/api/products/${productId}`);
  return normalizeProductDetail(payload);
}
