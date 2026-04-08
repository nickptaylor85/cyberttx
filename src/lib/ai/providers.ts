/**
 * AI Provider Abstraction Layer
 * Supports: Anthropic Claude, OpenAI GPT, Google Gemini
 * BYOK (Bring Your Own Key) for Pro and Enterprise tiers
 */

export type AIProvider = "anthropic" | "openai" | "google";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string; // Override default model
}

export interface AICompletionParams {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

export interface AICompletionResult {
  text: string;
  truncated: boolean;
  model: string;
  provider: AIProvider;
}

// Default models per provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  google: "gemini-2.5-flash-preview-04-17",
};

// Human-readable provider names
export const PROVIDER_INFO: Record<AIProvider, { name: string; description: string; models: { id: string; name: string }[] }> = {
  anthropic: {
    name: "Anthropic Claude",
    description: "Claude Sonnet and Haiku models. Excellent at structured output and reasoning.",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4 (Recommended)" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Faster)" },
    ],
  },
  openai: {
    name: "OpenAI",
    description: "GPT-4o and o3 models. Native JSON mode guarantees valid JSON output.",
    models: [
      { id: "gpt-4o", name: "GPT-4o (Recommended)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Faster)" },
      { id: "o3-mini", name: "o3 Mini (Reasoning)" },
    ],
  },
  google: {
    name: "Google Gemini",
    description: "Gemini 2.5 Pro and Flash models. Fast and cost-effective.",
    models: [
      { id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash (Recommended)" },
      { id: "gemini-2.5-pro-preview-05-06", name: "Gemini 2.5 Pro (Most capable)" },
    ],
  },
};

/**
 * Get the platform default provider config (uses ThreatCast's Anthropic key)
 */
export function getDefaultProvider(): AIProviderConfig {
  return {
    provider: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: "claude-sonnet-4-20250514",
  };
}

/**
 * Complete a prompt using the specified provider
 */
export async function aiComplete(config: AIProviderConfig, params: AICompletionParams): Promise<AICompletionResult> {
  const model = config.model || DEFAULT_MODELS[config.provider];

  switch (config.provider) {
    case "anthropic":
      return completeAnthropic(config.apiKey, model, params);
    case "openai":
      return completeOpenAI(config.apiKey, model, params);
    case "google":
      return completeGoogle(config.apiKey, model, params);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Validate an API key by making a minimal test call
 */
export async function validateApiKey(provider: AIProvider, apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case "anthropic": {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey });
        await client.messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "Hi" }] });
        return { valid: true };
      }
      case "openai": {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey });
        await client.chat.completions.create({ model: "gpt-4o-mini", max_tokens: 10, messages: [{ role: "user", content: "Hi" }] });
        return { valid: true };
      }
      case "google": {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
        await model.generateContent("Hi");
        return { valid: true };
      }
    }
  } catch (e: any) {
    return { valid: false, error: e?.message || "Invalid API key" };
  }
}

// ─── Provider Implementations ───────────────────────────────────

async function completeAnthropic(apiKey: string, model: string, params: AICompletionParams): Promise<AICompletionResult> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens,
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.userPrompt }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  return {
    text: textBlock?.type === "text" ? textBlock.text : "",
    truncated: response.stop_reason === "max_tokens",
    model,
    provider: "anthropic",
  };
}

async function completeOpenAI(apiKey: string, model: string, params: AICompletionParams): Promise<AICompletionResult> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model,
    max_tokens: params.maxTokens,
    response_format: { type: "json_object" }, // Guarantees valid JSON!
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content || "";
  return {
    text,
    truncated: response.choices[0]?.finish_reason === "length",
    model,
    provider: "openai",
  };
}

async function completeGoogle(apiKey: string, model: string, params: AICompletionParams): Promise<AICompletionResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(apiKey);

  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: params.systemPrompt,
    generationConfig: {
      maxOutputTokens: params.maxTokens,
      responseMimeType: "application/json", // JSON mode for Gemini
    },
  });

  const result = await genModel.generateContent(params.userPrompt);
  const text = result.response.text();

  return {
    text,
    truncated: false, // Gemini doesn't easily expose this
    model,
    provider: "google",
  };
}
