# EZOrder Frontend - React + Next.js

Modern WhatsApp-based order management SaaS built with React and Next.js.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend API running on `http://localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Architecture

```
frontend/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Login page
│   ├── dashboard/           # Dashboard routes
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── Navbar.tsx           # Navigation header
│   ├── tabs/                # Tab content components
│   ├── forms/               # Form components
│   ├── lists/               # List display components
│   ├── modals/              # Modal components
│   └── *.tsx                # Utility components
├── lib/                      # Utilities
│   ├── store.ts             # Zustand store
│   ├── api.ts               # API client
│   ├── utils.ts             # Helper functions
│   └── hooks/               # Custom hooks
└── public/                   # Static assets
```

## Features

✅ User authentication  
✅ Product management  
✅ Category management  
✅ Order taking system  
✅ Special marks/notes  
✅ Payment method tracking  
✅ Order cancellation  
✅ Real-time updates  
✅ WhatsApp message generation  
✅ Order history & analytics  

## Demo Credentials

- **Username**: owner
- **Password**: password123

## Notes

- Backend API must be running on port 3000
- Frontend runs on port 3001 during development
- All data is persisted to backend JSON files
- Session stored in browser localStorage

## Future Enhancements

- Real-time WebSocket updates
- Multiple user accounts
- Analytics dashboard
- Mobile app
- Restaurant multi-branch support
