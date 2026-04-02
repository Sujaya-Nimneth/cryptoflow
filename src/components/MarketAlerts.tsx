'use client';

import { useState } from 'react';
import { FiBell, FiTrash2, FiX } from 'react-icons/fi';

interface Alert {
  id: string;
  cryptoName: string;
  cryptoSymbol: string;
  alertType: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isTriggered: boolean;
  createdAt: string;
}

export default function MarketAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      cryptoName: 'Bitcoin',
      cryptoSymbol: 'BTC',
      alertType: 'above',
      targetPrice: 50000,
      currentPrice: 45000,
      isTriggered: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      cryptoName: 'Ethereum',
      cryptoSymbol: 'ETH',
      alertType: 'below',
      targetPrice: 2000,
      currentPrice: 2500,
      isTriggered: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crypto: '',
    alertType: 'above' as 'above' | 'below',
    targetPrice: '',
  });

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crypto || !formData.targetPrice) return;

    const newAlert: Alert = {
      id: Date.now().toString(),
      cryptoName: formData.crypto,
      cryptoSymbol: formData.crypto.toUpperCase().slice(0, 3),
      alertType: formData.alertType,
      targetPrice: parseFloat(formData.targetPrice),
      currentPrice: 0,
      isTriggered: false,
      createdAt: new Date().toISOString(),
    };

    setAlerts([...alerts, newAlert]);
    setFormData({ crypto: '', alertType: 'above', targetPrice: '' });
    setShowForm(false);
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getAlertStatus = (alert: Alert) => {
    if (alert.alertType === 'above') {
      return alert.currentPrice >= alert.targetPrice;
    } else {
      return alert.currentPrice <= alert.targetPrice;
    }
  };

  const triggeredCount = alerts.filter(getAlertStatus).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Intelligent Market Alerts</h2>
          <p className="text-sm text-slate-400 mt-1">{triggeredCount} alert(s) triggered</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <FiBell /> New Alert
        </button>
      </div>

      {/* Add Alert Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Create New Alert</h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 hover:bg-slate-700 rounded transition"
            >
              <FiX className="text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleAddAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Cryptocurrency</label>
              <input
                type="text"
                value={formData.crypto}
                onChange={(e) => setFormData({ ...formData, crypto: e.target.value })}
                placeholder="Bitcoin, Ethereum, etc."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Alert Type</label>
                <select
                  value={formData.alertType}
                  onChange={(e) =>
                    setFormData({ ...formData, alertType: e.target.value as 'above' | 'below' })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Price</label>
                <input
                  type="number"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Create Alert
            </button>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
            <FiBell className="mx-auto text-slate-500 mb-3" size={32} />
            <p className="text-slate-400">No alerts set up yet</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isTriggered = getAlertStatus(alert);
            return (
              <div
                key={alert.id}
                className={`rounded-lg p-4 border ${
                  isTriggered
                    ? 'bg-orange-500/10 border-orange-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white text-lg">
                        {alert.cryptoName}
                        <span className="text-slate-400 ml-2">({alert.cryptoSymbol})</span>
                      </h3>
                      {isTriggered && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
                          TRIGGERED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Alert Type</p>
                        <p className="text-white font-semibold">
                          Price {alert.alertType === 'above' ? 'Above' : 'Below'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Target Price</p>
                        <p className="text-white font-semibold">{formatPrice(alert.targetPrice)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Current Price</p>
                        <p className="text-white font-semibold">{formatPrice(alert.currentPrice)}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="ml-4 p-2 hover:bg-red-500/20 rounded text-red-400 transition"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Settings */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-slate-300">Email notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-slate-300">Browser push notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <span className="text-slate-300">SMS notifications</span>
          </label>
        </div>
      </div>
    </div>
  );
}
