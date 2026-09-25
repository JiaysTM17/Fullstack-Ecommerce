import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const CART_STORAGE_KEY = "cart";
const LEGACY_CART_STORAGE_KEY = "mini_shopee_cart";

const CartContext = createContext(null);

function getProductId(product) {
  return product?.productId || product?._id || product?.id;
}

function normalizeCartItem(product, quantity) {
  const productId = getProductId(product);

  return {
    productId,
    name: product.name || "San pham",
    price: Number(product.price) || 0,
    image: product.image || product.images?.[0] || "",
    quantity: Math.max(1, Number(quantity) || 1),
    stock: Number(product.stock) || 0,
    slug: product.slug || "",
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  }, [state.items]);

  const addToCart = useCallback((product, quantity = 1) => {
    dispatch({ type: "ADD_TO_CART", product, quantity });
  }, []);

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: "REMOVE_FROM_CART", productId });
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
  }, []);

  const getCartCount = useCallback(
    () => state.items.reduce((total, item) => total + item.quantity, 0),
    [state.items],
  );

  const getCartSubtotal = useCallback(
    () =>
      state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [state.items],
  );

  const value = useMemo(
    () => ({
      items: state.items,
      totalQuantity: getCartCount(),
      subtotal: getCartSubtotal(),
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
      getCartCount,
      getCartSubtotal,
    }),
    [
      state.items,
      getCartCount,
      getCartSubtotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
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
