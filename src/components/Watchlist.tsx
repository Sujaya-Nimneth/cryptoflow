'use client';

import { useState } from 'react';
import { FiStar, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface WatchlistItem {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  image: string;
}

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([
    {
      id: '1',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: 45000,
      change24h: 2.5,
      marketCap: 900000000000,
      image: 'https://images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
    },
    {
      id: '2',
      name: 'Ethereum',
      symbol: 'ETH',
      price: 2500,
      change24h: -1.2,
      marketCap: 300000000000,
      image: 'https://images.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
    },
    {
      id: '3',
      name: 'Cardano',
      symbol: 'ADA',
      price: 0.95,
      change24h: 3.1,
      marketCap: 35000000000,
      image: 'https://images.coingecko.com/coins/images/975/large/cardano.png?1696502090',
    },
  ]);

  const [topGainers, setTopGainers] = useState<WatchlistItem[]>(
    items.sort((a, b) => b.change24h - a.change24h).slice(0, 3)
  );

  const removeFromWatchlist = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    setTopGainers(updated.sort((a, b) => b.change24h - a.change24h).slice(0, 3));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatMarketCap = (cap: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(cap);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Watchlist & Market Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Watchlist */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">My Watchlist</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50 border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Coin</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">24h Change</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Market Cap</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">{formatPrice(item.price)}</td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 ${item.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.change24h >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                        <span className="font-semibold">{Math.abs(item.change24h).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatMarketCap(item.marketCap)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="inline-flex p-2 hover:bg-yellow-500/20 rounded text-yellow-400 transition">
                          <FiStar size={18} />
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="inline-flex p-2 hover:bg-red-500/20 rounded text-red-400 transition"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Gainers */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Gainers</h3>
          <div className="space-y-3">
            {topGainers.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-500">#{index + 1}</span>
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-6 h-6 rounded-full" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{item.symbol}</p>
                    <p className="text-xs text-slate-400">{item.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold text-sm">+{item.change24h.toFixed(2)}%</p>
                  <p className="text-xs text-slate-400">{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Overview Summary */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Market Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-2">Total Market Cap</p>
            <p className="text-2xl font-bold text-white">
              {formatMarketCap(items.reduce((sum, item) => sum + item.marketCap, 0))}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Average 24h Change</p>
            <p className={`text-2xl font-bold ${items.reduce((sum, item) => sum + item.change24h, 0) / items.length >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(items.reduce((sum, item) => sum + item.change24h, 0) / items.length).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Watched Assets</p>
            <p className="text-2xl font-bold text-orange-400">{items.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
