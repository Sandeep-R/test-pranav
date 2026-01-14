# Local Environment Setup

## Environment Variables

Your local environment variables are configured in `.env.local` file. This file is already set up with your Supabase credentials.

### Current Setup

The `.env.local` file contains:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### How Vite Loads Environment Variables

Vite automatically loads environment variables from `.env.local` when you run:
- `npm run dev` - Development server
- `npm run build` - Production build

**Important:** 
- Environment variables must be prefixed with `VITE_` to be exposed to the client-side code
- The `.env.local` file is gitignored and will not be committed to the repository
- Never commit your actual Supabase keys to git

### Verifying Environment Variables

To verify your environment variables are loaded:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the browser console** and check:
   - The app should load without showing the "Configuration Error" message
   - You should be able to sign up/login
   - Todos should sync with Supabase

3. **Check in code:**
   Environment variables are available via `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`

### If Environment Variables Are Missing

If you see the "Configuration Error" screen:

1. Check that `.env.local` exists in the `todo-app/` directory
2. Verify the file contains both variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart the dev server after making changes
4. Make sure there are no spaces around the `=` sign

### Getting Supabase Credentials

If you need to get your Supabase credentials:

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Troubleshooting

**Issue:** Environment variables not loading
- **Solution:** Restart the dev server after changing `.env.local`

**Issue:** "Missing Supabase environment variables" error
- **Solution:** Check `.env.local` file exists and has correct variable names (must start with `VITE_`)

**Issue:** Variables work locally but not in production
- **Solution:** Set the same environment variables in your Vercel project settings
