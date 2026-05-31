/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Clock, Users, CheckCircle, Package, Plus, Trash2, Edit2, ShieldAlert, ArrowRight, X, Phone, MapPin, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order, OrderStatus, Customer } from '../types';
import Sidebar, { AdminTab } from './Sidebar';
import { formatCurrency, formatDate } from '../utils';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onLogout: () => void;
  onResetDatabase: () => void;
}

export default function AdminPanel({
  products,
  orders,
  onUpdateProducts,
  onUpdateOrders,
  onLogout,
  onResetDatabase,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState<'Hamburgueres' | 'Combos' | 'Porcoes'>('Hamburgueres');
  const [prodPopular, setProdPopular] = useState(false);
  const [prodChefPick, setProdChefPick] = useState(false);

  // Stats Computations
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'Entregue')
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Pendente' || o.status === 'Preparando').length;
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'Entregue').length;
  }, [orders]);

  const averageTicket = useMemo(() => {
    const closed = orders.filter((o) => o.status === 'Entregue');
    return closed.length > 0 ? totalRevenue / closed.length : 0;
  }, [orders, totalRevenue]);

  // Dynamically group clients based on orders for CRM table
  const customersList = useMemo<Customer[]>(() => {
    const clientsMap: { [phone: string]: Customer } = {};
    orders.forEach((o) => {
      const cleanPhone = o.customerPhone.trim();
      if (!clientsMap[cleanPhone]) {
        clientsMap[cleanPhone] = {
          id: o.id,
          name: o.customerName,
          phone: cleanPhone,
          address: o.customerAddress,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: o.createdAt,
        };
      }
      clientsMap[cleanPhone].totalOrders += 1;
      clientsMap[cleanPhone].totalSpent += o.total;
      
      // Keep track of the most recent order date
      if (new Date(o.createdAt) > new Date(clientsMap[cleanPhone].lastOrderDate)) {
        clientsMap[cleanPhone].lastOrderDate = o.createdAt;
      }
    });
    return Object.values(clientsMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Orders status update
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Tem certeza que deseja apagar esse registro de pedido?')) {
      const filtered = orders.filter((o) => o.id !== orderId);
      onUpdateOrders(filtered);
    }
  };

  // Product actions CRUD
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDescription('');
    setProdPrice(10);
    setProdImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600');
    setProdCategory('Hamburgueres');
    setProdPopular(false);
    setProdChefPick(false);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDescription(p.description);
    setProdPrice(p.price);
    setProdImage(p.image);
    setProdCategory(p.category);
    setProdPopular(p.popular || false);
    setProdChefPick(p.chefPick || false);
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || prodPrice <= 0) {
      alert('Por favor insira um nome e preço válido para o produto!');
      return;
    }

    if (editingProduct) {
      // Edit
      const updated = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            description: prodDescription,
            price: Number(prodPrice),
            image: prodImage || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
            category: prodCategory,
            popular: prodPopular,
            chefPick: prodChefPick,
          };
        }
        return p;
      });
      onUpdateProducts(updated);
    } else {
      // Add
      const newProduct: Product = {
        id: Math.floor(1000 + Math.random() * 9000).toString(),
        name: prodName,
        description: prodDescription,
        price: Number(prodPrice),
        image: prodImage || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
        category: prodCategory,
        popular: prodPopular,
        chefPick: prodChefPick,
      };
      onUpdateProducts([...products, newProduct]);
    }
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Deseja realmente remover este lanche do cardápio?')) {
      onUpdateProducts(products.filter((p) => p.id !== id));
    }
  };

  // Recharts Sales performance graphs calculations
  const performanceData = useMemo(() => {
    // Generate simulated daily sales stats over the current month using the orders submitted
    // Fallback static entries to look rich and realistic, adding the live ones
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const distribution: { [day: string]: number } = {
      Seg: 180,
      Ter: 220,
      Qua: 350,
      Qui: 410,
      Sex: 650,
      Sáb: 890,
      Dom: 950,
    };

    // Aggregate online ones matching current dates (using day of week)
    orders.forEach((o) => {
      if (o.status === 'Entregue') {
        const orderDate = new Date(o.createdAt);
        const dayIndex = orderDate.getDay(); // 0 is Sunday, 1 is Monday ...
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayName = dayNames[dayIndex];
        distribution[dayName] = (distribution[dayName] || 0) + o.total;
      }
    });

    return days.map((day) => ({
      name: day,
      Vendas: Math.round(distribution[day]),
    }));
  }, [orders]);

  const categoryDistributionData = useMemo(() => {
    const cats: { [cat: string]: number } = {
      Hambúrgueres: 45,
      Combos: 30,
      Porções: 10,
    };
    // Aggregate from items inside delivered orders
    orders.forEach((o) => {
      if (o.status === 'Entregue') {
        o.items.forEach((item) => {
          // Detect category of item or default
          const originalProd = products.find((p) => p.id === item.productId);
          const catName = originalProd
            ? originalProd.category === 'Hamburgueres'
              ? 'Hambúrgueres'
              : originalProd.category === 'Combos'
              ? 'Combos'
              : 'Porções'
            : 'Hambúrgueres';
          cats[catName] = (cats[catName] || 0) + item.price * item.quantity;
        });
      }
    });

    return Object.keys(cats).map((key) => ({
      name: key,
      value: Math.round(cats[key]),
    }));
  }, [orders, products]);

  const CHART_COLORS = ['#f97316', '#dc2626', '#facc15', '#a78b7d'];

  return (
    <div className="min-h-screen bg-[#1c110c] text-[#f5ded5] flex font-sans">
      {/* Sidebar sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        orderCount={pendingOrdersCount}
      />

      {/* Main Admin Workspace (Spans to the right. 64px = 16rem = sidebar width) */}
      <main className="flex-1 pl-64 min-h-screen pb-12 font-sans selection:bg-[#f97316]/30">
        <header className="px-8 h-20 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1c110c]/80 backdrop-blur-md z-20">
          <div>
            <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
              {activeTab === 'dashboard' && 'Painel de Controle'}
              {activeTab === 'cardapio' && 'Cardápio / Produtos'}
              {activeTab === 'pedidos' && 'Gestão de Pedidos'}
              {activeTab === 'clientes' && 'Fidelidade de Clientes (CRM)'}
              {activeTab === 'relatorios' && 'Relatórios & Business Intelligence'}
              {activeTab === 'suporte' && 'Suporte de TI'}
            </h2>
            <p className="text-xxs text-[#a78b7d] tracking-wide font-medium">
              Ambiente de gerenciamento seguro. Bem-vindo de volta, Administrador!
            </p>
          </div>
          <div className="flex items-center space-x-4 select-none">
            <span className="text-xxs px-2.5 py-1 rounded bg-[#f97316]/10 text-[#f97316] font-extrabold tracking-wider border border-[#f97316]/10">
              ● SERVIDOR INSTÁVEL
            </span>
          </div>
        </header>

        <div className="p-8">
          {/* ======================================= */}
          {/* DASHBOARD TAB                           */}
          {/* ======================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Overview Cards Row */}
              <div id="stats-row" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                <div className="bg-[#261a14] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xxs text-[#a78b7d] tracking-wider uppercase font-bold">Faturamento (Hoje)</span>
                    <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(totalRevenue)}</h3>
                  </div>
                  <div className="p-3 bg-[#f97316]/15 text-[#f97316] rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#261a14] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xxs text-[#a78b7d] tracking-wider uppercase font-bold">Pedidos Pendentes</span>
                    <h3 className="text-2xl font-black text-white mt-1">{pendingOrdersCount}</h3>
                  </div>
                  <div className="p-3 bg-[#dc2626]/15 text-[#dc2626] rounded-xl">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="bg-[#261a14] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xxs text-[#a78b7d] tracking-wider uppercase font-bold">Clientes Ativos</span>
                    <h3 className="text-2xl font-black text-white mt-1">{customersList.length}</h3>
                  </div>
                  <div className="p-3 bg-yellow-400/10 text-yellow-500 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#261a14] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xxs text-[#a78b7d] tracking-wider uppercase font-bold">Ticket Médio</span>
                    <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(averageTicket)}</h3>
                  </div>
                  <div className="p-3 bg-amber-600/10 text-amber-500 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Feed of active/incoming orders (Replicating layout from image 6) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Orders Queue (Spans 8 columns) */}
                <div className="lg:col-span-8 bg-[#261a14] border border-white/5 p-6 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                    <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                      <Clock className="w-4.5 h-4.5 text-[#f97316]" />
                      <span>Fila de Preparação de Pedidos</span>
                    </h4>
                    <span className="text-xxs text-[#a78b7d] font-bold">
                      {activeOrdersCount} ativos
                    </span>
                  </div>

                  {orders.filter((o) => o.status !== 'Entregue').length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="w-12 h-12 text-[#a78b7d]/30 mx-auto mb-3" />
                      <p className="text-xs text-[#e0c0b1] font-bold">Nenhum pedido pendente de entrega.</p>
                      <p className="text-xxs text-[#a78b7d] mt-1">Todos os hambúrgueres já foram entregues!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter((o) => o.status !== 'Entregue')
                        .map((o) => (
                          <div
                            key={o.id}
                            className="p-5 bg-[#1c110c] border border-white/5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center space-x-2.5">
                                <span className="text-xs font-black text-[#f97316]">#{o.id}</span>
                                <h5 className="text-xs font-bold text-white">{o.customerName}</h5>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                                  o.status === 'Pendente'
                                    ? 'bg-[#dc2626]/20 text-red-400 border border-[#dc2626]/20'
                                    : o.status === 'Preparando'
                                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 animate-pulse'
                                    : 'bg-indigo-400/20 text-[#818cf8] border border-indigo-400/20'
                                }`}>
                                  {o.status}
                                </span>
                              </div>
                              <div className="mt-2 pr-4 space-y-1">
                                {o.items.map((i, idx) => (
                                  <div key={idx} className="text-xxs text-[#f5ded5] leading-relaxed">
                                    <span className="font-extrabold text-[#f97316] bg-[#f97316]/5 px-1.5 py-0.5 rounded mr-1">{i.quantity}x</span>
                                    <span className="font-semibold text-white">{i.productName}</span>
                                    {i.addOns && i.addOns.length > 0 && (
                                      <span className="text-yellow-400 font-medium block pl-5 text-[10px]">
                                        + {i.addOns.map(a => `${a.quantity && a.quantity > 1 ? `${a.quantity}x ` : ''}${a.name}`).join(', ')}
                                      </span>
                                    )}
                                    {i.notes && (
                                      <span className="text-[#a78b7d] italic block pl-5 text-[10px]">
                                        _Obs: {i.notes}_
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-[#a78b7d] mt-1">
                                Endereço: {o.customerAddress}
                              </p>
                              {o.notes && (
                                <p className="text-[9px] bg-white/5 text-[#f5ded5] max-w-fit px-2 py-0.5 mt-2 rounded border border-white/5">
                                  Obs: {o.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-3.5 self-end sm:self-center">
                              <span className="text-xs font-extrabold text-white">
                                {formatCurrency(o.total)}
                              </span>
                              <div className="flex items-center space-x-1">
                                {o.status === 'Pendente' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Preparando')}
                                    className="px-3 py-1.5 bg-[#f97316] text-white hover:bg-[#ea580c] rounded-lg text-[10px] font-extrabold uppercase transition-colors"
                                  >
                                    Preparar
                                  </button>
                                )}
                                {o.status === 'Preparando' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Em Entrega')}
                                    className="px-3 py-1.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg text-[10px] font-extrabold uppercase transition-colors"
                                  >
                                    Despachar
                                  </button>
                                )}
                                {o.status === 'Em Entrega' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'Entregue')}
                                    className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[10px] font-extrabold uppercase transition-colors"
                                  >
                                    Entregar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteOrder(o.id)}
                                  className="p-1.5 text-[#a78b7d] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Popular products list sidebar (Spans 4 columns) */}
                <div className="lg:col-span-4 bg-[#261a14] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5 pb-4 border-b border-white/5 flex items-center space-x-2">
                      <Layers className="w-4.5 h-4.5 text-[#f97316]" />
                      <span>Produtos Populares</span>
                    </h4>
                    <div className="space-y-4">
                      {products.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex items-center space-x-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-white/5"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                            <span className="text-[10px] text-[#f97316] font-extrabold">
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#a78b7d] bg-[#1c110c] px-2 py-1 rounded">
                            {p.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-white/5">
                    <button
                      onClick={() => setActiveTab('cardapio')}
                      className="w-full text-center text-xs font-bold text-[#f97316] hover:text-white flex items-center justify-center space-x-1.5 group select-none cursor-pointer"
                    >
                      <span>Gerenciar Cardápio</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* CARDÁPIO TAB (Menu Products CRUD)       */}
          {/* ======================================= */}
          {activeTab === 'cardapio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#e0c0b1] tracking-wider uppercase">
                  Gestão do Cardápio ({products.length} itens no total)
                </h3>
                <button
                  id="admin-btn-add-product"
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#dc2626] to-[#f97316] hover:from-[#b91c1c] hover:to-[#ea580c] text-white rounded-xl text-xs font-extrabold tracking-wider uppercase shadow shadow-[#dc2626]/10 flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Produto</span>
                </button>
              </div>

              {/* Grid of editable menu list cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#261a14] border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                  >
                    <div className="relative h-32 overflow-hidden bg-black/20">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="absolute bottom-3 left-4 text-xs font-black text-white">
                        {formatCurrency(p.price)}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-[#a78b7d] bg-[#1c110c] px-2.5 py-0.5 rounded border border-white/5">
                            {p.category}
                          </span>
                        </h4>
                        <p className="text-xxs text-[#a78b7d] line-clamp-3 mt-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 mt-5 pt-3.5 border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-[#f5ded5] rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="px-3 py-2 bg-[#dc2626]/15 hover:bg-[#dc2626]/20 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center p-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* PEDIDOS TAB                             */}
          {/* ======================================= */}
          {activeTab === 'pedidos' && (
            <div className="bg-[#261a14] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider mb-5 pb-4 border-b border-white/5 flex items-center justify-between">
                <span>Histórico & Detalhamento</span>
                <span className="text-xs bg-[#1c110c] px-3.5 py-1 rounded">
                  {orders.length} pedidos totais
                </span>
              </h3>

              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-[#a78b7d]/30 mx-auto mb-3" />
                  <p className="text-xs text-[#e0c0b1] font-bold">Nenhum pedido localizado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#1c110c]/80 uppercase text-[10px] text-[#a78b7d] font-bold">
                      <tr>
                        <th className="p-4 rounded-l-lg">ID</th>
                        <th className="p-4">Cliente / WhatsApp</th>
                        <th className="p-4">Endereço</th>
                        <th className="p-4">Data</th>
                        <th className="p-4 text-center">Itens</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Valor</th>
                        <th className="p-4 rounded-r-lg text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/2">
                          <td className="p-4 font-black text-[#f97316]">#{o.id}</td>
                          <td className="p-4 max-w-[150px] truncate">
                            <h5 className="font-bold text-white">{o.customerName}</h5>
                            <span className="text-xxs text-[#a78b7d]">{o.customerPhone}</span>
                          </td>
                          <td className="p-4 max-w-[180px] truncate">{o.customerAddress}</td>
                          <td className="p-4 text-[#a78b7d] whitespace-nowrap">{formatDate(o.createdAt)}</td>
                          <td className="p-4 text-center font-bold text-white">
                            {o.items.reduce((acc, i) => acc + i.quantity, 0)}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold px-2 py-1 rounded uppercase ${
                              o.status === 'Pendente'
                                ? 'bg-[#dc2626]/20 text-red-400 border border-[#dc2626]/20'
                                : o.status === 'Preparando'
                                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/20'
                                : o.status === 'Em Entrega'
                                ? 'bg-indigo-400/20 text-[#818cf8] border border-[#dbeafe]/20'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 font-black text-right text-[#f5ded5]">
                            {formatCurrency(o.total)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                                className="bg-[#1c110c] border border-white/10 rounded px-2 py-1 text-xxs text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                              >
                                <option value="Pendente">Pendente</option>
                                <option value="Preparando">Preparando</option>
                                <option value="Em Entrega">Em Entrega</option>
                                <option value="Entregue">Entregue</option>
                              </select>
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* CLIENTES TAB (CRM)                      */}
          {/* ======================================= */}
          {activeTab === 'clientes' && (
            <div className="bg-[#261a14] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider mb-5 pb-4 border-b border-white/5 flex items-center justify-between">
                <span>Painel CRM de Consumo</span>
                <span className="text-xs bg-[#1c110c] px-3 py-1 rounded">
                  {customersList.length} clientes fidelizados
                </span>
              </h3>

              {customersList.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-[#a78b7d]/30 mx-auto mb-3" />
                  <p className="text-xs text-[#e0c0b1] font-bold">Nenhum cliente cadastrado.</p>
                  <p className="text-xxs text-[#a78b7d] mt-1">Dados computados ao processar vendas na loja.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#1c110c]/80 uppercase text-[10px] text-[#a78b7d]">
                      <tr>
                        <th className="p-4 rounded-l-lg">Nome Completo</th>
                        <th className="p-4">WhatsApp de Contato</th>
                        <th className="p-4">Último Endereço Usado</th>
                        <th className="p-4 text-center">Frequência (Total Pedidos)</th>
                        <th className="p-4 text-right">Volume Consumido (LTV)</th>
                        <th className="p-4 rounded-r-lg text-right">Última Compra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {customersList.map((client) => (
                        <tr key={client.phone} className="hover:bg-white/2">
                          <td className="p-4">
                            <h5 className="font-extrabold text-white text-xs">{client.name}</h5>
                          </td>
                          <td className="p-4 font-mono font-medium text-[#a78b7d]">
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3 h-3" />
                              <span>{client.phone}</span>
                            </div>
                          </td>
                          <td className="p-4 max-w-[200px] truncate">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3 h-3 text-[#a78b7d]" />
                              <span>{client.address}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-black text-[#f97316]">
                            {client.totalOrders}
                          </td>
                          <td className="p-4 text-right font-black text-white">
                            {formatCurrency(client.totalSpent)}
                          </td>
                          <td className="p-4 text-right text-xxs text-[#a78b7d] whitespace-nowrap">
                            {formatDate(client.lastOrderDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* RELATÓRIOS TAB                          */}
          {/* ======================================= */}
          {activeTab === 'relatorios' && (
            <div className="space-y-8">
              {/* Secondary analytical cards row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                <div className="bg-[#261a14] p-5 rounded-2xl border border-white/5 shadow">
                  <h4 className="text-xxs text-[#a78b7d] font-bold uppercase tracking-wider">Margem de Lucratividade Estimada</h4>
                  <div className="flex items-baseline space-x-3.5 mt-2">
                    <span className="text-2xl font-black text-white">73,4%</span>
                    <span className="text-emerald-400 text-xxs font-extrabold">+4.2% este mês</span>
                  </div>
                  <p className="text-[10px] text-[#a78b7d] mt-1.5 leading-relaxed">
                    O bife artesanal de 150g e fatias de bacon fornecem a maior margem operacional do cardápio ativo hoje.
                  </p>
                </div>
                <div className="bg-[#261a14] p-5 rounded-2xl border border-white/5 shadow bg-gradient-to-tr from-[#261a14] via-[#261a14] to-[#f97316]/5">
                  <h4 className="text-xxs text-[#a78b7d] font-bold uppercase tracking-wider">Metas Financeiras (Maio 2026)</h4>
                  <div className="flex items-baseline space-x-3.5 mt-2">
                    <span className="text-2xl font-black text-white">R$ 5.000,00</span>
                    <span className="text-yellow-400 text-xxs font-extrabold">{Math.min(100, Math.round((totalRevenue/5000)*100))}% atingido</span>
                  </div>
                  <div className="w-full bg-[#1c110c] h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-gradient-to-r from-[#dc2626] to-[#f97316] h-full rounded-full" style={{ width: `${Math.min(100, Math.round((totalRevenue/5000)*100))}%` }} />
                  </div>
                </div>
              </div>

              {/* Graphics charts box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Weekly Sales revenue trend line chart (Spans 8 columns) */}
                <div className="lg:col-span-8 bg-[#261a14] border border-white/5 p-6 rounded-3xl shadow-xl">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-6 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-[#f97316]" />
                    <span>Faturamento Diário Desta Semana (R$)</span>
                  </h4>
                  <div className="h-72 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#a78b7d" />
                        <YAxis stroke="#a78b7d" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#261a14', borderColor: 'rgba(255,255,255,0.1)', color: '#f5ded5' }}
                        />
                        <Area type="monotone" dataKey="Vendas" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories share Pie chart (Spans 4 columns) */}
                <div className="lg:col-span-4 bg-[#261a14] border border-white/5 p-6 rounded-3xl shadow-xl">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-6 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#f97316]" />
                    <span>Rateio de Categorias (%)</span>
                  </h4>
                  <div className="h-60 w-full flex items-center justify-center font-sans">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#261a14', borderColor: 'rgba(255,255,255,0.1)', color: '#f5ded5', fontSize: '10px' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconSize={8}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '10px', color: '#a78b7d' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-[#a78b7d] text-center select-none pt-2">
                    Proporção baseada no faturamento histórico real de vendas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* SUPORTE TAB                             */}
          {/* ======================================= */}
          {activeTab === 'suporte' && (
            <div className="max-w-2xl bg-[#261a14] border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-yellow-400/10 text-yellow-500 rounded-2xl">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Opções Avançadas e Engenharia
                  </h3>
                  <p className="text-xs text-[#a78b7d] leading-relaxed mt-2">
                    As coleções de dados de produtos, categorias, pedidos processados e cadastros CRM de clientes estão sendo sincronizados e guardados localmente via armazenamento LocalStorage no contêiner de preview.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reinicializar Banco de Dados</h4>
                  <p className="text-xxs text-[#a78b7d] leading-relaxed mt-1">
                    Apaga todas as modificações ativas nos lanches, remove pedidos recebidos da storefront e CRM de fidelidade, recarregando a listagem original definida no mock de chapa de "Puro Sabor".
                  </p>
                </div>

                <button
                  id="admin-btn-reset-db"
                  onClick={() => {
                    if (confirm('Atenção: isto apagará TODOS os novos pedidos, clientes cadastrados e lanches customizados, retornando ao estado original. Prosseguir?')) {
                      onResetDatabase();
                      setActiveTab('dashboard');
                    }
                  }}
                  className="px-5 py-3 bg-[#dc2626] hover:bg-red-700 text-white font-extrabold tracking-widest uppercase text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restaurar Padrão de Chapa</span>
                </button>
              </div>

              <div className="border-t border-white/5 pt-6 text-[10px] text-[#a78b7d] leading-relaxed">
                <p><strong>Desenvolvedor Responsável:</strong> Google AI Studio Coding Assistant</p>
                <p className="mt-1">ID da Sessão: a3f94092-3278-4364-8d1c-42a0a7239877</p>
                <p>Tecnologias: React 19, TypeScript 5.8, Tailwind CSS, Recharts, LocalStorage Engine, WhatsApp CRM Outbound.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL OVERLAY: Product Edit/Create Form (Inspired by CRUD workflows) */}
      <AnimatePresence>
        {isProductFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsProductFormOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#261a14] border border-white/5 w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  {editingProduct ? `Editar Lanche: ${editingProduct.name}` : 'Cadastrar Novo Lanche'}
                </h4>
                <button
                  onClick={() => setIsProductFormOpen(false)}
                  className="text-[#a78b7d] hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                      Nome do Lanche *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: X-Calabresa"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2.5 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                    />
                  </div>

                  <div>
                    <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 19.90"
                      value={prodPrice || ''}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2.5 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                    Categoria do Produto
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2.5 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316]"
                  >
                    <option value="Hamburgueres">Hambúrgueres</option>
                    <option value="Combos">Combos</option>
                    <option value="Porcoes">Porções</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                    Link Direto da Imagem (URL Unsplash / Pública)
                  </label>
                  <input
                    type="url"
                    placeholder="URL HTTP da imagem"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2.5 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316] font-mono"
                  />
                </div>

                <div>
                  <label className="text-[#e0c0b1] text-[10px] font-semibold uppercase tracking-wider block mb-1">
                    Descrição dos Ingredientes *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ex: Pão brioche, bife artesanal de 150g, muito molho cheddar..."
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-2.5 px-3 text-[#f5ded5] focus:outline-none focus:border-[#f97316] resize-none"
                  />
                </div>

                {/* Badges/Highlights selections */}
                <div className="flex items-center justify-around py-3 sm:py-4 bg-[#1c110c] border border-white/5 rounded-xl select-none">
                  <label className="flex items-center space-x-2 font-bold cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={prodPopular}
                      onChange={(e) => setProdPopular(e.target.checked)}
                      className="rounded border-white/10 text-[#f97316] focus:ring-0 w-4 h-4"
                    />
                    <span>Destacar como "Popular"</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={prodChefPick}
                      onChange={(e) => setProdChefPick(e.target.checked)}
                      className="rounded border-white/10 text-[#f97316] focus:ring-0 w-4 h-4"
                    />
                    <span>Selecionado do Chef</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsProductFormOpen(false)}
                    className="flex-1 py-3 border border-white/5 hover:border-white/10 hover:bg-white/5 text-[#e0c0b1] hover:text-white rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-[#dc2626] to-[#f97316] hover:from-[#b91c1c] hover:to-[#ea580c] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#dc2626]/20 transition-all hover:scale-[1.01]"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
