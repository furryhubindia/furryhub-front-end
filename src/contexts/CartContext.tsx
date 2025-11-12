import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BackendCartItem {
  id?: number;
  packageId: number;
  packageName?: string;
  name?: string;
  unitPrice: number;
  qty: number;
  type?: string;
}

export interface CartItem {
  packageId: number;
  name: string;
  price: number;
  unitPrice?: number;
  type: 'grooming' | 'training' | 'pet-sitting' | 'vet' | 'adoption' | 'tracking' | 'mating' | 'cab';
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[];
  addToCart: (packageId: number, qty?: number) => Promise<void>;
  removeFromCart: (packageId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated || user?.role !== 'CUSTOMER') return;
    setIsLoading(true);
    try {
      const cart = await cartApi.getCart();
      // Map backend response to frontend CartItem, assuming items have packageId, name, unitPrice, qty
      const mappedItems = (cart.items || []).map((item: BackendCartItem) => ({
        packageId: item.packageId,
        name: item.name || item.packageName || `Package ${item.packageId}`,
        price: item.unitPrice || 0,
        unitPrice: item.unitPrice,
        type: (item.type as CartItem['type']) || 'grooming', // Default to grooming if not provided
        qty: item.qty,
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load local cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('localCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load local cart:', e);
      }
    }
  }, []);

  // Save local cart when items change (only if not authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('localCart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // When logging out, keep local cart in storage but don't clear state
    }
  }, [isAuthenticated]);

  const addToCart = async (packageId: number, qty: number = 1) => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      try {
        await cartApi.addItem({ packageId, qty });
        await fetchCart(); // Refresh cart
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Handle authentication errors
        if (error?.response?.status === 401) {
          console.error('Authentication failed. Token may be invalid or expired.');
          // Optionally, you could trigger a logout or token refresh here
        }
      }
    } else {
      // Local fallback for unauthenticated users
      // In real app, fetch package details first or pass them as param
      setCartItems(prev => {
        const existing = prev.find(item => item.packageId === packageId);
        if (existing) {
          return prev.map(item =>
            item.packageId === packageId ? { ...item, qty: item.qty + qty } : item
          );
        }
        return [...prev, { packageId, name: `Package ${packageId}`, price: 0, type: 'grooming', qty }];
      });
    }
  };

  const removeFromCart = async (packageId: number) => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      try {
        await cartApi.clearSpecificItem(packageId);
        await fetchCart();
      } catch (error) {
        console.error('Failed to remove from cart:', error);
        // Handle authentication errors
        if (error?.response?.status === 401) {
          console.error('Authentication failed. Token may be invalid or expired.');
        }
      }
    } else {
      setCartItems(prev => prev.filter(item => item.packageId !== packageId));
    }
  };

  const clearCart = async () => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      try {
        await cartApi.clearCart();
        setCartItems([]);
      } catch (error) {
        console.error('Failed to clear cart:', error);
        // Handle authentication errors
        if (error?.response?.status === 401) {
          console.error('Authentication failed. Token may be invalid or expired.');
        }
      }
    } else {
      setCartItems([]);
      localStorage.removeItem('localCart');
    }
  };

  const mergeCart = async () => {
    if (!isAuthenticated || user?.role !== 'CUSTOMER' || cartItems.length === 0) return;

    try {
      const items = cartItems.map(item => ({
        packageId: item.packageId,
        qty: item.qty
      }));
      await cartApi.mergeCart({ items });
      // Clear local after merge
      localStorage.removeItem('localCart');
      // Refresh from server
      await fetchCart();
    } catch (error) {
      console.error('Error merging cart:', error);
      // Handle authentication errors
      if (error?.response?.status === 401) {
        console.error('Authentication failed during cart merge. Token may be invalid or expired.');
      }
    }
  };

  // Auto-merge when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const savedCart = localStorage.getItem('localCart');
      if (savedCart) {
        try {
          const localItems = JSON.parse(savedCart);
          if (localItems.length > 0) {
            mergeCart();
          }
        } catch (e) {
          console.error('Error parsing local cart for merge:', e);
        }
      }
    }
  }, [isAuthenticated]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const value: CartContextType = {
    cart: cartItems,
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartCount,
    isLoading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
