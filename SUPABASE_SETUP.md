# Supabase Setup Guide

This guide will help you set up Supabase for PolyProp.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New project"
3. Fill in your project details:
   - **Name**: `polyprop` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Wait for your project to be created (this may take a few minutes)
2. Go to your project dashboard
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (something like `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Run Database Migrations

1. Install the Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your_project_ref
   ```
   (Find your project ref in the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)

4. Push the migrations:
   ```bash
   supabase db push
   ```

Alternatively, you can run the SQL directly in the Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try logging in with Privy
3. Check the browser console for any errors
4. The app should now work with real Supabase data instead of mock data

## Troubleshooting

### Common Issues:

1. **"Error syncing user with Supabase: {}"**
   - This error should now be resolved with the updated code
   - If you still see it, check your environment variables

2. **Migration errors**
   - Make sure you're using the correct project ref
   - Try running individual SQL statements in the SQL Editor

3. **Authentication issues**
   - Verify your Privy configuration
   - Check that your Supabase RLS policies are correct

### Database Schema

The app creates the following tables:
- `users` - User profiles and authentication
- `challenges` - Trading challenges
- `trades` - Individual trades
- `yields` - LP yield information
- `plans` - Challenge plan configurations
- `orders` - Admin order management
- `contracts` - Legal contract management
- `admin_logs` - Administrative actions
- `notifications` - In-app notifications

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies for:
- User data isolation
- Challenge access control
- Trade history privacy
- Administrative access

## Next Steps

Once Supabase is set up:
1. Test user registration and login
2. Create your first trading challenge
3. Try placing some virtual trades
4. Monitor the data in your Supabase dashboard

For production deployment, make sure to:
- Set up proper environment variables in your hosting platform
- Configure database backups
- Set up monitoring and alerts
- Review security policies

## Support

If you encounter any issues:
1. Check the browser console for detailed error messages
2. Verify your environment variables are correct
3. Ensure your Supabase project is active
4. Check the Supabase dashboard for any service issues
