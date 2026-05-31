/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Hamburgueres' | 'Combos' | 'Porcoes';
  popular?: boolean;
  chefPick?: boolean;
}

export interface CartItemAddOn {
  name: string;
  price: number;
  quantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  addOns?: CartItemAddOn[];
}

export type OrderStatus = 'Pendente' | 'Preparando' | 'Em Entrega' | 'Entregue';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    notes?: string;
    addOns?: CartItemAddOn[];
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}
