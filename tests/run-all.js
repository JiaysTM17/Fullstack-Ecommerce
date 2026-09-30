/**
 * Unified Test Runner Entrypoint
 * Mini Shopee Enterprise Multi-Vendor Marketplace E2E Test Suite
 * Executes Tiers 1-4 (596 test cases covering features across all subsystems)
 */

import { runAllTests } from "./harness/testRunner.js";

// Import Tier 1 Suites (330 tests across 8 subsystems)
import "./tier1_features/sub1_rbac.test.js";
import "./tier1_features/sub2_vouchers.test.js";
import "./tier1_features/sub3_chat_ai.test.js";
import "./tier1_features/sub4_post_order.test.js";
import "./tier1_features/sub5_catalog.test.js";
import "./tier1_features/sub6_quality.test.js";
import "./tier1_features/sub7_buyer_experience.test.js";
import "./tier1_features/sub8_buyer_experience_phase2.test.js";
import "./tier1_features/sub9_backend_overhaul.test.js";
import "./tier1_features/sub10_buyer_intelligence.test.js";

// Import Tier 2 Suites (230 tests across 7 subsystems)
import "./tier2_boundaries/sub1_rbac_edge.test.js";
import "./tier2_boundaries/sub2_vouchers_edge.test.js";
import "./tier2_boundaries/sub3_chat_ai_edge.test.js";
import "./tier2_boundaries/sub4_post_order_edge.test.js";
import "./tier2_boundaries/sub5_catalog_edge.test.js";
import "./tier2_boundaries/sub6_quality_edge.test.js";
import "./tier2_boundaries/sub7_phase2_edge.test.js";

// Import Tier 3 Suite (24 cross-feature matrix tests)
import "./tier3_combinations/cross_feature_matrix.test.js";

// Import Tier 4 Suite (12 real-world user journeys)
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
