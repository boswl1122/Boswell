// lib/providers/base.ts
import type { NextApiResponse } from "next";

export interface AIProvider {
  listModels(apiKey: string): Promise<string[]>;
  sendMessage(params: {
    apiKey: string;
    model: string;
    prompt: string;
    maxTokens: number;
  }): Promise<Response>;
  parseStreamResponse(response: Response, res: NextApiResponse): Promise<{ chosenModel: string; availableModels: string[] }>;
  pickModel(available: string[], requested?: string): string;
}

// lib/providers/claude.ts
import type { NextApiResponse } from "next";
import { AIProvider } from "./base";

export class ClaudeProvider implements AIProvider {
  async listModels(apiKey: string): Promise<string[]> {
    const r = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`listModels failed: ${r.status} ${txt || r.statusText}`);
    }
    const data = (await r.json()) as { data: { id: string }[] };
    return data.data.map(m => m.id);
  }

  pickModel(available: string[], requested?: string): string {
    if (requested && available.includes(requested)) return requested;

    // Prefer Opus 4.1 if available
    const opus41 = ["claude-opus-4-1-20250805", "claude-opus-4-1", "claude-opus-4-0"];
    for (const id of opus41) if (available.includes(id)) return id;

    // Fallbacks
    const sonnet4 = available.find(v => v.startsWith("claude-sonnet-4"));
    if (sonnet4) return sonnet4;
    const sonnet37 = available.find(v => v.startsWith("claude-3-7-sonnet"));
    if (sonnet37) return sonnet37;
    const haiku35 = available.find(v => v.startsWith("claude-3-5-haiku"));
    if (haiku35) return haiku35;

    return available[0];
  }

  async sendMessage(params: {
    apiKey: string;
    model: string;
    prompt: string;
    maxTokens: number;
  }): Promise<Response> {
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": params.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        stream: true,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });
  }

  async parseStreamResponse(response: Response, res: NextApiResponse): Promise<{ chosenModel: string; availableModels: string[] }> {
    if (!response.ok || !response.body) {
      const txt = await response.text().catch(() => "");
      res.write(`\n[STREAM_ERROR] Anthropic error (${response.status}): ${txt || response.statusText}\n`);
      return { chosenModel: "", availableModels: [] };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const flushLines = () => {
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;

        if (line.startsWith("data:")) {
          try {
            const evt = JSON.parse(line.slice(5).trim());

            if (evt?.type === "content_block_delta" && evt?.delta?.type === "text_delta") {
              res.write(evt.delta.text);
            }
            if (evt?.type === "error") {
              res.write(`\n[STREAM_ERROR] ${evt.error?.message || "unknown"}\n`);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      flushLines();
    }
    flushLines();

    return { chosenModel: "", availableModels: [] }; // These will be filled by the main handler
  }
}

// lib/providers/openai.ts
import type { NextApiResponse } from "next";
import { AIProvider } from "./base";

export class OpenAIProvider implements AIProvider {
  async listModels(apiKey: string): Promise<string[]> {
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`listModels failed: ${r.status} ${txt || r.statusText}`);
    }
    const data = (await r.json()) as { data: { id: string }[] };
    return data.data.map(m => m.id);
  }

  pickModel(available: string[], requested?: string): string {
    if (requested && available.includes(requested)) return requested;

    // Prefer GPT-5 family for latest capabilities
    const gpt5 = available.find(v => v === "gpt-5");
    if (gpt5) return gpt5;
    
    const gpt5Mini = available.find(v => v === "gpt-5-mini");
    if (gpt5Mini) return gpt5Mini;
    
    const gpt41 = available.find(v => v === "gpt-4.1");
    if (gpt41) return gpt41;
    
    const gpt4o = available.find(v => v.includes("gpt-4o"));
    if (gpt4o) return gpt4o;

    return available[0];
  }

  async sendMessage(params: {
    apiKey: string;
    model: string;
    prompt: string;
    maxTokens: number;
  }): Promise<Response> {
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        stream: true,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });
  }

  async parseStreamResponse(response: Response, res: NextApiResponse): Promise<{ chosenModel: string; availableModels: string[] }> {
    if (!response.ok || !response.body) {
      const txt = await response.text().catch(() => "");
      res.write(`\n[STREAM_ERROR] OpenAI error (${response.status}): ${txt || response.statusText}\n`);
      return { chosenModel: "", availableModels: [] };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const flushLines = () => {
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;

        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") return;
          
          try {
            const evt = JSON.parse(data);
            const content = evt?.choices?.[0]?.delta?.content;
            if (content) {
              res.write(content);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      flushLines();
    }
    flushLines();

    return { chosenModel: "", availableModels: [] };
  }
}


import type { NextApiResponse } from "next";
import { AIProvider } from "./base";

export class XaiProvider implements AIProvider {
  async listModels(apiKey: string): Promise<string[]> {
    const r = await fetch("https://api.x.ai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`listModels failed: ${r.status} ${txt || r.statusText}`);
    }
    const data = (await r.json()) as { data: { id: string }[] };
    return data.data.map(m => m.id);
  }

  pickModel(available: string[], requested?: string): string {
    if (requested && available.includes(requested)) return requested;

    // Prefer Grok 4 models for long-form writing
    const grok4Reasoning = available.find(v => v.includes("grok-4-fast-reasoning"));
    if (grok4Reasoning) return grok4Reasoning;
    
    const grok4Fast = available.find(v => v.includes("grok-4-fast-non-reasoning"));
    if (grok4Fast) return grok4Fast;
    
    const grok4Premium = available.find(v => v.includes("grok-4-0709"));
    if (grok4Premium) return grok4Premium;
    
    const grok3 = available.find(v => v.includes("grok-3"));
    if (grok3) return grok3;

    return available[0];
  }

  async sendMessage(params: {
    apiKey: string;
    model: string;
    prompt: string;
    maxTokens: number;
  }): Promise<Response> {
    return fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        stream: true,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });
  }

  async parseStreamResponse(response: Response, res: NextApiResponse): Promise<{ chosenModel: string; availableModels: string[] }> {
    if (!response.ok || !response.body) {
      const txt = await response.text().catch(() => "");
      res.write(`\n[STREAM_ERROR] X.ai error (${response.status}): ${txt || response.statusText}\n`);
      return { chosenModel: "", availableModels: [] };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const flushLines = () => {
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;

        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") return;
          
          try {
            const evt = JSON.parse(data);
            const content = evt?.choices?.[0]?.delta?.content;
            if (content) {
              res.write(content);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      flushLines();
    }
    flushLines();

    return { chosenModel: "", availableModels: [] };
  }
}

// lib/providers/index.ts
import { ClaudeProvider } from "./claude";
import { XaiProvider } from "./xai";
import { OpenAIProvider } from "./openai";
import { AIProvider } from "./base";

export const providers = {
  claude: new ClaudeProvider(),
  xai: new XaiProvider(),
  openai: new OpenAIProvider(),
} as const;

export type ProviderName = keyof typeof providers;

export function getProvider(name: ProviderName): AIProvider {
  return providers[name];
}

export function getApiKey(provider: ProviderName): string {
  switch (provider) {
    case "claude":
      const claudeKey = process.env.ANTHROPIC_API_KEY?.trim();
      if (!claudeKey) throw new Error("Missing ANTHROPIC_API_KEY");
      return claudeKey;
    case "xai":
      const xaiKey = process.env.XAI_API_KEY?.trim();
      if (!xaiKey) throw new Error("Missing XAI_API_KEY");
      return xaiKey;
    case "openai":
      const openaiKey = process.env.OPENAI_API_KEY?.trim();
      if (!openaiKey) throw new Error("Missing OPENAI_API_KEY");
      return openaiKey;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// lib/models.ts
export interface ModelConfig {
  provider: ProviderName;
  contextLength: number;
  maxTokens: number;
  displayName: string;
}

export const MODELS: Record<string, ModelConfig> = {
    // Claude models (unchanged)
    "claude-opus-4-1-20250805": {
      provider: "claude",
      contextLength: 200000,
      maxTokens: 28000,
      displayName: "Claude Opus 4.1"
    },
    "claude-opus-4-20250514": {
      provider: "claude", 
      contextLength: 200000,
      maxTokens: 28000,
      displayName: "Claude Opus 4"
    },
    "claude-sonnet-4-20250514": {
      provider: "claude",
      contextLength: 200000,
      maxTokens: 28000,
      displayName: "Claude Sonnet 4"
    },
    "claude-3-7-sonnet-20250219": {
      provider: "claude",
      contextLength: 200000,
      maxTokens: 28000,
      displayName: "Claude 3.7 Sonnet"
    },
    "claude-3-5-haiku-20241022": {
      provider: "claude",
      contextLength: 200000,
      maxTokens: 28000,
      displayName: "Claude 3.5 Haiku"
    },
    
      // X.ai models - FIXED FOR HIDDEN REASONING TOKENS
  "grok-4-fast-reasoning": {
    provider: "xai",
    contextLength: 256000,  
    maxTokens: 100000,      // MASSIVE increase to account for hidden reasoning tokens
    displayName: "Grok 4 Fast (Reasoning)"
  },
  "grok-4-fast-non-reasoning": {
    provider: "xai", 
    contextLength: 256000,  
    maxTokens: 100000,      // MASSIVE increase to account for hidden reasoning tokens
    displayName: "Grok 4 Fast"
  },
  "grok-4-0709": {
    provider: "xai",
    contextLength: 256000,  
    maxTokens: 100000,      // MASSIVE increase from 50K to 100K for reasoning overhead
    displayName: "Grok 4 (Premium)"
  },
  "grok-3": {
    provider: "xai",
    contextLength: 131072,   
    maxTokens: 50000,       // Increased for reasoning overhead
    displayName: "Grok 3"
  },
  
    // OpenAI models (unchanged)
    "gpt-5": {
      provider: "openai",
      contextLength: 400000,
      maxTokens: 128000,
      displayName: "GPT-5"
    },
    "gpt-5-mini": {
      provider: "openai",
      contextLength: 400000,
      maxTokens: 128000,
      displayName: "GPT-5 Mini"
    },
    "gpt-5-nano": {
      provider: "openai",
      contextLength: 400000,
      maxTokens: 128000,
      displayName: "GPT-5 Nano"
    },
    "gpt-4.1": {
      provider: "openai",
      contextLength: 1000000,
      maxTokens: 128000,
      displayName: "GPT-4.1"
    },
  };

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS[modelId];
}

export function getModelsByProvider(provider: ProviderName): string[] {
  return Object.keys(MODELS).filter(model => MODELS[model].provider === provider);
}

// pages/api/chat.ts (refactored from claude.ts)
import type { NextApiRequest, NextApiResponse } from "next";
import { getProvider, getApiKey, ProviderName } from "../../lib/providers";
import { getModelConfig, MODELS } from "../../lib/models";

// Allow large assembled prompts from the UI
export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

function detectProviderFromModel(model: string): ProviderName {
  const config = getModelConfig(model);
  if (config) return config.provider;
  
  // Fallback detection
  if (model.startsWith("claude")) return "claude";
  if (model.includes("grok")) return "xai";
  if (model.startsWith("gpt")) return "openai";
  
  return "claude"; // default
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { prompt, model: requestedModel, maxTokens, provider: requestedProvider } =
    (req.body ?? {}) as { 
      prompt?: string; 
      model?: string; 
      maxTokens?: number;
      provider?: ProviderName;
    };

  if (!prompt || typeof prompt !== "string" || prompt.length < 10) {
    return res.status(400).json({ error: "Missing/short 'prompt' string in body" });
  }

  try {
    // Determine provider - either explicitly passed or detected from model
    const providerName = requestedProvider || detectProviderFromModel(requestedModel || "");
    const provider = getProvider(providerName);
    const apiKey = getApiKey(providerName);

    // Discover available models for this provider
    const available = await provider.listModels(apiKey);
    const chosenModel = provider.pickModel(available, requestedModel);

    // Stream plain text back to the browser
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    // Decide output budget - use model config or fallback to your current logic
    const modelConfig = getModelConfig(chosenModel);
    const defaultMaxTokens = modelConfig?.maxTokens || 28000; // Keep your high default
    const requested = typeof maxTokens === "number" && maxTokens > 0 ? maxTokens : defaultMaxTokens;

    const response = await provider.sendMessage({
      apiKey,
      model: chosenModel,
      prompt,
      maxTokens: requested,
    });

    await provider.parseStreamResponse(response, res);

    res.write(`\n\n[END]\n[_meta:${JSON.stringify({ 
      chosenModel, 
      availableModels: available,
      provider: providerName 
    })}]\n`);
    res.end();
  } catch (err: any) {
    res.status(200).write(`\n[STREAM_ERROR] ${err?.message || String(err)}\n`);
    res.end();
  }
}