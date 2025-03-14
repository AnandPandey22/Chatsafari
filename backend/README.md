# ChatSafari Backend

The backend server for ChatSafari, built with Node.js, Express, and Socket.IO.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

## Deploying to Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Set environment variables:
   - `PORT`: Port number (default: 3000)
   - `CORS_ORIGIN`: Frontend URL (e.g., https://your-app.netlify.app)
   - `NODE_ENV`: production

## Environment Variables

See `.env.example` for required environment variables. 