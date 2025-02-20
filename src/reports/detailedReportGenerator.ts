import * as fs from "fs";
import * as path from "path";
import { AIManager } from "../ai/manager";
import { Logger } from "../utils/logger";

export class DetailedReportGenerator {
  private logger = new Logger();

  /**
   * Generates a final aggregated text report that provides detailed AI insights
   * for only the serious and critical violations for each page. It then sends
   * the aggregated per-page reports back to the AI to get cross-page patterns and stats.
   */
  public async generateDetailedReport(): Promise<void> {
    // Load the basic report from disk
    const basicReportPath = path.join(process.cwd(), "report-basic.json");
    const basicReportRaw = fs.readFileSync(basicReportPath, "utf8");
    const basicReport = JSON.parse(basicReportRaw);

    const finalReportParts: string[] = [];

    // Iterate over each browser report
    for (const browserReport of basicReport.browserReports) {
      const browser = browserReport.browser;
      // Iterate over each page result
      for (const pageResult of browserReport.pageResults) {
        const pageLabel = pageResult.label;
        // Assume violations are in axeResults.violations array.
        const violations = pageResult.axeResults?.violations || [];
        const filteredViolations = violations.filter((v: any) => {
          const impact = (v.impact || "").toLowerCase();
          return impact === "critical" || impact === "serious";
        });

        if (filteredViolations.length === 0) {
          continue;
        }

        // Build a prompt for this page's violations.
        const prompt = this.buildPagePrompt(browser, pageLabel, filteredViolations);
        this.logger.log(`Generating AI insights for ${browser} - ${pageLabel} (${filteredViolations.length} issues)...`);
        
        // Call the LLM to get detailed insights as plain text.
        let pageInsight = "";
        try {
          pageInsight = await AIManager.generateText(prompt);
        } catch (error) {
          pageInsight = `Error generating insights: ${error}`;
        }
        
        // Append page header and insights
        finalReportParts.push(`===== ${browser} - ${pageLabel} =====\n${pageInsight}\n`);
      }
    }

    // Combine all page insights into one aggregated text report.
    let aggregatedTextReport = finalReportParts.join("\n");

    // Now call the LLM one more time to get aggregated stats and cross-page patterns.
    const aggregatedPrompt = this.buildAggregatedPrompt(aggregatedTextReport);
    this.logger.log("Generating aggregated cross-page insights...");
    let aggregatedInsights = "";
    try {
      aggregatedInsights = await AIManager.generateText(aggregatedPrompt);
    } catch (error) {
      aggregatedInsights = `Error generating aggregated insights: ${error}`;
    }

    // Append the aggregated insights at the end of the final report.
    const finalReport = aggregatedTextReport + "\n\n===== Aggregated Insights =====\n" + aggregatedInsights;
    const reportPath = path.join(process.cwd(), "report-ai.txt");
    fs.writeFileSync(reportPath, finalReport, "utf8");
    this.logger.log(`Final AI-enhanced report written to ${reportPath}`);
  }

  /**
   * Builds a prompt for a specific page's filtered violations.
   * @param browser The browser name.
   * @param pageLabel The page label.
   * @param violations The array of serious/critical violation objects.
   * @returns The prompt string.
   */
  private buildPagePrompt(browser: string, pageLabel: string, violations: any[]): string {
    const violationsData = JSON.stringify(violations, null, 2);
    const prompt = `
You are an expert accessibility auditor. You are provided with a JSON array of accessibility violations for a specific page.
Page information:
- Browser: ${browser}
- Page Label: ${pageLabel}

For each violation in the JSON array, provide a detailed analysis that includes the following:
1. Contextual Summary: A brief summary of the violation in context. Include the violation ID and impact from the below violationsData array
2. Impacted Elements: List the HTML elements impacted (using information from the violation's nodes)
3. User-Centric Explanation: Combine the raw impact (serious/critical) with a short statement explaining how the violation affects users (e.g., screen reader users might be unable to perceive content, causing navigation and comprehension issues).
4. User Story/Business Impact: Provide a user story or business impact summary, for example, "When a user with a screen reader tries to fill out the Contact Form, the labeling issue causes confusion leading to form abandonment."
5. WCAG Reference: List the applicable WCAG 2.2 guideline(s) (if available, typically found in the violation's tags).
6. Remediation: Provide detailed remediation recommendations tailored to that violation.

ONLY output a structured plain text response for each violation (e.g., numbered or with clear headings). Do not output any extra commentary.

Below is the JSON array of violations:
${violationsData}
    `;
    return prompt;
  }

  /**
   * Builds a prompt to generate aggregated cross-page insights.
   * @param aggregatedText The complete text report generated from individual pages.
   * @returns The prompt string.
   */
  private buildAggregatedPrompt(aggregatedText: string): string {
    const prompt = `
You are an expert accessibility auditor. You are provided with a detailed plain text report of accessibility issues for multiple pages (each page is separated by clear headers).
Based on this report, please generate an aggregated analysis that includes:
- Overall statistics (e.g., total number of serious/critical violations across pages).
- Common patterns or recurring issues across different pages.
- Any cross-page insights, such as similar remediation recommendations or frequently impacted elements.
- Suggestions for prioritizing remediation efforts at the site level.

ONLY output a plain text summary with clear sections (e.g., Overall Statistics, Common Patterns, Recommendations).
Do NOT output any extra commentary.

Below is the detailed per-page report:
${aggregatedText}
    `;
    return prompt;
  }
}
