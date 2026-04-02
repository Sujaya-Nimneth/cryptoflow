'use client';

import { useState } from 'react';
import LivePriceTracker from '@/components/LivePriceTracker';
import PortfolioManagement from '@/components/PortfolioManagement';
import Watchlist from '@/components/Watchlist';
import MarketAlerts from '@/components/MarketAlerts';
import { FiHome, FiBriefcase, FiBookmark, FiBell } from 'react-icons/fi';

type TabType = 'home' | 'portfolio' | 'watchlist' | 'alerts';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Dashboard', icon: <FiHome /> },
    { id: 'portfolio', label: 'Portfolio', icon: <FiBriefcase /> },
    { id: 'watchlist', label: 'Watchlist', icon: <FiBookmark /> },
    { id: 'alerts', label: 'Alerts', icon: <FiBell /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">CryptoFlow Analytics</h1>
              <p className="text-slate-400 mt-1">Real-time cryptocurrency analytics dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Last updated</p>
              <p className="text-white font-semibold">
                {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-700">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <div className="space-y-8">
            <LivePriceTracker />

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Global Market Cap</p>
                <p className="text-3xl font-bold text-white">$2.1T</p>
                <p className="text-green-400 text-sm mt-2">+2.5% 24h</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">24h Volume</p>
                <p className="text-3xl font-bold text-white">$89.5B</p>
                <p className="text-red-400 text-sm mt-2">-1.2% 24h</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Bitcoin Dominance</p>
                <p className="text-3xl font-bold text-white">48.2%</p>
                <p className="text-green-400 text-sm mt-2">+0.4% 24h</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && <PortfolioManagement />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'alerts' && <MarketAlerts />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-4">About CryptoFlow</h3>
              <p className="text-slate-400 text-sm">
                Professional-grade cryptocurrency analytics with real-time data, portfolio tracking, and market insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>✓ Live price tracking</li>
                <li>✓ Portfolio management</li>
                <li>✓ Advanced charts</li>
                <li>✓ Market alerts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Support</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 CryptoFlow Analytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
