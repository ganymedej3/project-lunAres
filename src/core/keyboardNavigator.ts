import { Page } from 'playwright';
import { Logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

export class KeyboardNavigator {
  private page: Page;
  private screenshotsDir: string;
  private logger: Logger;

  constructor(page: Page, screenshotsDir: string) {
    this.page = page;
    this.screenshotsDir = screenshotsDir;
    this.logger = new Logger();
  }

  /**
   * Simulates keyboard navigation by sending Tab key presses.
   * Captures a screenshot for the first Tab press and logs details of the focused element.
   * Also performs a deterministic check on the element’s focus indicator.
   * @param flowLabel - A label for the navigation flow.
   */
  public async simulateNavigation(flowLabel: string): Promise<any> {
    const navigationResults = {
      label: flowLabel,
      keyboardNavigation: [] as any[],
      screenshotPath: '',
      errors: [] as string[]
    };

    try {
      // Ensure screenshots directory exists
      if (!fs.existsSync(this.screenshotsDir)) {
        fs.mkdirSync(this.screenshotsDir, { recursive: true });
      }

      const numTabs = 5;
      for (let i = 0; i < numTabs; i++) {
        await this.page.keyboard.press('Tab');

        // Capture a screenshot only for the first Tab press
        if (i === 0) {
          const screenshotPath = path.join(this.screenshotsDir, `keyboard_navigation_${Date.now()}.png`);
          await this.page.screenshot({ path: screenshotPath });
          navigationResults.screenshotPath = screenshotPath;
        }

        // Capture details of the focused element
        const focusedElement = await this.page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          const styles = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            classList: Array.from(el.classList),
            outline: styles.outline,
            boxShadow: styles.boxShadow
          };
        });
        navigationResults.keyboardNavigation.push(focusedElement);

        // Deterministic check: verify a focus indicator is present
        if (focusedElement) {
          const hasFocusIndicator = this.hasFocusIndicator(focusedElement);
          if (!hasFocusIndicator) {
            navigationResults.errors.push(`Element <${focusedElement.tag}> does not have a proper focus indicator.`);
          }
        } else {
          navigationResults.errors.push(`No focused element detected on Tab press ${i + 1}.`);
        }
      }
    } catch (error) {
      navigationResults.errors.push(`Error during keyboard navigation: ${error}`);
    }
    return navigationResults;
  }

  /**
   * Checks if the focused element has a visible focus indicator.
   * Uses computed styles to verify that either an outline or a box-shadow is applied.
   */
  private hasFocusIndicator(element: any): boolean {
    const outline = element.outline;
    const boxShadow = element.boxShadow;
    if (outline && outline !== '0px none rgb(0, 0, 0)' && outline !== 'none') {
      return true;
    }
    if (boxShadow && boxShadow !== 'none' && boxShadow !== '0px 0px 0px rgba(0, 0, 0, 0)') {
      return true;
    }
    return false;
  }
}
