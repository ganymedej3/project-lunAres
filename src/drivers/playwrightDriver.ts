import { chromium, Browser } from 'playwright';
import config from '../../config/config.json';

export class PlaywrightDriver {
  /**
   * Launches the Chromium browser with a headless configuration.
   */
  public async launchBrowser(): Promise<Browser> {
    const browser = await chromium.launch({ headless: false, timeout: config.globalTimeout });
    return browser;
  }
}
