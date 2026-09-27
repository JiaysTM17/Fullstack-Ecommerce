/**
 * Lightweight, zero-dependency E2E Test Runner for Mini Shopee
 * Supports describe/test/it, lifecycle hooks, assertions, filtering, and reporting.
 */

import assert from "node:assert/strict";

const suites = [];
let currentSuite = null;
let currentTier = "all";

// Configuration from CLI flags or env vars
const args = process.argv.slice(2);
const tierArg = args.find((a) => a.startsWith("--tier="))?.split("=")[1]?.toLowerCase() || process.env.TEST_TIER || "all";
const subArg = args.find((a) => a.startsWith("--sub="))?.split("=")[1] || process.env.TEST_SUB || null;
const grepArg = args.find((a) => a.startsWith("--grep="))?.split("=")[1]?.toLowerCase() || process.env.TEST_GREP || null;
const verbose = args.includes("--verbose") || process.env.TEST_VERBOSE === "1";

class TestSuite {
  constructor(name, tier = "tier1", subsystem = null, parent = null) {
    this.name = name;
    this.parent = parent;
    this.tier = tier;
    this.subsystem = subsystem;
    this.tests = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  getAllBeforeEachHooks() {
    const parentHooks = this.parent ? this.parent.getAllBeforeEachHooks() : [];
    return parentHooks.concat(this.beforeEachHooks);
  }

  getAllAfterEachHooks() {
    const hooks = this.afterEachHooks.slice();
    if (this.parent) {
      return hooks.concat(this.parent.getAllAfterEachHooks());
    }
    return hooks;
  }
}

export function setContext(tier, subsystem = null) {
  currentTier = tier;
}

export function describe(name, fn, options = {}) {
  if (typeof fn === "object" && typeof options === "function") {
    const temp = fn;
    fn = options;
    options = temp || {};
  }
  let tier = options.tier || currentSuite?.tier;
  if (!tier || tier === "all") {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("tier 1") || lowerName.includes("tier1")) tier = "tier1";
    else if (lowerName.includes("tier 2") || lowerName.includes("tier2")) tier = "tier2";
    else if (lowerName.includes("tier 3") || lowerName.includes("tier3")) tier = "tier3";
    else if (lowerName.includes("tier 4") || lowerName.includes("tier4")) tier = "tier4";
    else tier = "tier1";
  }
  const subsystem = options.subsystem || currentSuite?.subsystem || null;
  const suite = new TestSuite(name, tier, subsystem, currentSuite);
  suites.push(suite);

