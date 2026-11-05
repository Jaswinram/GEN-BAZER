import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { calculateLineTotal } from '../utils/currency';
import { resolveProductImage } from '../utils/productImages';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotalAmount: number;
  deliveryCharges: number;
  totalAmount: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('gen_baazar_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('gen_baazar_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
    if (product.stockStatus === 'out_of_stock' || product.availableQuantity <= 0) {
      return { success: false, message: 'Sorry, this product is currently out of stock.' };
    }

    const minQty = product.minOrderQuantity || 1;
    const requestedQty = Math.max(quantity, minQty);

    const existingIndex = items.findIndex((i) => i.productId === product._id);

    if (existingIndex > -1) {
      const current = items[existingIndex];
      const newQty = current.quantity + requestedQty;

      if (newQty > product.availableQuantity) {
        return {
          success: false,
          message: `Cannot add more. Only ${product.availableQuantity} ${product.quantityUnit} available in stock.`,
        };
      }

      const updated = [...items];
      updated[existingIndex] = { ...current, quantity: newQty };
      setItems(updated);
      return {
        success: true,
        message: `Updated quantity to ${newQty} ${product.quantityUnit}.`,
      };
    } else {
      if (requestedQty > product.availableQuantity) {
        return {
          success: false,
          message: `Requested quantity exceeds available stock (${product.availableQuantity} ${product.quantityUnit}).`,
        };
      }

      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        price: product.price,
        currency: 'INR',
        priceUnit: product.priceUnit,
        quantity: requestedQty,
        quantityUnit: product.quantityUnit,
        availableQuantity: product.availableQuantity,
        minOrderQuantity: minQty,
        image: resolveProductImage(product.name, product.category, product.images),
        sellerId: product.sellerId,
        sellerName: product.sellerName,
      };

      setItems([...items, newItem]);
      return {
        success: true,
        message: `Added ${requestedQty} ${product.quantityUnit} of ${product.name} to cart.`,
      };
    }
  };

  const updateQuantity = (productId: string, quantity: number): { success: boolean; message?: string } => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return { success: false, message: 'Item not in cart' };

    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: 'Item removed from cart' };
    }

    if (quantity > item.availableQuantity) {
      return {
        success: false,
        message: `Stock limit reached: only ${item.availableQuantity} ${item.quantityUnit} available.`,
      };
    }

    if (quantity < item.minOrderQuantity) {
      return {
        success: false,
        message: `Minimum order for this product is ${item.minOrderQuantity} ${item.quantityUnit}.`,
      };
    }

    setItems(
      items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotalAmount = items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.price, item.quantity);
  }, 0);

  const deliveryCharges = items.length === 0 ? 0 : subtotalAmount >= 1000 ? 0 : 80;
  const totalAmount = subtotalAmount + deliveryCharges;
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotalAmount,
        deliveryCharges,
        totalAmount,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

