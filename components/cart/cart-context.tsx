'use client';

import { createContext, useContext, useOptimistic, useTransition, ReactNode } from 'react';
import { Cart, CartItem } from '@/lib/shopify/types';

type UpdateType = 'plus' | 'minus' | 'delete';

type CartAction =
  | { type: 'UPDATE_ITEM'; payload: { lineId: string; updateType: UpdateType } }
  | { type: 'ADD_ITEM'; payload: { variant: CartItem['merchandise']; product: CartItem['merchandise']['product'] } }
  | { type: 'SET_CART'; payload: Cart };

type CartContextType = {
  cart: Cart | undefined;
  updateCartItem: (lineId: string, updateType: UpdateType) => void;
  addCartItem: (variant: CartItem['merchandise'], product: CartItem['merchandise']['product']) => void;
  isPending: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: Cart | undefined, action: CartAction): Cart | undefined {
  if (!state) return state;

  switch (action.type) {
    case 'UPDATE_ITEM': {
      const { lineId, updateType } = action.payload;
      const updatedLines = state.lines.edges
        .map((edge) => {
          if (edge.node.id !== lineId) return edge;

          if (updateType === 'delete') return null;

          const newQuantity = updateType === 'plus' ? edge.node.quantity + 1 : edge.node.quantity - 1;

          if (newQuantity <= 0) return null;

          return {
            ...edge,
            node: { ...edge.node, quantity: newQuantity },
          };
        })
        .filter(Boolean) as Cart['lines']['edges'];

      return {
        ...state,
        lines: { ...state.lines, edges: updatedLines },
        totalQuantity: updatedLines.reduce((sum, edge) => sum + edge.node.quantity, 0),
      };
    }
    case 'ADD_ITEM': {
      const { variant, product } = action.payload;
      const existingItem = state.lines.edges.find((edge) => edge.node.merchandise.id === variant.id);

      if (existingItem) {
        return {
          ...state,
          lines: {
            ...state.lines,
            edges: (state.lines?.edges ?? []).map((edge) =>
              edge.node.merchandise.id === variant.id
                ? { ...edge, node: { ...edge.node, quantity: edge.node.quantity + 1 } }
                : edge
            ),
          },
          totalQuantity: state.totalQuantity + 1,
        };
      }

      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        quantity: 1,
        cost: {
          totalAmount: { amount: '0', currencyCode: 'EUR' },
        },
        merchandise: {
          ...variant,
          product,
        },
      };

      return {
        ...state,
        lines: {
          ...state.lines,
          edges: [...state.lines.edges, { node: newItem, cursor: '' }],
        },
        totalQuantity: state.totalQuantity + 1,
      };
    }
    case 'SET_CART':
      return action.payload;
    default:
      return state;
  }
}

export function CartProvider({
  children,
  initialCart,
}: {
  children: ReactNode;
  initialCart: Cart | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCart, updateOptimisticCart] = useOptimistic(initialCart, cartReducer);

  const updateCartItem = (lineId: string, updateType: UpdateType) => {
    startTransition(() => {
      updateOptimisticCart({ type: 'UPDATE_ITEM', payload: { lineId, updateType } });
    });
  };

  const addCartItem = (variant: CartItem['merchandise'], product: CartItem['merchandise']['product']) => {
    startTransition(() => {
      updateOptimisticCart({ type: 'ADD_ITEM', payload: { variant, product } });
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart: optimisticCart,
        updateCartItem,
        addCartItem,
        isPending,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
