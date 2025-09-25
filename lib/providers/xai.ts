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