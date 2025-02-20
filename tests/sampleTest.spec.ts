import { test } from '@playwright/test';
import { TestRunner } from '../src/core/testRunner';

test('Accessibility AI Framework Integration Test', async () => {
  const testRunner = new TestRunner();
  await testRunner.run();
});
