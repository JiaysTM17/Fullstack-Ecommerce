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

  // Voucher state
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");

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
    setAppliedVoucher(null);
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

  // Voucher validation and discount
  const applyVoucher = useCallback(
    (code) => {
      const result = validateVoucher(code, selectedSubtotal || subtotal);
      if (result.valid) {
        setAppliedVoucher(result.voucher);
        setVoucherError("");
        return { success: true, message: result.message };
      } else {
        setVoucherError(result.message);
        return { success: false, message: result.message };
      }
    },
    [selectedSubtotal, subtotal],
  );

  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setVoucherError("");
  }, []);

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const baseSubtotal = selectedSubtotal > 0 ? selectedSubtotal : subtotal;
    if (appliedVoucher.type === "percent") {
      const raw = Math.round((baseSubtotal * appliedVoucher.value) / 100);
      return appliedVoucher.maxDiscount ? Math.min(raw, appliedVoucher.maxDiscount) : raw;
    }
    return appliedVoucher.value || 0;
  }, [appliedVoucher, selectedSubtotal, subtotal]);

  // Shipping calculation
  const defaultShippingFee = selectedItems.length > 0 ? 25000 : 0;
  const shippingFee =
    appliedVoucher?.type === "shipping"
      ? Math.max(0, defaultShippingFee - (appliedVoucher.value || 30000))
      : defaultShippingFee;

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
      voucherError,
      voucherDiscount,
      shippingFee,
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
      removeVoucher,
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
      voucherError,
      voucherDiscount,
      shippingFee,
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
      removeVoucher,
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
