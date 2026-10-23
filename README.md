# Wahid & Wasiq AI Studio

A multi-provider free-tier AI web application aggregating Google Gemini, Groq LPU, OpenRouter, Mistral, and more into a unified, resilient interface.

**Company:** Wahid & Wasiq AI Studio

## Features

- Intelligent modality routing: Chat → Groq LPU, Script → Gemini, Code → specialized models, Research → Gemini
- BYOK (Bring Your Own Key) — keys stored locally in the browser
- Elegant artistic interface with monogram branding
- Streaming responses via Vercel AI SDK
- Zero marginal inference cost on free tiers

## Setup

1. Clone the repo
2. `npm install`
3. Enter free-tier API keys in the Settings panel, or set environment variables:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `OPENROUTER_API_KEY`
   - `MISTRAL_API_KEY`
4. `npm run dev`

## Deploy

Deploy on Vercel free tier. Import the repository and deploy.

Built as a composed studio of free-tier intelligence.
