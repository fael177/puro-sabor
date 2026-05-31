/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Utensils, ClipboardList, Users, BarChart3, HelpCircle, LogOut, Flame } from 'lucide-react';

export type AdminTab = 'dashboard' | 'cardapio' | 'pedidos' | 'clientes' | 'relatorios' | 'suporte';

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  orderCount: number;
}

export default function Sidebar({ activeTab, onTabChange, onLogout, orderCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cardapio' as AdminTab, label: 'Cardápio', icon: Utensils },
    {
      id: 'pedidos' as AdminTab,
      label: 'Pedidos',
      icon: ClipboardList,
      badge: orderCount > 0 ? orderCount : undefined,
    },
    { id: 'clientes' as AdminTab, label: 'Clientes', icon: Users },
    { id: 'relatorios' as AdminTab, label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <aside id="admin-sidebar" className="w-64 bg-[#1e110c] border-r border-white/5 flex flex-col justify-between h-screen fixed left-0 top-0 text-[#f5ded5] z-30 font-sans">
      {/* Sidebar Header Brand Area */}
      <div>
        <div className="p-6 border-b border-white/5 flex items-center space-x-3 select-none">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#dc2626] to-[#f97316] rounded-xl flex items-center justify-center shadow-md shadow-[#f97316]/10">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight leading-none">
              Painel Admin
            </h2>
            <p className="text-xxs text-[#e0c0b1] tracking-wider mt-1 uppercase font-semibold">
              Lanchonete Puro Sabor
            </p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-4 space-y-1.5 mt-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group ${
                  isActive
                    ? 'bg-[#f97316] text-white shadow-lg shadow-[#f97316]/10 font-bold'
                    : 'text-[#e0c0b1] hover:text-[#f5ded5] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <IconComponent
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-[#a78b7d] group-hover:text-[#f5ded5]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-xxs px-2 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-white text-[#f97316]' : 'bg-[#dc2626] text-white animate-pulse'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom Area */}
      <div className="p-4 space-y-1.5 border-t border-white/5">
        <button
          id="sidebar-tab-suporte"
          onClick={() => onTabChange('suporte')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-colors ${
            activeTab === 'suporte'
              ? 'bg-white/10 text-white'
              : 'text-[#e0c0b1] hover:text-[#f5ded5] hover:bg-white/5'
          }`}
        >
          <HelpCircle className="w-5 h-5 text-[#a78b7d]" />
          <span>Suporte</span>
        </button>

        <button
          id="sidebar-btn-sair"
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
