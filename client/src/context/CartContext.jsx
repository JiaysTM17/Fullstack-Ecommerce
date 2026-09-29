import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { validateVoucher } from "../services/voucherService";

const CART_STORAGE_KEY = "cart";
const LEGACY_CART_STORAGE_KEY = "mini_shopee_cart";
const SAVED_ITEMS_KEY = "mini_shopee_saved_items";
const APPLIED_VOUCHER_KEY = "mini_shopee_applied_voucher";
const APPLIED_DISCOUNT_VOUCHER_KEY = "mini_shopee_applied_discount_voucher";
const APPLIED_SHIPPING_VOUCHER_KEY = "mini_shopee_applied_shipping_voucher";

const CartContext = createContext(null);

function getProductId(product) {
  return product?.productId || product?._id || product?.id;
}

function normalizeCartItem(product, quantity) {
  const productId = getProductId(product);

  return {
    productId,
    name: product.name || "Sản phẩm",
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
    image: product.image || product.images?.[0] || "",
    quantity: Math.max(1, Number(quantity) || 1),
    stock: Number(product.stock) || 50,
    slug: product.slug || "",
    shopId: product.shopId || "shop_01",
    shopName: product.shopName || "Thời Trang GenZ",
    selectedColor: product.selectedColor || null,
    selectedSize: product.selectedSize || null,
  };
}

function clampQuantity(nextQuantity, stock) {
  const quantity = Math.max(1, Number(nextQuantity) || 1);
  return stock > 0 ? Math.min(quantity, stock) : quantity;
}

