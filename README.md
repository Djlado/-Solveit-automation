# Solveit Automation

This project is now set up to run as a single Node app that serves the website and the AI/email backend together.

## What is included

- `index.html` — homepage with chatbot interface
- `about.html` — about page
- `services.html` — services and booking form
- `style.css` — site styling
- `script.js` — frontend chat and booking form behavior
- `server.js` — backend endpoints for AI chat and booking emails
- `.env.example` — example environment variables
- `package.json` — Node dependencies

## What the app does

The Node server now:

- serves the frontend pages from the same project
- exposes `POST /api/chat` for Gemini AI responses
- exposes `POST /api/book` for sending booking emails
- exposes `GET /health` for uptime checks

## Required environment variables

Create a `.env` file with the following values:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-mini
GEMINI_SYSTEM_PROMPT=You are Mr Solveit Automation, an AI assistant for automation consulting, websites, software, CRM systems, and custom business solutions. Always answer as Mr Solveit and use the pricing guidance below.
GEMINI_PRICE_RANGE=$50 to $5,000+ USD depending on scope, integrations, and complexity

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MY_EMAIL=your-email@gmail.com

PORT=3000
```

## Where to get the values

### Gemini API key
- Go to Google AI Studio
- Create a Gemini API key
- Copy the key into `GEMINI_API_KEY`

### SMTP values
For Gmail, do this:
- enable 2-step verification
- create an App Password
- use that App Password in `SMTP_PASS`

Use:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`

### Your email address
- Put your email in `SMTP_USER`
- Put the inbox that should receive requests in `MY_EMAIL`

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Then visit:
- `http://localhost:3000/`
- `http://localhost:3000/services`

## Deploying to Render

1. Push this project to GitHub.
2. Create a new Web Service in Render.
3. Choose this repository.
4. Set the start command to:

```bash
npm start
```

5. Add all environment variables from above in Render.
6. Deploy.

## Deploying to Vercel

Vercel can host static frontends, but this project is a Node server, so Render is the better fit. If you use Vercel, you would need to convert the backend into serverless functions.

## Notes

- Do not commit `.env` to GitHub.
- If you deploy to Render, your app will work as one full project.
- The frontend already calls `/api/chat` and `/api/book`, so it will work automatically when the Node app is hosted.
