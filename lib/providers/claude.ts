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