export class Logger {
    public log(message: string): void {
      console.log(`[LOG] ${message}`);
    }
    public error(message: string): void {
      console.error(`[ERROR] ${message}`);
    }
  }
  