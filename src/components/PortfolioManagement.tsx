'use client';

import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

interface PortfolioStats {
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
}

export default function PortfolioManagement() {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'Bitcoin',
      symbol: 'BTC',
      quantity: 0.5,
      purchasePrice: 40000,
      currentPrice: 45000,
    },
    {
      id: '2',
      name: 'Ethereum',
      symbol: 'ETH',
      quantity: 5,
      purchasePrice: 2000,
      currentPrice: 2500,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  const calculatePortfolioStats = (): PortfolioStats => {
    const totalInvestment = assets.reduce((sum, asset) => sum + asset.quantity * asset.purchasePrice, 0);
    const currentValue = assets.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
    const totalReturn = currentValue - totalInvestment;
    const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      currentValue,
      totalReturn,
      returnPercentage,
    };
  };

  const stats = calculatePortfolioStats();
  const isProfit = stats.totalReturn >= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Portfolio Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPlus /> Add Asset
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Investment</p>
          <p className="text-2xl font-bold text-white">{formatPrice(stats.totalInvestment)}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Current Value</p>
          <p className="text-2xl font-bold text-white">{formatPrice(stats.currentValue)}</p>
        </div>
        <div className={`rounded-lg p-4 border ${isProfit ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
          <p className="text-slate-400 text-sm">Total Return</p>
          <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {formatPrice(stats.totalReturn)}
          </p>
        </div>
        <div className={`rounded-lg p-4 border ${isProfit ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
          <p className="text-slate-400 text-sm">Return %</p>
          <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{stats.returnPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-700/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Asset</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Purchase Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Current Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Total Value</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Gain/Loss</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => {
                const investedValue = asset.quantity * asset.purchasePrice;
                const currentValue = asset.quantity * asset.currentPrice;
                const gainLoss = currentValue - investedValue;
                const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;
                const isGain = gainLoss >= 0;

                return (
                  <tr
                    key={asset.id}
                    className={`border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{asset.name}</p>
                        <p className="text-xs text-slate-400">{asset.symbol}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{asset.quantity}</td>
                    <td className="px-6 py-4 text-white">{formatPrice(asset.purchasePrice)}</td>
                    <td className="px-6 py-4 text-white">{formatPrice(asset.currentPrice)}</td>
                    <td className="px-6 py-4 text-white">{formatPrice(currentValue)}</td>
                    <td className={`px-6 py-4 ${isGain ? 'text-green-400' : 'text-red-400'}`}>
                      <div>
                        <p className="font-semibold">{isGain ? '+' : ''}{formatPrice(gainLoss)}</p>
                        <p className="text-xs">{isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="inline-flex p-2 hover:bg-red-500/20 rounded text-red-400 transition">
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h3>
          <div className="space-y-2">
            {assets.map((asset) => {
              const currentValue = asset.quantity * asset.currentPrice;
              const percentage = stats.currentValue > 0 ? (currentValue / stats.currentValue) * 100 : 0;

              return (
                <div key={asset.id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-slate-300">{asset.symbol}</p>
                    <p className="text-sm font-semibold text-white">{percentage.toFixed(1)}%</p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Holdings</h3>
          <div className="space-y-3">
            {assets
              .sort((a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice)
              .slice(0, 5)
              .map((asset) => {
                const value = asset.quantity * asset.currentPrice;
                return (
                  <div key={asset.id} className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                    <div>
                      <p className="font-semibold text-white">{asset.symbol}</p>
                      <p className="text-xs text-slate-400">{asset.quantity} units</p>
                    </div>
                    <p className="font-semibold text-orange-400">{formatPrice(value)}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