  const prevSuite = currentSuite;
  currentSuite = suite;
  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

export function test(name, fn, options = {}) {
  if (typeof fn === "object" && typeof options === "function") {
    const temp = fn;
    fn = options;
    options = temp || {};
  }
  const targetSuite = currentSuite || defaultSuite();
  targetSuite.tests.push({
    name,
    fn,
    tier: options.tier || targetSuite.tier,
    subsystem: options.subsystem || targetSuite.subsystem,
    featureId: options.featureId || null,
  });
}

export const it = test;

export function beforeAll(fn) {
  if (currentSuite) currentSuite.beforeAllHooks.push(fn);
}

export function afterAll(fn) {
  if (currentSuite) currentSuite.afterAllHooks.push(fn);
}

export function beforeEach(fn) {
  if (currentSuite) currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn) {
  if (currentSuite) currentSuite.afterEachHooks.push(fn);
}

function defaultSuite() {
  let s = suites.find((x) => x.name === "Default Suite");
  if (!s) {
    s = new TestSuite("Default Suite", "tier1");
    suites.push(s);
  }
  return s;
}

// Enhanced assertions
export { assert };
export const expect = {
  equal: assert.strictEqual,
  notEqual: assert.notStrictEqual,
  deepEqual: assert.deepStrictEqual,
  ok: assert.ok,
  match: (str, regex, msg) => assert.match(String(str), regex, msg),
  closeTo: (actual, expected, delta = 0.001, msg) => {
    assert.ok(
      Math.abs(actual - expected) <= delta,
      msg || `Expected ${actual} to be close to ${expected} (+/- ${delta})`
    );
  },
  rejects: assert.rejects,
  throws: assert.throws,
};

/**
 * Filter and run all collected tests
 */
export async function runAllTests() {
  const startTime = Date.now();
  let totalCount = 0;
  let passedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const failures = [];

  const tierStats = {
    tier1: { total: 0, passed: 0, failed: 0 },
    tier2: { total: 0, passed: 0, failed: 0 },
    tier3: { total: 0, passed: 0, failed: 0 },
    tier4: { total: 0, passed: 0, failed: 0 },
  };

  console.log("\n================================================================================");
  console.log("       MINI SHOPEE ENTERPRISE MARKETPLACE - OPAQUE-BOX E2E TEST RUNNER         ");
  console.log("================================================================================");
  console.log(` Filter: Tier=${tierArg} | Subsystem=${subArg || "All"} | Grep=${grepArg || "None"}\n`);

  for (const suite of suites) {
    // Check suite-level filter
    let suiteTests = suite.tests.filter((t) => {
      if (tierArg !== "all" && t.tier !== tierArg && suite.tier !== tierArg) return false;
      if (subArg && String(t.subsystem) !== String(subArg) && String(suite.subsystem) !== String(subArg)) return false;
      if (grepArg && !t.name.toLowerCase().includes(grepArg) && !suite.name.toLowerCase().includes(grepArg)) return false;
      return true;
    });

    if (suiteTests.length === 0) continue;

    console.log(`\n--- [${(suite.tier || "TIER").toUpperCase()}] ${suite.name} (${suiteTests.length} tests) ---`);

    // Run beforeAll hooks
    for (const hook of suite.beforeAllHooks) {
      try {
        await hook();
      } catch (err) {
        console.error(`  [beforeAll error]: ${err.message}`);
      }
    }

    for (const testCase of suiteTests) {
      totalCount++;
      const tierKey = testCase.tier || suite.tier || "tier1";
      if (tierStats[tierKey]) tierStats[tierKey].total++;

      // Run beforeEach hooks (ancestors first)
      for (const hook of suite.getAllBeforeEachHooks()) {
        try {
          await hook();
        } catch (err) {
          console.error(`  [beforeEach error]: ${err.message}`);
        }
      }

      const tStart = performance.now();
      try {
        await testCase.fn();
        const duration = (performance.now() - tStart).toFixed(2);
        passedCount++;
        if (tierStats[tierKey]) tierStats[tierKey].passed++;
        console.log(`  [PASS] ${testCase.name} (${duration}ms)`);
      } catch (err) {
        const duration = (performance.now() - tStart).toFixed(2);
        failedCount++;
        if (tierStats[tierKey]) tierStats[tierKey].failed++;
        console.log(`  [FAIL] ${testCase.name} (${duration}ms)`);
        console.log(`         Error: ${err.message}`);
        failures.push({
          suite: suite.name,
          test: testCase.name,
          error: err,
        });
      }

      // Run afterEach hooks (children first, then ancestors)
      for (const hook of suite.getAllAfterEachHooks()) {
        try {
          await hook();
        } catch (err) {
          console.error(`  [afterEach error]: ${err.message}`);
        }
      }
    }

    // Run afterAll hooks
    for (const hook of suite.afterAllHooks) {
      try {
        await hook();
      } catch (err) {
        console.error(`  [afterAll error]: ${err.message}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n================================================================================");
  console.log("                              TEST EXECUTION SUMMARY                            ");
  console.log("================================================================================");
  console.log(` Total Duration: ${elapsed}s`);
  console.log(` Total Tests:    ${totalCount}`);
  console.log(` Passed:         ${passedCount} \x1b[32m(✔)\x1b[0m`);
  console.log(` Failed:         ${failedCount} ${failedCount > 0 ? "\x1b[31m(✖)\x1b[0m" : ""}`);
  console.log(` Pass Rate:      ${totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : 0}%`);
  console.log("--------------------------------------------------------------------------------");
  console.log(" TIER BREAKDOWN:");
  for (const [tKey, stats] of Object.entries(tierStats)) {
    if (stats.total > 0) {
      const pct = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`   ${tKey.toUpperCase().padEnd(8)}: ${stats.passed}/${stats.total} passed (${pct}%)`);
    }
  }
  console.log("================================================================================");

  if (failures.length > 0) {
    console.log("\nFAILED TEST DETAILS:");
    failures.forEach((f, idx) => {
      console.log(`\n${idx + 1}) [${f.suite}] ${f.test}`);
      console.log(`   Message: ${f.error.message}`);
      if (verbose && f.error.stack) {
        console.log(`   Stack:\n${f.error.stack.split("\n").slice(1, 4).join("\n")}`);
      }
    });
    console.log("\n");
  }

  return {
    total: totalCount,
    passed: passedCount,
    failed: failedCount,
    duration: elapsed,
    tierStats,
    success: failedCount === 0,
  };
}

export default {
  describe,
  test,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  assert,
  expect,
  runAllTests,
  setContext,
};

// Auto-run when invoked as a standalone test file (not via run-all.js)
if (process.argv[1] && !process.argv[1].endsWith("run-all.js")) {
  setTimeout(async () => {
    if (!globalThis.__E2E_RUN_CALLED__) {
      globalThis.__E2E_RUN_CALLED__ = true;
      const res = await runAllTests();
      if (!res.success) process.exitCode = 1;
    }
  }, 10);
}
