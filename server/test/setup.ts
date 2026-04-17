import { afterAll, beforeAll } from 'vitest';
import { installNetworkGuard } from './network.js';
import { closeTestDb } from './db.js';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be "test" to run the test suite');
}

// Integration-test bootstrap is opt-in: a test file that needs the harness
// imports from './db' and calls getTestDb(). Service unit tests that use
// in-memory fakes never trigger the container bootstrap, which keeps the
// common test path fast.
//
// The network guard, however, applies globally to every test file.
beforeAll(() => {
  installNetworkGuard();
});

afterAll(async () => {
  await closeTestDb();
});
