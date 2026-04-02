'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getCryptocurrencyChart } from '@/lib/cryptoApi';
import { ChartData } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CandleStickChartProps {
  cryptoId: string;
  days?: string | number;
}

export default function CandleStickChart({ cryptoId, days = '7' }: CandleStickChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(days);

  useEffect(() => {
    fetchChartData();
  }, [cryptoId, selectedDays]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const data = await getCryptocurrencyChart(cryptoId, selectedDays);
      setChartData(data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || chartData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="h-96 flex items-center justify-center text-slate-400">
          Loading chart data...
        </div>
      </div>
    );
  }

  const labels = chartData.map((d) => {
    const date = new Date(d.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const closePrices = chartData.map((d) => d.close);
  const highPrices = chartData.map((d) => d.high);
  const lowPrices = chartData.map((d) => d.low);

  const data = {
    labels,
    datasets: [
      {
        label: 'Close Price',
        data: closePrices,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.1,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#000',
      },
      {
        label: 'High Price',
        data: highPrices,
        borderColor: '#22c55e',
        backgroundColor: 'transparent',
        tension: 0.1,
        borderDash: [5, 5],
        pointRadius: 2,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#000',
      },
      {
        label: 'Low Price',
        data: lowPrices,
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        tension: 0.1,
        borderDash: [5, 5],
        pointRadius: 2,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#000',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#f97316',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#334155',
        },
      },
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#334155',
        },
      },
    },
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Price Chart</h3>
        <div className="flex gap-2">
          {['1', '7', '30', '90', '365'].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDays(day)}
              className={`px-3 py-1 rounded text-sm transition ${
                selectedDays === day
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {day === '1' ? '24H' : day === '365' ? '1Y' : `${day}D`}
            </button>
          ))}
        </div>
      </div>
      <div className="h-96">
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
}
