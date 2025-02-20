import { TestRunner } from './core/testRunner';

(async () => {
  const testRunner = new TestRunner();
  await testRunner.run();
})();
