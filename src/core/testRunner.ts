import { Browser, Page } from "playwright";
import { PlaywrightDriver } from "../drivers/playwrightDriver";
import { KeyboardNavigator } from "./keyboardNavigator";
import { ReportGenerator } from "../reports/reportGenerator";
import { DetailedReportGenerator } from "../reports/detailedReportGenerator";
import config from "../../config/config.json";
import { Logger } from "../utils/logger";
import * as fs from "fs";

export class TestRunner {
  private browserDriver: PlaywrightDriver;
  private reportGenerator: ReportGenerator;
  private detailedReportGenerator: DetailedReportGenerator;
  private logger: Logger;
  private browser!: Browser;
  private page!: Page;

  constructor() {
    this.browserDriver = new PlaywrightDriver();
    this.reportGenerator = new ReportGenerator();
    this.detailedReportGenerator = new DetailedReportGenerator();
    this.logger = new Logger();
  }

  public async run(): Promise<void> {
    try {
      // Launch browser (Chrome only for POC)
      this.browser = await this.browserDriver.launchBrowser();
      this.page = await this.browser.newPage();

      const aggregatedResults: any[] = [];

      // 1. Homepage Scan
      this.logger.log("Starting Homepage Scan...");
      await this.page.goto(config.AUT, { timeout: config.globalTimeout });
      await this.page.waitForLoadState("load");
      await this.injectAxe();
      const homepageResults = await this.runAxeScan("Homepage");
      aggregatedResults.push(homepageResults);

      // 2. Menu Accessibility and Keyboard Navigation
      this.logger.log("Starting Menu Accessibility and Keyboard Navigation...");
      const menus = ["Courses", "Study with Us", "International"];
      for (const menu of menus) {
        this.logger.log(`Testing menu: ${menu}`);
        // Hover over the dropdown menu item
        await this.page.hover("li.dropdown-menu-primary");
        // Locate the correct menu item
        const menuSelector = this.page.locator("li.dropdown-menu-primary > a", {
          hasText: menu,
        });
        await menuSelector.waitFor({ state: "visible" });
        await menuSelector.hover();
        await this.page.waitForTimeout(200);
        const submenuResults = await this.runAxeScan(`${menu} - Submenu`);
        aggregatedResults.push(submenuResults);

        // Keyboard Navigation Flow
        const keyboardNavigator = new KeyboardNavigator(this.page, config.screenshotsDir);
        const keyboardNavResults = await keyboardNavigator.simulateNavigation(`${menu} - Keyboard Navigation`);
        aggregatedResults.push(keyboardNavResults);
      }

      // 3. RMIT Online and "Get in Touch" Flow
      this.logger.log('Starting RMIT Online and "Get in Touch" Flow...');
      const rmitOnlineLink = this.page.locator("nav .topnav-mainlinks", { hasText: "RMIT Online" });
      await rmitOnlineLink.waitFor({ state: "visible" });
      await rmitOnlineLink.click();
      await this.page.waitForLoadState("networkidle");

      const getInTouchSelector = this.page.locator('[data-test="social-contact"] >> text="Get in touch"');
      await getInTouchSelector.waitFor({ state: "visible" });
      await getInTouchSelector.click();
      await this.page.waitForLoadState("load");
      await this.injectAxe();
      const contactFormResults = await this.runAxeScan("Contact Form");
      aggregatedResults.push(contactFormResults);

      // Compose final basic report
      const basicReport: any = {
        browserReports: [
          {
            browser: "chrome",
            pageResults: aggregatedResults,
            errors: []
          }
        ]
      };

      // Write basic report to disk
      await this.reportGenerator.generateReport(basicReport, "report-basic.json");
      this.logger.log("Basic report written to report-basic.json");

      // Generate detailed AI-enhanced report per page
      await this.detailedReportGenerator.generateDetailedReport();

      this.logger.log("Test Runner completed successfully.");
    } catch (error) {
      this.logger.error("Error in TestRunner: " + error);
    } finally {
      await this.browser?.close();
    }
  }

  private async injectAxe(): Promise<void> {
    const axePath = require.resolve("axe-core/axe.min.js");
    const axeSource = fs.readFileSync(axePath, "utf8");
    await this.page.addScriptTag({ content: axeSource });
  }

  private async runAxeScan(label: string): Promise<any> {
    const axeResults = await this.page.evaluate(async () => {
      // @ts-ignore
      return await axe.run();
    });
    return { label, axeResults, errors: [] };
  }
}
