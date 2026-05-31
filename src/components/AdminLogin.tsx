/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Realistic login simulation - accepting 'admin' as username and '36753241' as password
    setTimeout(() => {
      const normalizedUser = username.trim().toLowerCase();
      const normalizedPass = password.trim();

      if (
        normalizedUser === 'admin' &&
        normalizedPass === '36753241'
      ) {
        onLoginSuccess();
      } else {
        setError('Usuário ou senha incorretos! Verifique suas credenciais administrativas.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#1c110c] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic ambient flame particles in the background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f97316] opacity-5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#dc2626] opacity-5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        id="login-card"
        className="w-full max-w-[420px] bg-[#261a14]/90 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10"
      >
        {/* Logo and Greeting Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-[#dc2626] to-[#f97316] rounded-2xl shadow-lg shadow-[#f97316]/20 mb-4 animate-pulse">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold font-sans text-[#f5ded5] tracking-tight">
            Puro <span className="text-[#f97316]">Sabor</span>
          </h1>
          <p className="text-[#e0c0b1] text-xs font-medium uppercase tracking-widest mt-1">
            Painel Administrativo
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-red-300 text-xs px-4 py-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[#e0c0b1] text-xs font-semibold uppercase tracking-wider block">
              Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78b7d]" />
              <input
                id="login-user"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: puro sabor"
                required
                className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[#f5ded5] text-sm placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316] transition-colors focus:ring-1 focus:ring-[#f97316]/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#e0c0b1] text-xs font-semibold uppercase tracking-wider block">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78b7d]" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full bg-[#1c110c] border border-white/10 rounded-xl py-3 pl-10 pr-11 text-[#f5ded5] text-sm placeholder-[#a78b7d]/50 focus:outline-none focus:border-[#f97316] transition-colors focus:ring-1 focus:ring-[#f97316]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a78b7d] hover:text-[#f5ded5] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-btn-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-[#dc2626] to-[#f97316] hover:from-[#b91c1c] hover:to-[#ea580c] text-white font-bold tracking-wider uppercase text-xs py-3.5 rounded-xl shadow-lg shadow-[#dc2626]/20 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#a78b7d] text-xxs font-medium tracking-wide">
            Acesso administrativo restrito a funcionários.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
