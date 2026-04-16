#!/usr/bin/env node
/**
 * Coverage gate.
 *
 * Reads the committed .coverage-threshold.json (never infers thresholds from
 * current coverage), then reads each workspace's coverage-summary.json and
 * compares against the workspace threshold. Computes a weighted global rollup
 * across workspaces and compares against the global threshold.
 *
 * Exits 1 on any failure, identifying the workspace + metric that regressed.
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..');

const METRICS = ['lines', 'statements', 'functions', 'branches'];
const WORKSPACES = ['shared', 'server', 'client'];

async function readJson(path) {
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw);
}

async function main() {
  const thresholdPath = resolve(REPO_ROOT, '.coverage-threshold.json');
  let thresholds;
  try {
    thresholds = await readJson(thresholdPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Threshold file not found at ${thresholdPath} — was .coverage-threshold.json committed?`);
      process.exit(1);
    }
    throw err;
  }

  const failures = [];
  const reportRows = [];
  const globalTotals = Object.fromEntries(
    METRICS.map((m) => [m, { total: 0, covered: 0 }]),
  );

  for (const ws of WORKSPACES) {
    const summaryPath = resolve(REPO_ROOT, ws, 'coverage', 'coverage-summary.json');
    let summary;
    try {
      summary = await readJson(summaryPath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        failures.push(`[${ws}] coverage-summary.json not found at ${summaryPath} — did the suite run?`);
        continue;
      }
      throw err;
    }

    const totals = summary.total;
    const wsThreshold = thresholds.workspaces?.[ws] ?? {};

    for (const metric of METRICS) {
      const total = totals[metric]?.total ?? 0;
      const raw = totals[metric]?.pct;
      const expected = wsThreshold[metric];
      // 0/0 is emitted as pct: "Unknown" by v8 coverage; treat as 100% since
      // there is nothing in scope to fall below threshold for.
      const actual = typeof raw === 'number' ? raw : total === 0 ? 100 : NaN;
      if (!Number.isFinite(actual)) {
        failures.push(`[${ws}] missing ${metric}.pct in coverage-summary.json`);
        continue;
      }
      reportRows.push({ ws, metric, actual, expected, delta: +(actual - expected).toFixed(2) });
      if (actual < expected) {
        failures.push(`[${ws}] ${metric} ${actual}% < threshold ${expected}%`);
      }
    }

    // Accumulate raw totals for the weighted global rollup (lines-based)
    for (const metric of METRICS) {
      const m = totals[metric];
      if (m && typeof m.total === 'number' && typeof m.covered === 'number') {
        globalTotals[metric].total += m.total;
        globalTotals[metric].covered += m.covered;
      }
    }
  }

  // Weighted global percentages
  const globalThreshold = thresholds.global ?? {};
  for (const metric of METRICS) {
    const { total, covered } = globalTotals[metric];
    const actual = total === 0 ? 100 : +((covered / total) * 100).toFixed(2);
    const expected = globalThreshold[metric];
    if (typeof expected !== 'number') continue;
    reportRows.push({ ws: 'GLOBAL', metric, actual, expected, delta: +(actual - expected).toFixed(2) });
    if (actual < expected) {
      failures.push(`[GLOBAL] ${metric} ${actual}% < threshold ${expected}%`);
    }
  }

  // Report
  const pad = (s, n) => String(s).padEnd(n, ' ');
  console.log('');
  console.log(pad('Workspace', 10) + pad('Metric', 12) + pad('Actual', 10) + pad('Threshold', 12) + pad('Delta', 10));
  console.log('─'.repeat(54));
  for (const row of reportRows) {
    const status = row.actual >= row.expected ? '✓' : '✗';
    console.log(
      pad(row.ws, 10) +
      pad(row.metric, 12) +
      pad(`${row.actual}%`, 10) +
      pad(`${row.expected}%`, 12) +
      pad(`${row.delta >= 0 ? '+' : ''}${row.delta}%`, 10) +
      status,
    );
  }
  console.log('');

  if (failures.length > 0) {
    console.error('Coverage gate FAILED:');
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log('Coverage gate PASSED.');
}

main().catch((err) => {
  console.error('check-coverage.mjs crashed:', err);
  process.exit(2);
});
