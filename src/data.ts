/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hambúrguer Normal',
    description: 'Pão, bife, milho, salada, batata palha.',
    price: 10.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    category: 'Hamburgueres'
  },
  {
    id: '2',
    name: 'X-Bacon',
    description: 'Pão, bife, ovo, bacon, mussarela, milho, salada, batata palha.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=600',
    category: 'Hamburgueres',
    popular: true
  },
  {
    id: '3',
    name: 'X-Egg Bacon',
    description: 'Pão, bife, ovo, bacon, mussarela, milho, salada, batata palha.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=600',
    category: 'Hamburgueres'
  },
  {
    id: '4',
    name: 'X-Tudo',
    description: 'Pão, bife, ovo, bacon, presunto, mussarela, milho, salada, batata palha.',
    price: 20.00,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=600',
    category: 'Hamburgueres',
    popular: true
  },
  {
    id: '5',
    name: 'Frango com Catupiry',
    description: 'Pão, frango, Catupiry, mussarela, milho, salada, batata palha.',
    price: 15.00,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRC8qtBdNlaRE2VbFtO_QG_M_HgCTXhBHMX0g&s',
    category: 'Hamburgueres'
  },
  {
    id: '6',
    name: 'X-Tudão Duplo',
    description: 'Pão, 2 bifes, 2 ovos, 2 mussarelas, presunto, bacon, Catupiry, milho, salada, batata palha.',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600',
    category: 'Hamburgueres'
  },
  {
    id: '7',
    name: 'Especial Puro Sabor',
    description: 'Pão, 2 bifes, 2 ovos, 2 mussarelas, presunto, bacon, cheddar, Catupiry, milho, salada, batata.',
    price: 28.00,
    image: 'https://images.unsplash.com/photo-1542574271-7f3b92e6c821?auto=format&fit=crop&q=80&w=600',
    category: 'Hamburgueres',
    chefPick: true
  },
  {
    id: '8',
    name: 'Batata Rústica com Cheddar & Bacon',
    description: 'Batatas rústicas com casca, douradas e crocantes, regadas com calda quente de queijo cheddar cremoso e muito bacon em cubos frito.',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
    category: 'Porcoes'
  }
];

export const AVAILABLE_ADDONS = [
  { name: 'Bife Artesanal', price: 5.00 },
  { name: 'Bife Normal', price: 2.50 },
  { name: 'Ovo', price: 2.50 },
  { name: 'Presunto', price: 2.50 },
  { name: 'Bacon', price: 3.00 },
  { name: 'Cheddar', price: 3.50 },
  { name: 'Mussarela', price: 3.50 },
  { name: 'Catupiry', price: 3.50 }
];
