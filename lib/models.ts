import { ProviderName } from "./providers";

export interface ModelConfig {
  provider: ProviderName;
  contextLength: number;
  maxTokens: number;
  displayName: string;
}

export const MODELS: Record<string, ModelConfig> = {
  // Claude models
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
  
  // X.ai models - optimized for long-form writing
  "grok-4-fast-reasoning": {
    provider: "xai",
    contextLength: 2000000,
    maxTokens: 8192,
    displayName: "Grok 4 Fast (Reasoning)"
  },
  "grok-4-fast-non-reasoning": {
    provider: "xai", 
    contextLength: 2000000,
    maxTokens: 8192,
    displayName: "Grok 4 Fast"
  },
  "grok-4-0709": {
    provider: "xai",
    contextLength: 256000,
    maxTokens: 8192,
    displayName: "Grok 4 (Premium)"
  },
  "grok-3": {
    provider: "xai",
    contextLength: 131072,
    maxTokens: 4096,
    displayName: "Grok 3"
  },

  // OpenAI models - current generation
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