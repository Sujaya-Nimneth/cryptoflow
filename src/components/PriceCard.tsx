'use client';

import { Cryptocurrency } from '@/types';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface PriceCardProps {
  crypto: Cryptocurrency;
}

export default function PriceCard({ crypto }: PriceCardProps) {
  const isPriceUp = crypto.price_change_percentage_24h >= 0;
  const priceChangeColor = isPriceUp ? 'text-green-400' : 'text-red-400';
  const bgColor = isPriceUp ? 'bg-green-500/10' : 'bg-red-500/10';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(num);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-orange-500 transition">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {crypto.image && (
            <img
              src={crypto.image}
              alt={crypto.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <h3 className="font-semibold text-white">{crypto.name}</h3>
            <p className="text-xs text-slate-400">{crypto.symbol.toUpperCase()}</p>
          </div>
        </div>
        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
          #{crypto.market_cap_rank}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm text-slate-400">Current Price</p>
          <p className="text-2xl font-bold text-white">{formatPrice(crypto.current_price)}</p>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded ${bgColor}`}>
          {isPriceUp ? (
            <FiTrendingUp className="text-green-400" />
          ) : (
            <FiTrendingDown className="text-red-400" />
          )}
          <p className={`${priceChangeColor} font-semibold`}>
            {isPriceUp ? '+' : ''}
            {crypto.price_change_percentage_24h.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-400">24h</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-400">H24</p>
            <p className="text-white font-semibold">{formatPrice(crypto.high_24h)}</p>
          </div>
          <div>
            <p className="text-slate-400">L24</p>
            <p className="text-white font-semibold">{formatPrice(crypto.low_24h)}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-xs">Market Cap</p>
          <p className="text-white font-semibold">{formatNumber(crypto.market_cap)}</p>
        </div>
      </div>
    </div>
  );
}
