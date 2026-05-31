/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Minus, Send, MapPin, User, Phone, CreditCard, Flame, Trash2, ArrowUpRight, ArrowRight, X, CheckCircle, Copy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Order, CartItemAddOn } from '../types';
import { formatCurrency, generateWhatsAppLink, formatAsMonospaceReceipt } from '../utils';
import { AVAILABLE_ADDONS } from '../data';

interface StorefrontProps {
  products: Product[];
  onSubmitOrder: (order: Order) => void;
  onOpenAdmin: () => void;
}

export default function Storefront({ products, onSubmitOrder, onOpenAdmin }: StorefrontProps) {
  const [activeCategory, setActiveCategory] = useState<'Todos' | 'Hamburgueres' | 'Porcoes'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customization modal states
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<CartItemAddOn[]>([]);
  const [customizingNotes, setCustomizingNotes] = useState('');
  const [customizingQuantity, setCustomizingQuantity] = useState(1);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Combine no WhatsApp');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const deliveryFee = useMemo(() => {
    if (!customerCity) return 6.00;
    return customerCity.trim().toLowerCase() === 'sapucaia' ? 0.00 : 6.00;
  }, [customerCity]);

  // Categories translation/filtering
  const categories = [
    { id: 'Todos', label: 'Todos' },
    { id: 'Hamburgueres', label: 'Hambúrgueres' },
    { id: 'Porcoes', label: 'Porções' },
  ];

  // Filters products by active category and search input (excluding 'Combos' entirely)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Hide Combos category items entirely "por enquanto"
      if (p.category === 'Combos') return false;

      const matchCategory =
        activeCategory === 'Todos' ||
        (activeCategory === 'Hamburgueres' && p.category === 'Hamburgueres') ||
        (activeCategory === 'Porcoes' && p.category === 'Porcoes');

      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Cart operations
  const handleStartCustomizing = (product: Product) => {
    setCustomizingProduct(product);
    setSelectedAddOns([]);
    setCustomizingNotes('');
    setCustomizingQuantity(1);
  };

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return;

    setCart((prevCart) => {
      // Sort and serialize selected addons to identify duplicates with matching additions and quantities
      const sortedNames = [...selectedAddOns].map(a => `${a.name}:${a.quantity || 1}`).sort().join(',');

      const existingIndex = prevCart.findIndex((item) => {
        const itemSorted = (item.addOns || []).map(a => `${a.name}:${a.quantity || 1}`).sort().join(',');
        return item.product.id === customizingProduct.id &&
               itemSorted === sortedNames &&
               (item.notes || '') === customizingNotes;
      });

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += customizingQuantity;
        return updated;
      }
      return [...prevCart, {
        product: customizingProduct,
        quantity: customizingQuantity,
        notes: customizingNotes,
        addOns: selectedAddOns
      }];
    });

    setCustomizingProduct(null);
  };

  const updateQuantityByIndex = (index: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item, idx) => {
          if (idx === index) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCartByIndex = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, idx) => idx !== index));
  };

  const updateNotesByIndex = (index: number, notes: string) => {
    setCart((prevCart) =>
      prevCart.map((item, idx) => (idx === index ? { ...item, notes } : item))
    );
  };

  // Helper to check product quantity in cart
  const countProductInCart = (productId: string) => {
    return cart
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const addOnsPrice = item.addOns?.reduce((sum, a) => sum + a.price * (a.quantity || 1), 0) || 0;
      return acc + (item.product.price + addOnsPrice) * item.quantity;
    }, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;
  }, [cartSubtotal, deliveryFee]);

  const handleCopyReceiptText = (order: Order) => {
    const formattedItems = order.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      addOns: item.addOns,
      notes: item.notes
    }));

    const monochromaticCoupon = formatAsMonospaceReceipt(
      order.customerName,
      order.customerPhone,
      order.customerAddress,
      formattedItems,
      order.subtotal,
      order.deliveryFee,
      order.total,
      order.notes
    );

    let text = `🚀 *PEDIDO COPIADO - PURO SABOR* 🚀\n\n`;
    text += `\`\`\`\n${monochromaticCoupon}\`\`\`\n`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Handle Order Submission
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Validate checkout details
    if (!customerName || !customerPhone || !customerAddress || !customerCity) {
      alert('Por favor, preencha todos os campos obrigatórios para entrega!');
      return;
    }

    const fullAddress = `${customerAddress} - ${customerCity.trim()}`;

    // Prepare internal order record
    const internalOrder: Order = {
      id: Math.floor(100000 + Math.random() * 90000).toString(), // random 6 digit ID
      customerName,
      customerPhone,
      customerAddress: fullAddress,
      paymentMethod,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price + (item.addOns?.reduce((sum, a) => sum + a.price * (a.quantity || 1), 0) || 0),
        quantity: item.quantity,
        notes: item.notes,
        addOns: item.addOns,
      })),
      subtotal: cartSubtotal,
      deliveryFee,
      total: cartTotal,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      notes: additionalNotes,
    };

    // Save order in local database so Dashboard instantly updates
    onSubmitOrder(internalOrder);
    setLastSubmittedOrder(internalOrder);

    // Create WhatsApp outbound API link with user-specified telephone: 553298589907
    const whatsAppLink = generateWhatsAppLink(
      '553298589907',
      customerName,
      customerPhone,
      fullAddress,
      paymentMethod,
      cart,
      deliveryFee,
      additionalNotes
    );

    // Trigger WhatsApp outbound redirect
    window.open(whatsAppLink, '_blank');

    // State cleanups
    setOrderCompleted(true);
    setCart([]);
    setAdditionalNotes('');
    setIsMobileCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#1c110c] text-[#f5ded5] font-sans pb-16 selection:bg-[#f97316]/30">
      {/* Upper Navigation */}
      <header className="sticky top-0 z-20 bg-[#1c110c]/90 backdrop-blur-md border-b border-white/5 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#dc2626] to-[#f97316] rounded-xl flex items-center justify-center shadow-lg shadow-[#f97316]/20">
              <Flame className="w-5.5 h-5.5 text-white animate-bounce" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                Puro <span className="text-[#f97316]">Sabor</span>
              </h1>
              <p className="text-[9px] text-[#e0c0b1] tracking-widest uppercase font-bold mt-1">
                Lanchonete & Restaurante
              </p>
            </div>
          </div>

          <button
            id="storefront-btn-admin-panel"
            onClick={onOpenAdmin}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold tracking-wide text-[#e0c0b1] hover:text-white transition-all cursor-pointer group"
          >
            <span>Painel Administrativo</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Featured Cover Hero */}
        <div id="promo-banner" className="relative h-60 sm:h-72 rounded-3xl overflow-hidden mb-10 shadow-2xl bg-gradient-to-r from-[#1c110c] via-[#291d17] to-[#120603] border border-white/5">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-25 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1c110c] via-[#1c110c]/80 to-transparent z-10" />

          <div className="relative z-15 flex flex-col justify-center h-full p-6 sm:p-12 max-w-xl">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-400 text-[#1c110c] text-[10px] font-extrabold uppercase tracking-widest rounded-lg shadow-md w-fit mb-4">
              <Flame className="w-3.5 h-3.5 fill-[#1c110c]" />
              <span>Menu Chapa Quente</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-sans leading-tight text-white mb-3">
              O Sabor Que <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-yellow-400">Incendeia!</span>
            </h2>
            <p className="text-sm text-[#e0c0b1] font-medium leading-relaxed mb-6">
              Peça agora os lanches mais robustos e saborosos. Customize com adicionais generosos e finalize tudo no WhatsApp.
            </p>
            <a
              href="#category-nav"
              className="px-6 py-3 w-fit rounded-xl bg-gradient-to-r from-[#dc2626] to-[#f97316] text-white hover:from-[#b91c1c] hover:to-[#ea580c] font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <span>Ver Cardápio Oficial</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories Chip Nav Bar and Search */}
        <div id="category-nav" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:scroll-smooth md:mx-0 md:px-0">
            {categories.map((c) => (
              <button
                key={c.id}
                id={`category-chip-${c.id}`}
                onClick={() => setActiveCategory(c.id as any)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/15'
                    : 'bg-white/5 border border-white/5 hover:border-white/10 text-[#e0c0b1] hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#a78b7d]" />
            <input
              id="storefront-input-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full bg-[#261a14]/60 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-[#f5ded5] placeholder-[#a78b7d]/60 focus:outline-none focus:border-[#f97316] transition-colors focus:ring-1 focus:ring-[#f97316]/50"
            />
          </div>
        </div>

        {/* 2-Column Responsive Body Layout */}
        <div id="store-grid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Menu Items */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center space-x-2">
              <span>Cardápio Ativo</span>
              <span className="text-[#a78b7d] text-xxs font-extrabold bg-white/5 px-2.5 py-1 rounded-md">
                {filteredProducts.length} itens {activeCategory !== 'Todos' && `em ${activeCategory}`}
              </span>
            </h3>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-[#261a14]/30 rounded-3xl border border-dashed border-white/5">
                <ShoppingBag className="w-12 h-12 text-[#a78b7d]/50 mx-auto mb-4" />
                <p className="text-[#e0c0b1] text-sm font-semibold">Nenhum lanche localizado com este filtro.</p>
                <p className="text-xs text-[#a78b7d] mt-1">Experimente buscar por outros termos ou categorias.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProducts.map((p) => {
                  const qtyInCart = countProductInCart(p.id);
                  return (
                    <motion.div
                      layout
                      key={p.id}
                      id={`product-card-${p.id}`}
                      className="group bg-[#261a14] border border-white/5 rounded-3xl overflow-hidden shadow-xl transition-all hover:scale-[1.01] hover:border-[#f97316]/20 hover:shadow-[#f97316]/5"
                    >
                      <div className="relative h-44 overflow-hidden bg-black/40">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {p.popular && (
                          <span className="absolute top-3 right-3 inline-flex items-center space-x-1 px-2.5 py-1 bg-yellow-400 text-[#1c110c] text-[9px] font-extrabold uppercase tracking-wider rounded shadow">
                            <Flame className="w-3 h-3 fill-[#1c110c]" />
                            <span>Popular</span>
                          </span>
                        )}
                        {p.chefPick && (
                          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 bg-[#f97316] text-white text-[9px] font-extrabold uppercase tracking-wider rounded shadow">
                            <span>RECOMENDADO</span>
                          </span>
                        )}

                        <span className="absolute bottom-3 right-4 bg-gradient-to-r from-[#dc2626] to-[#f97316] text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-lg font-sans">
                          {formatCurrency(p.price)}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col justify-between min-h-[170px]">
                        <div>
                          <h4 className="text-base font-extrabold text-white font-sans group-hover:text-[#f97316] transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-xs text-[#a78b7d] mt-1.5 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
                          {qtyInCart > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/10">
                              ✓ no carrinho ({qtyInCart})
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#a78b7d] font-semibold tracking-wider uppercase">
                              Disponível para entrega
                            </span>
                          )}

                          <button
                            onClick={() => handleStartCustomizing(p)}
                            className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#f97316] hover:from-[#b91c1c] hover:to-[#ea580c] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-[#dc2626]/10"
                            title="Personalizar e adicionar"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Order Cart Summary Panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">

            <div id="cart-container" className="bg-[#261a14] border border-white/5 rounded-3xl shadow-2xl p-6 overflow-hidden">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider mb-5 flex items-center justify-between border-b border-white/5 pb-4">
                <span className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-[#f97316]" />
                  <span>Seu Pedido</span>
                </span>
                <span className="text-[#a78b7d] text-xs font-bold bg-[#1c110c] px-2.5 py-1 rounded-lg">
                  {cart.length} itens
                </span>
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="w-10 h-10 text-[#a78b7d]/30 mx-auto mb-3" />
                  <p className="text-xs text-[#e0c0b1] font-semibold">Seu carrinho está vazio.</p>
                  <p className="text-xxs text-[#a78b7d] mt-1 leading-relaxed max-w-[200px] mx-auto">
                    Adicione hambúrgueres e bebidas do cardápio ao lado!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-56 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
                    <AnimatePresence>
                      {cart.map((item, index) => {
                        const addOnsPrice = item.addOns?.reduce((sum, a) => sum + a.price * (a.quantity || 1), 0) || 0;
                        const itemUnitPrice = item.product.price + addOnsPrice;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col space-y-1.5 pb-3 border-b border-white/5"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="text-xs font-bold text-white">{item.product.name}</h5>
                                {item.addOns && item.addOns.length > 0 && (
                                  <p className="text-[10px] text-[#f97316] leading-none mt-1">
                                    + {item.addOns.map(a => `${a.quantity && a.quantity > 1 ? `${a.quantity}x ` : ''}${a.name}`).join(', ')}
                                  </p>
                                )}
                                <span className="text-[10px] text-[#a78b7d] font-bold block mt-1">
                                  {formatCurrency(itemUnitPrice)} x {item.quantity}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-extrabold text-white">
                                  {formatCurrency(itemUnitPrice * item.quantity)}
                                </span>
                                <button
                                  onClick={() => removeFromCartByIndex(index)}
                                  className="text-[#a78b7d] hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="Observações (ex: sem cebola)"
                                value={item.notes || ''}
                                onChange={(e) => updateNotesByIndex(index, e.target.value)}
                                className="w-full bg-[#1c110c] border border-white/5 rounded-lg py-1 px-2.5 text-xxs text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316]"
                              />
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => updateQuantityByIndex(index, -1)}
                                  className="text-[#a78b7d] hover:text-white bg-white/5 rounded p-0.5 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xxs font-extrabold text-white w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantityByIndex(index, 1)}
                                  className="text-[#a78b7d] hover:text-white bg-white/5 rounded p-0.5 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2 select-none">
                    <div className="flex justify-between text-xs font-medium text-[#e0c0b1]">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-[#e0c0b1]">
                      <span>Taxa de Entrega</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/5">
                      <span>Total</span>
                      <span className="text-[#f97316]">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleCheckout} className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-[#f97316]" />
                      <span>Dados para Entrega</span>
                    </h4>

                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                          Nome Completo *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a78b7d]" />
                          <input
                            type="text"
                            required
                            placeholder="Seu nome"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                          WhatsApp *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a78b7d]" />
                          <input
                            type="tel"
                            required
                            placeholder="(32) 99999-9999"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                          Endereço de Entrega *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#a78b7d]" />
                          <textarea
                            required
                            rows={2}
                            placeholder="Rua, Número, Bairro"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 sm:py-2 px-3 pl-9 text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316] resize-none whitespace-pre-wrap"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                          Cidade * (Sem taxa para Sapucaia, taxa de R$ 6,00 para outras cidades)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a78b7d]" />
                          <input
                            type="text"
                            required
                            placeholder="Ex: Sapucaia"
                            value={customerCity}
                            onChange={(e) => setCustomerCity(e.target.value)}
                            className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                          Observações Gerais para a Entrega
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Troco para R$50, Portão vermelho."
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 px-3 text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316] resize-none"
                        />
                      </div>
                    </div>

                    <button
                      id="storefront-btn-submit-order"
                      type="submit"
                      className="w-full bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-extrabold tracking-widest uppercase text-xs py-4 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer mt-4"
                    >
                      <ShoppingBag className="w-4.5 h-4.5" />
                      <span>Finalizar via WhatsApp</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Floating Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-40 lg:hidden"
          >
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-gradient-to-r from-[#dc2626] to-[#f97316] text-white flex items-center justify-between px-6 py-4 rounded-2xl shadow-xl shadow-black/40 font-bold"
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-5 h-5 animate-pulse" />
                <span className="text-sm">Ver carrinho ({cart.length})</span>
              </div>
              <span className="text-sm bg-black/25 px-3.5 py-1 rounded-xl">
                {formatCurrency(cartTotal)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Modal / Bottom Drawer for Mobile screens */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#261a14] rounded-t-3xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h4 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-[#f97316]" />
                  <span>Seu Pedido ({cart.length})</span>
                </h4>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="text-[#a78b7d] hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  {cart.map((item, index) => {
                    const addOnsPrice = item.addOns?.reduce((sum, a) => sum + a.price * (a.quantity || 1), 0) || 0;
                    const itemUnitPrice = item.product.price + addOnsPrice;
                    return (
                      <div key={index} className="flex flex-col space-y-1.5 pb-3 border-b border-white/5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-xs font-bold text-white">{item.product.name}</h5>
                            {item.addOns && item.addOns.length > 0 && (
                              <p className="text-[10px] text-[#f97316] leading-none mt-1">
                                + {item.addOns.map(a => `${a.quantity && a.quantity > 1 ? `${a.quantity}x ` : ''}${a.name}`).join(', ')}
                              </p>
                            )}
                            <span className="text-[10px] text-[#a78b7d] font-bold block mt-1">
                              {formatCurrency(itemUnitPrice)} x {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold text-white">
                              {formatCurrency(itemUnitPrice * item.quantity)}
                            </span>
                            <button
                              onClick={() => removeFromCartByIndex(index)}
                              className="text-[#a78b7d] hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Observações (ex: sem cebola)"
                            value={item.notes || ''}
                            onChange={(e) => updateNotesByIndex(index, e.target.value)}
                            className="w-full bg-[#1c110c] border border-white/5 rounded-lg py-1 px-2.5 text-xxs text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                          />
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => updateQuantityByIndex(index, -1)}
                              className="bg-white/5 rounded p-0.5 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xxs font-extrabold text-[#f5ded5] w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantityByIndex(index, 1)}
                              className="bg-white/5 rounded p-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 py-3 border-b border-white/5">
                  <div className="flex justify-between text-xs text-[#e0c0b1]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#e0c0b1]">
                    <span>Taxa de Entrega</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2">
                    <span>Total</span>
                    <span className="text-[#f97316]">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#f97316]" />
                    <span>Dados de Entrega</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-xxs text-[#e0c0b1] font-semibold uppercase tracking-wider block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Seu nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                      />
                    </div>
                    <div>
                      <label className="text-xxs text-[#e0c0b1] font-semibold uppercase tracking-wider block mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="Seu Whatsapp"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                      />
                    </div>
                    <div>
                      <label className="text-xxs text-[#e0c0b1] font-semibold uppercase tracking-wider block mb-1">Endereço de Entrega</label>
                      <textarea
                        rows={2}
                        placeholder="Rua, Número, Bairro"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xxs text-[#e0c0b1] font-semibold uppercase tracking-wider block mb-1">Cidade</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Sapucaia"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-[#dc2626] to-[#f97316] text-white font-extrabold tracking-widest uppercase text-xs py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    <span>Finalizar via WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADDONS / DECORATE Hamburger Customization Modal */}
      <AnimatePresence>
        {customizingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setCustomizingProduct(null)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-lg bg-[#261a14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                    <img
                      src={customizingProduct.image}
                      alt={customizingProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{customizingProduct.name}</h3>
                    <p className="text-xxs text-[#a78b7d] leading-relaxed mt-0.5 line-clamp-2">
                      {customizingProduct.description}
                    </p>
                    <span className="inline-block mt-1 text-xs font-black text-[#f97316]">
                      {formatCurrency(customizingProduct.price)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCustomizingProduct(null)}
                  className="p-1.5 text-[#a78b7d] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
                {customizingProduct.category === 'Hamburgueres' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Turbine seu Lanche (Opcionais)
                      </h4>
                      <span className="text-[10px] text-[#f97316] font-extrabold bg-[#f97316]/10 px-2.5 py-0.5 rounded">
                        Acréscimos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {AVAILABLE_ADDONS.map((addOn) => {
                        const selectedAddOn = selectedAddOns.find(a => a.name === addOn.name);
                        const isSelected = !!selectedAddOn;
                        const currentQty = selectedAddOn?.quantity || 0;
                        return (
                          <div
                            key={addOn.name}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-[#f97316]/15 border-[#f97316] text-[#f97316]'
                                : 'bg-[#1c110c]/40 border-white/5 text-[#e0c0b1] hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedAddOns(selectedAddOns.filter(a => a.name !== addOn.name));
                                  } else {
                                    setSelectedAddOns([...selectedAddOns, { ...addOn, quantity: 1 }]);
                                  }
                                }}
                                className="accent-[#f97316] w-4 h-4 cursor-pointer rounded shrink-0"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate">{addOn.name}</span>
                                <span className="text-[10px] text-[#a78b7d] font-semibold">
                                  +{formatCurrency(addOn.price)}
                                </span>
                              </div>
                            </div>
                            {isSelected ? (
                              <div className="flex items-center space-x-1.5 bg-[#1c110c]/80 border border-[#f97316]/30 px-1.5 py-1 rounded-lg shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentQty <= 1) {
                                      setSelectedAddOns(selectedAddOns.filter(a => a.name !== addOn.name));
                                    } else {
                                      setSelectedAddOns(
                                        selectedAddOns.map(a =>
                                          a.name === addOn.name ? { ...a, quantity: currentQty - 1 } : a
                                        )
                                      );
                                    }
                                  }}
                                  className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-[#f97316] flex items-center justify-center font-black transition-colors text-xs cursor-pointer select-none"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black text-white px-0.5 min-w-[12px] text-center select-none">
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAddOns(
                                      selectedAddOns.map(a =>
                                        a.name === addOn.name ? { ...a, quantity: currentQty + 1 } : a
                                      )
                                    );
                                  }}
                                  className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-[#f97316] flex items-center justify-center font-black transition-colors text-xs cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedAddOns([...selectedAddOns, { ...addOn, quantity: 1 }])}
                                className="text-xxs font-extrabold uppercase tracking-wider text-[#f97316] bg-[#f97316]/10 px-2.5 py-1.5 rounded-lg hover:bg-[#f97316]/20 transition-all cursor-pointer"
                              >
                                Adicionar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xxs text-[#a78b7d] font-semibold uppercase tracking-wider bg-white/2 rounded-xl">
                    Este item não possui adicionais disponíveis
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    Observações Específicas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: sem cebola, ponto da carne bem passado, etc."
                    value={customizingNotes}
                    onChange={(e) => setCustomizingNotes(e.target.value)}
                    className="w-full bg-[#1c110c] border border-white/10 rounded-xl p-3 text-xs text-[#f5ded5] placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-black text-white uppercase tracking-wider">Quantidade</span>
                  <div className="flex items-center space-x-4 bg-[#1c110c] p-1.5 rounded-xl border border-white/5 select-none font-sans">
                    <button
                      onClick={() => setCustomizingQuantity(Math.max(1, customizingQuantity - 1))}
                      className="text-[#a78b7d] hover:text-white bg-white/5 rounded-lg p-1.5 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-white w-8 text-center bg-transparent">
                      {customizingQuantity}
                    </span>
                    <button
                      onClick={() => setCustomizingQuantity(customizingQuantity + 1)}
                      className="text-[#a78b7d] hover:text-white bg-white/5 rounded-lg p-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-[#1c110c]/50">
                <button
                  onClick={handleConfirmCustomization}
                  className="w-full bg-[#ea580c] hover:bg-[#ea580c]/95 text-white font-extrabold tracking-widest uppercase text-xs py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Adicionar • {formatCurrency(
                      (customizingProduct.price + selectedAddOns.reduce((sum, a) => sum + a.price, 0)) * customizingQuantity
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Receipt Modal */}
      <AnimatePresence>
        {orderCompleted && lastSubmittedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => {
                setOrderCompleted(false);
                setLastSubmittedOrder(null);
              }}
            />

            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md bg-[#261a14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 font-sans flex flex-col my-8"
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => {
                    setOrderCompleted(false);
                    setLastSubmittedOrder(null);
                  }}
                  className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* iFood-Inspired Ticket container */}
              <div className="p-6 pb-2 text-center bg-[#dc2626] text-white relative">
                <div className="inline-flex p-3 bg-white/10 rounded-full mb-3 shadow-inner">
                  <Flame className="w-8 h-8 text-yellow-300 animate-pulse fill-yellow-300" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Puro Sabor</h3>
                <p className="text-xs text-red-100 font-bold uppercase tracking-widest mt-1">Pedido Enviado com Sucesso!</p>

                {/* Simulated wavy/tear edge on receipt element below */}
                <div className="absolute -bottom-3 left-0 right-0 overflow-hidden h-3 flex justify-around">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-white rounded-full -mt-2" />
                  ))}
                </div>
              </div>

              {/* Physical Receipt Ticket (White Roll Paper aesthetic) */}
              <div className="bg-white text-neutral-800 p-6 pt-8 space-y-5 shadow-inner">
                {/* Visual authenticity elements: Title & Address */}
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest">Cupom de Entrega</span>
                  <h4 className="text-sm font-black text-neutral-800 tracking-tight flex items-center justify-center space-x-1.5 uppercase">
                    <span>* COMPROVANTE DIGITAL *</span>
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {new Date(lastSubmittedOrder.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                {/* Recipient details */}
                <div className="border border-dashed border-neutral-300 rounded-2xl p-4 bg-neutral-50 space-y-2">
                  <div className="text-xxs text-neutral-400 font-extrabold uppercase tracking-wider">Dados do Destinatário</div>
                  <div className="space-y-1 text-xs">
                    <p className="text-neutral-800 font-bold flex items-center space-x-2">
                      <span className="text-neutral-400">👤</span>
                      <span>{lastSubmittedOrder.customerName}</span>
                    </p>
                    <p className="text-neutral-600 flex items-center space-x-2 font-medium">
                      <span className="text-neutral-400">📞</span>
                      <span>{lastSubmittedOrder.customerPhone}</span>
                    </p>
                    <p className="text-neutral-600 flex items-start space-x-2 leading-relaxed font-medium">
                      <span className="text-neutral-400 mt-0.5">📍</span>
                      <span>{lastSubmittedOrder.customerAddress}</span>
                    </p>
                  </div>
                </div>

                {/* Items detail list */}
                <div className="space-y-2.5">
                  <div className="text-xxs text-neutral-400 font-bold uppercase tracking-wider flex justify-between border-b-2 border-neutral-200 pb-1.5">
                    <span>Menu / Item</span>
                    <span className="text-right">Total</span>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {lastSubmittedOrder.items.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex justify-between font-bold text-neutral-800 leading-tight">
                          <span>{item.quantity}x {item.productName}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="pl-3 text-[10px] text-neutral-500 font-medium">
                            + {item.addOns.map(a => `${a.name} (${formatCurrency(a.price)})`).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="pl-3 text-[10px] text-neutral-500 italic mt-0.5">
                            Obs: "{item.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {lastSubmittedOrder.notes && (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-xs text-amber-800">
                      <p className="font-bold uppercase text-[9px] tracking-wider mb-1">Observações Gerais</p>
                      <p className="italic">"{lastSubmittedOrder.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Dotted Tear Stripe */}
                <div className="border-t-2 border-dashed border-neutral-300 pt-4 space-y-1.5 select-none text-xs">
                  <div className="flex justify-between text-neutral-600 font-medium">
                    <span>Subtotal</span>
                    <span>{formatCurrency(lastSubmittedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 font-medium items-center">
                    <span>Taxa de Entrega</span>
                    {lastSubmittedOrder.deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase">Grátis (Sapucaia)</span>
                    ) : (
                      <span>{formatCurrency(lastSubmittedOrder.deliveryFee)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-black text-neutral-900 pt-3 border-t border-neutral-100">
                    <span className="text-red-600 font-bold">VALOR TOTAL</span>
                    <span className="text-red-600 font-extrabold">{formatCurrency(lastSubmittedOrder.total)}</span>
                  </div>
                </div>

                {/* Barcode graphic simulation for high delivery app aesthetic */}
                <div className="pt-2 text-center flex flex-col items-center">
                  <div className="flex justify-center items-center space-x-0.5 opacity-60">
                    <div className="w-[1px] h-6 bg-neutral-900" />
                    <div className="w-[3px] h-6 bg-neutral-900" />
                    <div className="w-[1px] h-6 bg-neutral-900" />
                    <div className="w-[2px] h-6 bg-neutral-900" />
                    <div className="w-[1px] h-6 bg-neutral-900" />
                    <div className="w-[4px] h-6 bg-neutral-900" />
                    <div className="w-[1px] h-6 bg-neutral-900" />
                    <div className="w-[2px] h-6 bg-neutral-900" />
                    <div className="w-[3px] h-6 bg-neutral-900" />
                    <div className="w-[1px] h-6 bg-neutral-900" />
                  </div>
                  <span className="text-[8px] text-neutral-400 font-mono tracking-widest mt-1">
                    CUPOM-PEDIDO-{lastSubmittedOrder.id}
                  </span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-6 bg-[#1f140f] border-t border-white/5 space-y-3">
                <button
                  onClick={() => {
                    const whatsAppLink = generateWhatsAppLink(
                      '553298589907',
                      lastSubmittedOrder.customerName,
                      lastSubmittedOrder.customerPhone,
                      lastSubmittedOrder.customerAddress,
                      lastSubmittedOrder.paymentMethod,
                      lastSubmittedOrder.items.map(item => {
                        const basePrice = item.price - (item.addOns?.reduce((sum, a) => sum + a.price * (a.quantity || 1), 0) || 0);
                        return {
                          product: { id: item.productId, name: item.productName, description: '', price: basePrice, image: '', category: 'Hamburgueres' },
                          quantity: item.quantity,
                          notes: item.notes,
                          addOns: item.addOns
                        };
                      }),
                      lastSubmittedOrder.deliveryFee,
                      lastSubmittedOrder.notes
                    );
                    window.open(whatsAppLink, '_blank');
                  }}
                  className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-extrabold tracking-widest uppercase text-xs py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  <Send className="w-4 h-4 fill-white animate-pulse" />
                  <span>Reenviar no WhatsApp</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCopyReceiptText(lastSubmittedOrder)}
                    className="py-2.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-xl text-[#e0c0b1] hover:text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setOrderCompleted(false);
                      setLastSubmittedOrder(null);
                    }}
                    className="py-2.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-xl text-[#e0c0b1] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                  >
                    <span>Novo Pedido</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
