import * as fs from "fs";
import * as path from "path";
import { AIManager } from "../ai/manager";
import { Logger } from "../utils/logger";

export class DetailedReportGenerator {
  private logger = new Logger();

  /**
   * Generates a final aggregated text report that provides detailed AI insights
   * for only the serious and critical violations for each page.
   * Reads the basic report from disk, processes it, and writes the detailed report.
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
        // Assume axeResults.violations array exists for each pageResult.
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
        
        // Append to final report parts with a clear separator.
        finalReportParts.push(`===== ${browser} - ${pageLabel} =====\n${pageInsight}\n`);
      }
    }

    const finalReport = finalReportParts.join("\n");
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

For each violation in the JSON array, provide a detailed analysis including:
1. Contextual Summary: A brief summary of the violation in context.
2. Issue Description: A clear description of the problem.
3. Priority: A computed priority based on the axe-core impact (serious/critical) and perceived user experience impact.
4. WCAG Reference: The applicable WCAG 2.2 guideline(s) (if available, typically from the violation's tags).
5. Remediation: Detailed remediation recommendations.

ONLY output a structured plain text response with each violation clearly delineated (e.g., numbered or with headings). Do NOT output any extra commentary outside of the analysis for each violation.

Below is the JSON array of violations:
${violationsData}
    `;
    return prompt;
  }
}
