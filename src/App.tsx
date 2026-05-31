/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Product, Order } from './types';
import { INITIAL_PRODUCTS } from './data';
import { getLocalStorageData, setLocalStorageData } from './utils';
import Storefront from './components/Storefront';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

// High quality default initial orders to make the admin charts and metrics immediately visible and rich!
const INITIAL_ORDERS: Order[] = [
  {
    id: '49281',
    customerName: 'Rafael Rodrigues',
    customerPhone: '(32) 99847-1958',
    customerAddress: 'Rua Principal, 142, Centro, Juiz de Fora - MG',
    paymentMethod: 'Pix (Recomendado)',
    items: [
      {
        productId: '3',
        productName: 'X-Tudo',
        price: 20.00,
        quantity: 1,
        notes: 'Sem cebola por favor.'
      },
      {
        productId: '9',
        productName: 'Coca-Cola Lata',
        price: 5.00,
        quantity: 2
      }
    ],
    subtotal: 30.00,
    deliveryFee: 5.00,
    total: 35.00,
    status: 'Entregue',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString() // 3 hours ago
  },
  {
    id: '50129',
    customerName: 'Juliana Souza de Oliveira',
    customerPhone: '(32) 99120-4493',
    customerAddress: 'Av. Itamar Franco, 2210, São Mateus',
    paymentMethod: 'Cartão de Crédito',
    items: [
      {
        productId: '4',
        productName: 'Frango Catupiry',
        price: 15.00,
        quantity: 1,
        notes: 'Capricha no catupiry!'
      },
      {
        productId: '11',
        productName: 'Suco de Laranja Natural',
        price: 7.00,
        quantity: 1
      }
    ],
    subtotal: 22.00,
    deliveryFee: 5.00,
    total: 27.00,
    status: 'Preparando',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString() // 25 minutes ago
  },
  {
    id: '88391',
    customerName: 'Marcos Pereira',
    customerPhone: '(32) 98844-3322',
    customerAddress: 'Rua Benjamin Constant, 95, Bairro Glória',
    paymentMethod: 'Dinheiro',
    items: [
      {
        productId: '6',
        productName: 'Combo Puro Sabor',
        price: 25.00,
        quantity: 2
      }
    ],
    subtotal: 50.00,
    deliveryFee: 5.00,
    total: 55.00,
    status: 'Pendente',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString() // 10 minutes ago
  },
  {
    id: '12093',
    customerName: 'Leticia Lima Ramos',
    customerPhone: '(32) 99104-1188',
    customerAddress: 'Rua São Sebastião, 452, Apt 302, Centro',
    paymentMethod: 'Pix (Recomendado)',
    items: [
      {
        productId: '5',
        productName: 'Especial Puro Sabor',
        price: 28.00,
        quantity: 1
      },
      {
        productId: '8',
        productName: 'Batata Rústica com Cheddar & Bacon',
        price: 18.00,
        quantity: 1
      }
    ],
    subtotal: 46.00,
    deliveryFee: 5.00,
    total: 51.00,
    status: 'Em Entrega',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString() // 45 minutes ago
  },
  {
    id: '33490',
    customerName: 'Rafael Rodrigues',
    customerPhone: '(32) 99847-1958',
    customerAddress: 'Rua Principal, 142, Centro, Juiz de Fora - MG',
    paymentMethod: 'Pix (Recomendado)',
    items: [
      {
        productId: '2',
        productName: 'X-Bacon',
        price: 15.00,
        quantity: 1
      }
    ],
    subtotal: 15.00,
    deliveryFee: 5.00,
    total: 20.00,
    status: 'Entregue',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString() // Yesterday
  }
];

