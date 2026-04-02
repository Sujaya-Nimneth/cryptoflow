# CryptoFlow Analytics - Development Guidelines

This is a professional cryptocurrency analytics dashboard built with Next.js and TypeScript.

## Project Overview

CryptoFlow Analytics is a real-time cryptocurrency tracking and portfolio management application featuring:
- Live price tracking with real-time updates
- Portfolio management with performance analytics
- Interactive candlestick charts with multiple timeframes
- Intelligent market alerts with notifications
- Watchlist functionality with top gainers tracking

## Architecture

### Tech Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **State**: React Hooks
- **API**: CoinGecko (free tier)
- **Database**: Supabase (optional)

### Key Directories
- `/src/app/` - Next.js app routes and layouts
- `/src/components/` - React components
- `/src/lib/` - Utilities and API clients
- `/src/types/` - TypeScript interfaces

## Development Setup

1. **Install dependencies**: `npm install`
2. **Configure environment**: Copy `.env.local` and add Supabase credentials
3. **Run dev server**: `npm run dev`
4. **Build for production**: `npm run build`

## Component Guidelines

### Client Components
All components in `/components/` use `'use client'` directive for interactivity:
- `LivePriceTracker` - Displays cryptocurrency prices with auto-refresh
- `PriceCard` - Individual crypto price display card
- `CandleStickChart` - Interactive price charts with timeframe selection
- `PortfolioManagement` - Portfolio tracking with gain/loss calculations
- `Watchlist` - Custom watchlist with market overview
- `MarketAlerts` - Price alert creation and management

### Data Flow
1. Components fetch data from CoinGecko API via `lib/cryptoApi.ts`
2. Optional Supabase integration via `lib/supabase.ts`
3. State managed with React useState/useEffect hooks
4. Type safety with TypeScript interfaces in `types/index.ts`

## Code Style

- Use TypeScript for type safety
- Prefer functional components with hooks
- Use Tailwind CSS for styling (no inline styles)
- Component names in PascalCase
- File names in PascalCase for components, camelCase for utilities
- Add JSDoc comments for complex functions

## API Integration

### CoinGecko API
- Free tier, no authentication required
- Rate limited to prevent abuse
- Used for market data and OHLC candlestick data
- Fallback: Consider implementing caching

### Supabase Integration
- Optional for user data persistence
- Tables: `portfolio_assets`, `watchlist`, `market_alerts`
- Row-level security should be implemented for production

## Testing & Quality

- Run TypeScript check: `npx tsc --noEmit`
- Check ESLint: `npm run lint`
- Build verification: `npm run build`

## Performance Considerations

- Auto-refresh throttled to 30-second intervals
- Charts lazy-loaded for better initial load
- Images optimized with next/image
- Memoization for expensive computations

## Common Tasks

### Adding a New Cryptocurrency
1. Update the default list in `LivePriceTracker.tsx`
2. Verify data format matches `Cryptocurrency` interface
3. Test chart rendering with new data

### Creating Market Alerts
1. Reference `MarketAlerts.tsx` component
2. Integrate with Supabase `market_alerts` table
3. Implement notification logic (email/push)

### Extending Portfolio Features
1. Add new fields to `portfolio_assets` table
2. Update `PortfolioAsset` interface in `types/index.ts`
3. Update calculations in `PortfolioManagement.tsx`

## Security Notes

- Never commit `.env.local` file
- Implement user authentication before production
- Use Supabase RLS policies for data protection
- Validate all user inputs server-side
- Keep dependencies updated

## Deployment

### Vercel (Recommended)
1. Push code to Git repository
2. Connect to Vercel project
3. Set environment variables in Vercel dashboard
4. Deploy with `vercel deploy`

### Other Platforms
1. Run `npm run build`
2. Deploy `.next` folder
3. Set environment variables on platform
4. Ensure Node.js 18+ is available

## Troubleshooting

- **Build errors**: Check TypeScript with `npx tsc --noEmit`
- **Chart issues**: Verify Chart.js installation and imports
- **API errors**: Check `.env.local` and API rate limits
- **Styling issues**: Ensure Tailwind CSS is properly configured

## Future Enhancements

1. User authentication with Supabase Auth
2. Real-time WebSocket updates instead of polling
3. Advanced technical analysis indicators
4. Mobile app with React Native
5. API endpoint for third-party integrations
6. Dark/light theme toggle
7. Export portfolio reports (PDF/CSV)

---

**Last Updated**: April 2, 2026
**Maintained by**: CryptoFlow Team
