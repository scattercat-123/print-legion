# Print Farm

A modern web application for managing 3D printing requests and fulfillment through Slack integration.

## Features

- Slack Authentication
- Printer and User Roles
- YSWS Request Management
- Airtable Integration
- Fillout Forms Integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
PUBLIC_SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_secret
SLACK_SIGNING_SECRET=your_signing_secret
PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

## Technology Stack

- Next.js 13+ (App Router)
- React 18
- Tailwind CSS
- Airtable
- Slack API
- Fillout Forms 