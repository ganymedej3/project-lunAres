import * as fs from 'fs';
import * as path from 'path';

export class ReportGenerator {
  /**
   * Writes the given report to disk.
   * @param report - The report data to write.
   * @param fileName - The filename (default is 'report.json').
   */
  public async generateReport(report: any, fileName: string = "report.json"): Promise<void> {
    const reportPath = path.join(process.cwd(), fileName);
    return new Promise((resolve, reject) => {
      fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8', (err) => {
        if (err) {
          reject(`Error writing report: ${err}`);
        } else {
          resolve();
        }
      });
    });
  }
}
