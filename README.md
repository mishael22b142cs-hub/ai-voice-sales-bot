# AI Voice Sales Bot

A working AI voice sales bot built for the Sankar Group intern assignment. It conducts a live
voice conversation in the browser, shows a real-time chat transcript, records the call, generates
an AI summary, and classifies the call into a sales status — all with call history for playback.

## How it works

- **Voice**: Uses the browser's built-in Web Speech API — `SpeechSynthesis` for the bot's voice
  and `SpeechRecognition` for understanding the customer. No extra voice API key needed. Works
  best in **Google Chrome on desktop**.
- **Conversation brain**: Each customer utterance is sent to `/api/chat`, which calls the
  Google Gemini API (free tier) with a sales system prompt (product info, pricing, objection
  handling) and returns the bot's next spoken reply.
- **Recording**: `MediaRecorder` captures the microphone audio for the whole call. After consent,
  recording starts automatically when you press Start Call.
- **AI Summary + Sales Status**: When you press End Call, the full transcript is sent to
  `/api/analyze`, which asks Gemini to return a structured JSON summary, customer requirements,
  objections, next steps, and one of: Converted, Interested, Follow-up Required, Not Interested,
  Demo Requested, No Response.
- **Call History**: Every call (transcript, recording, summary, status) is saved to the browser's
  IndexedDB (via `idb-keyval`) — no backend database needed. The history list lets you expand a
  past call, play back the recording, and read the transcript/summary.
- **Product being sold**: Configured in `lib/product.ts` — edit this file to pitch any SaaS
  product you like (name, features, pricing, objections). Defaults to a sample product called
  "FlowDesk".

## Running locally

1. Install dependencies:
   ```
   npm install
   ```
2. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   (sign in with Google, click "Create API key" — no credit card needed). Then copy the env file
   and add it:
   ```
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set `GEMINI_API_KEY=...`.
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in **Google Chrome**, allow microphone
   access when prompted, accept the recording consent, and press **Start Call**.

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Add an environment variable `GEMINI_API_KEY` with your key in the Vercel project settings.
4. Deploy — you'll get a public URL to submit.

Note: voice features require HTTPS and Chrome, both of which Vercel's deployment URL satisfies.

## Project structure

```
app/
  page.tsx            Main call UI (chat, controls, result, history)
  api/chat/route.ts    Conversation turn endpoint (Gemini)
  api/analyze/route.ts Summary + sales status endpoint (Gemini)
components/            UI pieces: chat bubbles, call controls, consent modal, history list
lib/
  useCallEngine.ts      Core state machine: mic capture, recognition, TTS, recording, saving
  product.ts            Editable SaaS product config the bot sells
  llm.ts                 Gemini client + system prompt
  db.ts                  IndexedDB storage for call history
  types.ts               Shared TypeScript types
```
