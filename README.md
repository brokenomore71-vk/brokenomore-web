This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Create the `user_profiles` table using the schema provided
   - Get your project URL and anon key from Supabase dashboard


3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory
   - Add the following variables:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional, falls back to anon key)
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_test_NqVc6wCSssskwt
   RAZORPAY_KEY_SECRET=1PxsaUhEKnsgZ1jmA030SUAV
   ```
   
   **Note:** For production, use production Razorpay keys and ensure `SUPABASE_SERVICE_ROLE_KEY` is set for server-side operations.

4. **Run the development server:**
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

### Database Schema

The application requires a `user_profiles` table in Supabase. Make sure to create the table with the provided schema before using the signup functionality.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
