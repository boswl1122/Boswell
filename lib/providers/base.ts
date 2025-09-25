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