# Free-Tier AI Studio

A multi-provider free-tier AI web application that aggregates Google Gemini, Groq LPU, OpenRouter, Mistral, and more into a unified, resilient interface.

## Features

- **Intelligent modality routing**: Chat → Groq, Script → Gemini, Code → specialized models, Research → Gemini with grounding
- **BYOK (Bring Your Own Key)**: Enter free-tier API keys in the UI (stored locally)
- **Fallback cascades** (extensible in the proxy)
- **Artistic, elegant UI** inspired by classical form and light
- **Streaming responses** via Vercel AI SDK
- **Zero marginal inference cost** when using free tiers

## Setup

1. Clone the repo
2. `npm install`
3. Add your free-tier keys in the app Settings, or set environment variables:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `OPENROUTER_API_KEY`
   - `MISTRAL_API_KEY`
4. `npm run dev`

## Deploy

Deployed on Vercel free tier. Push to `main` for automatic deployments.

## Architecture

- Next.js 14 App Router
- Edge runtime proxy (`/api/chat`)
- Client-side key management
- Mode-based provider selection with room for dynamic fallback and key pooling

Built for zero-cost, high-performance AI experiences.
