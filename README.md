# Email Agent - AI-Powered Email Assistant

An intelligent email monitoring and auto-reply system built with Next.js, Gmail API, and Claude AI.

## Features

- **Gmail Integration**: Connect your Gmail account via OAuth
- **Email Monitoring**: Automatically monitor your inbox for new emails
- **AI Draft Generation**: Generate professional reply drafts using Claude AI
- **Auto-Reply**: Automatically respond to basic emails
- **Custom Instructions**: Configure AI behavior with custom context
- **Dashboard**: View all emails with statuses (auto-replied, draft ready, needs attention)

## Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Gmail API for your project
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://agentic-49df7ae4.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for local development)
6. Copy your Client ID and Client Secret

### 2. Environment Variables

Create a `.env.local` file with:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_BASE_URL=https://agentic-49df7ae4.vercel.app
ANTHROPIC_API_KEY=your_claude_api_key (optional)
```

### 3. Deploy to Vercel

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-49df7ae4
```

## Usage

1. Visit your deployed app
2. Click "Connect Gmail Account" and authorize access
3. Enter your Claude API key in the settings (or set ANTHROPIC_API_KEY env var)
4. Configure reply context and auto-reply settings
5. Click "Refresh Emails" to load your unread emails
6. Generate drafts or enable auto-reply for basic emails

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Gmail API**: Email access and management
- **Claude AI**: Draft generation
- **Vercel**: Deployment platform
