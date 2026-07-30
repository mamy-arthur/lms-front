/**
 * Tests unitaires — cart-utils
 *
 * On vérifie le calcul du compteur, du sous-total, le lookup d'item
 * et le formatage monétaire.
 */

import {
  findCartItemByLearningPath,
  formatCartMoney,
  getCartItemCount,
  getCartSubtotal,
  withCartItemQuantity,
} from '../cart-utils';
import type { ApiCart, ApiCartItem } from '@/shared/types/cart.types';

const ITEM_A: ApiCartItem = {
  id: 'item-a',
  cart_id: 'cart-1',
  learning_path_id: 'lp-a',
  name: 'Formation A',
  price: 100,
  quantity: 2,
  currency: 'EUR',
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

const ITEM_B: ApiCartItem = {
  id: 'item-b',
  cart_id: 'cart-1',
  learning_path_id: 'lp-b',
  name: 'Formation B',
  price: 49.5,
  quantity: 1,
  currency: 'EUR',
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

const CART: ApiCart = {
  id: 'cart-1',
  tenant_id: 'tenant-1',
  user_id: 'user-1',
  status: 'active',
  currency: 'EUR',
  total: 249.5,
  items: [ITEM_A, ITEM_B],
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

describe('cart-utils', () => {
  describe('getCartItemCount', () => {
    it('retourne 0 pour un panier undefined / null', () => {
      expect(getCartItemCount(undefined)).toBe(0);
      expect(getCartItemCount(null)).toBe(0);
    });

    it('retourne 0 pour un panier sans items', () => {
      expect(getCartItemCount({ ...CART, items: [] })).toBe(0);
    });

    it('somme les quantités de tous les items', () => {
      expect(getCartItemCount(CART)).toBe(3);
    });
  });

  describe('getCartSubtotal', () => {
    it('retourne 0 pour une liste vide', () => {
      expect(getCartSubtotal([])).toBe(0);
    });

    it('calcule price × quantity pour chaque ligne', () => {
      // 100*2 + 49.5*1 = 249.5
      expect(getCartSubtotal(CART.items)).toBe(249.5);
    });
  });

  describe('findCartItemByLearningPath', () => {
    it('retourne undefined si le panier est absent', () => {
      expect(findCartItemByLearningPath(undefined, 'lp-a')).toBeUndefined();
      expect(findCartItemByLearningPath(null, 'lp-a')).toBeUndefined();
    });

    it('retourne undefined si le parcours est absent du panier', () => {
      expect(findCartItemByLearningPath(CART, 'lp-unknown')).toBeUndefined();
    });

    it('retourne l’item correspondant au learning_path_id', () => {
      expect(findCartItemByLearningPath(CART, 'lp-b')).toEqual(ITEM_B);
    });
  });

  describe('formatCartMoney', () => {
    it('formate en EUR par défaut', () => {
      expect(formatCartMoney(149.99)).toMatch(/149[,.]99/);
      expect(formatCartMoney(149.99)).toMatch(/€/);
    });

    it('utilise la devise fournie', () => {
      const formatted = formatCartMoney(10, 'USD');
      expect(formatted).toMatch(/10/);
    });
  });

  describe('withCartItemQuantity', () => {
    it('met à jour la quantité et recalcule le total', () => {
      const next = withCartItemQuantity(CART, 'item-a', 3, ITEM_A);
      expect(next.items.find((item) => item.id === 'item-a')?.quantity).toBe(3);
      expect(next.total).toBe(349.5);
    });

    it('retire l’item si la quantité tombe à 0', () => {
      const next = withCartItemQuantity(CART, 'item-a', 0, ITEM_A);
      expect(next.items.find((item) => item.id === 'item-a')).toBeUndefined();
      expect(next.total).toBe(49.5);
    });

    it('réinsère un item via le snapshot s’il a été retiré', () => {
      const empty = withCartItemQuantity(CART, 'item-a', 0, ITEM_A);
      const restored = withCartItemQuantity(empty, 'item-a', 2, ITEM_A);
      expect(restored.items.find((item) => item.id === 'item-a')).toEqual({
        ...ITEM_A,
        quantity: 2,
      });
      expect(restored.total).toBe(249.5);
    });
  });
});
