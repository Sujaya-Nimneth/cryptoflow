# CryptoFlow Analytics

A professional-grade, real-time cryptocurrency analytics dashboard built with Next.js, TypeScript, Tailwind CSS, and Chart.js. Features live price tracking, portfolio management, interactive candlestick charts, intelligent market alerts, and watchlist functionality.

## 🚀 Features

- **Live Price Tracking**: Real-time cryptocurrency price updates with 24-hour change indicators
- **Portfolio Management**: Track your crypto investments with detailed performance analytics
- **Interactive Charts**: Advanced candlestick and line charts with multiple timeframe options
- **Market Alerts**: Set intelligent price alerts for cryptocurrencies with email and push notifications
- **Watchlist**: Create custom watchlists to monitor your favorite cryptocurrencies
- **Market Overview**: View global market cap, trading volume, and Bitcoin dominance metrics
- **Modern UI**: Dark-themed, responsive interface optimized for all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: React Icons
- **State Management**: React Hooks
- **Backend**: REST API (CoinGecko)
- **Database**: Supabase (PostgreSQL)
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database features)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CRYPTO_API_URL=https://api.coingecko.com/api/v3
```

### 3. Set Up Supabase Database (Optional)

Create the following tables in your Supabase database:

#### `portfolio_assets`
```sql
CREATE TABLE portfolio_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  crypto_id TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  purchase_price DECIMAL NOT NULL,
  purchase_date TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);
```

#### `watchlist`
```sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  crypto_id TEXT NOT NULL,
  added_date TIMESTAMP DEFAULT now()
);
```

#### `market_alerts`
```sql
CREATE TABLE market_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  crypto_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  target_price DECIMAL NOT NULL,
  is_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with dark theme
│   ├── page.tsx           # Main dashboard with tab navigation
│   └── globals.css        # Global styles
├── components/
│   ├── LivePriceTracker.tsx    # Real-time price cards
│   ├── PriceCard.tsx            # Individual price card component
│   ├── CandleStickChart.tsx     # Interactive price charts
│   ├── PortfolioManagement.tsx  # Portfolio tracking and analytics
│   ├── Watchlist.tsx            # Watchlist with top gainers  
│   └── MarketAlerts.tsx         # Alert management
├── lib/
│   ├── cryptoApi.ts       # CoinGecko API client
│   └── supabase.ts        # Supabase database functions
├── types/
│   └── index.ts           # TypeScript interfaces
└── .env.local             # Environment variables
```

## 🎨 Features in Detail

### Dashboard Tab
- Live cryptocurrency price tracking with auto-refresh every 30 seconds
- Global market statistics (market cap, 24h volume, Bitcoin dominance)
- Responsive grid layout for multiple cryptocurrencies

### Portfolio Tab
- Add and manage your cryptocurrency holdings
- Real-time portfolio value calculation
- Individual asset performance tracking (gain/loss percentage)
- Portfolio allocation breakdown chart
- Top holdings summary

### Watchlist Tab
- Create custom watchlists of cryptocurrencies
- View 24-hour price changes and market caps
- Top gainers section for market trends
- Quick add/remove functionality

### Alerts Tab
- Create price-based alerts (above/below target price)
- Visual alert status indicators
- Notification preferences (email, push, SMS)
- Triggered alert highlighting

## 🔌 API Integration

### CoinGecko API
- Get market data for 250+ cryptocurrencies
- OHLC (Open, High, Low, Close) candlestick data
- Trending cryptocurrencies
- No authentication required

### Supabase
- User portfolio persistence
- Watchlist management
- Alert storage and tracking

## 📊 Data Flow

1. **Price Updates**: CoinGecko API → Component State → UI
2. **User Data**: Form Input → Supabase → Component State → UI
3. **Analytics**: Portfolio Assets → Calculate Stats → Display Charts

## 🎯 Customization

### Add More Cryptocurrencies
Edit the default list in `LivePriceTracker.tsx`:
```typescript
const data = await getCryptocurrencies(['bitcoin', 'ethereum', 'cardano', ...]);
```

### Change Update Frequency
Modify the interval in `LivePriceTracker.tsx`:
```typescript
const interval = setInterval(fetchPrices, 30000); // 30 seconds
```

### Customize Colors
Edit Tailwind classes in component files or update `tailwind.config.ts`

## 🚀 Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

### Deploy to Other Platforms

1. Build the project: `npm run build`
2. Deploy the `.next` folder to your hosting provider
3. Set environment variables on your hosting platform

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use Supabase Row Level Security (RLS) for production
- Implement user authentication before deploying
- Validate all user inputs server-side

## 📈 Performance Optimization

- Auto-refresh throttling to prevent API rate limits
- Memoized components to prevent unnecessary re-renders
- Lazy loading for chart components
- Optimized image loading with next/image

## 🐛 Troubleshooting

### Charts not displaying
- Ensure Chart.js is properly installed: `npm install chart.js react-chartjs-2`
- Check browser console for errors

### API rate limiting
- CoinGecko free tier has rate limits
- Consider caching responses or upgrading to API plan

### Supabase connection issues
- Verify credentials in `.env.local`
- Check Supabase service is running
- Ensure tables exist with correct schema

## 📝 License

MIT License - feel free to use this project for personal and commercial purposes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
1. Check GitHub Issues page
2. Review the documentation
3. Check CoinGecko API docs for market data questions
4. Check Supabase documentation for database questions

---

**Built with ❤️ for crypto enthusiasts**
