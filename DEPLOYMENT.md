# Deployment Guide

## Deploy to Vercel

### 1. Connect Repository
1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `Behnan1196/web-app-only`
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Project Settings
- **Framework Preset**: Next.js (should be auto-detected)
- **Root Directory**: Leave empty (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3. Set Environment Variables
Add these environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_STREAM_API_KEY` | Stream Chat public API key | `abc123def456` |
| `STREAM_API_KEY` | Stream Chat API key | `abc123def456` |
| `STREAM_API_SECRET` | Stream Chat API secret | `xyz789uvw012` |
| `NEXT_PUBLIC_API_URL` | **Your Vercel app URL** | `https://your-app.vercel.app` |

**Important**: For `NEXT_PUBLIC_API_URL`, you'll need to:
1. **First deploy** with any placeholder value (e.g., `https://placeholder.com`)
2. **After deployment**, update it to your actual Vercel app URL
3. **Redeploy** to apply the change

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at the provided URL
4. **Update `NEXT_PUBLIC_API_URL`** to your actual app URL
5. **Redeploy** to apply the change

## Troubleshooting

### Build Errors
- **Environment Variables Missing**: Ensure all required environment variables are set in Vercel
- **Type Errors**: The app should build successfully now with the latest fixes

### Runtime Errors
- **Supabase Connection**: Check that your Supabase URL and keys are correct
- **Stream Chat**: Verify your Stream Chat API credentials

### 404 Errors
- **Route Not Found**: Ensure all API routes are properly configured
- **Build Success**: If build succeeds locally but fails on Vercel, check environment variables

## Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your actual values

# Test build
npm run build

# Test development server
npm run dev
```

## Post-Deployment

1. **Test Authentication**: Try logging in with demo credentials
2. **Test Chat**: Verify real-time chat functionality works
3. **Check API Routes**: Ensure `/api/stream-token` and `/api/assignments/partner` work
4. **Monitor Logs**: Check Vercel function logs for any runtime errors
5. **Update API URL**: Set `NEXT_PUBLIC_API_URL` to your actual Vercel app URL

## Demo Credentials

- **Student**: ozan@sablon.com
- **Coach**: behnan@sablon.com

## Support

If you encounter issues:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Test locally first
4. Check browser console for client-side errors
5. Ensure `NEXT_PUBLIC_API_URL` points to your actual deployed app
