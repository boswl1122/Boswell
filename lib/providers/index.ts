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