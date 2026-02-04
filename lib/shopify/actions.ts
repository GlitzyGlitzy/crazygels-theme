'use server';

import { addToCart, createCart, getCart, removeFromCart, updateCart } from './index';
import { cookies } from 'next/headers';

const CART_COOKIE = 'cartId';

export async function getCartId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value;
}

export async function setCartId(cartId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function addItemToCart(merchandiseId: string, quantity: number = 1) {
  let cartId = await getCartId();

  if (!cartId) {
    const cart = await createCart();
    cartId = cart.id;
    await setCartId(cartId);
  }

  const cart = await addToCart(cartId, [{ merchandiseId, quantity }]);
  return cart;
}

export async function removeItemFromCart(lineId: string) {
  const cartId = await getCartId();
  if (!cartId) throw new Error('No cart found');

  const cart = await removeFromCart(cartId, [lineId]);
  return cart;
}

export async function updateItemQuantity(lineId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) throw new Error('No cart found');

  const cart = await updateCart(cartId, [{ id: lineId, quantity }]);
  return cart;
}

export async function fetchCart() {
  const cartId = await getCartId();
  if (!cartId) return null;

  const cart = await getCart(cartId);
  return cart;
}
