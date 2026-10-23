import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const runtime = 'edge';

const providerMap: Record<string, { primary: string; model: string; baseURL?: string }> = {
  chat: { primary: 'groq', model: 'llama-3.1-8b-instant', baseURL: 'https://api.groq.com/openai/v1' },
  script: { primary: 'gemini', model: 'gemini-1.5-flash' },
  code: { primary: 'groq', model: 'qwen2.5-coder-32b', baseURL: 'https://api.groq.com/openai/v1' },
  research: { primary: 'gemini', model: 'gemini-1.5-flash' },
};

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, keys } = await req.json();

    if (!messages || !mode) {
      return NextResponse.json({ error: 'Missing messages or mode' }, { status: 400 });
    }

    const config = providerMap[mode] || providerMap.chat;
    const key = keys?.[config.primary] || process.env[`${config.primary.toUpperCase()}_API_KEY`];

    if (!key) {
      return NextResponse.json(
        { error: `No API key provided for ${config.primary}. Add it in Settings or as a Vercel environment variable.` },
        { status: 400 }
      );
    }

    let model;
    if (config.primary === 'groq' || config.primary === 'openrouter') {
      const openai = createOpenAI({
        apiKey: key,
        baseURL: config.baseURL || (config.primary === 'openrouter' ? 'https://openrouter.ai/api/v1' : undefined),
      });
      model = openai(config.model);
    } else if (config.primary === 'gemini') {
      const google = createGoogleGenerativeAI({ apiKey: key });
      model = google(config.model);
    } else {
      // Fallback to OpenAI-compatible
      const openai = createOpenAI({ apiKey: key, baseURL: config.baseURL });
      model = openai(config.model);
    }

    const result = await streamText({
      model,
      messages,
      system: mode === 'research'
        ? 'You are a research assistant. Use up-to-date knowledge and cite sources when possible.'
        : mode === 'code'
        ? 'You are an expert coding assistant. Provide clean, well-commented code.'
        : mode === 'script'
        ? 'You are a skilled screenwriter and long-form writer. Produce polished, structured prose.'
        : 'You are a helpful, fast conversational assistant.',
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
