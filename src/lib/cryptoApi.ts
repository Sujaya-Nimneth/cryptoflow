import axios from 'axios';
import { Cryptocurrency, ChartData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_CRYPTO_API_URL || 'https://api.coingecko.com/api/v3';

const apiClient = axios.create({
  baseURL: API_URL,
});

export async function getCryptocurrencies(
  ids: string[] = ['bitcoin', 'ethereum', 'cardano', 'solana', 'xrp'],
  vsCurrency: string = 'usd'
): Promise<Cryptocurrency[]> {
  try {
    const response = await apiClient.get<Cryptocurrency[]>('/coins/markets', {
      params: {
        vs_currency: vsCurrency,
        ids: ids.join(','),
        order: 'market_cap_desc',
        per_page: 250,
        sparkline: true,
        price_change_percentage: '24h',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch cryptocurrencies:', error);
    throw error;
  }
}

export async function getCryptocurrencyDetails(id: string, vsCurrency: string = 'usd') {
  try {
    const response = await apiClient.get(`/coins/${id}`, {
      params: {
        vs_currency: vsCurrency,
        market_data: true,
        sparkline: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch cryptocurrency details for ${id}:`, error);
    throw error;
  }
}

export async function getCryptocurrencyChart(
  id: string,
  days: string | number = '1',
  vsCurrency: string = 'usd'
): Promise<ChartData[]> {
  try {
    const response = await apiClient.get(`/coins/${id}/ohlc`, {
      params: {
        vs_currency: vsCurrency,
        days: days,
      },
    });
    
    // Transform API response to ChartData format
    return response.data.map((candle: number[]) => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: 0, // CoinGecko doesn't provide volume in this endpoint
    }));
  } catch (error) {
    console.error(`Failed to fetch chart data for ${id}:`, error);
    throw error;
  }
}

export async function searchCryptocurrencies(query: string) {
  try {
    const response = await apiClient.get('/search', {
      params: {
        query,
      },
    });
    return response.data.coins;
  } catch (error) {
    console.error('Failed to search cryptocurrencies:', error);
    throw error;
  }
}

export async function getTrendingCryptocurrencies() {
  try {
    const response = await apiClient.get('/search/trending');
    return response.data.coins;
  } catch (error) {
    console.error('Failed to fetch trending cryptocurrencies:', error);
    throw error;
  }
}