export default function App() {
  // Sync state with LocalStorage for full persistence!
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'store' | 'admin-login' | 'admin-panel'>('store');

  // Load database on mount
  useEffect(() => {
    const loadedProds = getLocalStorageData<Product[]>('puro_sabor_products', []);
    const loadedOrders = getLocalStorageData<Order[]>('puro_sabor_orders', []);
    const authSession = getLocalStorageData<boolean>('puro_sabor_admin_auth', false);

    if (loadedProds.length > 0) {
      // Start with a clean list of INITIAL_PRODUCTS as the foundation to guarantee their correct details
      const mergedProds = [...INITIAL_PRODUCTS];
      const existingIds = new Set<string>(INITIAL_PRODUCTS.map(p => p.id));
      const existingNames = new Set<string>(INITIAL_PRODUCTS.map(p => p.name.toLowerCase().trim()));

      // Merge user custom products from local storage without duplicate IDs or names
      loadedProds.forEach((prod) => {
        const cleanName = prod.name.trim().toLowerCase();
        // Skip any older beverage products or obsolete categories
        if (
          cleanName === 'coca-cola lata' ||
          cleanName === 'guaraná antarctica lata' ||
          cleanName === 'guarana antarctica lata' ||
          cleanName === 'suco de laranja natural' ||
          (prod.category as string) === 'Bebidas'
        ) {
          return;
        }
        if (!existingIds.has(prod.id) && !existingNames.has(cleanName)) {
          mergedProds.push(prod);
          existingIds.add(prod.id);
          existingNames.add(cleanName);
        }
      });

      setProducts(mergedProds);
      setLocalStorageData('puro_sabor_products', mergedProds);
    } else {
      setProducts(INITIAL_PRODUCTS);
      setLocalStorageData('puro_sabor_products', INITIAL_PRODUCTS);
    }

    if (loadedOrders.length > 0) {
      setOrders(loadedOrders);
    } else {
      setOrders(INITIAL_ORDERS);
      setLocalStorageData('puro_sabor_orders', INITIAL_ORDERS);
    }

    setIsAdminLoggedIn(authSession);
  }, []);

  // Handlers to update local DB on modifications
  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    setLocalStorageData('puro_sabor_products', updatedProducts);
  };

  const handleUpdateOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    setLocalStorageData('puro_sabor_orders', updatedOrders);
  };

  const handleAddNewOrderFromStorefront = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    setLocalStorageData('puro_sabor_orders', updated);
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setLocalStorageData('puro_sabor_admin_auth', true);
    setCurrentView('admin-panel');
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setLocalStorageData('puro_sabor_admin_auth', false);
    setCurrentView('store');
  };

  const handleResetDatabase = () => {
    setProducts(INITIAL_PRODUCTS);
    setLocalStorageData('puro_sabor_products', INITIAL_PRODUCTS);

    setOrders(INITIAL_ORDERS);
    setLocalStorageData('puro_sabor_orders', INITIAL_ORDERS);
  };

  return (
    <div className="bg-[#1c110c] min-h-screen text-[#f5ded5]">
      <AnimatePresence mode="wait">
        {/* VIEW 1: Customer Storefront */}
        {currentView === 'store' && (
          <motion.div
            key="store-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Storefront
              products={products}
              onSubmitOrder={handleAddNewOrderFromStorefront}
              onOpenAdmin={() => {
                if (isAdminLoggedIn) {
                  setCurrentView('admin-panel');
                } else {
                  setCurrentView('admin-login');
                }
              }}
            />
          </motion.div>
        )}

        {/* VIEW 2: Administrative Login */}
        {currentView === 'admin-login' && (
          <motion.div
            key="login-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Elegant contextual header to go back to store */}
            <div className="absolute top-6 left-6 z-20">
              <button
                onClick={() => setCurrentView('store')}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-[#e0c0b1] hover:text-white text-xs font-semibold rounded-xl tracking-wide transition-all cursor-pointer"
              >
                Voltar para a Loja
              </button>
            </div>
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        )}

        {/* VIEW 3: Administrative Workspace Console */}
        {currentView === 'admin-panel' && isAdminLoggedIn && (
          <motion.div
            key="panel-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPanel
              products={products}
              orders={orders}
              onUpdateProducts={handleUpdateProducts}
              onUpdateOrders={handleUpdateOrders}
              onLogout={handleLogout}
              onResetDatabase={handleResetDatabase}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
