/**
 * Wishlist Service — Quản lý danh sách sản phẩm yêu thích (Client)
 * Tích hợp trực tiếp với /api/wishlist kèm fallback localStorage đồng bộ 2 chiều
 */
import { apiRequest } from "./api";

const WISHLIST_STORAGE_KEY = "mini_shopee_wishlist_items";

function getLocalWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("mini_shopee_wishlist_updated", { detail: { items } }));
  } catch {}
}

export async function getWishlist() {
  try {
    const res = await apiRequest("/api/wishlist");
    if (res?.data?.items) {
      saveLocalWishlist(res.data.items);
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }
  const items = getLocalWishlist();
  return { items, total: items.length };
}

export async function addToWishlist(productId, productData = {}) {
  try {
    const res = await apiRequest(`/api/wishlist/${productId}`, {
      method: "POST",
    });
    if (res?.data) {
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }

  const items = getLocalWishlist();
  if (!items.some((it) => (it.productId || it.id || it._id) === productId)) {
    const newItem = {
      productId,
      id: productId,
      _id: productId,
      name: productData.name || "Sản phẩm yêu thích",
      price: productData.price || 0,
      originalPrice: productData.originalPrice || 0,
      image: productData.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      rating: productData.rating || 5,
      sold: productData.sold || 0,
      stock: productData.stock || 50,
      inStock: (productData.stock || 50) > 0,
      shopName: productData.shopName || "Gian Hàng Shopee",
      addedAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    saveLocalWishlist(items);
  }
  return { success: true, total: items.length };
}

export async function removeFromWishlist(productId) {
  try {
    const res = await apiRequest(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });
    if (res?.data) {
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }

  const items = getLocalWishlist();
  const filtered = items.filter((it) => (it.productId || it.id || it._id) !== productId);
  saveLocalWishlist(filtered);
  return { success: true, total: filtered.length };
}

export async function checkWishlist(productId) {
  try {
    const res = await apiRequest(`/api/wishlist/check/${productId}`);
    if (res?.data?.isInWishlist !== undefined) {
      return res.data.isInWishlist;
    }
  } catch (err) {
    // offline fallback
  }

  const items = getLocalWishlist();
  return items.some((it) => (it.productId || it.id || it._id) === productId);
}

export async function clearWishlist() {
  try {
    await apiRequest("/api/wishlist", { method: "DELETE" });
  } catch {}
  saveLocalWishlist([]);
  return { success: true };
}

export async function moveAllWishlistToCart() {
  try {
    const res = await apiRequest("/api/wishlist/move-to-cart", { method: "POST" });
    if (res?.data) {
      saveLocalWishlist([]);
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }
  const items = getLocalWishlist();
  saveLocalWishlist([]);
  return { success: true, addedCount: items.length };
}

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  moveAllWishlistToCart,
};
