import { AIManager } from "./manager";

export class AIClient {
  /**
   * Analyzes aggregated axe-core results and returns a plain text accessibility analysis.
   * (This method is used when you want a single, comprehensive plain text response.)
   * @param aggregatedData - The combined results from all test flows.
   */
  public async analyzeResultsTextGen(aggregatedData: any): Promise<string> {
    const prompt = this.buildTextPrompt(aggregatedData);
    try {
      const textResult = await AIManager.generateText(prompt);
      return textResult;
    } catch (error) {
      throw new Error(`AI analysis failed: ${error}`);
    }
  }

  /**
   * Constructs the prompt for generating a plain text accessibility analysis.
   *
   * The prompt instructs the LLM to produce a comprehensive report with the following sections:
   *   1. CONTEXTUAL ANALYSIS
   *   2. AGGREGATION AND PRIORITIZATION
   *   3. REMEDIATION SUGGESTIONS
   *
   * Below is the aggregated axe-core accessibility report data:
   * <<DATA>>
   */
  private buildTextPrompt(aggregatedData: any): string {
    const defaultPrompt = `
You are an expert accessibility auditor. Based on the aggregated axe-core results provided below, generate a comprehensive accessibility analysis report as plain text. Your report must include the following sections:

1. CONTEXTUAL ANALYSIS:
   Provide a detailed summary of the overall accessibility issues, their impact on the end-user experience, and how they relate to WCAG 2.2 standards.

2. AGGREGATION AND PRIORITIZATION:
   Provide a prioritized list of accessibility issues, taking into account severity, frequency, and potential user impact.

3. REMEDIATION SUGGESTIONS:
   For each issue, provide detailed remediation guidance, including references to the appropriate WCAG 2.2 guideline(s) (e.g., 1.1.1, 1.3.1, etc.).

ONLY output plain text with clear section headings. Do NOT include any JSON formatting, markdown code fences, or extra keys.

Below is the aggregated axe-core accessibility report data:
<<DATA>>
    `;
    return defaultPrompt.replace("<<DATA>>", JSON.stringify(aggregatedData, null, 2));
  }
}