function loadCartFromStorage() {
  try {
    if (typeof window === "undefined") {
      return [];
    }

    const rawCart =
      localStorage.getItem(CART_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    const savedCart = rawCart ? JSON.parse(rawCart) : [];
    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
}

function loadSavedFromStorage() {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadAppliedDiscountVoucherFromStorage() {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(APPLIED_DISCOUNT_VOUCHER_KEY);
    if (raw) return JSON.parse(raw);
    // Fallback to legacy single voucher if it's a discount
    const legacy = localStorage.getItem(APPLIED_VOUCHER_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && parsed.type !== "shipping") return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function loadAppliedShippingVoucherFromStorage() {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(APPLIED_SHIPPING_VOUCHER_KEY);
    if (raw) return JSON.parse(raw);
    // Fallback to legacy single voucher if it's shipping
    const legacy = localStorage.getItem(APPLIED_VOUCHER_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && parsed.type === "shipping") return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_TO_CART": {
      const nextItem = normalizeCartItem(action.product, action.quantity);

      if (!nextItem.productId) {
        return state;
      }

      const existingItem = state.items.find(
        (item) => item.productId === nextItem.productId,
      );

      if (!existingItem) {
        return { items: [...state.items, nextItem] };
      }

      return {
        items: state.items.map((item) => {
          if (item.productId !== nextItem.productId) {
            return item;
          }

          return {
            ...item,
            quantity: clampQuantity(
              item.quantity + nextItem.quantity,
              item.stock || nextItem.stock,
            ),
          };
        }),
      };
    }

    case "REMOVE_FROM_CART":
      return {
        items: state.items.filter((item) => item.productId !== action.productId),
      };

    case "INCREASE_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.productId === action.productId
            ? {
                ...item,
                quantity: clampQuantity(item.quantity + 1, item.stock),
              }
            : item,
        ),
      };

    case "DECREASE_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.productId === action.productId
            ? {
                ...item,
                quantity: Math.max(1, item.quantity - 1),
              }
            : item,
        ),
      };

    case "SET_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.productId === action.productId
            ? {
                ...item,
                quantity: clampQuantity(action.quantity, item.stock),
              }
            : item,
        ),
      };

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, () => ({
    items: loadCartFromStorage(),
  }));

  // Selected items checkbox state
  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    return loadCartFromStorage().map((item) => item.productId);
  });

  // Saved for later list
  const [savedItems, setSavedItems] = useState(loadSavedFromStorage);

  // Dual Voucher states with local storage persistence
  const [appliedDiscountVoucher, setAppliedDiscountVoucher] = useState(
    loadAppliedDiscountVoucherFromStorage,
  );
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState(
    loadAppliedShippingVoucherFromStorage,
  );
  const [voucherError, setVoucherError] = useState("");

  // Backward compatibility alias
  const appliedVoucher = appliedDiscountVoucher || appliedShippingVoucher;

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);

    // Keep selectedItemIds aligned
    setSelectedItemIds((prev) => {
      const validIds = state.items.map((i) => i.productId);
      // Include any newly added items automatically
      const newlyAdded = validIds.filter((id) => !prev.includes(id));
      const remaining = prev.filter((id) => validIds.includes(id));
      return [...remaining, ...newlyAdded];
    });
  }, [state.items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (appliedDiscountVoucher) {
      localStorage.setItem(
        APPLIED_DISCOUNT_VOUCHER_KEY,
        JSON.stringify(appliedDiscountVoucher),
      );
    } else {
      localStorage.removeItem(APPLIED_DISCOUNT_VOUCHER_KEY);
    }
  }, [appliedDiscountVoucher]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (appliedShippingVoucher) {
      localStorage.setItem(
        APPLIED_SHIPPING_VOUCHER_KEY,
        JSON.stringify(appliedShippingVoucher),
      );
    } else {
      localStorage.removeItem(APPLIED_SHIPPING_VOUCHER_KEY);
    }
  }, [appliedShippingVoucher]);

  const addToCart = useCallback((product, quantity = 1) => {
    dispatch({ type: "ADD_TO_CART", product, quantity });
  }, []);

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: "REMOVE_FROM_CART", productId });
    setSelectedItemIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const increaseQuantity = useCallback((productId) => {
    dispatch({ type: "INCREASE_QUANTITY", productId });
  }, []);

  const decreaseQuantity = useCallback((productId) => {
    dispatch({ type: "DECREASE_QUANTITY", productId });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    dispatch({ type: "SET_QUANTITY", productId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
    setSelectedItemIds([]);
    setAppliedDiscountVoucher(null);
    setAppliedShippingVoucher(null);
    setVoucherError("");
  }, []);

  // Selection methods
  const toggleSelectItem = useCallback((productId) => {
    setSelectedItemIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const selectAllItems = useCallback(() => {
    setSelectedItemIds(state.items.map((i) => i.productId));
  }, [state.items]);

  const unselectAllItems = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const isItemSelected = useCallback(
    (productId) => selectedItemIds.includes(productId),
    [selectedItemIds],
  );

  // Save for later methods
  const saveForLater = useCallback(
    (productId) => {
      const itemToSave = state.items.find((i) => i.productId === productId);
      if (itemToSave) {
        setSavedItems((prev) => {
          if (prev.some((i) => i.productId === productId)) return prev;
          return [...prev, itemToSave];
        });
        removeFromCart(productId);
      }
    },
    [state.items, removeFromCart],
  );

  const moveToCartFromSaved = useCallback(
    (savedItem) => {
      addToCart(savedItem, savedItem.quantity || 1);
      setSavedItems((prev) =>
        prev.filter((i) => i.productId !== savedItem.productId),
      );
    },
    [addToCart],
  );

  const removeFromSaved = useCallback((productId) => {
    setSavedItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  // Calculations
  const totalQuantity = useMemo(
    () => state.items.reduce((total, item) => total + item.quantity, 0),
    [state.items],
  );

  const subtotal = useMemo(
    () =>
      state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [state.items],
  );

  const selectedItems = useMemo(
    () => state.items.filter((item) => selectedItemIds.includes(item.productId)),
    [state.items, selectedItemIds],
  );

  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [selectedItems],
  );

  // Voucher actions: Discount (percent / fixed) and Shipping (freeship)
  const applyDiscountVoucher = useCallback(
    async (codeOrVoucher) => {
      if (!codeOrVoucher) {
        setAppliedDiscountVoucher(null);
        return { success: false, message: "Mã không hợp lệ" };
      }
      const code = typeof codeOrVoucher === "string" ? codeOrVoucher : codeOrVoucher.code;
      const baseSubtotal = selectedSubtotal > 0 ? selectedSubtotal : subtotal;
      const result = await validateVoucher(code, baseSubtotal);
      if (result.valid) {
        if (result.voucher.type === "shipping") {
          return { success: false, message: "Đây là mã freeship, vui lòng chọn ở mục Miễn Phí Vận Chuyển" };
        }
        setAppliedDiscountVoucher(result.voucher);
        setVoucherError("");
        return { success: true, message: result.message, voucher: result.voucher };
      } else {
        setVoucherError(result.message);
        return { success: false, message: result.message };
      }
    },
    [selectedSubtotal, subtotal],
  );

  const applyShippingVoucher = useCallback(
    async (codeOrVoucher) => {
      if (!codeOrVoucher) {
        setAppliedShippingVoucher(null);
        return { success: false, message: "Mã không hợp lệ" };
      }
      const code = typeof codeOrVoucher === "string" ? codeOrVoucher : codeOrVoucher.code;
      const baseSubtotal = selectedSubtotal > 0 ? selectedSubtotal : subtotal;
      const result = await validateVoucher(code, baseSubtotal);
      if (result.valid) {
        if (result.voucher.type !== "shipping") {
          return { success: false, message: "Đây là mã giảm giá đơn hàng, vui lòng chọn ở mục Giảm Giá Sàn" };
        }
        setAppliedShippingVoucher(result.voucher);
        setVoucherError("");
        return { success: true, message: result.message, voucher: result.voucher };
      } else {
        setVoucherError(result.message);
        return { success: false, message: result.message };
      }
    },
    [selectedSubtotal, subtotal],
  );

  const removeDiscountVoucher = useCallback(() => {
    setAppliedDiscountVoucher(null);
  }, []);

  const removeShippingVoucher = useCallback(() => {
    setAppliedShippingVoucher(null);
  }, []);

  // Smart router applyVoucher: applies to appropriate slot based on voucher type
  const applyVoucher = useCallback(
    async (codeOrVoucher) => {
      if (!codeOrVoucher) {
        setAppliedDiscountVoucher(null);
        setAppliedShippingVoucher(null);
        setVoucherError("");
        return { success: false, message: "Mã không hợp lệ" };
      }
      const code = typeof codeOrVoucher === "string" ? codeOrVoucher : codeOrVoucher.code;
      const baseSubtotal = selectedSubtotal > 0 ? selectedSubtotal : subtotal;
      const result = await validateVoucher(code, baseSubtotal);
      if (result.valid) {
        if (result.voucher.type === "shipping") {
          setAppliedShippingVoucher(result.voucher);
        } else {
          setAppliedDiscountVoucher(result.voucher);
        }
        setVoucherError("");
        return { success: true, message: result.message, voucher: result.voucher };
      } else {
        setVoucherError(result.message);
        return { success: false, message: result.message };
      }
    },
    [selectedSubtotal, subtotal],
  );

  const removeVoucher = useCallback((target) => {
    if (target === "shipping") {
      setAppliedShippingVoucher(null);
    } else if (target === "discount") {
      setAppliedDiscountVoucher(null);
    } else {
      setAppliedDiscountVoucher(null);
      setAppliedShippingVoucher(null);
    }
    setVoucherError("");
  }, []);

  // Product/Order voucher discount calculation
  const voucherDiscount = useMemo(() => {
    if (!appliedDiscountVoucher) return 0;
    const baseSubtotal = selectedSubtotal > 0 ? selectedSubtotal : subtotal;
    if (appliedDiscountVoucher.type === "percent") {
      const raw = Math.round((baseSubtotal * appliedDiscountVoucher.value) / 100);
      return appliedDiscountVoucher.maxDiscount
        ? Math.min(raw, appliedDiscountVoucher.maxDiscount)
        : raw;
    }
    return Math.min(appliedDiscountVoucher.value || 0, baseSubtotal);
  }, [appliedDiscountVoucher, selectedSubtotal, subtotal]);

  // Shipping fee & Shipping discount calculation
  const defaultShippingFee =
    selectedItems.length > 0 ? 25000 : state.items.length > 0 ? 25000 : 0;

  const shippingDiscount = useMemo(() => {
    if (!appliedShippingVoucher) return 0;
    const value = appliedShippingVoucher.value || 30000;
    return Math.min(value, defaultShippingFee);
  }, [appliedShippingVoucher, defaultShippingFee]);

  const shippingFee = Math.max(0, defaultShippingFee - shippingDiscount);

  const finalTotal = useMemo(() => {
    const base = selectedSubtotal > 0 ? selectedSubtotal : subtotal;
    if (base === 0) return 0;
    return Math.max(0, base - voucherDiscount + shippingFee);
  }, [selectedSubtotal, subtotal, voucherDiscount, shippingFee]);

  const value = useMemo(
    () => ({
      items: state.items,
      totalQuantity,
      subtotal,
      selectedItems,
      selectedItemIds,
      selectedSubtotal,
      savedItems,
      appliedVoucher,
      appliedDiscountVoucher,
      appliedShippingVoucher,
      voucherError,
      voucherDiscount,
      shippingDiscount,
      shippingFee,
      defaultShippingFee,
      finalTotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
      toggleSelectItem,
      selectAllItems,
      unselectAllItems,
      isItemSelected,
      saveForLater,
      moveToCartFromSaved,
      removeFromSaved,
      applyVoucher,
      applyDiscountVoucher,
      applyShippingVoucher,
      removeVoucher,
      removeDiscountVoucher,
      removeShippingVoucher,
    }),
    [
      state.items,
      totalQuantity,
      subtotal,
      selectedItems,
      selectedItemIds,
      selectedSubtotal,
      savedItems,
      appliedVoucher,
      appliedDiscountVoucher,
      appliedShippingVoucher,
      voucherError,
      voucherDiscount,
      shippingDiscount,
      shippingFee,
      defaultShippingFee,
      finalTotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
      toggleSelectItem,
      selectAllItems,
      unselectAllItems,
      isItemSelected,
      saveForLater,
      moveToCartFromSaved,
      removeFromSaved,
      applyVoucher,
      applyDiscountVoucher,
      applyShippingVoucher,
      removeVoucher,
      removeDiscountVoucher,
      removeShippingVoucher,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
