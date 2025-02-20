import { AI_CONFIG } from "../../config/ai.config";
import { LLMResponseParser } from "./llm_response_parser";

export class AIManager {
  /**
   * Low-level method: call Ollama with "stream": false => single JSON chunk.
   */
  private static async callOllama(prompt: string): Promise<string> {
    const body = {
      prompt,
      model: AI_CONFIG.model.name,
      options: {
        //num_ctx: 8192,
        num_ctx: 10240,
      },
      stream: false,
    };

    const url = AI_CONFIG.api.baseUrl + AI_CONFIG.api.endpoints.generate;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama request failed [${response.status}]: ${errorText}`
      );
    }
    return await response.text();
  }

  /**
   * Public method to generate AI output as raw text using the prompt.
   */
  public static async generate(prompt: string): Promise<string> {
    return await this.callOllama(prompt);
  }

  /**
   * New method: Generate and parse AI output.
   * Uses the full LLMResponseParser to clean and structure the output.
   *
   * @param prompt The prompt for the LLM.
   * @param expectedType Expected type of the parsed JSON ("object", "array", or "any").
   * @returns Parsed JSON response.
   */
  public static async generateParsed(
    prompt: string,
    expectedType: "object" | "array" | "any" = "any"
  ): Promise<any> {
    const raw = await this.callOllama(prompt);
    return LLMResponseParser.parseLLMResponse(raw, expectedType);
  }

  /**
   * Generates the AI output as plain text.
   *
   * @param prompt The prompt for the LLM.
   * @returns The plain text response from the LLM (extracted from the "response" field).
   */
  public static async generateText(prompt: string): Promise<string> {
    const raw = await this.callOllama(prompt);
    // Parse the top-level response; we expect it to be a JSON string.
    const top = JSON.parse(raw) as { model: string; response: string; done: boolean };
    return top.response.trim();
  }
}
