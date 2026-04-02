'use client';

import { useState, useEffect } from 'react';
import { Cryptocurrency } from '@/types';
import { getCryptocurrencies } from '@/lib/cryptoApi';
import PriceCard from './PriceCard';
import { FiRefreshCw } from 'react-icons/fi';

export default function LivePriceTracker() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrices();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      setRefreshing(true);
      const data = await getCryptocurrencies();
      setCryptos(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch cryptocurrency prices');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-700 rounded-lg p-4 animate-pulse h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Price Tracking</h2>
        <button
          onClick={fetchPrices}
          disabled={refreshing}
          className="p-2 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          title="Refresh prices"
        >
          <FiRefreshCw
            className={`text-orange-500 ${refreshing ? 'animate-spin' : ''}`}
            size={20}
          />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-200 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptos.map((crypto) => (
          <PriceCard key={crypto.id} crypto={crypto} />
        ))}
      </div>
    </div>
  );
}
