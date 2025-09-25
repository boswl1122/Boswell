import type { NextApiResponse } from "next";
import { AIProvider } from "./base";

export class OpenAIProvider implements AIProvider {
  // List of models that use max_completion_tokens instead of max_tokens
  private readonly newTokenParamModels = ['gpt-5', 'gpt-5-mini', 'gpt-4.1'];

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

  // Helper method to determine if model uses new parameter
  private usesMaxCompletionTokens(model: string): boolean {
    return this.newTokenParamModels.some(m => model.includes(m));
  }

  async sendMessage(params: {
    apiKey: string;
    model: string;
    prompt: string;
    maxTokens?: number;
    maxCompletionTokens?: number;
  }): Promise<Response> {
    // Determine which parameter to use based on model
    const useNewParam = this.usesMaxCompletionTokens(params.model);
    
    // Only GPT-5 and GPT-5-mini require verification for streaming (not GPT-4.1)
    const requiresVerificationForStream = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'].some(
      m => params.model === m || params.model.startsWith(m + '-')
    );
    
    // Build the request body with the correct parameter
    const requestBody: any = {
      model: params.model,
      stream: !requiresVerificationForStream, // Stream for GPT-4.1, not for GPT-5/5-mini
      messages: [{ role: "user", content: params.prompt }],
    };

    // Add the appropriate token limit parameter
    if (useNewParam) {
      // For new models, use max_completion_tokens
      // Use maxCompletionTokens if provided, otherwise fall back to maxTokens
      requestBody.max_completion_tokens = params.maxCompletionTokens || params.maxTokens || 100000;
    } else {
      // For older models, use max_tokens
      requestBody.max_tokens = params.maxTokens || 4096;
    }

    console.log(`[OpenAI] Using model: ${params.model}, streaming: ${!requiresVerificationForStream}, parameter: ${useNewParam ? 'max_completion_tokens' : 'max_tokens'}, value: ${useNewParam ? requestBody.max_completion_tokens : requestBody.max_tokens}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Store whether this was a non-streaming request
    (response as any).isNonStreaming = requiresVerificationForStream;
    
    return response;
  }

  async parseStreamResponse(response: Response, res: NextApiResponse): Promise<{ chosenModel: string; availableModels: string[] }> {
    if (!response.ok || !response.body) {
      const txt = await response.text().catch(() => "");
      res.write(`\n[STREAM_ERROR] OpenAI error (${response.status}): ${txt || response.statusText}\n`);
      return { chosenModel: "", availableModels: [] };
    }

    // Check if this is a non-streaming response (for GPT-5/5-mini)
    const contentType = response.headers.get('content-type');
    const isNonStreaming = (response as any).isNonStreaming;
    
    if (contentType && contentType.includes('application/json')) {
      // Handle non-streaming response
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && isNonStreaming) {
        // For non-streaming GPT-5 models, send content in chunks to simulate streaming
        // Use smaller chunks for more granular display
        const chunkSize = 200; // Characters per chunk
        
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, Math.min(i + chunkSize, content.length));
          res.write(chunk);
          // Force flush the response
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
          // Small delay to prevent overwhelming the client
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      } else if (content) {
        // For other non-streaming responses, just write it all
        res.write(content);
      }
      return { chosenModel: "", availableModels: [] };
    }

    // Handle normal streaming response (for all other models including GPT-4.1)
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