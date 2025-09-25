// pages/api/chat.ts
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

  const { 
    prompt, 
    model: requestedModel, 
    maxTokens, 
    maxCompletionTokens,
    provider: requestedProvider 
  } = (req.body ?? {}) as { 
    prompt?: string; 
    model?: string; 
    maxTokens?: number;
    maxCompletionTokens?: number;
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
    const defaultMaxTokens = modelConfig?.maxTokens || 28000;
    
    // For OpenAI newer models, prefer maxCompletionTokens if provided
    const isOpenAINewModel = ['gpt-5', 'gpt-5-mini', 'gpt-4.1'].some(m => chosenModel.includes(m));
    
    let tokenParams: { maxTokens?: number; maxCompletionTokens?: number } = {};
    
    if (isOpenAINewModel && providerName === "openai") {
      // For new OpenAI models, use maxCompletionTokens
      tokenParams.maxCompletionTokens = maxCompletionTokens || maxTokens || defaultMaxTokens;
      // Also pass maxTokens as fallback for the provider to handle
      tokenParams.maxTokens = maxTokens || defaultMaxTokens;
    } else {
      // For all other models, use maxTokens
      tokenParams.maxTokens = maxTokens || defaultMaxTokens;
    }

    console.log(`[API] Using model: ${chosenModel}, provider: ${providerName}, params:`, tokenParams);

    const response = await provider.sendMessage({
      apiKey,
      model: chosenModel,
      prompt,
      ...tokenParams
    });

    await provider.parseStreamResponse(response, res);

    res.write(`\n\n[END]\n[_meta:${JSON.stringify({ 
      chosenModel, 
      availableModels: available,
      provider: providerName,
      tokenParams
    })}]\n`);
    res.end();
  } catch (err: any) {
    console.error('[API Error]', err);
    res.status(200).write(`\n[STREAM_ERROR] ${err?.message || String(err)}\n`);
    res.end();
  }
}