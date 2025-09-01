# Coaching Web App

A clean, modern Next.js web application for coaching and student management with real-time chat functionality.

## Features

- **Authentication**: Secure login/signup with Supabase
- **Real-time Chat**: Stream Chat integration for instant messaging
- **User Management**: Student and coach role-based access
- **Partner Assignment**: Automatic pairing of students with coaches
- **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Auth, Database)
- **Chat**: Stream Chat
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stream Chat account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Behnan1196/web-app-only.git
cd web-app-only
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NEXT_PUBLIC_API_URL=your_vercel_app_url
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── chat/           # Chat page
│   ├── dashboard/      # Dashboard page
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── contexts/            # React contexts
│   ├── AuthContext.tsx # Authentication context
│   └── ChatContext.tsx # Chat context
├── lib/                 # Utility libraries
│   ├── assignments.ts  # Partner assignment service
│   ├── streamChat.ts   # Stream Chat service
│   └── supabase.ts     # Supabase client
└── types/               # TypeScript type definitions
```

## Key Components

### Authentication
- **AuthContext**: Manages user authentication state
- **Login/Signup**: Clean authentication forms with role selection

### Chat System
- **ChatContext**: Real-time chat functionality
- **Stream Chat Service**: Handles chat connections and messaging

### Partner Assignment
- **Assignments Service**: Fetches and manages student-coach relationships

## API Routes

- `/api/stream-token`: Generates Stream Chat authentication tokens
- `/api/assignments/partner`: Fetches assigned partner information

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check
```

## Deployment

This app is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set all environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_STREAM_API_KEY` | Stream Chat public API key | Yes |
| `STREAM_API_KEY` | Stream Chat API key | Yes |
| `STREAM_API_SECRET` | Stream Chat API secret | Yes |
| `NEXT_PUBLIC_API_URL` | Your app's public URL | Yes |

## Demo Credentials

- **Student**: ozan@sablon.com
- **Coach**: behnan@sablon.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
