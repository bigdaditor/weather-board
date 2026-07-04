This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Backend API

The sales, weather, and statistics backend runs in Next.js Route Handlers and
uses Supabase for persistence.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET, POST, PATCH, DELETE | `/api/sale` | Sales CRUD and paginated daily totals |
| GET | `/api/sale/{saleId}` | Sale lookup by ID |
| GET | `/api/sale/month?key=YYYY-MM` | Monthly daily totals |
| GET, POST | `/api/weather` | Monthly weather lookup and KMA weather sync |
| GET | `/api/statistics` | Weekly and monthly statistics |
| GET | `/api/statistics/summary/{periodType}` | Statistics summary |
| GET | `/api/statistics/daily` | Daily sales by payment type |
| GET | `/api/statistics/weather/monthly` | Monthly weather-sales trends |
| POST | `/api/statistics/recompute` | Validate statistics recomputation |

Configure the following values in `.env.local` or your deployment environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KMA_SERVICE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must not be exposed to browser
code. Set `KMA_SERVICE_KEY` to enable `POST /api/weather`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
