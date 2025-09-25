// pages/api/claude.ts
import type { NextApiRequest, NextApiResponse } from "next";

// Allow large assembled prompts from the UI
export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

type AnthropicModel = { id: string };

async function listModels(apiKey: string) {
  const r = await fetch("https://api.anthropic.com/v1/models", {
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`listModels failed: ${r.status} ${txt || r.statusText}`);
  }
  const data = (await r.json()) as { data: AnthropicModel[] };
  return data.data.map(m => m.id);
}

function pickModel(avail: string[], requested?: string) {
  if (requested && avail.includes(requested)) return requested;

  // Prefer Opus 4.1 if available
  const opus41 = ["claude-opus-4-1-20250805", "claude-opus-4-1", "claude-opus-4-0"];
  for (const id of opus41) if (avail.includes(id)) return id;

  // Fallbacks
  const sonnet4 = avail.find(v => v.startsWith("claude-sonnet-4"));
  if (sonnet4) return sonnet4;
  const sonnet37 = avail.find(v => v.startsWith("claude-3-7-sonnet"));
  if (sonnet37) return sonnet37;
  const haiku35 = avail.find(v => v.startsWith("claude-3-5-haiku"));
  if (haiku35) return haiku35;

  return avail[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });

  const { prompt, model: requestedModel, maxTokens } =
    (req.body ?? {}) as { prompt?: string; model?: string; maxTokens?: number };

  if (!prompt || typeof prompt !== "string" || prompt.length < 10) {
    return res.status(400).json({ error: "Missing/short 'prompt' string in body" });
  }

  try {
    // Discover available models for this key
    const available = await listModels(apiKey);
    const chosenModel = pickModel(available, requestedModel);

    // Stream plain text back to the browser
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    // Decide output budget. Keep high, but let UI override.
    const requested = typeof maxTokens === "number" && maxTokens > 0 ? maxTokens : 28000;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: requested,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok || !r.body) {
      const txt = await r.text().catch(() => "");
      res.write(`\n[STREAM_ERROR] Anthropic error (${r.status}): ${txt || r.statusText}\n`);
      return res.end();
    }

    // Parse Anthropic SSE and forward text deltas only
    const reader = r.body.getReader();
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

    res.write(`\n\n[END]\n[_meta:${JSON.stringify({ chosenModel, availableModels: available })}]\n`);
    res.end();
  } catch (err: any) {
    res.status(200).write(`\n[STREAM_ERROR] ${err?.message || String(err)}\n`);
    res.end();
  }
}