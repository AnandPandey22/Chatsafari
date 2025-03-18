# ChatSafari Frontend

A modern chat application built with React, TypeScript, and Socket.IO.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

## Deploying to Netlify

1. Create a new site on Netlify
2. Connect your repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Set environment variables:
   - `VITE_API_URL`: Your backend API URL (e.g., https://your-backend.onrender.com)

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
``` 