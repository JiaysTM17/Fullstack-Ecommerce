/**
 * Unified Test Runner Entrypoint
 * Mini Shopee Enterprise Multi-Vendor Marketplace E2E Test Suite
 * Executes Tiers 1-4 (450 test cases covering all 42 features across 6 subsystems)
 */

import { runAllTests } from "./harness/testRunner.js";

// Import Tier 1 Suites (260 tests across 7 subsystems)
import "./tier1_features/sub1_rbac.test.js";
import "./tier1_features/sub2_vouchers.test.js";
import "./tier1_features/sub3_chat_ai.test.js";
import "./tier1_features/sub4_post_order.test.js";
import "./tier1_features/sub5_catalog.test.js";
import "./tier1_features/sub6_quality.test.js";
import "./tier1_features/sub7_buyer_experience.test.js";

// Import Tier 2 Suites (210 tests)
import "./tier2_boundaries/sub1_rbac_edge.test.js";
import "./tier2_boundaries/sub2_vouchers_edge.test.js";
import "./tier2_boundaries/sub3_chat_ai_edge.test.js";
import "./tier2_boundaries/sub4_post_order_edge.test.js";
import "./tier2_boundaries/sub5_catalog_edge.test.js";
import "./tier2_boundaries/sub6_quality_edge.test.js";

// Import Tier 3 Suite (20 tests)
import "./tier3_combinations/cross_feature_matrix.test.js";

// Import Tier 4 Suite (10 tests)
import "./tier4_scenarios/user_journeys.test.js";

// Execute all registered suites
async function main() {
  try {
    const result = await runAllTests();
    if (!result.success) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("CRITICAL RUNNER ERROR:", err);
    process.exitCode = 1;
  }
}

main();
