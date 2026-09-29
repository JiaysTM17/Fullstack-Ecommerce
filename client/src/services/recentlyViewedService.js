/**
 * Recently Viewed Products Service
 * Tracks and persists up to 20 recently viewed items in localStorage
 */

const RECENTLY_VIEWED_KEY = "mini_shopee_recently_viewed";
const MAX_RECENT_ITEMS = 20;

export function getRecentlyViewed() {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading recently viewed products:", err);
    return [];
  }
}

export function addRecentlyViewed(product) {
  if (!product) return [];
  try {
    if (typeof window === "undefined") return [];
    const current = getRecentlyViewed();
    const productId = product._id || product.id;

    // Filter out existing occurrence of this product
    const filtered = current.filter((p) => (p._id || p.id) !== productId);

    // Prepare clean item object with essential metadata
    const cleanItem = {
      _id: productId,
      id: productId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      image: product.image,
      rating: product.rating || 5,
      sold: product.sold || 0,
      shopId: product.shopId || "shop_01",
      shopName: product.shopName || "Thời Trang GenZ",
      category: product.category || "",
      isOfficial: product.isOfficial || false,
      viewedAt: new Date().toISOString(),
    };

    // Prepend new item and slice to max
    const updated = [cleanItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));

    // Dispatch event for reactive listeners
    window.dispatchEvent(new Event("mini_shopee_recently_viewed_updated"));
    return updated;
  } catch (err) {
    console.error("Error adding recently viewed product:", err);
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    window.dispatchEvent(new Event("mini_shopee_recently_viewed_updated"));
  } catch (err) {
    console.error("Error clearing recently viewed products:", err);
  }
}

export default {
  getRecentlyViewed,
  addRecentlyViewed,
  clearRecentlyViewed,
};
