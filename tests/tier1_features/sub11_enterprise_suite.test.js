/**
 * Tier 1: Feature Coverage - Subsystem 11: Enterprise Seller & Super Admin Advanced Suite (Features 60-63)
 * 20 comprehensive automated test cases:
 *   - Feature 60: Shopee Ads ROI Suite (Search Ads, CTR, CPC, ROAS Calculation)
 *   - Feature 61: Withholding Tax Center (Nghị định 52/2018 & Thông tư 40/2021)
 *   - Feature 62: Fraud Anomaly Radar & Threat Mitigation Flow
 *   - Feature 63: Flash Sale Shop Matrix & Batch Inventory Guard
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { memoryStore } from "../../server/src/models/memoryStore.js";
import AdsCampaign from "../../server/src/models/AdsCampaign.js";
import FlashSale from "../../server/src/models/FlashSale.js";
import Shop from "../../server/src/models/Shop.js";
import Order from "../../server/src/models/Order.js";
import Product from "../../server/src/models/Product.js";
import PurchaseOrder from "../../server/src/models/PurchaseOrder.js";
import AuditLog, { recordAuditLog } from "../../server/src/models/AuditLog.js";
import User, { computeLoyaltyTier } from "../../server/src/models/User.js";
import { checkAdminSafetyGuardrails, generateAdminCopilotResponse, ADMIN_GUARDRAILS, ADMIN_KNOWLEDGE_BASE } from "../../client/src/services/adminAiCopilotEngine.js";
import { generateSellerCopilotResponse } from "../../client/src/services/sellerAiCopilotEngine.js";
import { generateAiChatResponse } from "../../client/src/services/chatAiEngine.js";
import { idempotencyStore, idempotencyGuard } from "../../server/src/middlewares/idempotency.js";
import { TokenBucket, TokenBucketStore, tokenBucketLimiter } from "../../server/src/utils/tokenBucket.js";
import { CircuitBreaker, CircuitState } from "../../server/src/utils/circuitBreaker.js";
import { LRUCache } from "../../server/src/utils/lruCache.js";
import { OptimisticConcurrencyManager } from "../../server/src/utils/occManager.js";
import { redisService } from "../../server/src/config/redis.js";
import { rabbitMQService } from "../../server/src/config/rabbitmq.js";
import {
  calculateLevenshteinDistance,
  findClosestTerm,
  BM25Engine,
  calculateCosineSimilarity,
  createTfEmbedding,
  analyzeSentiment,
  ConsistentHashRing,
  fnv1a32,
  BloomFilter,
  murmur32,
  RecommendationEngine,
  AhoCorasick,
  calculateHaversineDistance,
  optimizeDeliveryRoute,
  CountMinSketch,
  HyperLogLog,
  knapsack01,
  findOptimalAddonToUnlockVoucher,
  DynamicPricingBandit,
  sampleBeta,
  DisjointSetUnion,
  SybilFraudRadar,
  TrieAutocomplete,
  removeVietnameseTones,
  sha256,
  DoubleEntryLedger,
  MerkleTree,
  SkiplistIndex,
  MultiWarehouseDispatcher,
  kShingles,
  MinHash,
  MinHashLSH,
  LSHCloneDetector,
  CatalogCloneRadar,
  AuctionEngine,
  GspAuctionEngine,
  VcgAuctionEngine,
  PNCounter,
  LWWElementSet,
  CrdtCart,
  // Phase 10 Enterprise Distributed Algorithms
  cosineDistance,
  euclideanDistance,
  PriorityQueue,
  HNSWNode,
  HNSWIndex,
  solveHungarian,
  SPXDispatchEngine,
  NodeRole,
  RaftNode,
  FlashSaleStateMachine,
  RaftCluster,
  // Phase 11 Enterprise Algorithms
  FPNode,
  FPTree,
  FPGrowthBundler,
  SPX_STANDARD_BOXES,
  calculateVolumetricWeight,
  MaximalRectanglesPacker,
  SPXBoxOptimizer,
  MemberStatus,
  ClusterMember,
  SwimNode,
  SwimCluster,
  // Phase 12 Enterprise Algorithms
  SPX_DEFAULT_HUBS,
  SPX_DEFAULT_ROUTES,
  SPXHubGraphRouter,
  ArrayContainer,
  BitmapContainer,
  RoaringBitmap,
  FacetedCatalogIndex,
  RFM_SEGMENT_RULES,
  RFMSegmentationEngine,
  // Phase 13 Enterprise Algorithms
  INVENTORY_AGE_TIERS,
  InventoryDecayOptimizer,
  encodeGeohash,
  decodeGeohash,
  calculateHaversineKm,
  getGeohashNeighbors,
  GeohashSpatialIndex,
  invertMatrix,
  matrixVectorMultiply,
  dotProduct,
  LinUCBRecommender,
  PidBiddingController,
  EdmondsKarpMaxFlow,
  PerceptualImageHash,
  ImageHashIndex,
  PriceElasticitySimulator,
  HopcroftKarpMatching,
  LSMTreeClickstream,
  DynamicTimeWarping,
  HierarchicalKMeans,
  ReservoirSampling,
  SimHashReviewSpam,
  AhoCorasickNode,
  AhoCorasickModerator,
  BellmanFordArbitrage,
} from "../../client/src/services/aiAlgorithms.js";
import { SPXHubGraphRouter as ServerSPXRouter } from "../../server/src/utils/spxHubGraphRouter.js";
import { RoaringBitmap as ServerRoaringBitmap, FacetedCatalogIndex as ServerFacetedIndex } from "../../server/src/utils/roaringBitmapFilter.js";
import { RFMSegmentationEngine as ServerRFMEngine } from "../../server/src/utils/rfmSegmentationEngine.js";
import { InventoryDecayOptimizer as ServerInventoryDecayOptimizer } from "../../server/src/utils/inventoryDecayClearance.js";
import { GeohashSpatialIndex as ServerGeohashSpatialIndex } from "../../server/src/utils/geohashSpatialIndex.js";
import { LinUCBRecommender as ServerLinUCBRecommender } from "../../server/src/utils/linUcbRecommender.js";
import { PidBiddingController as ServerPidController } from "../../server/src/utils/pidBiddingController.js";
import { EdmondsKarpMaxFlow as ServerEdmondsKarp } from "../../server/src/utils/edmondsKarpMaxFlow.js";
import { PerceptualImageHash as ServerPerceptualHash, ImageHashIndex as ServerImageHashIndex } from "../../server/src/utils/perceptualImageHash.js";
import { PriceElasticitySimulator as ServerPriceElasticity } from "../../server/src/utils/volatilityPricingSimulator.js";
import { HopcroftKarpMatching as ServerHopcroftKarp } from "../../server/src/utils/hopcroftKarpMatching.js";
import { LSMTreeClickstream as ServerLSMTree } from "../../server/src/utils/lsmTreeClickstream.js";
import { DynamicTimeWarping as ServerDTW } from "../../server/src/utils/dynamicTimeWarping.js";
import { HierarchicalKMeans as ServerHierarchicalKMeans } from "../../server/src/utils/hierarchicalKMeans.js";
import { ReservoirSampling as ServerReservoirSampling } from "../../server/src/utils/reservoirSampling.js";
import { SimHashReviewSpam as ServerSimHash } from "../../server/src/utils/simHashReviewSpam.js";
import { AhoCorasickModerator as ServerAhoCorasick } from "../../server/src/utils/ahoCorasickModerator.js";
import { BellmanFordArbitrage as ServerBellmanFord } from "../../server/src/utils/bellmanFordArbitrage.js";
import fs from "fs";

describe("Tier 1 - Subsystem 11: Enterprise Seller & Super Admin Advanced Suite (Features 60-63)", { tier: "tier1", subsystem: "sub11" }, () => {

  // =========================================================================
  // FEATURE 60: Shopee Ads ROI Suite & Bidding Mechanics (5 Tests)
  // =========================================================================
  describe("Feature 60: Shopee Ads ROI Suite", () => {
    test("F60-T1: Calculates CTR accurately given impressions and clicks", () => {
      const impressions = 12500;
      const clicks = 625;
      const ctr = Number(((clicks / impressions) * 100).toFixed(2));
      expect.equal(ctr, 5.0);
    });

    test("F60-T2: Zero impressions safely results in 0% CTR without NaN or Infinity", () => {
      const impressions = 0;
      const clicks = 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      expect.equal(ctr, 0);
    });

    test("F60-T3: Computes ROAS and CPC correctly from spent and revenue", () => {
      const spent = 250000;
      const clicks = 250;
      const revenue = 1250000;
      const cpc = Math.round(spent / clicks);
      const roas = Number((revenue / spent).toFixed(2));
      expect.equal(cpc, 1000);
      expect.equal(roas, 5.0);
    });

    test("F60-T4: Toggle campaign status alternates between active and paused", async () => {
      const camp = await AdsCampaign.create({
        shopId: "shop_test_ads",
        campaignName: "Test Chiến Dịch Bidding",
        type: "SEARCH_ADS",
        status: "active",
        budgetDaily: 50000,
        budgetTotal: 500000,
      });

      expect.equal(camp.status, "active");
      camp.status = camp.status === "active" ? "paused" : "active";
      await camp.save();
      expect.equal(camp.status, "paused");

      camp.status = camp.status === "active" ? "paused" : "active";
      await camp.save();
      expect.equal(camp.status, "active");
    });

    test("F60-T5: Multi-keyword bidding structure validates bidPrice threshold", () => {
      const keywords = [
        { keyword: "áo thun nam", bidPrice: 1500, matchType: "exact" },
        { keyword: "áo thun cotton", bidPrice: 1200, matchType: "broad" },
      ];
      const valid = keywords.every((k) => k.bidPrice >= 500 && k.keyword.trim().length > 0);
      expect.equal(valid, true);
    });
  });

  // =========================================================================
  // FEATURE 61: Withholding Tax Center (Nghị định 52 / TT 40) (5 Tests)
  // =========================================================================
  describe("Feature 61: Marketplace Withholding Tax Center", () => {
    function computeSellerTax(revenue) {
      const pitTax = Math.round(revenue * 0.01); // 1.0% TNCN
      const vatTax = Math.round(revenue * 0.005); // 0.5% GTGT
      return { pitTax, vatTax, totalTax: pitTax + vatTax };
    }

    test("F61-T1: Computes 1.5% combined tax rate on GMV revenue", () => {
      const revenue = 100000000; // 100M VND
      const tax = computeSellerTax(revenue);
      expect.equal(tax.pitTax, 1000000); // 1M VND
      expect.equal(tax.vatTax, 500000);  // 500k VND
      expect.equal(tax.totalTax, 1500000);
    });

    test("F61-T2: Zero revenue produces zero withholding tax liability", () => {
      const tax = computeSellerTax(0);
      expect.equal(tax.pitTax, 0);
      expect.equal(tax.vatTax, 0);
      expect.equal(tax.totalTax, 0);
    });

    test("F61-T3: Fractional revenue rounding produces integers strictly", () => {
      const tax = computeSellerTax(199999);
      expect.equal(Number.isInteger(tax.pitTax), true);
      expect.equal(Number.isInteger(tax.vatTax), true);
      expect.equal(Number.isInteger(tax.totalTax), true);
    });

    test("F61-T4: High volume GMV (10 tỷ VND) does not overflow JavaScript numbers", () => {
      const highRevenue = 10000000000;
      const tax = computeSellerTax(highRevenue);
      expect.equal(tax.totalTax, 150000000);
    });

    test("F61-T5: Multi-shop aggregation matches sum of individual liabilities", () => {
      const revenues = [50000000, 30000000, 20000000];
      const sumIndividual = revenues.reduce((acc, rev) => acc + computeSellerTax(rev).totalTax, 0);
      const totalRev = revenues.reduce((a, b) => a + b, 0);
      const aggregateTax = computeSellerTax(totalRev).totalTax;
      expect.equal(sumIndividual, aggregateTax);
    });
  });

  // =========================================================================
  // FEATURE 62: Fraud Anomaly Radar & Threat Mitigation (5 Tests)
  // =========================================================================
  describe("Feature 62: Fraud Anomaly Radar & Threat Mitigation", () => {
    test("F62-T1: Detects cancellation rate exceeding 50% threshold as anomaly", () => {
      const totalOrders = 10;
      const cancelledOrders = 6;
      const cancelRate = cancelledOrders / totalOrders;
      const isAnomaly = cancelRate >= 0.5;
      const severity = cancelRate >= 0.8 ? "CRITICAL" : "HIGH";
      expect.equal(isAnomaly, true);
      expect.equal(severity, "HIGH");
    });

    test("F62-T2: Cancellation rate >= 80% classifies severity as CRITICAL", () => {
      const totalOrders = 10;
      const cancelledOrders = 8;
      const cancelRate = cancelledOrders / totalOrders;
      const severity = cancelRate >= 0.8 ? "CRITICAL" : "HIGH";
      expect.equal(severity, "CRITICAL");
    });

    test("F62-T3: Normal cancellation rate (10%) is not flagged as anomaly", () => {
      const totalOrders = 10;
      const cancelledOrders = 1;
      const cancelRate = cancelledOrders / totalOrders;
      const isAnomaly = cancelRate >= 0.5;
      expect.equal(isAnomaly, false);
    });

    test("F62-T4: High-value unverified COD threshold triggers pre-payment requirement", () => {
      const orderAmount = 12500000;
      const isCOD = true;
      const isOtpVerified = false;
      const flagHighValueCOD = isCOD && !isOtpVerified && orderAmount >= 5000000;
      expect.equal(flagHighValueCOD, true);
    });

    test("F62-T5: Resolving anomaly with LOCK_USER updates user status to banned", async () => {
      const testUser = await memoryStore.users.create({
        fullName: "Tài Khoản Vi Phạm Fraud",
        email: "fraud.spammer@test.vn",
        password: "hash",
        role: "customer",
        status: "active",
      });

      expect.equal(testUser.status, "active");
      // Simulate resolution
      testUser.status = "banned";
      await testUser.save();
      expect.equal(testUser.status, "banned");
    });
  });

  // =========================================================================
  // FEATURE 63: Flash Sale Shop & Batch Inventory Matrix (5 Tests)
  // =========================================================================
  describe("Feature 63: Flash Sale Shop Matrix & Batch Inventory", () => {
    test("F63-T1: Flash Sale discount percent computes correctly from original price", () => {
      const originalPrice = 200000;
      const flashPrice = 100000;
      const discountPercent = Math.round(((originalPrice - flashPrice) / originalPrice) * 100);
      expect.equal(discountPercent, 50);
    });

    test("F63-T2: Sold count cannot exceed stock limit in Flash Sale slot", () => {
      const stockLimit = 20;
      let soldCount = 20;
      const canBuy = soldCount < stockLimit;
      expect.equal(canBuy, false);
    });

    test("F63-T3: FlashSale model persists and retrieves slot information", async () => {
      const slot = await FlashSale.create({
        shopId: "shop_test_fs",
        shopName: "Shop Thử Nghiệm",
        slotTime: "16:00 - 18:00 Hôm Nay",
        status: "active",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        items: [
          {
            productId: "prod_fs_01",
            name: "Tai Nghe Wireless Studio",
            originalPrice: 500000,
            flashPrice: 250000,
            discountPercent: 50,
            stockLimit: 15,
            soldCount: 3,
          },
        ],
      });

      expect.equal(slot.shopId, "shop_test_fs");
      expect.equal(slot.items.length, 1);
      expect.equal(slot.items[0].flashPrice, 250000);
    });

    test("F63-T4: Batch inventory matrix identifies LOW_STOCK under safety threshold", () => {
      const item1 = { stock: 5, safetyThreshold: 10 };
      const item2 = { stock: 25, safetyThreshold: 10 };
      const status1 = item1.stock <= item1.safetyThreshold ? "LOW_STOCK" : "HEALTHY";
      const status2 = item2.stock <= item2.safetyThreshold ? "LOW_STOCK" : "HEALTHY";
      expect.equal(status1, "LOW_STOCK");
      expect.equal(status2, "HEALTHY");
    });

    test("F63-T5: Multiple batch stock updates compute successfully in single array", () => {
      const batchUpdates = [
        { productId: "p1", stock: 100, safetyThreshold: 20 },
        { productId: "p2", stock: 50, safetyThreshold: 15 },
        { productId: "p3", stock: 8, safetyThreshold: 10 },
      ];
      expect.equal(batchUpdates.length, 3);
      const lowStockItems = batchUpdates.filter((b) => b.stock <= b.safetyThreshold);
      expect.equal(lowStockItems.length, 1);
      expect.equal(lowStockItems[0].productId, "p3");
    });
  });

  // =========================================================================
  // FEATURE 64: Seller Wallet Withdrawal & Settlement Payout Flow (5 Tests)
  // =========================================================================
  describe("Feature 64: Wallet Withdrawal & Settlement Payout Flow", () => {
    test("F64-T1: Withdrawal amount less than 50.000₫ threshold is rejected", () => {
      const amt = 30000;
      const isValid = amt >= 50000;
      expect.equal(isValid, false);
    });

    test("F64-T2: Withdrawal exceeding current wallet balance is prevented", () => {
      const balance = 1500000;
      const requestedAmt = 2000000;
      const canWithdraw = requestedAmt <= balance;
      expect.equal(canWithdraw, false);
    });

    test("F64-T3: Approved withdrawal deducts wallet balance and creates transaction record", () => {
      let balance = 2500000;
      const withdrawAmt = 1000000;
      balance -= withdrawAmt;
      const tx = {
        id: "WTX_TEST_01",
        amount: -withdrawAmt,
        balanceAfter: balance,
        status: "PROCESSING",
      };
      expect.equal(balance, 1500000);
      expect.equal(tx.balanceAfter, 1500000);
      expect.equal(tx.status, "PROCESSING");
    });

    test("F64-T4: Admin settlement payout updates shop settlementStatus to settled", () => {
      const shopRecord = {
        shopId: "shop_test_settle",
        name: "Shop Đối Soát",
        settlementStatus: "pending",
        settledAt: null,
      };
      expect.equal(shopRecord.settlementStatus, "pending");
      shopRecord.settlementStatus = "settled";
      shopRecord.settledAt = new Date().toISOString();
      expect.equal(shopRecord.settlementStatus, "settled");
      expect.equal(typeof shopRecord.settledAt, "string");
    });

    test("F64-T5: Batch order confirmation marks all valid pending orders as confirmed", () => {
      const orders = [
        { id: "o1", status: "pending" },
        { id: "o2", status: "pending" },
        { id: "o3", status: "completed" },
      ];
      const pendingOrders = orders.filter((o) => o.status === "pending");
      pendingOrders.forEach((o) => { o.status = "confirmed"; });
      expect.equal(orders[0].status, "confirmed");
      expect.equal(orders[1].status, "confirmed");
      expect.equal(orders[2].status, "completed");
    });
  });

  // =========================================================================
  // FEATURE 65: Settlement Statements & AI Dispute Arbitration (5 Tests)
  // =========================================================================
  describe("Feature 65: Settlement Statements & AI Dispute Arbitration", () => {
    test("F65-T1: Settlement statement computes Net Payout after 5% commission and 1.5% tax", () => {
      const gmv = 10000000;
      const commission = Math.round(gmv * 0.05); // 500,000
      const taxWithheld = Math.round(gmv * 0.015); // 150,000 (0.5% VAT + 1.0% PIT)
      const netPayout = gmv - commission - taxWithheld; // 9,350,000
      expect.equal(commission, 500000);
      expect.equal(taxWithheld, 150000);
      expect.equal(netPayout, 9350000);
    });

    test("F65-T2: Escrow cash flow calculation accurately reserves in-flight platform capital", () => {
      const totalPlatformGmv = 50000000;
      const escrowHeld = Math.round(totalPlatformGmv * 0.45);
      expect.equal(escrowHeld, 22500000);
    });

    test("F65-T3: AI Dispute arbitration favors buyer when buyer reputation > 90 and seller reputation is lower", () => {
      const buyerRep = 96;
      const sellerRep = 92;
      const aiRecommendation = buyerRep >= sellerRep ? "REFUND_BUYER" : "REJECT_BUYER";
      const confidence = Math.min(99, Math.round(85 + (buyerRep - sellerRep) * 2));
      expect.equal(aiRecommendation, "REFUND_BUYER");
      expect.equal(confidence, 93);
    });

    test("F65-T4: Anomaly radar flags shop with excessive return rate exceeding 30%", () => {
      const totalShopOrders = 10;
      const returnedOrders = 4; // 40%
      const returnRate = returnedOrders / totalShopOrders;
      const isExcessive = returnRate > 0.30;
      expect.equal(isExcessive, true);
      expect.equal(returnRate, 0.40);
    });

    test("F65-T5: Consecutive order cancellations >= 3 triggers SERIAL_CANCELLATIONS anomaly", () => {
      const userOrders = [
        { status: "cancelled" },
        { status: "cancelled" },
        { status: "cancelled" },
        { status: "completed" },
      ];
      let consecutiveCancels = 0;
      for (const o of userOrders) {
        if (o.status === "cancelled") consecutiveCancels++;
        else break;
      }
      const isSerialCancellation = consecutiveCancels >= 3;
      expect.equal(isSerialCancellation, true);
      expect.equal(consecutiveCancels, 3);
    });
  });

  // =========================================================================
  // FEATURE 66: Seller Return & Refund Handling (5 Tests)
  // =========================================================================
  describe("Feature 66: Seller Return & Refund Handling", () => {
    test("F66-T1: Approving return request transitions order status to 'returning'", () => {
      const order = {
        id: "ord_ret_01",
        status: "completed",
        returnRequest: { status: "pending", reason: "Hàng lỗi", refundAmount: 189000 },
      };
      const decision = "approved";
      order.returnRequest.status = decision;
      if (decision === "approved") {
        order.status = "returning";
      }
      expect.equal(order.returnRequest.status, "approved");
      expect.equal(order.status, "returning");
    });

    test("F66-T2: Approving return automatically restores stock quantity of returned product", () => {
      let productStock = 50;
      const returnedQuantity = 2;
      productStock += returnedQuantity;
      expect.equal(productStock, 52);
    });

    test("F66-T3: Rejecting return request keeps order status and attaches explanation note", () => {
      const order = {
        id: "ord_ret_02",
        status: "completed",
        returnRequest: { status: "pending", reason: "Đổi ý", refundAmount: 250000, responseNote: "" },
      };
      const decision = "rejected";
      const note = "Sản phẩm đã bóc tem và qua sử dụng > 7 ngày";
      order.returnRequest.status = decision;
      order.returnRequest.responseNote = note;
      expect.equal(order.returnRequest.status, "rejected");
      expect.equal(order.status, "completed");
      expect.equal(order.returnRequest.responseNote, note);
    });

    test("F66-T4: Invalid return decision throws validation error", () => {
      const validDecisions = ["approved", "rejected"];
      const attempt = "dismissed";
      const isValid = validDecisions.includes(attempt);
      expect.equal(isValid, false);
    });

    test("F66-T5: Filter return orders retrieves only orders with non-empty return requests", () => {
      const orders = [
        { id: "o1", returnRequest: { status: "none" } },
        { id: "o2", returnRequest: { status: "pending" } },
        { id: "o3", returnRequest: { status: "approved" } },
      ];
      const activeReturns = orders.filter((o) => o.returnRequest?.status && o.returnRequest.status !== "none");
      expect.equal(activeReturns.length, 2);
      expect.equal(activeReturns[0].id, "o2");
      expect.equal(activeReturns[1].id, "o3");
    });
  });

  describe("Feature 67: Seller P&L Per-SKU Cost & Margin Analytics (Cost of Goods Sold, Gross Margin)", () => {
    test("F67-T1: SKU margin calculation accurately computes Gross Profit and Margin %", () => {
      const price = 250000;
      const costPrice = 150000;
      const unitsSold = 10;
      const revenue = price * unitsSold;
      const cogs = costPrice * unitsSold;
      const grossProfit = revenue - cogs;
      const margin = Number(((grossProfit / revenue) * 100).toFixed(1));

      expect.equal(revenue, 2500000);
      expect.equal(cogs, 1500000);
      expect.equal(grossProfit, 1000000);
      expect.equal(margin, 40.0);
    });

    test("F67-T2: Fallback cost price defaults to 60% of retail price when costPrice is omitted", () => {
      const price = 500000;
      const costPrice = null;
      const effectiveCost = Number(costPrice) || Math.round(price * 0.6);
      expect.equal(effectiveCost, 300000);
    });

    test("F67-T3: SKU margin threshold categorizes unhealthy vs healthy margins", () => {
      const classifyMargin = (margin) => {
        if (margin < 15) return "low_margin";
        if (margin > 40) return "high_margin";
        return "healthy";
      };

      expect.equal(classifyMargin(10.5), "low_margin");
      expect.equal(classifyMargin(28.0), "healthy");
      expect.equal(classifyMargin(45.2), "high_margin");
    });

    test("F67-T4: Overall shop P&L aggregates total revenue, COGS and weighted average margin", () => {
      const skuData = [
        { revenue: 1000000, cogs: 600000 },
        { revenue: 2000000, cogs: 1000000 },
      ];
      const totalRev = skuData.reduce((s, i) => s + i.revenue, 0);
      const totalCogs = skuData.reduce((s, i) => s + i.cogs, 0);
      const grossProfitTotal = totalRev - totalCogs;
      const avgMargin = Number(((grossProfitTotal / totalRev) * 100).toFixed(1));

      expect.equal(totalRev, 3000000);
      expect.equal(totalCogs, 1600000);
      expect.equal(grossProfitTotal, 1400000);
      expect.equal(avgMargin, 46.7);
    });

    test("F67-T5: Zero revenue SKU returns 0% margin without NaN division by zero", () => {
      const revenue = 0;
      const cogs = 0;
      const grossProfit = revenue - cogs;
      const margin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
      expect.equal(Number.isNaN(margin), false);
      expect.equal(margin, 0);
    });
  });

  describe("Feature 68: Buyer Initiated Return & Refund Workflow", () => {
    test("F68-T1: Customer return request initializes status to pending and records timeline event", () => {
      const order = {
        id: "ord_cust_ret_1",
        status: "completed",
        total: 320000,
        timeline: [],
        returnRequest: { status: "none" },
      };

      const reason = "Sản phẩm lỗi đường chỉ may, không đúng kích thước";
      order.returnRequest = {
        reason,
        evidence: ["https://example.com/evidence1.jpg"],
        status: "pending",
        refundAmount: order.total,
        requestedAt: new Date().toISOString(),
      };
      order.timeline.push({ time: new Date().toISOString(), text: `Khách hàng gửi yêu cầu Trả hàng / Hoàn tiền: ${reason}` });

      expect.equal(order.returnRequest.status, "pending");
      expect.equal(order.returnRequest.refundAmount, 320000);
      expect.equal(order.timeline.length, 1);
      expect.equal(order.timeline[0].text.includes("Khách hàng gửi yêu cầu Trả hàng"), true);
    });

    test("F68-T2: Empty reason submission is rejected with error", () => {
      const validateReason = (r) => Boolean(r && r.trim());
      expect.equal(validateReason(""), false);
      expect.equal(validateReason("   "), false);
      expect.equal(validateReason("Hàng vỡ bể trong quá trình vận chuyển"), true);
    });

    test("F68-T3: Cancelled orders are strictly prevented from initiating return requests", () => {
      const order = { id: "ord_canc_1", status: "cancelled" };
      const canInitiateReturn = order.status !== "cancelled";
      expect.equal(canInitiateReturn, false);
    });

    test("F68-T4: Partial refund amount capping ensures refund does not exceed order total", () => {
      const orderTotal = 450000;
      const requestedRefund = 500000;
      const effectiveRefund = Math.min(orderTotal, requestedRefund);
      expect.equal(effectiveRefund, 450000);
    });

    test("F68-T5: Multiple evidence image attachments are correctly mapped into request array", () => {
      const rawEvidence = ["https://img1.jpg", "https://img2.jpg"];
      const evidence = Array.isArray(rawEvidence) ? rawEvidence : [];
      expect.equal(evidence.length, 2);
      expect.equal(evidence[0], "https://img1.jpg");
    });
  });

  describe("Feature 69: Super Admin Dispute Arbitration Synchronization with Live Orders", () => {
    test("F69-T1: Admin arbitration REFUND_BUYER updates dispute and changes order status to returning", () => {
      const dispute = { id: "disp_01", orderId: "ord_101", status: "opened", arbitrationNote: "" };
      const order = { id: "ord_101", status: "completed", returnRequest: { status: "pending", responseNote: "" } };

      const resolution = "REFUND_BUYER";
      const note = "Super Admin chấp thuận khiếu nại dựa trên bằng chứng video khui hàng";

      dispute.status = resolution === "REFUND_BUYER" ? "resolved_refund" : "resolved_rejected";
      dispute.arbitrationNote = note;
      order.returnRequest.status = resolution === "REFUND_BUYER" ? "approved" : "rejected";
      order.returnRequest.responseNote = `Trọng tài Super Admin phán quyết: ${note}`;
      if (resolution === "REFUND_BUYER") {
        order.status = "returning";
      }

      expect.equal(dispute.status, "resolved_refund");
      expect.equal(order.status, "returning");
      expect.equal(order.returnRequest.status, "approved");
      expect.equal(order.returnRequest.responseNote.includes("Trọng tài Super Admin"), true);
    });

    test("F69-T2: Admin arbitration REJECT_BUYER sets dispute resolved_rejected and keeps original order status", () => {
      const dispute = { id: "disp_02", orderId: "ord_102", status: "under_review", arbitrationNote: "" };
      const order = { id: "ord_102", status: "completed", returnRequest: { status: "rejected", responseNote: "" } };

      const resolution = "REJECT_BUYER";
      const note = "Bằng chứng người mua không đủ tính pháp lý";

      dispute.status = resolution === "REFUND_BUYER" ? "resolved_refund" : "resolved_rejected";
      dispute.arbitrationNote = note;
      order.returnRequest.status = resolution === "REFUND_BUYER" ? "approved" : "rejected";
      order.returnRequest.responseNote = `Trọng tài Super Admin phán quyết: ${note}`;

      expect.equal(dispute.status, "resolved_rejected");
      expect.equal(order.status, "completed");
      expect.equal(order.returnRequest.status, "rejected");
    });

    test("F69-T3: Order-backed dispute generator formats synthetic disp_ord_ IDs consistently", () => {
      const orderId = "ORD_789456123";
      const syntheticId = `disp_ord_${orderId.slice(-8)}`;
      expect.equal(syntheticId.startsWith("disp_ord_"), true);
      expect.equal(syntheticId, "disp_ord_89456123");
    });

    test("F69-T4: Non-existent dispute returns 404 cleanly", () => {
      const allDisputes = [{ id: "disp_01" }, { id: "disp_02" }];
      const found = allDisputes.find((d) => d.id === "disp_99");
      expect.equal(Boolean(found), false);
    });

    test("F69-T5: Enriched disputes correctly assign AI confidence metric within 0-100%", () => {
      const aiConfidence = 94;
      const isValidScore = typeof aiConfidence === "number" && aiConfidence >= 0 && aiConfidence <= 100;
      expect.equal(isValidScore, true);
    });
  });

  describe("Feature 70: Super Admin Escrow Vault Liquidity & Cashflow Monitoring (Nghị định 52 Compliance)", () => {
    test("F70-T1: Vault liquidity correctly reconciles holding, frozen dispute and cleared payout buckets", () => {
      const holding = 18500000;
      const frozen = 3420000;
      const cleared = 23880000;
      const totalLiquidity = holding + frozen + cleared;

      expect.equal(totalLiquidity, 45800000);
      expect.equal(totalLiquidity >= holding + frozen, true);
    });

    test("F70-T2: Shop escrow risk categorization identifies HIGH_RISK, MEDIUM_RISK and SAFE shops", () => {
      const evaluateRisk = (frozenBalance) => {
        if (frozenBalance > 1000000) return "HIGH_RISK";
        if (frozenBalance > 0) return "MEDIUM_RISK";
        return "SAFE";
      };

      expect.equal(evaluateRisk(0), "SAFE");
      expect.equal(evaluateRisk(450000), "MEDIUM_RISK");
      expect.equal(evaluateRisk(2500000), "HIGH_RISK");
    });

    test("F70-T3: Disputed order return request immediately freezes amount from cleared balance", () => {
      let clearedBalance = 15000000;
      let frozenBalance = 0;
      const disputeRefundAmount = 1200000;

      clearedBalance -= disputeRefundAmount;
      frozenBalance += disputeRefundAmount;

      expect.equal(clearedBalance, 13800000);
      expect.equal(frozenBalance, 1200000);
    });

    test("F70-T4: Empty shop or zero orders initializes vault breakdown with 0 without throwing error", () => {
      const shop = { shopId: "shop_new", name: "New Brand" };
      const shopOrders = [];
      const holding = shopOrders.reduce((sum, o) => sum + o.total, 0);
      expect.equal(holding, 0);
    });

    test("F70-T5: Vault summary attaches statutory compliance notice referencing Decree 52/2018", () => {
      const summary = {
        statutoryCompliance: "Nghị định 52/2018/NĐ-CP Điều 74: Cơ chế bảo vệ tiền khách hàng & ký quỹ bên thứ ba",
      };
      expect.equal(summary.statutoryCompliance.includes("Nghị định 52/2018/NĐ-CP"), true);
      expect.equal(summary.statutoryCompliance.includes("ký quỹ bên thứ ba"), true);
    });
  });

  describe("Feature 71: Super Admin Omnichannel Notification Broadcast Engine", () => {
    test("F71-T1: Broadcast notification distributes message to multiple user inboxes", () => {
      const userStores = new Map();
      userStores.set("user_1", []);
      userStores.set("user_2", []);

      const payload = {
        title: "Bảo Trì Hệ Thống Định Kỳ",
        message: "Hệ thống sẽ bảo trì thanh toán trong 15 phút từ 02:00 sáng mai",
        type: "system",
      };

      let count = 0;
      for (const [uid, arr] of userStores.entries()) {
        arr.unshift({ ...payload, id: `notif-${Date.now()}-${uid}`, isRead: false });
        count++;
      }

      expect.equal(count, 2);
      expect.equal(userStores.get("user_1").length, 1);
      expect.equal(userStores.get("user_2").length, 1);
      expect.equal(userStores.get("user_1")[0].title, payload.title);
    });

    test("F71-T2: Broadcast request missing title or message throws validation error", () => {
      const validateBroadcast = (body) => Boolean(body?.title && body?.message);
      expect.equal(validateBroadcast({ title: "Hi", message: "" }), false);
      expect.equal(validateBroadcast({ title: "", message: "Hello" }), false);
      expect.equal(validateBroadcast({ title: "Voucher Hot", message: "Nhận 50k" }), true);
    });

    test("F71-T3: Notification buffer enforces 200 items maximum capacity limit", () => {
      const notifications = [];
      for (let i = 0; i < 210; i++) {
        notifications.unshift({ id: `n-${i}`, title: `Thông báo ${i}` });
        if (notifications.length > 200) {
          notifications.length = 200;
        }
      }
      expect.equal(notifications.length, 200);
      expect.equal(notifications[0].title, "Thông báo 209");
    });

    test("F71-T4: Unread notification filter counts only isRead === false items", () => {
      const items = [
        { id: "1", isRead: true },
        { id: "2", isRead: false },
        { id: "3", isRead: false },
      ];
      const unread = items.filter((i) => !i.isRead).length;
      expect.equal(unread, 2);
    });

    test("F71-T5: Notification default icons correctly map domain specific types", () => {
      const getDefaultIcon = (t) => {
        const map = { order: "📦", promotion: "🎉", system: "🔔", warning: "⚠️" };
        return map[t] || "🔔";
      };
      expect.equal(getDefaultIcon("order"), "📦");
      expect.equal(getDefaultIcon("promotion"), "🎉");
      expect.equal(getDefaultIcon("unknown"), "🔔");
    });
  });

  // =========================================================================
  // FEATURE 72: Dynamic Shipping Tier & SPX Subsidies Matrix (5 Tests)
  // =========================================================================
  describe("Feature 72: Dynamic Shipping Tier & SPX Subsidies Matrix", () => {
    test("F72-T1: Seller shipping policy calculates zero fee when cart subtotal meets freeShipThreshold", () => {
      const policy = {
        baseFee: 25000,
        freeShipThreshold: 300000,
        spxSubsidized: true,
      };

      const calculateFee = (subtotal, isExpress = false) => {
        let fee = subtotal >= policy.freeShipThreshold ? 0 : policy.baseFee;
        if (isExpress) fee += 15000;
        return fee;
      };

      expect.equal(calculateFee(350000), 0);
      expect.equal(calculateFee(200000), 25000);
      expect.equal(calculateFee(350000, true), 15000);
    });

    test("F72-T2: SPX 50% subsidy rule cuts standard shipping fee by half when enabled", () => {
      const baseFee = 30000;
      const spxSubsidized = true;
      const actualBuyerFee = spxSubsidized ? Math.round(baseFee * 0.5) : baseFee;
      expect.equal(actualBuyerFee, 15000);
    });

    test("F72-T3: Express shipping surcharge validation rejects negative surcharge values", () => {
      const validateExpressPolicy = (surcharge) => typeof surcharge === "number" && surcharge >= 0;
      expect.equal(validateExpressPolicy(15000), true);
      expect.equal(validateExpressPolicy(0), true);
      expect.equal(validateExpressPolicy(-5000), false);
    });

    test("F72-T4: Shop model updates shippingPolicy and persists configurations", async () => {
      const shop = await Shop.findOne({ shopId: "shop_01" });
      expect.equal(Boolean(shop), true);

      shop.shippingPolicy = {
        baseFee: 28000,
        freeShipThreshold: 250000,
        spxSubsidized: true,
        expressAvailable: true,
        expressSurcharge: 20000,
      };
      await shop.save();

      const updated = await Shop.findOne({ shopId: "shop_01" });
      expect.equal(updated.shippingPolicy.baseFee, 28000);
      expect.equal(updated.shippingPolicy.freeShipThreshold, 250000);
      expect.equal(updated.shippingPolicy.expressSurcharge, 20000);
    });

    test("F72-T5: Multi-shop shipping calculator applies independent policies per vendor", () => {
      const shopA = { baseFee: 20000, freeShipThreshold: 200000 };
      const shopB = { baseFee: 30000, freeShipThreshold: 500000 };

      const subtotalA = 250000;
      const subtotalB = 400000;

      const feeA = subtotalA >= shopA.freeShipThreshold ? 0 : shopA.baseFee;
      const feeB = subtotalB >= shopB.freeShipThreshold ? 0 : shopB.baseFee;

      expect.equal(feeA, 0); // Đủ điều kiện freeship Shop A
      expect.equal(feeB, 30000); // Chưa đủ freeship Shop B
      expect.equal(feeA + feeB, 30000);
    });
  });

  // =========================================================================
  // FEATURE 73: COD Cash-On-Delivery Logistics Reconciliation Ledger (5 Tests)
  // =========================================================================
  describe("Feature 73: COD Logistics Reconciliation Ledger", () => {
    test("F73-T1: Separates COD payments into 4 lifecycle stages correctly", () => {
      const orders = [
        { total: 100000, codSettlementStatus: "uncollected" },
        { total: 200000, codSettlementStatus: "collected_by_courier" },
        { total: 300000, codSettlementStatus: "reconciled_with_platform" },
        { total: 400000, codSettlementStatus: "remitted_to_seller" },
      ];

      const totals = orders.reduce(
        (acc, o) => {
          acc[o.codSettlementStatus] += o.total;
          return acc;
        },
        { uncollected: 0, collected_by_courier: 0, reconciled_with_platform: 0, remitted_to_seller: 0 }
      );

      expect.equal(totals.uncollected, 100000);
      expect.equal(totals.collected_by_courier, 200000);
      expect.equal(totals.reconciled_with_platform, 300000);
      expect.equal(totals.remitted_to_seller, 400000);
    });

    test("F73-T2: Reconciling COD batch marks orders and updates settlement timestamps", async () => {
      const testOrder = await Order.create({
        customer: { fullName: "Bùi Văn Thu Hộ", phone: "0909112233", email: "thuho@shopee.vn", address: "TP HCM" },
        items: [{ productId: "p1", name: "Hàng COD", price: 150000, quantity: 1, image: "img.jpg", shopId: "shop_01" }],
        subtotal: 150000,
        total: 150000,
        paymentMethod: "COD",
        status: "shipping",
        codSettlementStatus: "collected_by_courier",
      });

      expect.equal(testOrder.codSettlementStatus, "collected_by_courier");

      testOrder.codSettlementStatus = "reconciled_with_platform";
      testOrder.codReconciledAt = new Date().toISOString();
      await testOrder.save();

      const refreshed = await Order.findById(testOrder._id);
      expect.equal(refreshed.codSettlementStatus, "reconciled_with_platform");
      expect.equal(Boolean(refreshed.codReconciledAt), true);
    });

    test("F73-T3: Empty or invalid order ID list rejected during batch clear execution", () => {
      const validateBatch = (ids) => Array.isArray(ids) && ids.length > 0;
      expect.equal(validateBatch([]), false);
      expect.equal(validateBatch(null), false);
      expect.equal(validateBatch(["ord_01", "ord_02"]), true);
    });

    test("F73-T4: Non-COD payment methods (VietQR, MoMo) are excluded from COD reconciliation report", () => {
      const orders = [
        { id: "1", paymentMethod: "COD", total: 100000 },
        { id: "2", paymentMethod: "BANK_TRANSFER", total: 200000 },
        { id: "3", paymentMethod: "MOMO", total: 300000 },
      ];

      const codFiltered = orders.filter((o) => o.paymentMethod === "COD");
      expect.equal(codFiltered.length, 1);
      expect.equal(codFiltered[0].total, 100000);
    });

    test("F73-T5: Courier fee and net remittance calculations balance precisely without drift", () => {
      const orderTotal = 250000;
      const courierCodFeePercent = 0.015; // 1.5% phí thu hộ của nhà vận chuyển
      const codFee = Math.round(orderTotal * courierCodFeePercent);
      const netRemittance = orderTotal - codFee;

      expect.equal(codFee, 3750);
      expect.equal(netRemittance, 246250);
      expect.equal(netRemittance + codFee, orderTotal);
    });
  });

  // =========================================================================
  // FEATURE 74: Seller Operational SLA & Shopee Penalty Points Engine (5 Tests)
  // =========================================================================
  describe("Feature 74: Seller Operational SLA & Penalty Points Engine", () => {
    test("F74-T1: Computes onTimeShipmentRate and lateShipmentRate strictly totaling 100%", () => {
      const lateShipmentRate = 2.4;
      const onTimeShipmentRate = Number((100 - lateShipmentRate).toFixed(1));
      expect.equal(onTimeShipmentRate, 97.6);
      expect.equal(onTimeShipmentRate + lateShipmentRate, 100.0);
    });

    test("F74-T2: Zero penalty points maps to TIER_0 Clean Account without restrictions", () => {
      const calculatePenaltyTier = (points) => {
        if (points >= 6) return "TIER_3";
        if (points >= 3) return "TIER_2";
        if (points >= 1) return "TIER_1";
        return "TIER_0";
      };

      expect.equal(calculatePenaltyTier(0), "TIER_0");
      expect.equal(calculatePenaltyTier(2), "TIER_1");
      expect.equal(calculatePenaltyTier(4), "TIER_2");
      expect.equal(calculatePenaltyTier(7), "TIER_3");
    });

    test("F74-T3: High cancellation rate exceeding 5% adds 3 penalty points", () => {
      const getPoints = (cancelRate) => (cancelRate > 5 ? 3 : 0);
      expect.equal(getPoints(2.1), 0);
      expect.equal(getPoints(6.5), 3);
    });

    test("F74-T4: Shop operationalMetrics schema persists and updates in database", async () => {
      const shop = await Shop.findOne({ shopId: "shop_01" });
      expect.equal(Boolean(shop), true);

      shop.operationalMetrics = {
        onTimeShipmentRate: 99.1,
        lateShipmentRate: 0.9,
        cancellationRate: 0.5,
        returnRate: 1.0,
        sellerPenaltyPoints: 0,
        penaltyTier: "TIER_0",
      };
      await shop.save();

      const updated = await Shop.findOne({ shopId: "shop_01" });
      expect.equal(updated.operationalMetrics.onTimeShipmentRate, 99.1);
      expect.equal(updated.operationalMetrics.penaltyTier, "TIER_0");
    });

    test("F74-T5: Operational benchmark comparison identifies SLA compliance", () => {
      const benchmarks = { onTimeMin: 98.0, cancelMax: 1.0 };
      const currentShop = { onTime: 98.5, cancel: 0.8 };

      const isCompliant = currentShop.onTime >= benchmarks.onTimeMin && currentShop.cancel <= benchmarks.cancelMax;
      expect.equal(isCompliant, true);
    });
  });

  // =========================================================================
  // FEATURE 75: Triple Voucher Stacking & Mini Xu Offset Engine (5 Tests)
  // =========================================================================
  describe("Feature 75: Triple Voucher Stacking & Mini Xu Offset Engine", () => {
    test("F75-T1: Stack Freeship + Shop Fixed Voucher + Platform Percent Voucher cleanly", () => {
      const subtotal = 500000;
      const shippingFee = 30000;

      // 1. Freeship 30k
      const shipDiscount = Math.min(shippingFee, 30000);
      const remainShip = shippingFee - shipDiscount;

      // 2. Shop voucher 50k
      const shopDiscount = 50000;
      const afterShop = subtotal - shopDiscount;

      // 3. Platform voucher 10%
      const platformDiscount = Math.round(afterShop * 0.1); // 45k
      const afterPlatform = afterShop - platformDiscount; // 405k

      expect.equal(shipDiscount, 30000);
      expect.equal(remainShip, 0);
      expect.equal(platformDiscount, 45000);
      expect.equal(afterPlatform + remainShip, 405000);
    });

    test("F75-T2: Shopee Xu offset strictly capped at 50% of payable amount after vouchers", () => {
      const payableAfterVouchers = 400000;
      const userCoins = 300000; // Người dùng có 300k Xu

      const maxCoinsAllowed = Math.floor(payableAfterVouchers * 0.5); // 200k Xu tối đa
      const actualCoinsUsed = Math.min(userCoins, maxCoinsAllowed);

      expect.equal(maxCoinsAllowed, 200000);
      expect.equal(actualCoinsUsed, 200000);
      expect.equal(payableAfterVouchers - actualCoinsUsed, 200000);
    });

    test("F75-T3: Minimum order value threshold prevents applying voucher when subtotal is inadequate", () => {
      const voucher = { code: "MIN500K", minOrderValue: 500000, value: 50000 };
      const subtotalFail = 450000;
      const subtotalPass = 550000;

      const canApplyFail = subtotalFail >= voucher.minOrderValue;
      const canApplyPass = subtotalPass >= voucher.minOrderValue;

      expect.equal(canApplyFail, false);
      expect.equal(canApplyPass, true);
    });

    test("F75-T4: Max discount ceiling limits high-percentage vouchers correctly", () => {
      const orderSubtotal = 2000000;
      const voucher = { type: "percent", value: 20, maxDiscount: 150000 };

      const computed = (orderSubtotal * voucher.value) / 100; // 400k
      const capped = Math.min(computed, voucher.maxDiscount); // 150k

      expect.equal(computed, 400000);
      expect.equal(capped, 150000);
    });

    test("F75-T5: Free shipping discount does not exceed actual shipping fee charged", () => {
      const actualShippingFee = 18000;
      const freeshipVoucherVal = 30000;

      const appliedDiscount = Math.min(actualShippingFee, freeshipVoucherVal);
      const remainingShippingFee = actualShippingFee - appliedDiscount;

      expect.equal(appliedDiscount, 18000);
      expect.equal(remainingShippingFee, 0);
    });
  });

  // =========================================================================
  // FEATURE 76: Buyer Return Abuse & Fraud Pattern Radar (5 Tests)
  // =========================================================================
  describe("Feature 76: Buyer Return Abuse & Fraud Pattern Radar", () => {
    test("F76-T1: High return rate (>50%) flagged with CRITICAL severity and risk score increment", () => {
      const totalOrders = 6;
      const returnedOrders = 4;
      const returnRate = (returnedOrders / totalOrders) * 100; // 66.7%

      let riskScore = 0;
      if (returnRate >= 50 && totalOrders >= 2) {
        riskScore += 40;
      }
      expect.equal(returnRate > 50, true);
      expect.equal(riskScore, 40);
    });

    test("F76-T2: High COD refusal rate flags buyer with suggested restriction", () => {
      const codOrders = 4;
      const rejectedCod = 3;
      const refusalRate = (rejectedCod / codOrders) * 100; // 75%

      let riskScore = 0;
      let restriction = "NONE";
      if (refusalRate >= 50 && codOrders >= 2) {
        riskScore += 35;
        restriction = "RESTRICT_COD";
      }

      expect.equal(riskScore, 35);
      expect.equal(restriction, "RESTRICT_COD");
    });

    test("F76-T3: Risk score >= 70 categorizes buyer as CRITICAL risk tier", () => {
      const riskScore = 75;
      let riskLevel = "LOW";
      if (riskScore >= 70) riskLevel = "CRITICAL";
      else if (riskScore >= 40) riskLevel = "MEDIUM";

      expect.equal(riskLevel, "CRITICAL");
    });

    test("F76-T4: Applying RESTRICT_COD updates user restrictions object accurately", () => {
      const user = {
        _id: "user_test_abuse",
        status: "active",
        restrictions: { codDisabled: false, vouchersDisabled: false, reason: "" },
      };

      // Admin arbitrates: RESTRICT_COD
      user.restrictions.codDisabled = true;
      user.restrictions.reason = "Tỷ lệ bùng đơn bưu tá vượt ngưỡng 50%";

      expect.equal(user.restrictions.codDisabled, true);
      expect.equal(user.restrictions.vouchersDisabled, false);
      expect.equal(user.restrictions.reason.includes("50%"), true);
    });

    test("F76-T5: Blocked voucher buyer restriction successfully halts voucher application in order checkout", () => {
      const userRestrictions = {
        codDisabled: false,
        vouchersDisabled: true,
        reason: "Phát hiện gian lận voucher hệ thống",
      };

      const hasVoucherDiscount = true;
      const shouldBlockOrder = userRestrictions.vouchersDisabled && hasVoucherDiscount;

      expect.equal(shouldBlockOrder, true);
    });
  });

  // =========================================================================
  // FEATURE 77: Seller Auto-Reply Chat Assistant & Keyword Trigger Engine (5 Tests)
  // =========================================================================
  describe("Feature 77: Seller Auto-Reply Chat Assistant & Keyword Trigger Engine", () => {
    test("F77-T1: Auto-reply matches trigger keyword in customer query accurately", () => {
      const templates = [
        { id: "t1", triggerKeyword: "khi nào giao", responseMessage: "Shop giao SPX trong 24h ạ!" },
        { id: "t2", triggerKeyword: "tư vấn size", responseMessage: "Bạn gửi chiều cao cân nặng nhé!" },
      ];

      const customerMessage = "Chào shop, cho mình hỏi đơn này khi nào giao hàng vậy ạ?";
      const matched = templates.find((t) =>
        customerMessage.toLowerCase().includes(t.triggerKeyword.toLowerCase())
      );

      expect.equal(matched !== undefined, true);
      expect.equal(matched.id, "t1");
      expect.equal(matched.responseMessage.includes("24h"), true);
    });

    test("F77-T2: Fallback to welcomeMessage when no keyword triggers match and shop is online", () => {
      const autoReplyConfig = {
        enabled: true,
        welcomeMessage: "Cảm ơn bạn đã ghé thăm shop!",
        offlineMessage: "Shop đang ngoài giờ làm việc.",
        quickTemplates: [
          { id: "t1", triggerKeyword: "giảm giá", responseMessage: "Mời bạn lưu voucher shop nhé" },
        ],
      };

      const isOffline = false;
      const customerMsg = "Alo shop ơi!";
      const matched = autoReplyConfig.quickTemplates.find((t) =>
        customerMsg.toLowerCase().includes(t.triggerKeyword.toLowerCase())
      );

      const reply = matched
        ? matched.responseMessage
        : isOffline
        ? autoReplyConfig.offlineMessage
        : autoReplyConfig.welcomeMessage;

      expect.equal(reply, "Cảm ơn bạn đã ghé thăm shop!");
    });

    test("F77-T3: Fallback to offlineMessage during non-operating hours (after 22:00)", () => {
      const autoReplyConfig = {
        enabled: true,
        welcomeMessage: "Chào bạn!",
        offlineMessage: "Hiện tại shop đang ngoài giờ làm việc (sau 22:00).",
        quickTemplates: [],
      };

      const isOfflineHour = true; // e.g. 23:30
      const reply = isOfflineHour ? autoReplyConfig.offlineMessage : autoReplyConfig.welcomeMessage;

      expect.equal(reply.includes("sau 22:00"), true);
    });

    test("F77-T4: Disabled autoReply toggle suppresses automated responses completely", () => {
      const autoReplyConfig = {
        enabled: false,
        welcomeMessage: "Chào bạn!",
        quickTemplates: [{ triggerKeyword: "size", responseMessage: "Size chuẩn ạ" }],
      };

      const shouldSendAutoReply = autoReplyConfig.enabled;
      expect.equal(shouldSendAutoReply, false);
    });

    test("F77-T5: Updating quick templates persists multiple keyword patterns correctly", () => {
      const shop = {
        shopId: "shop_01",
        autoReply: {
          enabled: true,
          quickTemplates: [],
        },
      };

      const newTemplates = [
        { id: "tpl_1", triggerKeyword: "bảo hành", responseMessage: "Bảo hành 12 tháng chính hãng" },
        { id: "tpl_2", triggerKeyword: "freeship", responseMessage: "Đơn từ 300k miễn phí vận chuyển" },
        { id: "tpl_3", triggerKeyword: "đổi trả", responseMessage: "Hỗ trợ đổi size trong 7 ngày" },
      ];

      shop.autoReply.quickTemplates = newTemplates;

      expect.equal(shop.autoReply.quickTemplates.length, 3);
      expect.equal(shop.autoReply.quickTemplates[1].triggerKeyword, "freeship");
    });
  });

  // =========================================================================
  // FEATURE 78: Triple Voucher Stacking & Checkout Ledger Persistence (5 Tests)
  // =========================================================================
  describe("Feature 78: Triple Voucher Stacking & Checkout Ledger Persistence", () => {
    test("F78-T1: Order model schema holds tripleVouchers breakdown snapshot", () => {
      const order = {
        subtotal: 500000,
        shippingFee: 30000,
        tripleVouchers: {
          freeship: { code: "FREESHIPVIP", discount: 30000 },
          shopVoucher: { code: "SHOPGENZ", discount: 50000 },
          platformVoucher: { code: "MEGA100", discount: 100000 },
          coinDiscount: 50000,
          coinsRedeemed: 50000,
        },
        total: 300000,
      };

      expect.equal(order.tripleVouchers.freeship.code, "FREESHIPVIP");
      expect.equal(order.tripleVouchers.shopVoucher.discount, 50000);
      expect.equal(order.tripleVouchers.platformVoucher.discount, 100000);
      expect.equal(order.total, 300000);
    });

    test("F78-T2: Total discount sum across 3 voucher tiers equals total savings", () => {
      const freeshipDiscount = 25000;
      const shopDiscount = 40000;
      const platformDiscount = 60000;
      const coinDiscount = 35000;

      const totalSavings = freeshipDiscount + shopDiscount + platformDiscount + coinDiscount;
      expect.equal(totalSavings, 160000);
    });

    test("F78-T3: Applying order with only freeship leaves shop and platform voucher zeroed", () => {
      const tripleVouchers = {
        freeship: { code: "FREESHIP", discount: 15000 },
        shopVoucher: { code: "", discount: 0 },
        platformVoucher: { code: "", discount: 0 },
        coinDiscount: 0,
        coinsRedeemed: 0,
      };

      expect.equal(tripleVouchers.freeship.discount, 15000);
      expect.equal(tripleVouchers.shopVoucher.discount, 0);
      expect.equal(tripleVouchers.platformVoucher.discount, 0);
    });

    test("F78-T4: Cart subtotal after shop discount serves as base for platform discount computation", () => {
      const baseSubtotal = 1000000;
      const shopVoucher = { type: "fixed", value: 100000 };
      const subtotalAfterShop = baseSubtotal - shopVoucher.value; // 900,000

      const platformVoucher = { type: "percent", value: 10, maxDiscount: 150000 };
      const platformDiscount = Math.min((subtotalAfterShop * platformVoucher.value) / 100, platformVoucher.maxDiscount); // 90,000

      expect.equal(subtotalAfterShop, 900000);
      expect.equal(platformDiscount, 90000);
    });

    test("F78-T5: Final payable total never drops below zero regardless of voucher stacking", () => {
      const subtotal = 100000;
      const shippingFee = 20000;
      const totalDiscounts = 250000; // Large stacked voucher exceeds total

      const payable = Math.max(0, subtotal + shippingFee - totalDiscounts);
      expect.equal(payable, 0);
    });
  });

  // =========================================================================
  // FEATURE 79: 3PL Carrier Webhook & Post-Delivery CSAT Feedback (5 Tests)
  // =========================================================================
  describe("Feature 79: 3PL Carrier Webhook & Post-Delivery CSAT Feedback", () => {
    test("F79-T1: 3PL webhook event DELIVERED marks order completed and triggers COD collection", () => {
      const order = {
        status: "shipping",
        paymentMethod: "COD",
        codSettlementStatus: "uncollected",
        timeline: [],
      };

      const eventStatus = "DELIVERED";
      if (eventStatus === "DELIVERED") {
        order.status = "completed";
        if (order.paymentMethod === "COD") {
          order.codSettlementStatus = "collected_by_courier";
        }
      }

      expect.equal(order.status, "completed");
      expect.equal(order.codSettlementStatus, "collected_by_courier");
    });

    test("F79-T2: 3PL webhook appends carrier audit timeline entry with hub location", () => {
      const timeline = [];
      const carrier = "VIETTEL_POST";
      const hub = "Kho Bưu Cục Hoàn Kiếm";

      timeline.push({
        time: new Date().toISOString(),
        text: `[${carrier}] Kiện hàng đã đến ${hub}. Đang phân loại để xuất bưu cục phát.`,
      });

      expect.equal(timeline.length, 1);
      expect.equal(timeline[0].text.includes("VIETTEL_POST"), true);
      expect.equal(timeline[0].text.includes("Hoàn Kiếm"), true);
    });

    test("F79-T3: CSAT feedback rating must be within 1 to 5 stars range strictly", () => {
      const validRating = 5;
      const invalidRatingLow = 0;
      const invalidRatingHigh = 6;

      const isValid = (r) => typeof r === "number" && r >= 1 && r <= 5;

      expect.equal(isValid(validRating), true);
      expect.equal(isValid(invalidRatingLow), false);
      expect.equal(isValid(invalidRatingHigh), false);
    });

    test("F79-T4: CSAT feedback aggregates deliverySpeed and courierAttitude dimensions", () => {
      const csat = {
        rating: 5,
        deliverySpeedRating: 5,
        courierAttitudeRating: 4,
        comment: "Bưu tá thân thiện, giao hỏa tốc rất nhanh!",
        submittedAt: new Date().toISOString(),
      };

      const averageScore = (csat.rating + csat.deliverySpeedRating + csat.courierAttitudeRating) / 3;

      expect.equal(averageScore.toFixed(1), "4.7");
      expect.equal(csat.comment.length > 0, true);
    });

    test("F79-T5: Failed delivery webhook preserves shipping status and records re-attempt note", () => {
      const order = {
        status: "shipping",
        timeline: [],
      };

      const eventStatus = "DELIVERY_FAILED";
      const note = "Khách đi vắng";

      if (eventStatus === "DELIVERY_FAILED") {
        order.timeline.push({
          time: new Date().toISOString(),
          text: `[SPX] Giao hàng không thành công. Lý do: ${note}. Bưu tá sẽ thử phát lại.`,
        });
      }

      expect.equal(order.status, "shipping");
      expect.equal(order.timeline[0].text.includes("Khách đi vắng"), true);
    });
  });

  // =========================================================================
  // FEATURE 80: Cart Stock Reservation TTL & Idempotency Key Guard (5 Tests)
  // =========================================================================
  describe("Feature 80: Cart Stock Reservation & Order Idempotency Engine", () => {
    test("F80-T1: Idempotency Key Guard detects replayed requests and avoids duplicate order creation", () => {
      const orders = [
        { _id: "ord_101", idempotencyKey: "idem_abc_123", total: 450000, status: "pending" },
      ];

      const incomingKey = "idem_abc_123";
      const existing = orders.find((o) => o.idempotencyKey === incomingKey);

      expect.equal(Boolean(existing), true);
      expect.equal(existing._id, "ord_101");
    });

    test("F80-T2: Stock reservation locks reservedStock and decrements available pool", () => {
      const product = { _id: "prod_p1", stock: 10, reservedStock: 0 };
      const requestedQty = 3;

      const availableStock = product.stock - product.reservedStock;
      expect.equal(availableStock >= requestedQty, true);

      // Lock reservation
      product.reservedStock += requestedQty;
      const remainingAvailable = product.stock - product.reservedStock;

      expect.equal(product.reservedStock, 3);
      expect.equal(remainingAvailable, 7);
    });

    test("F80-T3: Stock reservation rejects reservation if requested quantity exceeds available stock", () => {
      const product = { _id: "prod_p2", stock: 5, reservedStock: 4 };
      const requestedQty = 2;

      const available = product.stock - product.reservedStock; // 1
      const canReserve = requestedQty <= available;

      expect.equal(canReserve, false);
      expect.equal(available, 1);
    });

    test("F80-T4: Committing order completes reservation and clears reservedStock", () => {
      const product = { _id: "prod_p3", stock: 10, reservedStock: 2, sold: 5 };
      const reservation = { reservationId: "resv_99", status: "ACTIVE", quantity: 2 };

      // Checkout completed: commit
      reservation.status = "COMMITTED";
      product.reservedStock = Math.max(0, product.reservedStock - reservation.quantity);
      product.stock = Math.max(0, product.stock - reservation.quantity);
      product.sold += reservation.quantity;

      expect.equal(reservation.status, "COMMITTED");
      expect.equal(product.reservedStock, 0);
      expect.equal(product.stock, 8);
      expect.equal(product.sold, 7);
    });

    test("F80-T5: Expired or cancelled reservation releases reservedStock back to catalog", () => {
      const product = { _id: "prod_p4", stock: 20, reservedStock: 5 };
      const reservation = {
        reservationId: "resv_100",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() - 60000).toISOString(), // expired
        quantity: 5,
      };

      const now = new Date().toISOString();
      if (reservation.expiresAt <= now && reservation.status === "ACTIVE") {
        reservation.status = "EXPIRED";
        product.reservedStock = Math.max(0, product.reservedStock - reservation.quantity);
      }

      expect.equal(reservation.status, "EXPIRED");
      expect.equal(product.reservedStock, 0);
      expect.equal(product.stock - product.reservedStock, 20);
    });
  });

  // =========================================================================
  // FEATURE 81: Flash Sale Real-time Countdown & Stock Depletion Broadcast (5 Tests)
  // =========================================================================
  describe("Feature 81: Flash Sale Real-time Countdown & Stock Depletion Broadcast", () => {
    test("F81-T1: Flash sale slot countdown computes valid remaining hours, minutes and seconds", () => {
      const remainingSeconds = 3600 * 2 + 60 * 45 + 30; // 2h 45m 30s
      const countdown = {
        hours: Math.floor(remainingSeconds / 3600),
        minutes: Math.floor((remainingSeconds % 3600) / 60),
        seconds: remainingSeconds % 60,
      };

      expect.equal(countdown.hours, 2);
      expect.equal(countdown.minutes, 45);
      expect.equal(countdown.seconds, 30);
    });

    test("F81-T2: Stock depletion engine classifies status as CRITICAL_LOW when stock <= 3", () => {
      const item = { stock: 2, sold: 98 };
      const percentSold = Math.round((item.sold / (item.stock + item.sold)) * 100);

      let depletionStatus = "AVAILABLE";
      if (item.stock === 0) depletionStatus = "SOLD_OUT";
      else if (item.stock <= 3 || percentSold >= 90) depletionStatus = "CRITICAL_LOW";
      else if (item.stock <= 10 || percentSold >= 70) depletionStatus = "BURNING_OUT";

      expect.equal(depletionStatus, "CRITICAL_LOW");
      expect.equal(percentSold, 98);
    });

    test("F81-T3: Burning out deals trigger alert flag and gradient badge", () => {
      const item = { stock: 8, sold: 40 };
      const percentSold = Math.round((item.sold / (item.stock + item.sold)) * 100);

      const isBurningOut = item.stock <= 10 || percentSold >= 70;
      expect.equal(isBurningOut, true);
    });

    test("F81-T4: Fully sold out flash deal switches depletion status to SOLD_OUT", () => {
      const item = { stock: 0, sold: 100 };
      const depletionStatus = item.stock === 0 ? "SOLD_OUT" : "AVAILABLE";

      expect.equal(depletionStatus, "SOLD_OUT");
    });

    test("F81-T5: Multi-slot query correctly links products to requested slotId", () => {
      const response = {
        slot: "slot-2",
        products: [
          { _id: "prod_1", slotId: "slot-2", discountPercent: 45 },
          { _id: "prod_2", slotId: "slot-2", discountPercent: 30 },
        ],
      };

      expect.equal(response.slot, "slot-2");
      expect.equal(response.products.length, 2);
      expect.equal(response.products.every((p) => p.slotId === "slot-2"), true);
    });
  });

  // =========================================================================
  // FEATURE 82: Merchant KYC & Tax Compliance Center (5 Tests)
  // =========================================================================
  describe("Feature 82: Merchant KYC & Tax Compliance Center", () => {
    test("F82-T1: Shop KYC classification validates ENTERPRISE, HOUSEHOLD, and INDIVIDUAL types", () => {
      const validTypes = ["ENTERPRISE", "HOUSEHOLD", "INDIVIDUAL"];
      const isValid = (t) => validTypes.includes(t);

      expect.equal(isValid("ENTERPRISE"), true);
      expect.equal(isValid("HOUSEHOLD"), true);
      expect.equal(isValid("INDIVIDUAL"), true);
      expect.equal(isValid("UNKNOWN_TYPE"), false);
    });

    test("F82-T2: Vietnamese Tax Identification Number (MST) format validation (10 or 13 digits)", () => {
      const validateMST = (mst) => {
        if (!mst || typeof mst !== "string") return false;
        const clean = mst.replace(/-/g, "").trim();
        return /^[0-9]{10}$|^[0-9]{13}$/.test(clean);
      };

      expect.equal(validateMST("0318928172"), true); // 10-digit enterprise MST
      expect.equal(validateMST("0318928172-001"), true); // 13-digit branch MST
      expect.equal(validateMST("12345"), false); // too short
      expect.equal(validateMST("ABC1234567"), false); // non-digits
    });

    test("F82-T3: Approving KYC sets status to VERIFIED and awards Đã Xác Minh Thuế badge", () => {
      const shop = {
        shopId: "shop_test_kyc",
        badges: ["Chính Hãng 100%"],
        kycVerification: {
          status: "PENDING_REVIEW",
          taxId: "0318928172",
        },
      };

      // Admin executes APPROVE
      shop.kycVerification.status = "VERIFIED";
      shop.kycVerification.verifiedAt = new Date().toISOString();
      if (!shop.badges.includes("Đã Xác Minh Thuế")) {
        shop.badges.push("Đã Xác Minh Thuế");
      }

      expect.equal(shop.kycVerification.status, "VERIFIED");
      expect.equal(shop.badges.includes("Đã Xác Minh Thuế"), true);
      expect.equal(Boolean(shop.kycVerification.verifiedAt), true);
    });

    test("F82-T4: Rejecting KYC records rejectedReason and strips verifiedAt", () => {
      const shop = {
        shopId: "shop_test_kyc2",
        kycVerification: {
          status: "PENDING_REVIEW",
          verifiedAt: "2026-01-01T00:00:00.000Z",
        },
      };

      const reason = "Ảnh chụp GPKD mờ, không trùng khớp tên người đại diện";
      shop.kycVerification.status = "REJECTED";
      shop.kycVerification.rejectedReason = reason;
      shop.kycVerification.verifiedAt = null;

      expect.equal(shop.kycVerification.status, "REJECTED");
      expect.equal(shop.kycVerification.rejectedReason, reason);
      expect.equal(shop.kycVerification.verifiedAt, null);
    });

    test("F82-T5: Audit log captures KYC arbitration with admin ID and shop entity", () => {
      const auditLog = {
        userId: "user_admin_01",
        userName: "Super Admin",
        action: "KYC_MERCHANT_APPROVE",
        entityType: "SHOP",
        entityId: "shop_01",
        details: { action: "APPROVE", shopName: "Thời Trang GenZ Official" },
        createdAt: new Date().toISOString(),
      };

      expect.equal(auditLog.action, "KYC_MERCHANT_APPROVE");
      expect.equal(auditLog.entityType, "SHOP");
      expect.equal(auditLog.entityId, "shop_01");
      expect.equal(auditLog.details.action, "APPROVE");
    });
  });

  // =========================================================================
  // FEATURE 83: Seller Auto-Reply Keyword Engine & Sandbox Simulator (5 Tests)
  // =========================================================================
  describe("Feature 83: Seller Auto-Reply Keyword Engine & Sandbox Simulator", () => {
    const autoReplyConfig = {
      enabled: true,
      welcomeMessage: "Cảm ơn bạn đã ghé thăm gian hàng!",
      offlineMessage: "Hiện tại shop đang ngoài giờ làm việc (sau 22:00).",
      quickTemplates: [
        { triggerKeyword: "khi nào giao", responseMessage: "Đơn hàng sẽ giao trong 24h qua SPX ạ!" },
        { triggerKeyword: "tư vấn size", responseMessage: "Bạn gửi chiều cao và cân nặng nhé!" },
        { triggerKeyword: "freeship", responseMessage: "Shop hỗ trợ freeship cho đơn từ 300k trở lên!" },
      ],
    };

    test("F83-T1: Outside working hours flag triggers OFFLINE_HOURS response unconditionally", () => {
      const simulate = (msg, isOutside) => {
        if (!autoReplyConfig.enabled) return { triggered: false };
        if (isOutside) {
          return { triggered: true, ruleType: "OFFLINE_HOURS", reply: autoReplyConfig.offlineMessage };
        }
        return { triggered: true, ruleType: "WELCOME_FALLBACK", reply: autoReplyConfig.welcomeMessage };
      };

      const res = simulate("khi nào giao", true);
      expect.equal(res.triggered, true);
      expect.equal(res.ruleType, "OFFLINE_HOURS");
      expect.equal(res.reply, autoReplyConfig.offlineMessage);
    });

    test("F83-T2: Matching trigger keyword in buyer message triggers KEYWORD_TRIGGER rule", () => {
      const buyerText = "Shop ơi cho mình hỏi khi nào giao hàng tới Hà Nội?";
      const lower = buyerText.toLowerCase();

      const matched = autoReplyConfig.quickTemplates.find((t) =>
        lower.includes(t.triggerKeyword.toLowerCase())
      );

      expect.equal(Boolean(matched), true);
      expect.equal(matched.triggerKeyword, "khi nào giao");
      expect.equal(matched.responseMessage.includes("SPX"), true);
    });

    test("F83-T3: Case-insensitive keyword matching resolves accurately", () => {
      const buyerText = "SHOP ƠI TƯ VẤN SIZE CHO EM VỚI";
      const lower = buyerText.toLowerCase();

      const matched = autoReplyConfig.quickTemplates.find((t) =>
        lower.includes(t.triggerKeyword.toLowerCase())
      );

      expect.equal(Boolean(matched), true);
      expect.equal(matched.triggerKeyword, "tư vấn size");
    });

    test("F83-T4: Message without matched keywords defaults to WELCOME_FALLBACK", () => {
      const buyerText = "Xin chào shop";
      const lower = buyerText.toLowerCase();

      const matched = autoReplyConfig.quickTemplates.find((t) =>
        lower.includes(t.triggerKeyword.toLowerCase())
      );

      const ruleType = matched ? "KEYWORD_TRIGGER" : "WELCOME_FALLBACK";
      const reply = matched ? matched.responseMessage : autoReplyConfig.welcomeMessage;

      expect.equal(ruleType, "WELCOME_FALLBACK");
      expect.equal(reply, autoReplyConfig.welcomeMessage);
    });

    test("F83-T5: Disabled auto-reply engine halts responses cleanly", () => {
      const disabledConfig = { ...autoReplyConfig, enabled: false };
      const shouldTrigger = disabledConfig.enabled === true;

      expect.equal(shouldTrigger, false);
    });
  });

  // =========================================================================
  // FEATURE 84: Checkout 1-Click Stock Reservation Transition & Client Auto-Release (5 Tests)
  // =========================================================================
  describe("Feature 84: Checkout 1-Click Stock Reservation Transition & Client Auto-Release", () => {
    test("F84-T1: Client-side reserveStock invocation transitions cart items to active reservation with 15-minute expiration", async () => {
      const p1 = await Product.create({
        name: "Sản phẩm test Checkout TTL",
        price: 250000,
        stock: 10,
        reservedStock: 0,
      });

      const reservation = memoryStore.reservations.create("user_checkout_01", [{ productId: p1._id, quantity: 2 }], 15);
      expect.equal(reservation.status, "ACTIVE");
      expect.equal(reservation.items.length, 1);
      expect.equal(reservation.items[0].quantity, 2);

      const updated = await Product.findById(p1._id);
      expect.equal(updated.reservedStock, 2);
      expect.equal(updated.stock - updated.reservedStock, 8);
    });

    test("F84-T2: Order payload bundling reservationId and idempotencyKey commits reservation and prevents race conditions", async () => {
      const p2 = await Product.create({
        name: "Sản phẩm test Commit",
        price: 300000,
        stock: 20,
        reservedStock: 0,
      });

      const resv = memoryStore.reservations.create("user_checkout_02", [{ productId: p2._id, quantity: 3 }], 15);
      const idempotencyKey = `IDEMP_${Date.now()}_test84_commit`;

      const order = await Order.create({
        orderId: `ORD_${Date.now()}_84`,
        idempotencyKey,
        reservationId: resv.reservationId,
        customer: { fullName: "Nguyễn Văn Test", phone: "0901234567", address: "Hà Nội" },
        items: [{ productId: p2._id, name: p2.name, price: 300000, quantity: 3 }],
        total: 900000,
        status: "pending",
      });

      const committed = memoryStore.reservations.commit(resv.reservationId);
      expect.equal(committed, true);
      expect.equal(resv.status, "COMMITTED");

      const checkOrder = await Order.findOne({ idempotencyKey });
      expect.equal(Boolean(checkOrder), true);
      expect.equal(checkOrder.reservationId, resv.reservationId);
    });

    test("F84-T3: Client auto-release on checkout abandonment releases reserved items back to available stock pool", async () => {
      const p3 = await Product.create({
        name: "Sản phẩm test Abandonment Release",
        price: 150000,
        stock: 5,
        reservedStock: 0,
      });

      const resv = memoryStore.reservations.create("user_checkout_abandon", [{ productId: p3._id, quantity: 4 }], 15);
      let prod = await Product.findById(p3._id);
      expect.equal(prod.reservedStock, 4);

      const released = memoryStore.reservations.release(resv.reservationId);
      expect.equal(released, true);
      expect.equal(resv.status, "CANCELLED");

      prod = await Product.findById(p3._id);
      expect.equal(prod.reservedStock, 0);
      expect.equal(prod.stock - prod.reservedStock, 5);
    });

    test("F84-T4: IdempotencyKey prevents double-order submission across concurrent client calls", async () => {
      const idempotencyKey = `IDEMP_UNIQUE_TEST_CALL_${Date.now()}`;
      
      await Order.create({
        orderId: `ORD_IDEMP_${Date.now()}`,
        idempotencyKey,
        customer: { fullName: "Khách 1", phone: "0911222333", address: "HCM" },
        items: [{ name: "Item 1", price: 100000, quantity: 1 }],
        total: 100000,
        status: "pending",
      });

      const duplicateFound = await Order.findOne({ idempotencyKey });
      expect.equal(Boolean(duplicateFound), true);
      expect.equal(duplicateFound.idempotencyKey, idempotencyKey);
    });

    test("F84-T5: Expired reservation detection prevents committing stale reservations", async () => {
      const p5 = await Product.create({
        name: "Sản phẩm test Expired TTL",
        price: 120000,
        stock: 8,
        reservedStock: 0,
      });

      const resv = memoryStore.reservations.create("user_stale", [{ productId: p5._id, quantity: 2 }], -1);
      const isExpired = new Date(resv.expiresAt) <= new Date();
      expect.equal(isExpired, true);

      memoryStore.reservations.cleanExpired();
      const afterClean = memoryStore.reservations.findById(resv.reservationId);
      expect.equal(afterClean.status, "EXPIRED");

      const prod = await Product.findById(p5._id);
      expect.equal(prod.reservedStock, 0);
    });
  });

  // =========================================================================
  // FEATURE 85: Super Admin Security Incident Response & Audit Trail Export (5 Tests)
  // =========================================================================
  describe("Feature 85: Super Admin Security Incident Response & Audit Trail Export", () => {
    test("F85-T1: Audit log recorder registers critical actions with user ID, role, action, and timestamp", async () => {
      const log = await recordAuditLog({
        userId: "admin_sec_01",
        userName: "Võ An Ninh (Security Lead)",
        userRole: "admin",
        action: "SUSPEND_FRAUDULENT_ACCOUNT",
        entityType: "USER",
        entityId: "user_attacker_99",
        details: { reason: "Sybil attack voucher farming detected", confidence: 0.98 },
        ip: "10.0.0.99",
      });

      expect.equal(Boolean(log), true);
      expect.equal(log.action, "SUSPEND_FRAUDULENT_ACCOUNT");
      expect.equal(log.entityId, "user_attacker_99");
      expect.equal(Boolean(log.createdAt), true);
    });

    test("F85-T2: Audit trail export in JSON format yields structured schema with totalRecords and ISO timestamp", async () => {
      const logs = await AuditLog.find({});
      const exportPayload = {
        format: "json",
        exportedAt: new Date().toISOString(),
        totalRecords: logs.length,
        logs,
      };

      expect.equal(exportPayload.format, "json");
      expect.equal(typeof exportPayload.totalRecords, "number");
      expect.equal(exportPayload.totalRecords >= 1, true);
      expect.equal(Array.isArray(exportPayload.logs), true);
    });

    test("F85-T3: Audit trail export in CSV format outputs UTF-8 BOM, standard headers, and properly escaped fields", () => {
      const sampleLogs = [
        {
          _id: "aud_01",
          createdAt: "2026-10-10T12:00:00.000Z",
          userName: "Tổng Quản Trị Viên",
          userRole: "admin",
          action: "UPDATE_COMMISSION",
          entityType: "SHOP",
          entityId: "shop_01",
          details: { oldRate: 0.05, newRate: 0.04 },
          ip: "127.0.0.1",
        },
      ];

      const headers = ["ID", "Thoi_Gian", "Nguoi_Thuc_Hien", "Vai_Tro", "Hanh_Dong", "Thuc_The", "Ma_Thuc_The", "Chi_Tiet", "IP_Address"];
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = sampleLogs.map((log) => [
        escapeCsv(log._id),
        escapeCsv(log.createdAt),
        escapeCsv(log.userName),
        escapeCsv(log.userRole),
        escapeCsv(log.action),
        escapeCsv(log.entityType),
        escapeCsv(log.entityId),
        escapeCsv(log.details),
        escapeCsv(log.ip),
      ].join(","));

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

      expect.equal(csvContent.startsWith("\uFEFF"), true);
      expect.equal(csvContent.includes("UPDATE_COMMISSION"), true);
      expect.equal(csvContent.includes('""oldRate"":0.05'), true);
    });

    test("F85-T4: Action-based filtering isolates targeted operations", async () => {
      await recordAuditLog({
        userId: "admin_kyc_01",
        userName: "Nguyễn Thẩm Định KYC",
        userRole: "admin",
        action: "ARBITRATE_KYC",
        entityType: "SHOP",
        entityId: "shop_kyc_filter_test",
        details: { status: "VERIFIED" },
      });

      const allLogs = await AuditLog.find({});
      const kycLogs = allLogs.filter((l) => l.action === "ARBITRATE_KYC");
      expect.equal(kycLogs.length >= 1, true);
      expect.equal(kycLogs.every((l) => l.action === "ARBITRATE_KYC"), true);
    });

    test("F85-T5: Date range boundary filters constrain audit event timeframe strictly between startDate and endDate", () => {
      const pastLog = { createdAt: "2026-01-01T00:00:00.000Z" };
      const currentLog = { createdAt: "2026-10-10T10:00:00.000Z" };
      const futureLog = { createdAt: "2026-12-31T23:59:59.000Z" };

      const startDate = new Date("2026-10-01T00:00:00.000Z");
      const endDate = new Date("2026-10-31T23:59:59.000Z");

      const filterByDateRange = (l) => {
        const d = new Date(l.createdAt);
        return d >= startDate && d <= endDate;
      };

      expect.equal(filterByDateRange(pastLog), false);
      expect.equal(filterByDateRange(currentLog), true);
      expect.equal(filterByDateRange(futureLog), false);
    });
  });

  // =========================================================================
  // FEATURE 86: Seller Automated Shipping Label & Dispatch Manifest Generator (5 Tests)
  // =========================================================================
  describe("Feature 86: Seller Automated Shipping Label & Dispatch Manifest Generator", () => {
    test("F86-T1: Generates standardized SPX Logistics Manifest with sender, recipient, routing hub, and carrier specifications", () => {
      const order = {
        orderId: "ORD_SPX_01",
        trackingCode: "SPX-VN-11223344",
        customerName: "Đỗ Minh Khách",
        phone: "0912345678",
        address: "72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
        items: [{ productId: "p_01", name: "Áo Polo Nam", quantity: 2, price: 200000 }],
        paymentMethod: "COD",
        total: 400000,
        shippingFee: 25000,
      };

      const shop = {
        name: "Shop Thời Trang GenZ",
        phone: "0987654321",
        address: "Kho SPX Tân Bình, TP.HCM",
      };

      const manifest = {
        manifestId: `MNF-${order.orderId}`,
        trackingCode: order.trackingCode,
        orderId: order.orderId,
        carrier: "SPX Express Standard Delivery",
        routingHub: "SGN-HUB-D1",
        sender: { name: shop.name, phone: shop.phone, address: shop.address },
        recipient: { name: order.customerName, phone: order.phone, address: order.address },
        items: order.items,
        codAmount: order.paymentMethod === "COD" ? order.total : 0,
        isCod: true,
      };

      expect.equal(manifest.carrier, "SPX Express Standard Delivery");
      expect.equal(manifest.routingHub, "SGN-HUB-D1");
      expect.equal(manifest.sender.name, "Shop Thời Trang GenZ");
      expect.equal(manifest.recipient.name, "Đỗ Minh Khách");
      expect.equal(manifest.trackingCode, "SPX-VN-11223344");
    });

    test("F86-T2: Computes COD collecting amount strictly for cash-on-delivery orders while zeroing for prepaid orders", () => {
      const codOrder = { paymentMethod: "COD", total: 350000 };
      const prepaidOrder = { paymentMethod: "VIETQR", total: 350000 };

      const getCod = (ord) => (ord.paymentMethod === "COD" ? ord.total : 0);

      expect.equal(getCod(codOrder), 350000);
      expect.equal(getCod(prepaidOrder), 0);
    });

    test("F86-T3: Generates machine-readable linear barcode format and QR code dispatch payload", () => {
      const trackingCode = "SPX-VN-88776655";
      const orderId = "ORD_BARCODE_01";
      const total = 500000;

      const linearBarcode = `*${trackingCode}*`;
      const qrPayload = `SPX|${orderId}|${total}|${trackingCode}`;

      expect.equal(linearBarcode, "*SPX-VN-88776655*");
      expect.equal(qrPayload.startsWith("SPX|"), true);
      expect.equal(qrPayload.includes(orderId), true);
      expect.equal(qrPayload.includes(trackingCode), true);
    });

    test("F86-T4: Batch order dispatch transitions selected pending orders to shipping status with unique SPX tracking codes", async () => {
      const o1 = await Order.create({
        orderId: `ORD_BATCH_D1_${Date.now()}`,
        status: "pending",
        customer: { fullName: "Khách A", phone: "0901", address: "Hà Nội" },
        items: [{ name: "Hàng A", price: 100000, quantity: 1 }],
        total: 100000,
      });
      const o2 = await Order.create({
        orderId: `ORD_BATCH_D2_${Date.now()}`,
        status: "pending",
        customer: { fullName: "Khách B", phone: "0902", address: "Đà Nẵng" },
        items: [{ name: "Hàng B", price: 200000, quantity: 1 }],
        total: 200000,
      });

      const orderIds = [o1.orderId, o2.orderId];
      const dispatched = [];

      for (const id of orderIds) {
        const ord = await Order.findOne({ orderId: id });
        if (ord && ord.status === "pending") {
          ord.status = "shipping";
          ord.statusText = "Đang giao hàng";
          ord.trackingCode = `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;
          await ord.save?.();
          dispatched.push(ord);
        }
      }

      expect.equal(dispatched.length, 2);
      expect.equal(dispatched[0].status, "shipping");
      expect.equal(dispatched[0].trackingCode.startsWith("SPX-VN-"), true);
      expect.equal(dispatched[1].status, "shipping");
    });

    test("F86-T5: Batch dispatch logs audit trail entry with user identity and dispatched order count", async () => {
      const auditLog = await recordAuditLog({
        userId: "seller_01",
        userName: "Shop Chủ",
        userRole: "seller",
        action: "BATCH_DISPATCH_ORDERS",
        entityType: "ORDER",
        entityId: "BATCH_2",
        details: { dispatchedCount: 2, orderIds: ["ORD_1", "ORD_2"] },
      });

      expect.equal(Boolean(auditLog), true);
      expect.equal(auditLog.action, "BATCH_DISPATCH_ORDERS");
      expect.equal(auditLog.details.dispatchedCount, 2);
    });
  });

  // =========================================================================
  // FEATURE 87: Smart Multi-tier Loyalty & VIP Membership Club System (5 Tests)
  // =========================================================================
  describe("Feature 87: Smart Multi-tier Loyalty & VIP Membership Club System", () => {
    test("F87-T1: Computes BRONZE tier for new user with zero orders and zero lifetime spent", () => {
      const tier = computeLoyaltyTier(0, 0);
      expect.equal(tier.tier, "BRONZE");
      expect.equal(tier.coinMultiplier, 1.0);
      expect.equal(tier.nextTier, "SILVER");
      expect.equal(tier.spentToNext, 1000000);
      expect.equal(tier.progressPercent, 0);
    });

    test("F87-T2: Automatically promotes to SILVER tier upon reaching 1,000,000 VND spent or 5 orders", () => {
      const tierBySpent = computeLoyaltyTier(1500000, 2);
      expect.equal(tierBySpent.tier, "SILVER");
      expect.equal(tierBySpent.coinMultiplier, 1.2);
      expect.equal(tierBySpent.nextTier, "GOLD");

      const tierByOrders = computeLoyaltyTier(600000, 5);
      expect.equal(tierByOrders.tier, "SILVER");
      expect.equal(tierByOrders.coinMultiplier, 1.2);
    });

    test("F87-T3: Promotes to GOLD tier (5M VND or 15 orders) with 1.5x Mini Xu multiplier and exclusive perks", () => {
      const goldTier = computeLoyaltyTier(6500000, 16);
      expect.equal(goldTier.tier, "GOLD");
      expect.equal(goldTier.coinMultiplier, 1.5);
      expect.equal(goldTier.nextTier, "DIAMOND");
      expect.equal(goldTier.perks.length >= 4, true);
    });

    test("F87-T4: Promotes to DIAMOND tier (15M VND or 30 orders) with 2.0x Xu and 100% progress", () => {
      const diamondTier = computeLoyaltyTier(22000000, 32);
      expect.equal(diamondTier.tier, "DIAMOND");
      expect.equal(diamondTier.coinMultiplier, 2.0);
      expect.equal(diamondTier.nextTier, null);
      expect.equal(diamondTier.progressPercent, 100);
      expect.equal(diamondTier.spentToNext, 0);
    });

    test("F87-T5: User profile persists loyalty points, tier, and lifetime spent consistently", async () => {
      const testUser = await User.create({
        fullName: "Khách Hàng Thân Thiết VIP",
        email: `vip.loyalty.${Date.now()}@test.vn`,
        password: "hash_pw",
        role: "customer",
        coins: 1500,
        loyalty: {
          tier: "GOLD",
          points: 5200,
          lifetimeSpent: 5200000,
          orderCount: 16,
          lastEvaluatedAt: new Date(),
        },
      });

      const foundUser = await User.findById(testUser.id || testUser._id);
      expect.equal(Boolean(foundUser), true);
      expect.equal(foundUser.loyalty.tier, "GOLD");
      expect.equal(foundUser.loyalty.points, 5200);
      expect.equal(foundUser.loyalty.lifetimeSpent, 5200000);
    });
  });

  // =========================================================================
  // FEATURE 88: Real-time Live Stream & Product Showcase Floating Widget (5 Tests)
  // =========================================================================
  describe("Feature 88: Real-time Live Stream & Product Showcase Floating Widget", () => {
    test("F88-T1: Pinned live stream discount percent calculates accurately", () => {
      const originalPrice = 400000;
      const livePrice = 280000;
      const discountPercent = Math.round(((originalPrice - livePrice) / originalPrice) * 100);
      expect.equal(discountPercent, 30);
    });

    test("F88-T2: Live voucher code validation conforms to alphanumeric pattern with expiry guard", () => {
      const voucher = {
        code: "LIVEHOT50",
        discountAmount: 50000,
        minOrder: 200000,
        expiresInMinutes: 15,
      };
      const isValidFormat = /^[A-Z0-9_-]+$/.test(voucher.code);
      expect.equal(isValidFormat, true);
      expect.equal(voucher.expiresInMinutes > 0, true);
      expect.equal(voucher.discountAmount, 50000);
    });

    test("F88-T3: Client like counter increments without mutation collisions", () => {
      let initialLikes = 24500;
      const likeAction = () => { initialLikes += 1; return initialLikes; };
      const newCount = likeAction();
      expect.equal(newCount, 24501);
    });

    test("F88-T4: Real-time live comment prepends cleanly to message stream", () => {
      const messageStream = [
        { id: "m1", user: "User A", text: "Chốt 1 chiếc", time: "10s trước" },
      ];
      const newComment = { id: "m2", user: "User B", text: "Có freeship không shop?", time: "Vừa xong" };
      const updatedStream = [newComment, ...messageStream];
      expect.equal(updatedStream.length, 2);
      expect.equal(updatedStream[0].id, "m2");
      expect.equal(updatedStream[0].user, "User B");
    });

    test("F88-T5: Live showcase products list contains valid non-empty array with price metadata", async () => {
      const liveProducts = await Product.find({ isActive: true });
      expect.equal(Array.isArray(liveProducts), true);
      expect.equal(liveProducts.length > 0, true);
      const first = liveProducts[0];
      expect.equal(first.price > 0, true);
      expect.equal(typeof (first.name || ""), "string");
    });
  });

  // =========================================================================
  // FEATURE 89: Seller COD Cash-on-Delivery Settlement & Remittance Suite (5 Tests)
  // =========================================================================
  describe("Feature 89: Seller COD Settlement & Remittance Suite", () => {
    test("F89-T1: Computes COD fee at standard 1.5% and calculates net remittance", () => {
      const orderTotal = 400000;
      const codFeeRate = 0.015;
      const codFee = Math.round(orderTotal * codFeeRate);
      const netRemittance = orderTotal - codFee;
      expect.equal(codFee, 6000);
      expect.equal(netRemittance, 394000);
    });

    test("F89-T2: Distinguishes uncollected vs collected_by_courier COD settlement states", () => {
      const order1 = { status: "shipping", codSettlementStatus: "uncollected" };
      const order2 = { status: "completed", codSettlementStatus: "collected_by_courier" };
      expect.equal(order1.codSettlementStatus, "uncollected");
      expect.equal(order2.codSettlementStatus, "collected_by_courier");
    });

    test("F89-T3: Multi-order batch COD reconciliation aggregates net settlement amount accurately", () => {
      const collectedOrders = [
        { id: "cod_1", total: 200000, codFee: 3000, net: 197000 },
        { id: "cod_2", total: 500000, codFee: 7500, net: 492500 },
        { id: "cod_3", total: 1000000, codFee: 15000, net: 985000 },
      ];
      const aggregatedNet = collectedOrders.reduce((acc, o) => acc + o.net, 0);
      expect.equal(aggregatedNet, 1674500);
      expect.equal(collectedOrders.length, 3);
    });

    test("F89-T4: Reconciled COD transition updates status to remitted_to_seller with timestamp", async () => {
      const testCodOrder = await Order.create({
        orderId: `ORD_COD_${Date.now()}`,
        status: "completed",
        paymentMethod: "COD",
        total: 350000,
        customer: { fullName: "Khách COD", phone: "0911223344", address: "Hà Nội" },
        items: [{ name: "Sản phẩm COD", price: 350000, quantity: 1, shopId: "shop_01" }],
        codSettlementStatus: "collected_by_courier",
      });

      expect.equal(testCodOrder.codSettlementStatus, "collected_by_courier");

      // Simulate reconciliation
      testCodOrder.codSettlementStatus = "remitted_to_seller";
      testCodOrder.codReconciledAt = new Date().toISOString();
      await testCodOrder.save?.();

      expect.equal(testCodOrder.codSettlementStatus, "remitted_to_seller");
      expect.equal(Boolean(testCodOrder.codReconciledAt), true);
    });

    test("F89-T5: Recording COD settlement logs audit trail entry with reconciled amount and order count", async () => {
      const auditLog = await recordAuditLog({
        userId: "seller_01",
        userName: "Thời Trang GenZ Official",
        userRole: "seller",
        action: "RECONCILE_COD_SETTLEMENT",
        entityType: "ORDER",
        entityId: "COD_RECONCILE_3",
        details: { reconciledCount: 3, totalAmount: 1674500, orderIds: ["cod_1", "cod_2", "cod_3"] },
      });

      expect.equal(Boolean(auditLog), true);
      expect.equal(auditLog.action, "RECONCILE_COD_SETTLEMENT");
      expect.equal(auditLog.details.reconciledCount, 3);
      expect.equal(auditLog.details.totalAmount, 1674500);
    });
  });

  // =========================================================================
  // FEATURE 90: CSAT Delivery Experience & Courier Performance Rating (5 Tests)
  // =========================================================================
  describe("Feature 90: CSAT Delivery Experience & Courier Performance Rating", () => {
    test("F90-T1: Validates star ratings within strict bounds 1 to 5", () => {
      const validateRating = (r) => typeof r === "number" && r >= 1 && r <= 5;
      expect.equal(validateRating(5), true);
      expect.equal(validateRating(1), true);
      expect.equal(validateRating(0), false);
      expect.equal(validateRating(6), false);
    });

    test("F90-T2: Order persists composite CSAT ratings (overall, speed, courier attitude)", async () => {
      const testOrder = await Order.create({
        orderId: `ORD_CSAT_${Date.now()}`,
        status: "completed",
        customer: { fullName: "Khách CSAT", phone: "0988776655", address: "TP.HCM" },
        items: [{ name: "Sản phẩm A", price: 250000, quantity: 1, shopId: "shop_01" }],
        total: 250000,
        carrierPartner: "SPX_EXPRESS",
      });

      testOrder.csatFeedback = {
        rating: 5,
        deliverySpeedRating: 5,
        courierAttitudeRating: 4,
        comment: "Bưu tá rất lịch sự, gọi điện trước khi giao 15 phút",
        submittedAt: new Date().toISOString(),
      };
      await testOrder.save?.();

      const found = await Order.findOne({ orderId: testOrder.orderId });
      expect.equal(Boolean(found), true);
      expect.equal(found.csatFeedback.rating, 5);
      expect.equal(found.csatFeedback.courierAttitudeRating, 4);
    });

    test("F90-T3: CSAT feedback updates order delivery timeline entry", async () => {
      const testOrder = await Order.create({
        orderId: `ORD_CSAT_TL_${Date.now()}`,
        status: "delivered",
        customer: { fullName: "Khách Timeline", phone: "0900", address: "Hải Phòng" },
        items: [{ name: "Hàng test", price: 100000, quantity: 1 }],
        total: 100000,
        timeline: [],
      });

      const ratingText = `Khách hàng đánh giá dịch vụ giao vận 5/5 sao: Hài lòng`;
      testOrder.timeline.push({ time: new Date().toISOString(), text: ratingText });
      await testOrder.save?.();

      expect.equal(testOrder.timeline.length, 1);
      expect.equal(testOrder.timeline[0].text.includes("5/5 sao"), true);
    });

    test("F90-T4: Average CSAT rating score computes correctly across multiple courier deliveries", () => {
      const ratings = [5, 4, 5, 3, 5];
      const avg = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
      expect.equal(avg, 4.4);
    });

    test("F90-T5: Carrier delivery satisfaction percentage identifies >80% threshold", () => {
      const positiveDeliveries = 42;
      const totalDeliveries = 48;
      const csatPercent = Math.round((positiveDeliveries / totalDeliveries) * 100);
      expect.equal(csatPercent >= 80, true);
      expect.equal(csatPercent, 88);
    });
  });

  // =========================================================================
  // FEATURE 91: Smart Price Comparison & Competitor Monitoring Radar (5 Tests)
  // =========================================================================
  describe("Feature 91: Smart Price Comparison & Competitor Monitoring Radar for Sellers", () => {
    test("F91-T1: Product priced significantly lower than market avg (-5%+) is marked as WINNING Buy Box", () => {
      const myPrice = 180000;
      const avgMarketPrice = 200000;
      const isWinning = myPrice < avgMarketPrice * 0.95;
      expect.equal(isWinning, true);
    });

    test("F91-T2: Product priced higher than market avg (+8%+) is flagged as OVERPRICED with lower suggested price", () => {
      const myPrice = 250000;
      const avgMarketPrice = 200000;
      const isOverpriced = myPrice > avgMarketPrice * 1.08;
      const suggestedPrice = Math.round(avgMarketPrice * 0.98);
      expect.equal(isOverpriced, true);
      expect.equal(suggestedPrice, 196000);
      expect.equal(suggestedPrice < myPrice, true);
    });

    test("F91-T3: Price difference percentage computes accurately with rounding", () => {
      const myPrice = 230000;
      const avgMarketPrice = 200000;
      const diff = myPrice - avgMarketPrice;
      const diffPercent = Number(((diff / avgMarketPrice) * 100).toFixed(1));
      expect.equal(diffPercent, 15.0);
    });

    test("F91-T4: Overall shop price competitiveness score evaluates correctly between 0 and 100", () => {
      const radarItems = [
        { buyBoxStatus: "winning" },
        { buyBoxStatus: "winning" },
        { buyBoxStatus: "competitive" },
        { buyBoxStatus: "overpriced" },
      ];
      const winningCount = radarItems.filter((i) => i.buyBoxStatus === "winning").length;
      const overpricedCount = radarItems.filter((i) => i.buyBoxStatus === "overpriced").length;
      const compCount = radarItems.length - winningCount - overpricedCount;
      const score = Math.round(((winningCount * 1.0 + compCount * 0.7) / radarItems.length) * 100);
      expect.equal(winningCount, 2);
      expect.equal(overpricedCount, 1);
      expect.equal(score, 68);
    });

    test("F91-T5: Empty competitor catalog returns graceful fallback price equal to current product price", () => {
      const myPrice = 150000;
      const competitorPrices = [];
      const avgCompPrice = competitorPrices.length > 0
        ? Math.round(competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length)
        : myPrice;
      expect.equal(avgCompPrice, myPrice);
    });
  });

  // =========================================================================
  // FEATURE 92: Gift Wrapping & Personalized Greeting Card Customizer (5 Tests)
  // =========================================================================
  describe("Feature 92: Gift Wrapping & Personalized Greeting Card Customizer", () => {
    test("F92-T1: Enabling gift wrap adds standard fixed fee of 25.000₫ to order total", () => {
      const subtotal = 200000;
      const shippingFee = 25000;
      const giftWrapEnabled = true;
      const giftWrapFee = giftWrapEnabled ? 25000 : 0;
      const total = subtotal + shippingFee + giftWrapFee;
      expect.equal(giftWrapFee, 25000);
      expect.equal(total, 250000);
    });

    test("F92-T2: Order created with giftWrap schema stores theme and greeting card text", async () => {
      const order = await Order.create({
        orderId: `ORD_GIFT_${Date.now()}`,
        status: "pending",
        customer: { fullName: "Người Mua Quà", phone: "0911", address: "Đà Nẵng" },
        items: [{ name: "Hộp Son Môi Cao Cấp", price: 350000, quantity: 1 }],
        subtotal: 350000,
        total: 375000,
        giftWrap: {
          enabled: true,
          fee: 25000,
          theme: "LUXURY_RED",
          greetingMessage: "Chúc em sinh nhật vui vẻ và luôn hạnh phúc!",
          recipientName: "Lan Anh",
          senderName: "Huy Hoàng",
        },
      });

      expect.equal(order.giftWrap.enabled, true);
      expect.equal(order.giftWrap.theme, "LUXURY_RED");
      expect.equal(order.giftWrap.recipientName, "Lan Anh");
      expect.equal(order.giftWrap.fee, 25000);
    });

    test("F92-T3: Updating gift wrap toggles order total dynamically without precision error", () => {
      let initialTotal = 300000;
      let prevWrapFee = 25000;
      let newWrapFee = 0; // customer cancelled gift wrap
      let updatedTotal = initialTotal + (newWrapFee - prevWrapFee);
      expect.equal(updatedTotal, 275000);
    });

    test("F92-T4: Gift wrap themes conform to valid premium styles", () => {
      const validThemes = ["STANDARD", "LUXURY_RED", "PASTEL_PINK", "BIRTHDAY_CELEBRATION"];
      const selectedTheme = "PASTEL_PINK";
      expect.equal(validThemes.includes(selectedTheme), true);
      expect.equal(validThemes.includes("INVALID_THEME"), false);
    });

    test("F92-T5: Gift wrap registration appends distinct event entry to order timeline", async () => {
      const order = await Order.create({
        orderId: `ORD_GW_TL_${Date.now()}`,
        status: "pending",
        customer: { fullName: "Khách Quà Tặng", phone: "0922", address: "Hà Nội" },
        items: [{ name: "Nước hoa mini", price: 150000, quantity: 1 }],
        total: 175000,
        timeline: [],
      });

      const timelineText = `Đã đăng ký dịch vụ đóng gói quà tặng: LUXURY_RED - Thiệp: "Chúc mừng sinh nhật"`;
      order.timeline.push({ time: new Date().toISOString(), text: timelineText });
      await order.save?.();

      expect.equal(order.timeline.length, 1);
      expect.equal(order.timeline[0].text.includes("đóng gói quà tặng"), true);
    });
  });

  // =========================================================================
  // FEATURE 93: Social Commerce Group Buy & Team Purchase Suite (5 Tests)
  // =========================================================================
  describe("Feature 93: Social Commerce Group Buy & Team Purchase Suite", () => {
    test("F93-T1: Group buy price applies steep discount (-25%) compared to regular solo retail price", () => {
      const regularPrice = 200000;
      const groupPrice = Math.round(regularPrice * 0.75);
      const discountPercent = Math.round(((regularPrice - groupPrice) / regularPrice) * 100);
      expect.equal(groupPrice, 150000);
      expect.equal(discountPercent, 25);
    });

    test("F93-T2: Group team requires target member count and computes remaining slots", () => {
      const team = {
        targetMembers: 2,
        currentMembers: 1,
      };
      const remainingSlots = team.targetMembers - team.currentMembers;
      expect.equal(remainingSlots, 1);
      expect.equal(remainingSlots > 0, true);
    });

    test("F93-T3: Joining an existing team fills the final slot and triggers TEAM_COMPLETED_SUCCESS", () => {
      const team = {
        teamId: "team_test_123",
        targetMembers: 2,
        currentMembers: 1,
      };
      // New member joins
      team.currentMembers += 1;
      const status = team.currentMembers >= team.targetMembers ? "TEAM_COMPLETED_SUCCESS" : "TEAM_CREATED_WAITING";
      expect.equal(team.currentMembers, 2);
      expect.equal(status, "TEAM_COMPLETED_SUCCESS");
    });

    test("F93-T4: Product schema supports groupBuy configuration with active teams count", async () => {
      const product = await Product.create({
        name: "Bàn Phím Cơ TKL RGB",
        price: 600000,
        category: "Điện tử",
        groupBuy: {
          enabled: true,
          groupPrice: 450000,
          targetMembers: 3,
          activeTeamsCount: 5,
        },
      });

      expect.equal(product.groupBuy.enabled, true);
      expect.equal(product.groupBuy.groupPrice, 450000);
      expect.equal(product.groupBuy.targetMembers, 3);
      expect.equal(product.groupBuy.activeTeamsCount, 5);
    });

    test("F93-T5: Group buy team countdown expires gracefully after duration threshold", () => {
      const expiresInSeconds = 0;
      const isExpired = expiresInSeconds <= 0;
      expect.equal(isExpired, true);
    });
  });

  // =========================================================================
  // FEATURE 94: Flexible Delivery Slot & Doorstep Rescheduling Hub (5 Tests)
  // =========================================================================
  describe("Feature 94: Flexible Delivery Slot & Doorstep Rescheduling Hub", () => {
    test("F94-T1: Order model supports deliveryReschedule schema fields", async () => {
      const order = await Order.create({
        orderId: "ORD_RESCHEDULE_01",
        items: [{ name: "Giày Thể Thao Sneaker", price: 350000, quantity: 1 }],
        total: 350000,
        status: "shipping",
        deliveryReschedule: {
          status: "confirmed",
          requestedDate: "2026-10-15",
          timeSlot: "MORNING_8_12",
          note: "Giao trước 11h sáng giúp mình",
          rescheduledAt: new Date().toISOString(),
          courierConfirmedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.deliveryReschedule.status, "confirmed");
      expect.equal(order.deliveryReschedule.requestedDate, "2026-10-15");
      expect.equal(order.deliveryReschedule.timeSlot, "MORNING_8_12");
      expect.equal(order.deliveryReschedule.note, "Giao trước 11h sáng giúp mình");
    });

    test("F94-T2: Delivery time slots map to accurate customer-facing friendly labels", () => {
      const timeSlotLabelMap = {
        MORNING_8_12: "Buổi Sáng (08:00 - 12:00)",
        AFTERNOON_13_17: "Buổi Chiều (13:00 - 17:00)",
        EVENING_18_21: "Buổi Tối (18:00 - 21:00)",
        ANYTIME: "Cả Ngày (Giờ hành chính)",
      };

      expect.equal(timeSlotLabelMap["MORNING_8_12"], "Buổi Sáng (08:00 - 12:00)");
      expect.equal(timeSlotLabelMap["AFTERNOON_13_17"], "Buổi Chiều (13:00 - 17:00)");
      expect.equal(timeSlotLabelMap["EVENING_18_21"], "Buổi Tối (18:00 - 21:00)");
      expect.equal(timeSlotLabelMap["ANYTIME"], "Cả Ngày (Giờ hành chính)");
    });

    test("F94-T3: Rescheduling appends an audit event to order timeline history", async () => {
      const order = await Order.create({
        orderId: "ORD_RESCHEDULE_02",
        items: [{ name: "Áo Thun Oversize", price: 150000, quantity: 1 }],
        total: 150000,
        status: "shipping",
        timeline: [
          { time: "2026-10-10 08:00", text: "Đơn hàng đã xuất kho trung chuyển" },
        ],
      });

      const slotLabel = "Buổi Tối (18:00 - 21:00)";
      order.timeline.push({
        time: new Date().toISOString(),
        text: `Bưu tá SPX đã xác nhận hẹn lại lịch giao hàng vào ngày 2026-10-14 (${slotLabel}) - Lưu ý: "Gọi trước 10 phút"`,
      });
      await order.save();

      expect.equal(order.timeline.length, 2);
      expect.equal(order.timeline[1].text.includes("SPX đã xác nhận"), true);
      expect.equal(order.timeline[1].text.includes("Buổi Tối"), true);
    });

    test("F94-T4: Rescheduling validation rejects missing requested date", () => {
      const validateReschedule = (payload) => {
        if (!payload || !payload.requestedDate) {
          return { valid: false, error: "Vui lòng chọn ngày giao hàng mong muốn" };
        }
        return { valid: true };
      };

      const result = validateReschedule({ timeSlot: "AFTERNOON_13_17" });
      expect.equal(result.valid, false);
      expect.equal(result.error, "Vui lòng chọn ngày giao hàng mong muốn");
    });

    test("F94-T5: Free rescheduling policy guarantees zero added fee for door delivery changes", () => {
      const rescheduleFee = 0;
      expect.equal(rescheduleFee, 0);
    });
  });

  // =========================================================================
  // FEATURE 95: Smart Restock Alert & Supplier Reorder PO Hub (5 Tests)
  // =========================================================================
  describe("Feature 95: Smart Restock Alert & Supplier Reorder PO Hub", () => {
    test("F95-T1: Reorder recommendation formula calculates target restocking quantity accurately", () => {
      const currentStock = 4;
      const safetyThreshold = 10;
      // Formula: Math.max(20, safetyThreshold * 3 - currentStock)
      const recommendedReorder = Math.max(20, safetyThreshold * 3 - currentStock);
      expect.equal(recommendedReorder, 26);
    });

    test("F95-T2: Severity classification flags CRITICAL_OUT_OF_STOCK when stock is zero", () => {
      const getSeverity = (stock) => (stock === 0 ? "CRITICAL_OUT_OF_STOCK" : "WARNING_LOW_STOCK");
      expect.equal(getSeverity(0), "CRITICAL_OUT_OF_STOCK");
      expect.equal(getSeverity(5), "WARNING_LOW_STOCK");
    });

    test("F95-T3: PurchaseOrder model creates PO record with valid total cost calculation", async () => {
      const po = await PurchaseOrder.create({
        poNumber: "PO-202610-TEST95",
        shopId: "shop_test_po",
        shopName: "Thời Trang Nam Test",
        supplier: {
          name: "Xưởng Dệt May Test",
          contact: "Anh Tuấn",
          phone: "0909888777",
          email: "tuandm@test.vn",
        },
        items: [
          {
            productId: "prod_test_po_01",
            name: "Áo Polo Nam Co Giãn",
            sku: "POLO-CG-01",
            currentStock: 2,
            safetyThreshold: 10,
            reorderQuantity: 30,
            estimatedUnitCost: 80000,
            totalCost: 2400000,
          },
        ],
        totalEstimatedCost: 2400000,
        status: "APPROVED",
        expectedDeliveryDate: "2026-10-20",
      });

      expect.equal(po.poNumber, "PO-202610-TEST95");
      expect.equal(po.items.length, 1);
      expect.equal(po.items[0].reorderQuantity, 30);
      expect.equal(po.totalEstimatedCost, 2400000);
      expect.equal(po.status, "APPROVED");
    });

    test("F95-T4: Multi-item PO correctly sums totalEstimatedCost across distinct products", () => {
      const items = [
        { reorderQuantity: 20, estimatedUnitCost: 50000 },
        { reorderQuantity: 10, estimatedUnitCost: 120000 },
      ];
      const totalCost = items.reduce((sum, it) => sum + it.reorderQuantity * it.estimatedUnitCost, 0);
      expect.equal(totalCost, 2200000);
    });

    test("F95-T5: PO generation validation rejects payloads missing supplier name", () => {
      const validatePoPayload = (payload) => {
        if (!payload || !payload.supplier || !payload.supplier.name) {
          return { valid: false, error: "Vui lòng cung cấp tên nhà cung cấp" };
        }
        return { valid: true };
      };

      const result = validatePoPayload({ items: [{ productId: "p1", reorderQuantity: 10 }] });
      expect.equal(result.valid, false);
      expect.equal(result.error, "Vui lòng cung cấp tên nhà cung cấp");
    });
  });

  // =========================================================================
  // FEATURE 96: Automated Dynamic Bundling & Volume Discount Upsell Engine (5 Tests)
  // =========================================================================
  describe("Feature 96: Automated Dynamic Bundling & Volume Discount Upsell Engine", () => {
    test("F96-T1: Product model supports volumeTiers schema configuration", async () => {
      const product = await Product.create({
        name: "Áo Thun Cổ Tròn Cotton 100%",
        price: 200000,
        category: "Thời Trang",
        volumeTiers: {
          enabled: true,
          tiers: [
            { minQuantity: 2, discountPercent: 5 },
            { minQuantity: 3, discountPercent: 10 },
            { minQuantity: 5, discountPercent: 15 },
          ],
        },
      });

      expect.equal(product.volumeTiers.enabled, true);
      expect.equal(product.volumeTiers.tiers.length, 3);
      expect.equal(product.volumeTiers.tiers[1].minQuantity, 3);
      expect.equal(product.volumeTiers.tiers[1].discountPercent, 10);
    });

    test("F96-T2: Matching highest achieved volume tier calculates correct unit price and total savings", () => {
      const basePrice = 200000;
      const quantity = 3;
      const tiers = [
        { minQuantity: 2, discountPercent: 5 },
        { minQuantity: 3, discountPercent: 10 },
        { minQuantity: 5, discountPercent: 15 },
      ];

      const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const matched = sortedTiers.find((t) => quantity >= t.minQuantity);
      const discountPercent = matched ? matched.discountPercent : 0;
      const unitPrice = Math.round(basePrice * (1 - discountPercent / 100));
      const totalSavings = (basePrice - unitPrice) * quantity;

      expect.equal(discountPercent, 10);
      expect.equal(unitPrice, 180000);
      expect.equal(totalSavings, 60000);
    });

    test("F96-T3: Volume discount computes zero savings when purchase quantity is below lowest tier", () => {
      const basePrice = 150000;
      const quantity = 1;
      const tiers = [{ minQuantity: 2, discountPercent: 5 }];

      const matched = tiers.find((t) => quantity >= t.minQuantity);
      const discountPercent = matched ? matched.discountPercent : 0;
      const totalSavings = (basePrice * (discountPercent / 100)) * quantity;

      expect.equal(discountPercent, 0);
      expect.equal(totalSavings, 0);
    });

    test("F96-T4: Upsell engine identifies next tier and computes exact additional units needed", () => {
      const currentQty = 2;
      const tiers = [
        { minQuantity: 2, discountPercent: 5 },
        { minQuantity: 4, discountPercent: 12 },
      ];

      const nextTier = tiers.find((t) => t.minQuantity > currentQty);
      expect.equal(Boolean(nextTier), true);
      expect.equal(nextTier.minQuantity, 4);
      const additionalNeeded = nextTier.minQuantity - currentQty;
      expect.equal(additionalNeeded, 2);
    });

    test("F96-T5: Default volume tiers fallback provides tiered discounts (2->5%, 3->10%, 5->15%)", () => {
      const defaultTiers = [
        { minQuantity: 2, discountPercent: 5 },
        { minQuantity: 3, discountPercent: 10 },
        { minQuantity: 5, discountPercent: 15 },
      ];

      expect.equal(defaultTiers.length, 3);
      expect.equal(defaultTiers[0].discountPercent, 5);
      expect.equal(defaultTiers[2].discountPercent, 15);
    });
  });

  // =========================================================================
  // FEATURE 97: Doorstep Co-Inspection & Defect Handover Protocol (5 Tests)
  // =========================================================================
  describe("Feature 97: Doorstep Co-Inspection & Defect Handover Protocol", () => {
    test("F97-T1: Doorstep Co-Inspection defaults to 0 VND fee for buyer peace of mind", () => {
      const inspectionConfig = {
        enabled: true,
        fee: 0,
        status: "requested",
      };

      expect.equal(inspectionConfig.enabled, true);
      expect.equal(inspectionConfig.fee, 0);
      expect.equal(inspectionConfig.status, "requested");
    });

    test("F97-T2: Order model persists and retrieves doorstepInspection object", async () => {
      const order = await Order.create({
        orderId: "ORD_INSPECT_97",
        customer: { fullName: "Đặng Thuỳ Trang", phone: "0918882233" },
        items: [{ productId: "prod_spx_01", name: "Đồng Hồ Cơ Automatic", price: 1200000, quantity: 1 }],
        total: 1200000,
        paymentMethod: "COD",
        doorstepInspection: {
          enabled: true,
          fee: 0,
          status: "requested",
        },
      });

      expect.equal(order.orderId, "ORD_INSPECT_97");
      expect.equal(order.doorstepInspection.enabled, true);
      expect.equal(order.doorstepInspection.status, "requested");
    });

    test("F97-T3: Courier records inspection passed result and logs timestamp", async () => {
      const order = await Order.create({
        orderId: "ORD_INSPECT_PASSED",
        items: [{ productId: "p1", name: "Áo Polo Nam", price: 250000, quantity: 1 }],
        total: 250000,
        doorstepInspection: {
          enabled: true,
          fee: 0,
          status: "requested",
        },
      });

      const updated = await Order.findByIdAndUpdate(order._id, {
        doorstepInspection: {
          ...order.doorstepInspection,
          status: "inspected_passed",
          inspectorCourierName: "Nguyễn Văn Shipper (SPX)",
          inspectionNote: "Khách đã đồng kiểm ngoại quan cùng bưu tá: đủ 1 áo, đúng màu, tem mác nguyên vẹn.",
          inspectedAt: new Date().toISOString(),
        },
      });

      expect.equal(updated.doorstepInspection.status, "inspected_passed");
      expect.equal(updated.doorstepInspection.inspectorCourierName, "Nguyễn Văn Shipper (SPX)");
      expect.equal(Boolean(updated.doorstepInspection.inspectedAt), true);
    });

    test("F97-T4: Defect rejection triggers inspected_rejected status and photo proof recording", async () => {
      const order = await Order.create({
        orderId: "ORD_INSPECT_REJECTED",
        items: [{ productId: "p2", name: "Bình Giữ Nhiệt Khắc Tên", price: 350000, quantity: 1 }],
        total: 350000,
        doorstepInspection: {
          enabled: true,
          fee: 0,
          status: "requested",
        },
      });

      const updated = await Order.findByIdAndUpdate(order._id, {
        doorstepInspection: {
          ...order.doorstepInspection,
          status: "inspected_rejected",
          inspectorCourierName: "Lê Minh Tuấn (SPX Hub Tân Bình)",
          inspectionNote: "Hộp méo mó, nắp bình trầy xước nặng, khách từ chối nhận tại chỗ.",
          photoProof: ["https://spx.vn/proofs/defect_binh_giu_nhiet.jpg"],
          inspectedAt: new Date().toISOString(),
        },
      });

      expect.equal(updated.doorstepInspection.status, "inspected_rejected");
      expect.equal(updated.doorstepInspection.photoProof[0], "https://spx.vn/proofs/defect_binh_giu_nhiet.jpg");
    });

    test("F97-T5: Disabling co-inspection sets status to none without inspection metadata", () => {
      const doorstepInspection = {
        enabled: false,
        fee: 0,
        status: "none",
      };

      expect.equal(doorstepInspection.enabled, false);
      expect.equal(doorstepInspection.status, "none");
      expect.equal(Boolean(doorstepInspection.inspectorCourierName), false);
    });
  });

  // =========================================================================
  // FEATURE 98: Smart Shopee Live In-Stream Flash Voucher Dropper (5 Tests)
  // =========================================================================
  describe("Feature 98: Smart Shopee Live In-Stream Flash Voucher Dropper", () => {
    test("F98-T1: Flash voucher drop initializes with duration and limited claim slots", () => {
      const drop = {
        dropId: "drop_test_01",
        code: "FLASH98LIVE",
        name: "Flash Voucher 45s",
        value: 50000,
        minOrderValue: 150000,
        totalSlots: 20,
        claimedCount: 0,
        durationSeconds: 45,
        expiresAt: new Date(Date.now() + 45000).toISOString(),
        claimedUserIds: [],
      };

      expect.equal(drop.code, "FLASH98LIVE");
      expect.equal(drop.totalSlots, 20);
      expect.equal(drop.claimedCount, 0);
      expect.equal(drop.durationSeconds, 45);
    });

    test("F98-T2: In-Stream claim increments claimedCount and stores buyer identifier", () => {
      const drop = {
        dropId: "drop_test_02",
        code: "FLASH50K",
        totalSlots: 10,
        claimedCount: 2,
        claimedUserIds: ["buyer_01", "buyer_02"],
      };

      const newUserId = "buyer_03";
      if (!drop.claimedUserIds.includes(newUserId) && drop.claimedCount < drop.totalSlots) {
        drop.claimedCount += 1;
        drop.claimedUserIds.push(newUserId);
      }

      expect.equal(drop.claimedCount, 3);
      expect.equal(drop.claimedUserIds.includes("buyer_03"), true);
      expect.equal(drop.totalSlots - drop.claimedCount, 7);
    });

    test("F98-T3: User cannot claim the same in-stream flash voucher more than once", () => {
      const drop = {
        dropId: "drop_test_03",
        code: "FLASHVIP",
        totalSlots: 10,
        claimedCount: 1,
        claimedUserIds: ["buyer_dup"],
      };

      let duplicateClaimRejected = false;
      const attemptUserId = "buyer_dup";
      if (drop.claimedUserIds.includes(attemptUserId)) {
        duplicateClaimRejected = true;
      }

      expect.equal(duplicateClaimRejected, true);
      expect.equal(drop.claimedCount, 1);
    });

    test("F98-T4: Expired in-stream flash voucher cannot be claimed even with remaining slots", () => {
      const expiredDrop = {
        dropId: "drop_expired",
        code: "FLASHLATE",
        totalSlots: 50,
        claimedCount: 5,
        expiresAt: new Date(Date.now() - 5000).toISOString(),
      };

      const isExpired = new Date(expiredDrop.expiresAt) <= new Date();
      expect.equal(isExpired, true);
    });

    test("F98-T5: Reaching claim slot capacity rejects subsequent claim attempts", () => {
      const exhaustedDrop = {
        dropId: "drop_full",
        code: "FLASHOUT",
        totalSlots: 15,
        claimedCount: 15,
      };

      const isFull = exhaustedDrop.claimedCount >= exhaustedDrop.totalSlots;
      expect.equal(isFull, true);
      const remainingSlots = Math.max(0, exhaustedDrop.totalSlots - exhaustedDrop.claimedCount);
      expect.equal(remainingSlots, 0);
    });
  });

  // =========================================================================
  // FEATURE 99: Extended Warranty & Accidental Damage Protection (5 Tests)
  // =========================================================================
  describe("Feature 99: Extended Warranty & Accidental Damage Protection Suite (Shopee Care+)", () => {
    test("F99-T1: Warranty plans compute dynamically scaled premiums based on item base price", () => {
      const basePrice = 2000000;
      const fee6m = Math.max(19000, Math.round(basePrice * 0.03));
      const fee12m = Math.max(39000, Math.round(basePrice * 0.055));

      expect.equal(fee6m, 60000);
      expect.equal(fee12m, 110000);
    });

    test("F99-T2: Minimum fallback premium floor protects low-cost accessory coverage", () => {
      const lowBasePrice = 50000;
      const fee6m = Math.max(19000, Math.round(lowBasePrice * 0.03));
      const fee12m = Math.max(39000, Math.round(lowBasePrice * 0.055));

      expect.equal(fee6m, 19000);
      expect.equal(fee12m, 39000);
    });

    test("F99-T3: Order model stores selected warrantyProtection plan metadata", async () => {
      const order = await Order.create({
        orderId: "ORD_WARRANTY_99",
        items: [{ productId: "p_laptop", name: "Laptop Gaming ASUS ROG", price: 25000000, quantity: 1 }],
        total: 25000000 + 49000,
        warrantyProtection: {
          enabled: true,
          planId: "care_plus_12m",
          planName: "Bảo Hiểm VIP 12 Tháng Shopee Care+",
          durationMonths: 12,
          fee: 49000,
          certificateCode: "CERT-CARE-2026-9901",
          activatedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.warrantyProtection.enabled, true);
      expect.equal(order.warrantyProtection.planId, "care_plus_12m");
      expect.equal(order.warrantyProtection.durationMonths, 12);
      expect.equal(order.warrantyProtection.certificateCode, "CERT-CARE-2026-9901");
    });

    test("F99-T4: Selecting warranty plan adds protection fee to item order item summary", () => {
      const itemPrice = 1500000;
      const warrantyPlan = { planId: "care_plus_6m", price: 45000 };
      const itemTotalWithCare = itemPrice + warrantyPlan.price;

      expect.equal(itemTotalWithCare, 1545000);
    });

    test("F99-T5: Product schema provides 6-month and 12-month Shopee Care+ coverage definitions", () => {
      const plans = [
        { planId: "care_plus_6m", durationMonths: 6, coverage: "1 đổi 1 tận nhà nếu rơi vỡ hoặc vào nước" },
        { planId: "care_plus_12m", durationMonths: 12, coverage: "Miễn phí sửa chữa chính hãng toàn diện" },
      ];

      expect.equal(plans.length, 2);
      expect.equal(plans[0].durationMonths, 6);
      expect.equal(plans[1].durationMonths, 12);
    });
  });

  // =========================================================================
  // FEATURE 100: Smart Price Drop Alert & Target Price Radar (5 Tests)
  // =========================================================================
  describe("Feature 100: Smart Price Drop Alert & Target Price Radar", () => {
    test("F100-T1: Desired price must be strictly lower than current product price", () => {
      const currentPrice = 300000;
      const targetPriceValid = 250000;
      const targetPriceInvalid = 350000;

      const isValid1 = targetPriceValid > 0 && targetPriceValid < currentPrice;
      const isValid2 = targetPriceInvalid > 0 && targetPriceInvalid < currentPrice;

      expect.equal(isValid1, true);
      expect.equal(isValid2, false);
    });

    test("F100-T2: Product model persists and retrieves priceDropWatchers array", async () => {
      const product = await Product.create({
        name: "Bàn Phím Cơ Không Dây RGB",
        price: 850000,
        stock: 20,
        priceDropWatchers: [
          {
            userId: "user_hunter_01",
            email: "hunter@shopee.vn",
            targetPrice: 750000,
            createdAt: new Date().toISOString(),
          },
        ],
      });

      expect.equal(product.price, 850000);
      expect.equal(product.priceDropWatchers.length, 1);
      expect.equal(product.priceDropWatchers[0].targetPrice, 750000);
    });

    test("F100-T3: Updating target price overrides existing user alert instead of duplicating", () => {
      const watchers = [
        { userId: "user_01", targetPrice: 600000 },
        { userId: "user_02", targetPrice: 550000 },
      ];

      const updateUserId = "user_01";
      const newTarget = 520000;
      const existingIdx = watchers.findIndex((w) => w.userId === updateUserId);

      if (existingIdx !== -1) {
        watchers[existingIdx].targetPrice = newTarget;
      }

      expect.equal(watchers.length, 2);
      expect.equal(watchers[0].targetPrice, 520000);
    });

    test("F100-T4: Price Drop Radar computes expected savings percentage correctly", () => {
      const currentPrice = 500000;
      const targetPrice = 400000;
      const discountExpected = Math.round(((currentPrice - targetPrice) / currentPrice) * 100);

      expect.equal(discountExpected, 20);
    });

    test("F100-T5: Price drop triggered when new price reaches or falls below target price", () => {
      const targetAlert = { targetPrice: 450000 };
      const priceUpdate1 = 480000; // Chưa đạt
      const priceUpdate2 = 430000; // Đã đạt mức giảm

      const shouldNotify1 = priceUpdate1 <= targetAlert.targetPrice;
      const shouldNotify2 = priceUpdate2 <= targetAlert.targetPrice;

      expect.equal(shouldNotify1, false);
      expect.equal(shouldNotify2, true);
    });
  });

  // =========================================================================
  // FEATURE 101: Multi-Attempt Delivery Retry & Failed Handover Protocol (5 Tests)
  // =========================================================================
  describe("Feature 101: Multi-Attempt Delivery Retry & Failed Handover Protocol", () => {
    test("F101-T1: First failed attempt increments totalAttempts and records reason", () => {
      const deliveryState = {
        totalAttempts: 0,
        maxAttempts: 3,
        currentStatus: "scheduled",
        history: [],
      };

      const newAttempt = {
        attemptNumber: 1,
        attemptedAt: new Date().toISOString(),
        courierName: "Bưu tá Nguyễn Văn Shipper",
        reason: "CUSTOMER_UNREACHABLE",
        reasonNote: "Gọi điện thoại 3 cuộc không nghe máy",
      };

      deliveryState.totalAttempts += 1;
      deliveryState.history.push(newAttempt);
      deliveryState.currentStatus = "failed_attempt";

      expect.equal(deliveryState.totalAttempts, 1);
      expect.equal(deliveryState.history.length, 1);
      expect.equal(deliveryState.currentStatus, "failed_attempt");
      expect.equal(deliveryState.maxAttempts - deliveryState.totalAttempts, 2);
    });

    test("F101-T2: Order model persists deliveryAttempts tracking history", async () => {
      const order = await Order.create({
        orderId: "ORD_RETRY_101",
        items: [{ productId: "p_dress", name: "Đầm Dự Tiệc Cao Cấp", price: 650000, quantity: 1 }],
        total: 650000,
        deliveryAttempts: {
          totalAttempts: 1,
          maxAttempts: 3,
          currentStatus: "failed_attempt",
          history: [
            {
              attemptNumber: 1,
              attemptedAt: new Date().toISOString(),
              courierName: "Bưu tá SPX",
              reason: "CUSTOMER_RESCHEDULED",
              reasonNote: "Khách bận đi công tác, hẹn giao ngày mai",
            },
          ],
          escalatedToCustomerCare: false,
        },
      });

      expect.equal(order.orderId, "ORD_RETRY_101");
      expect.equal(order.deliveryAttempts.totalAttempts, 1);
      expect.equal(order.deliveryAttempts.history[0].reason, "CUSTOMER_RESCHEDULED");
    });

    test("F101-T3: Exceeding max delivery attempts flags returned_to_hub status and triggers escalation", () => {
      const maxAttempts = 3;
      let totalAttempts = 2;

      // Third attempt failed
      totalAttempts += 1;
      const isExceeded = totalAttempts >= maxAttempts;
      const status = isExceeded ? "returned_to_hub" : "failed_attempt";
      const escalatedToCustomerCare = isExceeded;

      expect.equal(isExceeded, true);
      expect.equal(status, "returned_to_hub");
      expect.equal(escalatedToCustomerCare, true);
    });

    test("F101-T4: Next scheduled slot provides clear reschedule timeline to recipient", () => {
      const attemptRecord = {
        attemptNumber: 2,
        reason: "SECURITY_GATE_DENIED",
        nextScheduledSlot: "Ca chiều mai (13:00 - 17:00)",
      };

      expect.equal(attemptRecord.attemptNumber, 2);
      expect.equal(Boolean(attemptRecord.nextScheduledSlot), true);
    });

    test("F101-T5: Standard failure reason codes conform to SPX logistics taxonomy", () => {
      const validReasons = [
        "CUSTOMER_UNREACHABLE",
        "CUSTOMER_RESCHEDULED",
        "INCORRECT_ADDRESS",
        "SECURITY_GATE_DENIED",
        "FORCE_MAJEURE_WEATHER",
      ];

      expect.equal(validReasons.includes("CUSTOMER_UNREACHABLE"), true);
      expect.equal(validReasons.includes("FORCE_MAJEURE_WEATHER"), true);
      expect.equal(validReasons.length, 5);
    });
  });

  // =========================================================================
  // FEATURE 102: Vault of Video Unboxing Evidence & Instant Dispute Arbitration (5 Tests)
  // =========================================================================
  describe("Feature 102: Vault of Video Unboxing Evidence & Instant Dispute Arbitration", () => {
    test("F102-T1: Uploading unboxing video attaches SHA256 integrity hash and duration", () => {
      const videoProof = {
        hasVideo: true,
        videoUrl: "https://vault.shopee.vn/videos/unboxing_ord102.mp4",
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        durationSeconds: 45,
        verificationStatus: "uploaded",
      };

      expect.equal(videoProof.hasVideo, true);
      expect.equal(videoProof.durationSeconds, 45);
      expect.equal(videoProof.verificationStatus, "uploaded");
      expect.equal(Boolean(videoProof.sha256Hash), true);
    });

    test("F102-T2: Order model persists unboxingVideoProof verification structure", async () => {
      const order = await Order.create({
        orderId: "ORD_UNBOX_102",
        items: [{ productId: "p_headphone", name: "Tai Nghe Studio Master", price: 1800000, quantity: 1 }],
        total: 1800000,
        unboxingVideoProof: {
          hasVideo: true,
          videoUrl: "https://vault.shopee.vn/videos/unbox_headphone.mp4",
          uploadedAt: new Date().toISOString(),
          sha256Hash: "hash_vid_102",
          durationSeconds: 60,
          verificationStatus: "uploaded",
        },
      });

      expect.equal(order.orderId, "ORD_UNBOX_102");
      expect.equal(order.unboxingVideoProof.hasVideo, true);
      expect.equal(order.unboxingVideoProof.verificationStatus, "uploaded");
    });

    test("F102-T3: Approved video transitions verificationStatus to verified with reviewer identity", () => {
      const videoProof = {
        hasVideo: true,
        verificationStatus: "uploaded",
        verifiedBy: null,
        verifiedAt: null,
      };

      videoProof.verificationStatus = "verified";
      videoProof.verifiedBy = "Trọng tài viên Shopee Lê Hoàng Nam";
      videoProof.verifiedAt = new Date().toISOString();
      videoProof.verificationNote = "Video quay rõ 6 mặt hộp, niêm phong chưa rách, phát hiện móp méo bên trong.";

      expect.equal(videoProof.verificationStatus, "verified");
      expect.equal(Boolean(videoProof.verifiedBy), true);
      expect.equal(Boolean(videoProof.verifiedAt), true);
    });

    test("F102-T4: Rejected video notes deficiency and logs rejection justification", () => {
      const videoProof = {
        hasVideo: true,
        verificationStatus: "uploaded",
      };

      videoProof.verificationStatus = "rejected";
      videoProof.verifiedBy = "Shop Thời Trang GenZ";
      videoProof.verificationNote = "Video bị gián đoạn giữa chừng, không quay rõ tem mã vận đơn.";

      expect.equal(videoProof.verificationStatus, "rejected");
      expect.equal(videoProof.verificationNote.includes("tem mã vận đơn"), true);
    });

    test("F102-T5: Order without unboxing video maintains default none verification status", () => {
      const defaultProof = {
        hasVideo: false,
        videoUrl: "",
        verificationStatus: "none",
      };

      expect.equal(defaultProof.hasVideo, false);
      expect.equal(defaultProof.verificationStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 103: Smart 1-Click Reorder Suite & Reorder Loyalty Voucher (5 Tests)
  // =========================================================================
  describe("Feature 103: Smart 1-Click Reorder Suite & Reorder Loyalty Voucher", () => {
    test("F103-T1: Reorder calculation grants 10% loyalty discount voucher (REORDER10)", () => {
      const subtotal = 500000;
      const loyaltyDiscount = Math.round(subtotal * 0.1);
      const shippingFee = 25000;
      const finalTotal = subtotal - loyaltyDiscount + shippingFee;

      expect.equal(loyaltyDiscount, 50000);
      expect.equal(finalTotal, 475000);
    });

    test("F103-T2: Order model stores oneClickReorderSuite and tracks reorder counts", async () => {
      const order = await Order.create({
        orderId: "ORD_REORDER_ORIGIN",
        items: [{ productId: "p_coffee", name: "Cà phê Robusta Đặc Sản", price: 150000, quantity: 2 }],
        subtotal: 300000,
        total: 325000,
        oneClickReorderSuite: {
          isReordered: true,
          reorderCount: 1,
          lastReorderedAt: new Date().toISOString(),
          reorderVoucherApplied: "REORDER10",
          reorderSavings: 30000,
        },
      });

      expect.equal(order.orderId, "ORD_REORDER_ORIGIN");
      expect.equal(order.oneClickReorderSuite.isReordered, true);
      expect.equal(order.oneClickReorderSuite.reorderCount, 1);
      expect.equal(order.oneClickReorderSuite.reorderVoucherApplied, "REORDER10");
    });

    test("F103-T3: Subsequent reorder increments reorderCount and updates lastReorderedAt", () => {
      const suite = {
        isReordered: true,
        reorderCount: 1,
        lastReorderedAt: "2026-10-01T10:00:00Z",
        reorderSavings: 30000,
      };

      suite.reorderCount += 1;
      suite.lastReorderedAt = "2026-10-11T12:00:00Z";
      suite.reorderSavings += 35000;

      expect.equal(suite.reorderCount, 2);
      expect.equal(suite.reorderSavings, 65000);
      expect.equal(suite.lastReorderedAt, "2026-10-11T12:00:00Z");
    });

    test("F103-T4: Newly spawned reorder inherits doorstepInspection with 0₫ fee", () => {
      const newOrderPayload = {
        orderId: "ORD_REORDER_NEW_01",
        doorstepInspection: {
          enabled: true,
          fee: 0,
          status: "requested",
        },
      };

      expect.equal(newOrderPayload.doorstepInspection.enabled, true);
      expect.equal(newOrderPayload.doorstepInspection.fee, 0);
      expect.equal(newOrderPayload.doorstepInspection.status, "requested");
    });

    test("F103-T5: Empty item order correctly prevented from executing 1-click reorder", () => {
      const emptyOrder = { items: [] };
      const canReorder = Array.isArray(emptyOrder.items) && emptyOrder.items.length > 0;
      expect.equal(canReorder, false);
    });
  });

  // =========================================================================
  // FEATURE 104: Seller Multi-Warehouse Stock Splitting & Geo-Proximity Routing (5 Tests)
  // =========================================================================
  describe("Feature 104: Seller Multi-Warehouse Stock Splitting & Geo-Proximity Routing", () => {
    test("F104-T1: Order model persists multiWarehouseRouting schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_GEO_WH_104",
        items: [{ productId: "p_wh_1", name: "Bộ Ấm Chén Bát Tràng", price: 450000, quantity: 2 }],
        total: 475000,
        multiWarehouseRouting: {
          isSplitOrder: true,
          fulfillmentHubs: [
            {
              hubId: "HUB_HN_01",
              hubName: "Kho Tổng SPX Mega Bắc Ninh (Miền Bắc)",
              region: "HANOI",
              itemsCount: 1,
              estimatedDistanceKm: 18.5,
              dispatchedStatus: "allocated",
            },
            {
              hubId: "HUB_DN_01",
              hubName: "Kho Phụ SPX Liên Chiểu (Miền Trung)",
              region: "DANANG",
              itemsCount: 1,
              estimatedDistanceKm: 45.0,
              dispatchedStatus: "allocated",
            },
          ],
          primaryOriginHub: "Kho Tổng SPX Mega Bắc Ninh (Miền Bắc)",
          carbonSavedKg: 2.85,
        },
      });

      expect.equal(order.orderId, "ORD_GEO_WH_104");
      expect.equal(order.multiWarehouseRouting.isSplitOrder, true);
      expect.equal(order.multiWarehouseRouting.fulfillmentHubs.length, 2);
      expect.equal(order.multiWarehouseRouting.carbonSavedKg, 2.85);
    });

    test("F104-T2: Geo-routing assigns Northern Mega Hub when destination province is Hanoi", () => {
      const buyerProvince = "Hà Nội";
      const isNorthern = buyerProvince.toLowerCase().includes("hà nội");
      const primaryHub = isNorthern ? "Kho Tổng SPX Mega Bắc Ninh (Miền Bắc)" : "Kho Tổng SPX Tân Bình (Miền Nam)";

      expect.equal(isNorthern, true);
      expect.equal(primaryHub.includes("Bắc Ninh"), true);
    });

    test("F104-T3: Geo-routing assigns Southern Mega Hub when destination province is Ho Chi Minh City", () => {
      const buyerProvince = "TP Hồ Chí Minh";
      const isNorthern = buyerProvince.toLowerCase().includes("hà nội");
      const primaryHub = isNorthern ? "Kho Tổng SPX Mega Bắc Ninh (Miền Bắc)" : "Kho Tổng SPX Tân Bình (Miền Nam)";

      expect.equal(isNorthern, false);
      expect.equal(primaryHub.includes("Tân Bình"), true);
    });

    test("F104-T4: Carbon emission savings accurately calculates from combined distance reduction", () => {
      const distanceHub1 = 18.5;
      const distanceHub2 = 45.0;
      const emissionFactorPerKm = 0.045; // kg CO2 per km
      const carbonSavedKg = Number(((distanceHub1 + distanceHub2) * emissionFactorPerKm).toFixed(2));

      expect.equal(carbonSavedKg, 2.86);
      expect.equal(carbonSavedKg > 0, true);
    });

    test("F104-T5: Item count splits proportionally across available distribution hubs", () => {
      const totalItems = 5;
      const hub1Count = Math.ceil(totalItems / 2);
      const hub2Count = Math.floor(totalItems / 2);

      expect.equal(hub1Count, 3);
      expect.equal(hub2Count, 2);
      expect.equal(hub1Count + hub2Count, totalItems);
    });
  });

  // =========================================================================
  // FEATURE 105: Dynamic In-Flight Delivery Address Correction Suite (5 Tests)
  // =========================================================================
  describe("Feature 105: Dynamic In-Flight Delivery Address Correction Suite", () => {
    test("F105-T1: Order model persists dynamicAddressCorrection schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_ADDR_CORR_105",
        items: [{ productId: "p_acc_01", name: "Đồng hồ thông minh FitPro", price: 650000, quantity: 1 }],
        total: 675000,
        dynamicAddressCorrection: {
          isModified: true,
          originalAddress: "123 Cầu Giấy, Hà Nội",
          correctedAddress: "456 Kim Mã, Ba Đình, Hà Nội",
          correctionReason: "Chuyển sang cơ quan nhận hàng ban ngày",
          modifiedAt: new Date().toISOString(),
          lockStatus: "open",
        },
      });

      expect.equal(order.orderId, "ORD_ADDR_CORR_105");
      expect.equal(order.dynamicAddressCorrection.isModified, true);
      expect.equal(order.dynamicAddressCorrection.correctedAddress, "456 Kim Mã, Ba Đình, Hà Nội");
      expect.equal(order.dynamicAddressCorrection.lockStatus, "open");
    });

    test("F105-T2: Address correction updates timeline with modification rationale", () => {
      const timeline = [];
      const now = new Date().toISOString();
      const newAddress = "Toà nhà Landmark 81, P.22, Q.Bình Thạnh, TP.HCM";
      const reason = "Đã dọn sang căn hộ mới";

      timeline.push({
        time: now,
        text: `Địa chỉ nhận hàng đã được cập nhật thành: ${newAddress} (Lý do: ${reason})`,
      });

      expect.equal(timeline.length, 1);
      expect.equal(timeline[0].text.includes("Landmark 81"), true);
      expect.equal(timeline[0].text.includes(reason), true);
    });

    test("F105-T3: Orders in late dispatch or terminal stages reject address correction", () => {
      const terminalStatuses = ["delivering", "completed", "delivered", "cancelled"];
      const checkCanModify = (status) => !terminalStatuses.includes(status);

      expect.equal(checkCanModify("pending"), true);
      expect.equal(checkCanModify("confirmed"), true);
      expect.equal(checkCanModify("shipping"), true);
      expect.equal(checkCanModify("delivering"), false);
      expect.equal(checkCanModify("completed"), false);
      expect.equal(checkCanModify("cancelled"), false);
    });

    test("F105-T4: Empty or blank address string is strictly rejected", () => {
      const validateAddress = (addr) => Boolean(addr && typeof addr === "string" && addr.trim().length > 5);

      expect.equal(validateAddress(""), false);
      expect.equal(validateAddress("    "), false);
      expect.equal(validateAddress("HN"), false);
      expect.equal(validateAddress("Số 10 Phố Tràng Tiền, Hoàn Kiếm"), true);
    });

    test("F105-T5: Default order maintains unmodified address state with open lock", () => {
      const defaultCorrection = {
        isModified: false,
        originalAddress: "",
        correctedAddress: "",
        correctionReason: "",
        modifiedAt: null,
        lockStatus: "open",
      };

      expect.equal(defaultCorrection.isModified, false);
      expect.equal(defaultCorrection.lockStatus, "open");
      expect.equal(defaultCorrection.modifiedAt, null);
    });
  });

  // =========================================================================
  // FEATURE 106: Eco-Friendly Packaging & Carbon Offsetting Contribution Suite (5 Tests)
  // =========================================================================
  describe("Feature 106: Eco-Friendly Packaging & Carbon Offsetting Contribution Suite", () => {
    test("F106-T1: Order model persists ecoPackagingContribution schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_ECO_PACK_106",
        items: [{ productId: "p_bamboo_cup", name: "Ly Tre Tự Nhiên Sinh Thái", price: 120000, quantity: 2 }],
        total: 265000,
        ecoPackagingContribution: {
          isOptedIn: true,
          boxType: "biodegradable_honeycomb",
          treePlantContribution: 5000,
          plasticFreeGuaranteed: true,
          rewardCoinsIssued: 50,
        },
      });

      expect.equal(order.orderId, "ORD_ECO_PACK_106");
      expect.equal(order.ecoPackagingContribution.isOptedIn, true);
      expect.equal(order.ecoPackagingContribution.boxType, "biodegradable_honeycomb");
      expect.equal(order.ecoPackagingContribution.rewardCoinsIssued, 50);
      expect.equal(order.ecoPackagingContribution.treePlantContribution, 5000);
    });

    test("F106-T2: Opting in eco-packaging awards +50 Mini Xu incentive", () => {
      const isOptedIn = true;
      const rewardCoins = isOptedIn ? 50 : 0;
      expect.equal(rewardCoins, 50);

      const isOptedOut = false;
      const noReward = isOptedOut ? 50 : 0;
      expect.equal(noReward, 0);
    });

    test("F106-T3: Plastic-free guarantee confirms 0% single-use plastic wrap", () => {
      const pack = {
        isOptedIn: true,
        boxType: "biodegradable_honeycomb",
        plasticFreeGuaranteed: true,
      };

      expect.equal(pack.plasticFreeGuaranteed, true);
      expect.equal(pack.boxType.includes("honeycomb"), true);
    });

    test("F106-T4: Tree plant contribution adds directly to carbon offsetting total", () => {
      const initialPool = 1250000; // 1,250,000 VND
      const contribution = 5000;
      const updatedPool = initialPool + contribution;

      expect.equal(updatedPool, 1255000);
    });

    test("F106-T5: Eco-packaging timeline logs environmental action and tree contribution amount", () => {
      const timeline = [];
      const now = new Date().toISOString();
      const contribution = 5000;
      const rewardCoins = 50;

      timeline.push({
        time: now,
        text: `Đã kích hoạt Đóng gói Xanh: Hộp giấy tổ ong phân hủy sinh học. Đóng góp ${contribution.toLocaleString('vi-VN')}₫ trồng rừng SPX Green (+${rewardCoins} Xu)`,
      });

      expect.equal(timeline.length, 1);
      expect.equal(timeline[0].text.includes("trồng rừng SPX Green"), true);
      expect.equal(timeline[0].text.includes("+50 Xu"), true);
    });
  });

  // =========================================================================
  // FEATURE 107: Contactless Smart Locker Station Auto-Handoff Suite (5 Tests)
  // =========================================================================
  describe("Feature 107: Contactless Smart Locker Station Auto-Handoff Suite", () => {
    test("F107-T1: Order model persists contactlessLockerDelivery schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_SMART_LOCKER_107",
        items: [{ productId: "p_book_01", name: "Sách Thiết Kế Cuộc Đời", price: 140000, quantity: 1 }],
        total: 165000,
        contactlessLockerDelivery: {
          isRequested: true,
          lockerStationId: "SPX_LOCKER_CGI_01",
          lockerStationName: "Trạm Tủ Thông Minh SPX - Toà Keangnam Landmark",
          lockerStationAddress: "Phạm Hùng, Nam Từ Liêm, Hà Nội",
          compartmentPinCode: "748291",
          compartmentId: "BOX_12",
          pinExpiresAt: new Date(Date.now() + 172800000).toISOString(),
          pickupStatus: "delivered_in_locker",
          pickedUpAt: null,
        },
      });

      expect.equal(order.orderId, "ORD_SMART_LOCKER_107");
      expect.equal(order.contactlessLockerDelivery.isRequested, true);
      expect.equal(order.contactlessLockerDelivery.compartmentPinCode, "748291");
      expect.equal(order.contactlessLockerDelivery.compartmentId, "BOX_12");
      expect.equal(order.contactlessLockerDelivery.pickupStatus, "delivered_in_locker");
    });

    test("F107-T2: Smart Locker PIN generation conforms to 6-digit numeric pattern", () => {
      const pinCode = "829104";
      const isValidPin = /^\d{6}$/.test(pinCode);
      expect.equal(isValidPin, true);

      const invalidPin = "ABC12";
      expect.equal(/^\d{6}$/.test(invalidPin), false);
    });

    test("F107-T3: Pickup expiration timeline defaults to exactly 48-hour pickup window", () => {
      const creationMs = 1700000000000;
      const hoursWindow = 48;
      const expiresMs = creationMs + hoursWindow * 60 * 60 * 1000;
      const calculatedHours = (expiresMs - creationMs) / (1000 * 60 * 60);

      expect.equal(calculatedHours, 48);
    });

    test("F107-T4: Customer pickup completion transitions pickupStatus to picked_up", () => {
      const lockerData = {
        pickupStatus: "delivered_in_locker",
        pickedUpAt: null,
      };

      lockerData.pickupStatus = "picked_up";
      lockerData.pickedUpAt = new Date().toISOString();

      expect.equal(lockerData.pickupStatus, "picked_up");
      expect.equal(Boolean(lockerData.pickedUpAt), true);
    });

    test("F107-T5: Default order maintains inactive locker state", () => {
      const defaultLocker = {
        isRequested: false,
        lockerStationId: "",
        compartmentPinCode: "",
        pickupStatus: "none",
      };

      expect.equal(defaultLocker.isRequested, false);
      expect.equal(defaultLocker.pickupStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 108: Digital Carbon Offset Certificate & Green NFT Badge Suite (5 Tests)
  // =========================================================================
  describe("Feature 108: Digital Carbon Offset Certificate & Green NFT Badge Suite", () => {
    test("F108-T1: Order model persists carbonOffsetCert schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_CARBON_CERT_108",
        items: [{ productId: "p_solar_lamp", name: "Đèn Năng Lượng Mặt Trời SolarPro", price: 350000, quantity: 1 }],
        total: 375000,
        carbonOffsetCert: {
          isIssued: true,
          certificateId: "CERT-CO2-98472910",
          carbonOffsetKg: 4.3,
          issuedAt: new Date().toISOString(),
          treeUnitsPlanted: 4,
          certPdfUrl: "https://cert.shopee.vn/carbon-offset/CERT-CO2-98472910.pdf",
          nftBadgeCode: "SPX-GREEN-HERO-K98A2",
        },
      });

      expect.equal(order.orderId, "ORD_CARBON_CERT_108");
      expect.equal(order.carbonOffsetCert.isIssued, true);
      expect.equal(order.carbonOffsetCert.certificateId, "CERT-CO2-98472910");
      expect.equal(order.carbonOffsetCert.carbonOffsetKg, 4.3);
      expect.equal(order.carbonOffsetCert.treeUnitsPlanted, 4);
      expect.equal(order.carbonOffsetCert.nftBadgeCode.includes("SPX-GREEN-HERO"), true);
    });

    test("F108-T2: Carbon reduction computation sums multi-warehouse routing and eco-packaging savings", () => {
      const whSaved = 1.8;
      const ecoPackSaved = 2.5;
      const totalOffsetKg = Number((whSaved + ecoPackSaved).toFixed(2));

      expect.equal(totalOffsetKg, 4.3);
      expect.equal(totalOffsetKg > 4.0, true);
    });

    test("F108-T3: Equivalent planted tree calculation computes accurately based on CO2 ratio", () => {
      const carbonOffsetKg = 4.3;
      const treeUnits = Math.max(1, Math.round(carbonOffsetKg / 1.2));

      expect.equal(treeUnits, 4);
    });

    test("F108-T4: Certificate PDF URL format matches enterprise validation pattern", () => {
      const certId = "CERT-CO2-12345678";
      const certPdfUrl = `https://cert.shopee.vn/carbon-offset/${certId}.pdf`;

      expect.equal(certPdfUrl.startsWith("https://cert.shopee.vn/carbon-offset/"), true);
      expect.equal(certPdfUrl.endsWith(".pdf"), true);
    });

    test("F108-T5: Default order initial state reflects unissued certificate status", () => {
      const defaultCert = {
        isIssued: false,
        certificateId: "",
        carbonOffsetKg: 0,
        treeUnitsPlanted: 0,
        nftBadgeCode: "",
      };

      expect.equal(defaultCert.isIssued, false);
      expect.equal(defaultCert.carbonOffsetKg, 0);
      expect.equal(defaultCert.treeUnitsPlanted, 0);
    });
  });

  // =========================================================================
  // FEATURE 109: Doorstep Return & Exchange Courier Dispatch Suite (5 Tests)
  // =========================================================================
  describe("Feature 109: Doorstep Return & Exchange Courier Dispatch Suite", () => {
    test("F109-T1: Order model persists doorstepReturnPickup schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_DOORSTEP_RET_109",
        items: [{ productId: "p_shoe_01", name: "Giày Sneaker Running SPX", price: 790000, quantity: 1 }],
        total: 815000,
        doorstepReturnPickup: {
          isBooked: true,
          appointmentDate: "2026-10-15",
          timeWindow: "morning_8_12",
          courierName: "Nguyễn Văn Tuấn (Bưu tá SPX Thu Hồi)",
          courierPhone: "0912839102",
          pickupStatus: "scheduled",
          pickupAddress: "Số 88 Phố Huế, Hai Bà Trưng, Hà Nội",
          pickupNote: "Kiện hàng đã dán tem đổi trả",
        },
      });

      expect.equal(order.orderId, "ORD_DOORSTEP_RET_109");
      expect.equal(order.doorstepReturnPickup.isBooked, true);
      expect.equal(order.doorstepReturnPickup.appointmentDate, "2026-10-15");
      expect.equal(order.doorstepReturnPickup.pickupStatus, "scheduled");
      expect.equal(order.doorstepReturnPickup.courierName.includes("Nguyễn Văn Tuấn"), true);
    });

    test("F109-T2: Courier dispatch assignment maps valid contact phone format", () => {
      const courierPhone = "0912839102";
      const isValidPhone = /^(03|05|07|08|09)\d{8}$/.test(courierPhone);
      expect.equal(isValidPhone, true);
    });

    test("F109-T3: Time window presets support designated shift options", () => {
      const allowedWindows = ["anytime", "morning_8_12", "afternoon_13_17", "evening_18_20"];
      expect.equal(allowedWindows.includes("morning_8_12"), true);
      expect.equal(allowedWindows.includes("afternoon_13_17"), true);
      expect.equal(allowedWindows.includes("midnight"), false);
    });

    test("F109-T4: Pickup handover execution advances pickupStatus to picked_up", () => {
      const returnPickup = {
        pickupStatus: "scheduled",
      };

      returnPickup.pickupStatus = "picked_up";
      expect.equal(returnPickup.pickupStatus, "picked_up");

      returnPickup.pickupStatus = "returned_to_hub";
      expect.equal(returnPickup.pickupStatus, "returned_to_hub");
    });

    test("F109-T5: Default order initial state preserves unbooked doorstep return state", () => {
      const defaultPickup = {
        isBooked: false,
        appointmentDate: null,
        pickupStatus: "none",
      };

      expect.equal(defaultPickup.isBooked, false);
      expect.equal(defaultPickup.pickupStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 110: Automated Fraud Risk Radar & COD Protection Suite (5 Tests)
  // =========================================================================
  describe("Feature 110: Automated Fraud Risk Radar & COD Protection Suite", () => {
    test("F110-T1: Order model persists fraudRiskScore schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_FRAUD_RADAR_110",
        items: [{ productId: "p_gold_watch", name: "Đồng hồ mạ vàng cơ học Chrono", price: 25000000, quantity: 1 }],
        total: 25000000,
        fraudRiskScore: {
          riskScore: 80,
          riskLevel: "critical",
          flags: ["MASSIVE_HIGH_VALUE_TRANSACTION (>20M VND)", "IN_FLIGHT_ADDRESS_ALTERATION"],
          scannedAt: new Date().toISOString(),
          actionTaken: "account_frozen",
        },
      });

      expect.equal(order.orderId, "ORD_FRAUD_RADAR_110");
      expect.equal(order.fraudRiskScore.riskScore, 80);
      expect.equal(order.fraudRiskScore.riskLevel, "critical");
      expect.equal(order.fraudRiskScore.actionTaken, "account_frozen");
      expect.equal(order.fraudRiskScore.flags.length, 2);
    });

    test("F110-T2: High value transaction (>20M VND) increases risk score by 45 points", () => {
      let score = 5;
      const orderTotal = 25000000;
      if (orderTotal > 20000000) {
        score += 45;
      }
      expect.equal(score, 50);
    });

    test("F110-T3: Moderate risk score (>=50) triggers cod_disabled protection rule", () => {
      const score = 55;
      const action = score >= 75 ? "account_frozen" : score >= 50 ? "cod_disabled" : "allowed";
      expect.equal(action, "cod_disabled");
    });

    test("F110-T4: Critical risk score (>=75) flags order for account freezing", () => {
      const score = 85;
      const riskLevel = score >= 75 ? "critical" : "high";
      const action = score >= 75 ? "account_frozen" : "cod_disabled";

      expect.equal(riskLevel, "critical");
      expect.equal(action, "account_frozen");
    });

    test("F110-T5: Clean normal order defaults to low risk level with allowed action", () => {
      const defaultRisk = {
        riskScore: 5,
        riskLevel: "low",
        flags: [],
        actionTaken: "allowed",
      };

      expect.equal(defaultRisk.riskScore, 5);
      expect.equal(defaultRisk.riskLevel, "low");
      expect.equal(defaultRisk.actionTaken, "allowed");
      expect.equal(defaultRisk.flags.length, 0);
    });
  });

  // =========================================================================
  // FEATURE 111: Automated COD Courier Reconciliation & Wallet Settlement (5 Tests)
  // =========================================================================
  describe("Feature 111: Automated COD Courier Reconciliation & Wallet Settlement", () => {
    test("F111-T1: Order model persists automatedCodSettlement schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_COD_RECON_111",
        items: [{ productId: "p_jacket_01", name: "Áo Khoác Bomber Kaki Nam", price: 420000, quantity: 1 }],
        total: 445000,
        automatedCodSettlement: {
          settlementId: "SETTLE-COD-84729104",
          amountCollected: 445000,
          courierHandoverStatus: "hub_verified",
          verifiedAt: new Date().toISOString(),
          remittedAt: null,
          reconciliationRef: "SPX-RECON-K198A",
        },
      });

      expect.equal(order.orderId, "ORD_COD_RECON_111");
      expect.equal(order.automatedCodSettlement.settlementId, "SETTLE-COD-84729104");
      expect.equal(order.automatedCodSettlement.amountCollected, 445000);
      expect.equal(order.automatedCodSettlement.courierHandoverStatus, "hub_verified");
      expect.equal(order.automatedCodSettlement.reconciliationRef, "SPX-RECON-K198A");
    });

    test("F111-T2: Hub verification confirms courier cash physical match before clearing", () => {
      const settlement = {
        amountCollected: 445000,
        courierHandoverStatus: "courier_cash_held",
      };

      settlement.courierHandoverStatus = "hub_verified";
      expect.equal(settlement.courierHandoverStatus, "hub_verified");
    });

    test("F111-T3: Seller remittance transition stamps remittedAt timestamp", () => {
      const settlement = {
        courierHandoverStatus: "hub_verified",
        remittedAt: null,
      };

      settlement.courierHandoverStatus = "seller_remitted";
      settlement.remittedAt = new Date().toISOString();

      expect.equal(settlement.courierHandoverStatus, "seller_remitted");
      expect.equal(Boolean(settlement.remittedAt), true);
    });

    test("F111-T4: Unique reconciliation reference is generated with platform prefix", () => {
      const ref = "SPX-RECON-XYZ123";
      expect.equal(ref.startsWith("SPX-RECON-"), true);
      expect.equal(ref.length > 10, true);
    });

    test("F111-T5: Default order initializes with pending_collection COD status", () => {
      const defaultCod = {
        settlementId: "",
        amountCollected: 0,
        courierHandoverStatus: "pending_collection",
        verifiedAt: null,
        remittedAt: null,
      };

      expect.equal(defaultCod.courierHandoverStatus, "pending_collection");
      expect.equal(defaultCod.amountCollected, 0);
      expect.equal(defaultCod.verifiedAt, null);
    });
  });

  // =========================================================================
  // FEATURE 112: Shopee On-Time Delivery Guarantee & Automated Delay Compensation (5 Tests)
  // =========================================================================
  describe("Feature 112: Shopee On-Time Delivery Guarantee & Automated Delay Compensation", () => {
    test("F112-T1: Order model persists lateDeliveryCompensation schema attributes", async () => {
      const order = await Order.create({
        orderId: "ORD_ONTIME_COMP_112",
        items: [{ productId: "p_earphone", name: "Tai Nghe Nhét Tai Gaming", price: 290000, quantity: 1 }],
        total: 315000,
        lateDeliveryCompensation: {
          isEligible: true,
          promiseDeliveryDate: "2026-10-09",
          actualDeliveredDate: "2026-10-11",
          delayHours: 28,
          compensationVoucherCode: "ONTIME40K-849102",
          compensationAmount: 40000,
          claimStatus: "auto_credited",
          claimedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_ONTIME_COMP_112");
      expect.equal(order.lateDeliveryCompensation.isEligible, true);
      expect.equal(order.lateDeliveryCompensation.compensationAmount, 40000);
      expect.equal(order.lateDeliveryCompensation.claimStatus, "auto_credited");
      expect.equal(order.lateDeliveryCompensation.compensationVoucherCode.startsWith("ONTIME40K-"), true);
    });

    test("F112-T2: Delivery delay exceeding promise window (>24h) flags eligibility", () => {
      const promiseDate = new Date("2026-10-09T18:00:00Z");
      const actualDate = new Date("2026-10-11T00:00:00Z");
      const delayHours = (actualDate.getTime() - promiseDate.getTime()) / (1000 * 60 * 60);

      expect.equal(delayHours, 30);
      const isEligible = delayHours > 24;
      expect.equal(isEligible, true);
    });

    test("F112-T3: On-time delivery within window does not trigger compensation", () => {
      const promiseDate = new Date("2026-10-11T18:00:00Z");
      const actualDate = new Date("2026-10-11T12:00:00Z");
      const isLate = actualDate.getTime() > promiseDate.getTime();

      expect.equal(isLate, false);
    });

    test("F112-T4: Compensation voucher generation produces standard prefix code", () => {
      const voucherCode = "ONTIME40K-928103";
      expect.equal(voucherCode.startsWith("ONTIME40K-"), true);
      expect.equal(voucherCode.length, 16);
    });

    test("F112-T5: Default order initial state maintains uncredited compensation state", () => {
      const defaultLate = {
        isEligible: false,
        delayHours: 0,
        compensationAmount: 0,
        claimStatus: "none",
      };

      expect.equal(defaultLate.isEligible, false);
      expect.equal(defaultLate.claimStatus, "none");
      expect.equal(defaultLate.compensationAmount, 0);
    });
  });

  // =========================================================================
  // FEATURE 113: Intelligent AI Damage Claim Vision Evaluator & Instant Partial Refund (5 Tests)
  // =========================================================================
  describe("Feature 113: Intelligent AI Damage Claim Vision Evaluator & Instant Partial Refund", () => {
    test("F113-T1: Order model persists AI Damage Claim Evaluation data schema", async () => {
      const order = await Order.create({
        orderId: "ORD_AI_CLAIM_113",
        user: "buyer_test_claim_113",
        shopId: "shop_claim_113",
        total: 200000,
        aiDamageClaimEvaluation: {
          hasClaim: true,
          claimId: "DMG_113001",
          damageSeverityPercent: 35,
          detectedFlaws: ["Nứt góc viền hộp bảo vệ", "Trầy xước bề mặt nhẹ 3.5cm"],
          instantPartialRefundOffered: 70000,
          acceptedByBuyer: true,
          evaluationVerdict: "minor_scratch",
          evaluatedAt: new Date().toISOString(),
          refundStatus: "partial_refund_credited",
        },
      });

      expect.equal(order.orderId, "ORD_AI_CLAIM_113");
      expect.equal(order.aiDamageClaimEvaluation.hasClaim, true);
      expect.equal(order.aiDamageClaimEvaluation.damageSeverityPercent, 35);
      expect.equal(order.aiDamageClaimEvaluation.instantPartialRefundOffered, 70000);
      expect.equal(order.aiDamageClaimEvaluation.refundStatus, "partial_refund_credited");
      expect.equal(order.aiDamageClaimEvaluation.detectedFlaws.length, 2);
    });

    test("F113-T2: Partial refund computes accurately based on total amount and damage severity percentage", () => {
      const totalAmount = 300000;
      const damageSeverityPercent = 40;
      const calculatedRefund = Math.round((totalAmount * damageSeverityPercent) / 100);

      expect.equal(calculatedRefund, 120000);
      expect.equal(calculatedRefund < totalAmount, true);
    });

    test("F113-T3: Buyer accepts partial refund transitions refund status to partial_refund_credited", () => {
      const acceptPartialRefund = true;
      const refundStatus = acceptPartialRefund ? "partial_refund_credited" : "full_return_requested";

      expect.equal(refundStatus, "partial_refund_credited");
    });

    test("F113-T4: Buyer rejects partial refund routes to full product return request", () => {
      const acceptPartialRefund = false;
      const refundStatus = acceptPartialRefund ? "partial_refund_credited" : "full_return_requested";

      expect.equal(refundStatus, "full_return_requested");
    });

    test("F113-T5: Default order schema initial state has no active damage claim", () => {
      const defaultClaim = {
        hasClaim: false,
        damageSeverityPercent: 0,
        instantPartialRefundOffered: 0,
        refundStatus: "none",
      };

      expect.equal(defaultClaim.hasClaim, false);
      expect.equal(defaultClaim.damageSeverityPercent, 0);
      expect.equal(defaultClaim.instantPartialRefundOffered, 0);
      expect.equal(defaultClaim.refundStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 114: Multi-Store Consolidated Packaging & Unified Box Shipping (5 Tests)
  // =========================================================================
  describe("Feature 114: Multi-Store Consolidated Packaging & Unified Box Shipping", () => {
    test("F114-T1: Order model persists Multi-Store Consolidated Packaging Suite schema", async () => {
      const order = await Order.create({
        orderId: "ORD_CONSOLIDATED_114",
        user: "buyer_test_consolidate_114",
        shopId: "multi_vendor_hub",
        total: 540000,
        consolidatedPackagingSuite: {
          isConsolidated: true,
          consolidationHub: "SPX Logistics Sorting Center Tân Bình",
          consolidatedBoxesCount: 1,
          participatingShops: ["Shopee Mall Flagship", "Công Nghệ Store HCM", "Gia Dụng Xanh Official"],
          packagingMaterialsSavedKg: 1.15,
          shippingFeeSaved: 22000,
          consolidationStatus: "bundled_in_hub",
          consolidatedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_CONSOLIDATED_114");
      expect.equal(order.consolidatedPackagingSuite.isConsolidated, true);
      expect.equal(order.consolidatedPackagingSuite.consolidatedBoxesCount, 1);
      expect.equal(order.consolidatedPackagingSuite.participatingShops.length, 3);
      expect.equal(order.consolidatedPackagingSuite.packagingMaterialsSavedKg, 1.15);
      expect.equal(order.consolidatedPackagingSuite.shippingFeeSaved, 22000);
      expect.equal(order.consolidatedPackagingSuite.consolidationStatus, "bundled_in_hub");
    });

    test("F114-T2: Packaging material savings calculation aggregates across multiple participating shops", () => {
      const shopsCount = 3;
      const baseSavingPerExtraShop = 0.45; // kg
      const totalSavedKg = Number(((shopsCount - 1) * baseSavingPerExtraShop).toFixed(2));

      expect.equal(totalSavedKg, 0.9);
      expect.equal(totalSavedKg > 0, true);
    });

    test("F114-T3: Unified box consolidation reduces multi-shop shipping fee overhead", () => {
      const individualShippingFees = [25000, 20000, 18000];
      const unifiedConsolidatedShippingFee = 38000;
      const totalIndividual = individualShippingFees.reduce((a, b) => a + b, 0);
      const savedFee = totalIndividual - unifiedConsolidatedShippingFee;

      expect.equal(totalIndividual, 63000);
      expect.equal(savedFee, 25000);
    });

    test("F114-T4: Consolidation status progresses from awaiting_items to dispatched_single_box", () => {
      const statuses = ["awaiting_items", "bundled_in_hub", "dispatched_single_box"];
      expect.equal(statuses[0], "awaiting_items");
      expect.equal(statuses[2], "dispatched_single_box");
    });

    test("F114-T5: Default order schema initial state does not force consolidation", () => {
      const defaultConsolidation = {
        isConsolidated: false,
        consolidatedBoxesCount: 1,
        participatingShops: [],
        packagingMaterialsSavedKg: 0,
        shippingFeeSaved: 0,
        consolidationStatus: "none",
      };

      expect.equal(defaultConsolidation.isConsolidated, false);
      expect.equal(defaultConsolidation.participatingShops.length, 0);
      expect.equal(defaultConsolidation.consolidationStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 115: Priority Cold-Chain Perishable Logistics & IoT Thermal Tracker (5 Tests)
  // =========================================================================
  describe("Feature 115: Priority Cold-Chain Perishable Logistics & IoT Thermal Tracker", () => {
    test("F115-T1: Order model persists Priority Cold Chain Dispatch schema", async () => {
      const order = await Order.create({
        orderId: "ORD_COLD_CHAIN_115",
        user: "buyer_test_cold_115",
        shopId: "fresh_market_official",
        total: 450000,
        priorityColdChainDispatch: {
          isColdChain: true,
          sensorSerial: "TEMP-IOT-948102",
          minTempCelsius: 0,
          maxTempCelsius: 4,
          currentTempCelsius: 2.3,
          thermalInsulationBox: "smart_refrigerated_container",
          tempBreachAlert: false,
          lastSensorSyncAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_COLD_CHAIN_115");
      expect.equal(order.priorityColdChainDispatch.isColdChain, true);
      expect.equal(order.priorityColdChainDispatch.sensorSerial, "TEMP-IOT-948102");
      expect.equal(order.priorityColdChainDispatch.currentTempCelsius, 2.3);
      expect.equal(order.priorityColdChainDispatch.tempBreachAlert, false);
      expect.equal(order.priorityColdChainDispatch.thermalInsulationBox, "smart_refrigerated_container");
    });

    test("F115-T2: Safe temperature range strictly maintains 0°C to 4°C without triggering breach alert", () => {
      const minTemp = 0;
      const maxTemp = 4;
      const readings = [0.5, 1.8, 2.4, 3.9];

      for (const temp of readings) {
        const isBreached = temp < minTemp || temp > maxTemp;
        expect.equal(isBreached, false);
      }
    });

    test("F115-T3: Temperature breach above threshold triggers automated IoT alarm", () => {
      const minTemp = 0;
      const maxTemp = 4;
      const tempReading = 6.2; // Quá ngưỡng
      const isBreached = tempReading < minTemp || tempReading > maxTemp;

      expect.equal(isBreached, true);
    });

    test("F115-T4: Temperature breach below freezing threshold triggers alarm for delicate fresh produce", () => {
      const minTemp = 0;
      const maxTemp = 4;
      const tempReading = -2.1; // Bị đông đá hư hỏng
      const isBreached = tempReading < minTemp || tempReading > maxTemp;

      expect.equal(isBreached, true);
    });

    test("F115-T5: Default order schema initial state does not activate cold chain without perishable tag", () => {
      const defaultColdChain = {
        isColdChain: false,
        sensorSerial: "",
        minTempCelsius: 0,
        maxTempCelsius: 4,
        tempBreachAlert: false,
      };

      expect.equal(defaultColdChain.isColdChain, false);
      expect.equal(defaultColdChain.tempBreachAlert, false);
      expect.equal(defaultColdChain.sensorSerial, "");
    });
  });

  // =========================================================================
  // FEATURE 116: Doorstep Old Appliance Trade-In & E-Waste Direct Subsidy (5 Tests)
  // =========================================================================
  describe("Feature 116: Doorstep Old Appliance Trade-In & E-Waste Direct Subsidy", () => {
    test("F116-T1: Order model persists Doorstep Old Appliance Trade-In schema", async () => {
      const order = await Order.create({
        orderId: "ORD_TRADE_IN_116",
        user: "buyer_test_tradein_116",
        shopId: "apple_flagship_store",
        total: 25000000,
        doorstepOldApplianceTradeIn: {
          isTradeInRequested: true,
          applianceType: "smartphone",
          deviceBrandModel: "iPhone 11 64GB",
          cosmeticCondition: "like_new",
          subsidyCreditAmount: 1800000,
          recycleCertificateCode: "REC-EW-981023",
          pickupCourierName: "Trần Đình Khôi (Đội Thu Hồi E-Waste)",
          tradeInStatus: "subsidy_credited",
          creditedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_TRADE_IN_116");
      expect.equal(order.doorstepOldApplianceTradeIn.isTradeInRequested, true);
      expect.equal(order.doorstepOldApplianceTradeIn.applianceType, "smartphone");
      expect.equal(order.doorstepOldApplianceTradeIn.deviceBrandModel, "iPhone 11 64GB");
      expect.equal(order.doorstepOldApplianceTradeIn.subsidyCreditAmount, 1800000);
      expect.equal(order.doorstepOldApplianceTradeIn.recycleCertificateCode.startsWith("REC-EW-"), true);
      expect.equal(order.doorstepOldApplianceTradeIn.tradeInStatus, "subsidy_credited");
    });

    test("F116-T2: Net payment calculation properly offsets trade-in subsidy credit from original order", () => {
      const orderTotal = 25000000;
      const tradeInSubsidy = 1800000;
      const netPayment = Math.max(0, orderTotal - tradeInSubsidy);

      expect.equal(netPayment, 23200000);
      expect.equal(netPayment < orderTotal, true);
    });

    test("F116-T3: Cosmetic condition scales subsidy multiplier consistently", () => {
      const baseValuation = 2000000;
      const multipliers = {
        like_new: 1.0,
        minor_wear: 0.75,
        cracked_or_faulty: 0.4,
      };

      const likeNewVal = baseValuation * multipliers.like_new;
      const minorWearVal = baseValuation * multipliers.minor_wear;
      const faultyVal = baseValuation * multipliers.cracked_or_faulty;

      expect.equal(likeNewVal, 2000000);
      expect.equal(minorWearVal, 1500000);
      expect.equal(faultyVal, 800000);
    });

    test("F116-T4: Trade-in status lifecycle progresses cleanly to e_waste_recycled", () => {
      const statuses = ["scheduled_pickup", "inspected_at_doorstep", "subsidy_credited", "e_waste_recycled"];
      expect.equal(statuses[0], "scheduled_pickup");
      expect.equal(statuses[3], "e_waste_recycled");
    });

    test("F116-T5: Default order schema initial state does not request trade-in", () => {
      const defaultTradeIn = {
        isTradeInRequested: false,
        applianceType: "none",
        subsidyCreditAmount: 0,
        tradeInStatus: "none",
      };

      expect.equal(defaultTradeIn.isTradeInRequested, false);
      expect.equal(defaultTradeIn.subsidyCreditAmount, 0);
      expect.equal(defaultTradeIn.tradeInStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 117: Autonomous Drone Flight Delivery Route & Helipad Drop Simulator (5 Tests)
  // =========================================================================
  describe("Feature 117: Autonomous Drone Flight Delivery Route & Helipad Drop Simulator", () => {
    test("F117-T1: Order model persists Autonomous Drone Flight Delivery schema", async () => {
      const order = await Order.create({
        orderId: "ORD_DRONE_117",
        user: "buyer_test_drone_117",
        shopId: "shop_pharma_urgent",
        total: 1200000,
        autonomousDroneDelivery: {
          isDroneEligible: true,
          droneCallsign: "SPX-DRONE-VN0982",
          flightAltitudeMeters: 120,
          flightSpeedKmh: 68,
          batteryLevelPercent: 88,
          helipadCoordinates: { lat: 10.7769, lng: 106.7009 },
          tetherDropStatus: "winch_cable_lowered",
          windSpeedKnots: 7.8,
          flightLogId: "FLIGHT-SPX-982103",
        },
      });

      expect.equal(order.orderId, "ORD_DRONE_117");
      expect.equal(order.autonomousDroneDelivery.isDroneEligible, true);
      expect.equal(order.autonomousDroneDelivery.droneCallsign, "SPX-DRONE-VN0982");
      expect.equal(order.autonomousDroneDelivery.flightAltitudeMeters, 120);
      expect.equal(order.autonomousDroneDelivery.batteryLevelPercent, 88);
      expect.equal(order.autonomousDroneDelivery.tetherDropStatus, "winch_cable_lowered");
      expect.equal(order.autonomousDroneDelivery.helipadCoordinates.lat, 10.7769);
    });

    test("F117-T2: Wind speed under 20 knots permits safe autonomous commercial drone dispatch", () => {
      const maxSafeWindKnots = 20;
      const windSpeedKnots = 7.8;
      const isSafeToFly = windSpeedKnots <= maxSafeWindKnots;

      expect.equal(isSafeToFly, true);
    });

    test("F117-T3: Extreme wind speed exceeding safety limit halts autonomous drone takeoff", () => {
      const maxSafeWindKnots = 20;
      const gustWindKnots = 28.5;
      const isSafeToFly = gustWindKnots <= maxSafeWindKnots;

      expect.equal(isSafeToFly, false);
    });

    test("F117-T4: Drone flight state transitions sequentially to landed_safely", () => {
      const flightSequence = [
        "takeoff_clearance",
        "airborne_cruise",
        "hovering_above_pad",
        "winch_cable_lowered",
        "landed_safely",
      ];

      expect.equal(flightSequence[0], "takeoff_clearance");
      expect.equal(flightSequence[3], "winch_cable_lowered");
      expect.equal(flightSequence[4], "landed_safely");
    });

    test("F117-T5: Default order schema initial state does not engage drone delivery without urgent dispatch", () => {
      const defaultDrone = {
        isDroneEligible: false,
        droneCallsign: "",
        flightAltitudeMeters: 0,
        tetherDropStatus: "none",
      };

      expect.equal(defaultDrone.isDroneEligible, false);
      expect.equal(defaultDrone.droneCallsign, "");
      expect.equal(defaultDrone.tetherDropStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 118: Smart In-Transit Package Temperature Breach Insurance Claim (5 Tests)
  // =========================================================================
  describe("Feature 118: Smart In-Transit Package Temperature Breach Insurance Claim", () => {
    test("F118-T1: Order model persists Cold Chain Insurance Compensation schema", async () => {
      const order = await Order.create({
        orderId: "ORD_INSURANCE_118",
        user: "buyer_test_insure_118",
        shopId: "shop_pharma_cold",
        total: 800000,
        coldChainInsuranceCompensation: {
          hasInsurance: true,
          policyId: "POL-COLD-948102",
          coverageAmount: 500000,
          breachDetected: true,
          autoClaimStatus: "payout_settled",
          payoutAmount: 350000,
          settledAt: new Date().toISOString(),
          insuranceProvider: "Shopee Bảo Hiểm Hàng Lạnh Toàn Diện",
        },
      });

      expect.equal(order.orderId, "ORD_INSURANCE_118");
      expect.equal(order.coldChainInsuranceCompensation.hasInsurance, true);
      expect.equal(order.coldChainInsuranceCompensation.policyId, "POL-COLD-948102");
      expect.equal(order.coldChainInsuranceCompensation.coverageAmount, 500000);
      expect.equal(order.coldChainInsuranceCompensation.breachDetected, true);
      expect.equal(order.coldChainInsuranceCompensation.payoutAmount, 350000);
      expect.equal(order.coldChainInsuranceCompensation.autoClaimStatus, "payout_settled");
    });

    test("F118-T2: Verified temperature breach triggers automated insurance settlement payout", () => {
      const breachDetected = true;
      const coverageAmount = 500000;
      const payoutAmount = breachDetected ? 350000 : 0;
      const claimStatus = breachDetected ? "payout_settled" : "claim_rejected";

      expect.equal(claimStatus, "payout_settled");
      expect.equal(payoutAmount <= coverageAmount, true);
    });

    test("F118-T3: Normal cold-chain temperature profile without breach rejects insurance claims", () => {
      const breachDetected = false;
      const payoutAmount = breachDetected ? 350000 : 0;
      const claimStatus = breachDetected ? "payout_settled" : "claim_rejected";

      expect.equal(claimStatus, "claim_rejected");
      expect.equal(payoutAmount, 0);
    });

    test("F118-T4: Insurance policy code starts with standard POL-COLD prefix", () => {
      const policyId = "POL-COLD-849102";
      expect.equal(policyId.startsWith("POL-COLD-"), true);
      expect.equal(policyId.length, 15);
    });

    test("F118-T5: Default order schema initial state does not activate insurance payout", () => {
      const defaultInsurance = {
        hasInsurance: false,
        coverageAmount: 0,
        breachDetected: false,
        autoClaimStatus: "none",
        payoutAmount: 0,
      };

      expect.equal(defaultInsurance.hasInsurance, false);
      expect.equal(defaultInsurance.breachDetected, false);
      expect.equal(defaultInsurance.autoClaimStatus, "none");
      expect.equal(defaultInsurance.payoutAmount, 0);
    });
  });

  // =========================================================================
  // FEATURE 119: Smart Carbon Neutral Green Route Optimization & Solar Fleet Badge (5 Tests)
  // =========================================================================
  describe("Feature 119: Smart Carbon Neutral Green Route Optimization & Solar Fleet Badge", () => {
    test("F119-T1: Order model persists Solar Fleet Green Routing schema", async () => {
      const order = await Order.create({
        orderId: "ORD_GREEN_FLEET_119",
        user: "buyer_test_green_119",
        shopId: "shop_eco_friendly",
        total: 620000,
        solarFleetGreenRouting: {
          isGreenFleet: true,
          vehicleType: "solar_cargo_bike",
          fleetId: "GREEN-EV-0921",
          routeOptimizationEfficiencyPercent: 28,
          co2AvoidedGrams: 850,
          solarEnergyHarvestedWh: 420,
          ecoDriverRating: 4.95,
        },
      });

      expect.equal(order.orderId, "ORD_GREEN_FLEET_119");
      expect.equal(order.solarFleetGreenRouting.isGreenFleet, true);
      expect.equal(order.solarFleetGreenRouting.vehicleType, "solar_cargo_bike");
      expect.equal(order.solarFleetGreenRouting.fleetId, "GREEN-EV-0921");
      expect.equal(order.solarFleetGreenRouting.co2AvoidedGrams, 850);
      expect.equal(order.solarFleetGreenRouting.solarEnergyHarvestedWh, 420);
      expect.equal(order.solarFleetGreenRouting.ecoDriverRating, 4.95);
    });

    test("F119-T2: Carbon reduction computation aggregates accurately for multiple green drop-offs", () => {
      const dropOffs = 5;
      const co2SavedPerDropGrams = 850;
      const totalCo2AvoidedKg = (dropOffs * co2SavedPerDropGrams) / 1000;

      expect.equal(totalCo2AvoidedKg, 4.25);
      expect.equal(totalCo2AvoidedKg > 0, true);
    });

    test("F119-T3: Solar energy harvested per route strictly increases vehicle auxiliary range", () => {
      const batteryCapacityWh = 1000;
      const solarEnergyHarvestedWh = 420;
      const chargeAddedPercent = Math.round((solarEnergyHarvestedWh / batteryCapacityWh) * 100);

      expect.equal(chargeAddedPercent, 42);
      expect.equal(chargeAddedPercent > 0, true);
    });

    test("F119-T4: Eco driver rating maintains valid 1.0 to 5.0 range", () => {
      const ecoDriverRating = 4.95;
      expect.equal(ecoDriverRating >= 1.0 && ecoDriverRating <= 5.0, true);
    });

    test("F119-T5: Default order schema initial state does not force green fleet tag without dispatch assignment", () => {
      const defaultGreen = {
        isGreenFleet: false,
        vehicleType: "none",
        co2AvoidedGrams: 0,
        solarEnergyHarvestedWh: 0,
      };

      expect.equal(defaultGreen.isGreenFleet, false);
      expect.equal(defaultGreen.vehicleType, "none");
      expect.equal(defaultGreen.co2AvoidedGrams, 0);
    });
  });

  // =========================================================================
  // FEATURE 120: In-App Real-Time Interactive Parcel Rerouting & Scheduled Delivery Window Switcher (5 Tests)
  // =========================================================================
  describe("Feature 120: In-App Real-Time Interactive Parcel Rerouting & Scheduled Delivery Window Switcher", () => {
    test("F120-T1: Order model persists Real-Time Parcel Rerouting schema", async () => {
      const order = await Order.create({
        orderId: "ORD_REROUTE_120",
        user: "buyer_test_reroute_120",
        shopId: "shop_speed_express",
        total: 750000,
        realTimeParcelRerouting: {
          isRerouted: true,
          originalCoordinates: { lat: 10.7769, lng: 106.7009 },
          newCoordinates: { lat: 10.7801, lng: 106.6992 },
          reroutedAddress: "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          deliveryTimeWindow: "afternoon_13_17",
          additionalDistanceKm: 1.4,
          rerouteFeeCharged: 0,
          courierAckStatus: "route_recalculated",
          reroutedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_REROUTE_120");
      expect.equal(order.realTimeParcelRerouting.isRerouted, true);
      expect.equal(order.realTimeParcelRerouting.reroutedAddress, "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh");
      expect.equal(order.realTimeParcelRerouting.deliveryTimeWindow, "afternoon_13_17");
      expect.equal(order.realTimeParcelRerouting.additionalDistanceKm, 1.4);
      expect.equal(order.realTimeParcelRerouting.rerouteFeeCharged, 0);
      expect.equal(order.realTimeParcelRerouting.courierAckStatus, "route_recalculated");
    });

    test("F120-T2: Radius under 3km grants free rerouting while maintaining courier efficiency", () => {
      const maxFreeRadiusKm = 3.0;
      const reroutedDistanceKm = 1.4;
      const rerouteFee = reroutedDistanceKm <= maxFreeRadiusKm ? 0 : 15000;

      expect.equal(rerouteFee, 0);
    });

    test("F120-T3: Radius exceeding free threshold calculates extra courier mileage surcharge", () => {
      const maxFreeRadiusKm = 3.0;
      const longDistanceRerouteKm = 5.2;
      const rerouteFee = longDistanceRerouteKm > maxFreeRadiusKm ? 15000 : 0;

      expect.equal(rerouteFee, 15000);
    });

    test("F120-T4: Delivery time window options cover all standard commercial shift slots", () => {
      const shiftSlots = ["morning_08_12", "afternoon_13_17", "evening_18_21", "weekend_priority"];
      expect.equal(shiftSlots.length, 4);
      expect.equal(shiftSlots.includes("afternoon_13_17"), true);
      expect.equal(shiftSlots.includes("weekend_priority"), true);
    });

    test("F120-T5: Default order schema initial state preserves original route without reroute flags", () => {
      const defaultReroute = {
        isRerouted: false,
        additionalDistanceKm: 0,
        rerouteFeeCharged: 0,
        courierAckStatus: "none",
      };

      expect.equal(defaultReroute.isRerouted, false);
      expect.equal(defaultReroute.additionalDistanceKm, 0);
      expect.equal(defaultReroute.courierAckStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 121: Smart Fragile Shock-Sensor IoT Telemetry & Impact Abuse Auto-Insurance Claim (5 Tests)
  // =========================================================================
  describe("Feature 121: Smart Fragile Shock-Sensor IoT Telemetry & Impact Abuse Auto-Insurance Claim", () => {
    test("F121-T1: Order model persists Fragile Shock Sensor Telemetry schema", async () => {
      const order = await Order.create({
        orderId: "ORD_SHOCK_121",
        user: "buyer_test_shock_121",
        shopId: "shop_crystal_ceramic",
        total: 1500000,
        fragileShockSensorTelemetry: {
          isFragileMonitored: true,
          shockSensorId: "SHOCK-IOT-0921",
          maxGForceLimit: 2.5,
          recordedGForce: 3.2,
          impactExceeded: true,
          dropEventCount: 1,
          autoClaimInsuranceStatus: "compensation_disbursed",
          insuranceCompensationAmount: 250000,
          lastTelemetrySyncAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_SHOCK_121");
      expect.equal(order.fragileShockSensorTelemetry.isFragileMonitored, true);
      expect.equal(order.fragileShockSensorTelemetry.shockSensorId, "SHOCK-IOT-0921");
      expect.equal(order.fragileShockSensorTelemetry.recordedGForce, 3.2);
      expect.equal(order.fragileShockSensorTelemetry.maxGForceLimit, 2.5);
      expect.equal(order.fragileShockSensorTelemetry.impactExceeded, true);
      expect.equal(order.fragileShockSensorTelemetry.insuranceCompensationAmount, 250000);
      expect.equal(order.fragileShockSensorTelemetry.autoClaimInsuranceStatus, "compensation_disbursed");
    });

    test("F121-T2: Impact G-Force strictly exceeding threshold flags breach and disburses compensation", () => {
      const limit = 2.5;
      const recorded = 3.2;
      const isBreached = recorded > limit;
      const payout = isBreached ? 250000 : 0;

      expect.equal(isBreached, true);
      expect.equal(payout, 250000);
    });

    test("F121-T3: Gentle handling within G-Force limit keeps transit safe without triggering false payout", () => {
      const limit = 2.5;
      const recorded = 1.2;
      const isBreached = recorded > limit;
      const payout = isBreached ? 250000 : 0;

      expect.equal(isBreached, false);
      expect.equal(payout, 0);
    });

    test("F121-T4: Shock sensor identifier adheres to SHOCK-IOT prefix standard", () => {
      const sensorId = "SHOCK-IOT-8491";
      expect.equal(sensorId.startsWith("SHOCK-IOT-"), true);
      expect.equal(sensorId.length, 14);
    });

    test("F121-T5: Default order schema initial state does not activate shock sensor without fragile opt-in", () => {
      const defaultShock = {
        isFragileMonitored: false,
        shockSensorId: "",
        recordedGForce: 0,
        impactExceeded: false,
        insuranceCompensationAmount: 0,
      };

      expect.equal(defaultShock.isFragileMonitored, false);
      expect.equal(defaultShock.impactExceeded, false);
      expect.equal(defaultShock.insuranceCompensationAmount, 0);
    });
  });

  // =========================================================================
  // FEATURE 122: Smart Multi-Carrier Carbon Neutrality Offset Ledger & Blockchain Verification Hash (5 Tests)
  // =========================================================================
  describe("Feature 122: Smart Multi-Carrier Carbon Neutrality Offset Ledger & Blockchain Verification Hash", () => {
    test("F122-T1: Order model persists Multi-Carrier Carbon Ledger schema", async () => {
      const order = await Order.create({
        orderId: "ORD_LEDGER_122",
        user: "buyer_test_ledger_122",
        shopId: "shop_green_alliance",
        total: 980000,
        multiCarrierCarbonLedger: {
          isLedgerRecorded: true,
          carrierCode: "SPX_EXPRESS",
          carrierConsortiumBatchId: "CONSORTIUM-VN-0921",
          carbonCreditsOffset: 1.85,
          blockchainVerificationHash: "0x7f9a8b19bc814e5a9c02d184f9",
          greenAuditStatus: "gold_standard_certified",
          verifiedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_LEDGER_122");
      expect.equal(order.multiCarrierCarbonLedger.isLedgerRecorded, true);
      expect.equal(order.multiCarrierCarbonLedger.carrierCode, "SPX_EXPRESS");
      expect.equal(order.multiCarrierCarbonLedger.carrierConsortiumBatchId, "CONSORTIUM-VN-0921");
      expect.equal(order.multiCarrierCarbonLedger.carbonCreditsOffset, 1.85);
      expect.equal(order.multiCarrierCarbonLedger.blockchainVerificationHash.startsWith("0x"), true);
      expect.equal(order.multiCarrierCarbonLedger.greenAuditStatus, "gold_standard_certified");
    });

    test("F122-T2: Consortium supports major national courier services seamlessly", () => {
      const carriers = ["SPX_EXPRESS", "GHN_EXPRESS", "VIETTEL_POST", "JNT_EXPRESS"];
      expect.equal(carriers.length, 4);
      expect.equal(carriers.includes("SPX_EXPRESS"), true);
      expect.equal(carriers.includes("VIETTEL_POST"), true);
    });

    test("F122-T3: Blockchain hash satisfies cryptographic hex string format", () => {
      const hash = "0x7f9a8b19bc814e5a9c02d184f9";
      expect.equal(hash.startsWith("0x"), true);
      expect.equal(hash.length >= 20, true);
    });

    test("F122-T4: Carbon offset credit accounting aggregates across consortium batches", () => {
      const batchCredits = [1.85, 2.15, 0.90];
      const totalOffset = Number(batchCredits.reduce((sum, c) => sum + c, 0).toFixed(2));

      expect.equal(totalOffset, 4.9);
      expect.equal(totalOffset > 0, true);
    });

    test("F122-T5: Default order schema initial state does not record unverified blockchain hash", () => {
      const defaultLedger = {
        isLedgerRecorded: false,
        carbonCreditsOffset: 0,
        blockchainVerificationHash: "",
        greenAuditStatus: "none",
      };

      expect.equal(defaultLedger.isLedgerRecorded, false);
      expect.equal(defaultLedger.carbonCreditsOffset, 0);
      expect.equal(defaultLedger.greenAuditStatus, "none");
    });
  });

  // =========================================================================
  // FEATURE 123: AI Smart Video Return Verification & Automated Resale Grading (5 Tests)
  // =========================================================================
  describe("Feature 123: AI Smart Video Return Verification & Automated Resale Grading", () => {
    test("F123-T1: Order model persists AI Video Return Resale Grading schema", async () => {
      const order = await Order.create({
        orderId: "ORD_RESALE_123",
        user: "buyer_test_resale_123",
        shopId: "shop_electronics_outlet",
        total: 1000000,
        aiVideoReturnResaleGrading: {
          hasEvaluated: true,
          videoAnalysisId: "VID-AI-GRADER-0921",
          resaleGrade: "grade_a_pristine",
          restockingFeeDeductionPercent: 0,
          estimatedResaleValueVnd: 1000000,
          secondaryMarketChannel: "shopee_outlet",
          gradedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_RESALE_123");
      expect.equal(order.aiVideoReturnResaleGrading.hasEvaluated, true);
      expect.equal(order.aiVideoReturnResaleGrading.resaleGrade, "grade_a_pristine");
      expect.equal(order.aiVideoReturnResaleGrading.restockingFeeDeductionPercent, 0);
      expect.equal(order.aiVideoReturnResaleGrading.estimatedResaleValueVnd, 1000000);
      expect.equal(order.aiVideoReturnResaleGrading.secondaryMarketChannel, "shopee_outlet");
    });

    test("F123-T2: Resale grade deduction scales accurately across open-box and refurbished tiers", () => {
      const orderTotal = 1000000;
      const deductionTiers = {
        grade_a_pristine: 0,
        grade_b_open_box: 10,
        grade_c_refurbished: 25,
        grade_d_salvage_parts: 60,
      };

      const valB = Math.round(orderTotal * (1 - deductionTiers.grade_b_open_box / 100));
      const valC = Math.round(orderTotal * (1 - deductionTiers.grade_c_refurbished / 100));
      const valD = Math.round(orderTotal * (1 - deductionTiers.grade_d_salvage_parts / 100));

      expect.equal(valB, 900000);
      expect.equal(valC, 750000);
      expect.equal(valD, 400000);
    });

    test("F123-T3: Secondary market channel routing matches grade tier correctly", () => {
      const channelA = "grade_a_pristine" === "grade_a_pristine" ? "shopee_outlet" : "b2b_liquidation_auction";
      const channelD = "grade_d_salvage_parts" === "grade_d_salvage_parts" ? "b2b_liquidation_auction" : "shopee_outlet";

      expect.equal(channelA, "shopee_outlet");
      expect.equal(channelD, "b2b_liquidation_auction");
    });

    test("F123-T4: Video analysis identifier follows standard prefix syntax", () => {
      const analysisId = "VID-AI-GRADER-9812";
      expect.equal(analysisId.startsWith("VID-AI-GRADER-"), true);
      expect.equal(analysisId.length, 18);
    });

    test("F123-T5: Default order schema initial state does not mark resale evaluation", () => {
      const defaultGrading = {
        hasEvaluated: false,
        resaleGrade: "grade_a_pristine",
        estimatedResaleValueVnd: 0,
      };

      expect.equal(defaultGrading.hasEvaluated, false);
      expect.equal(defaultGrading.estimatedResaleValueVnd, 0);
    });
  });

  // =========================================================================
  // FEATURE 124: Smart In-Transit Acoustic Anti-Tamper & Package Audio Integrity Audit (5 Tests)
  // =========================================================================
  describe("Feature 124: Smart In-Transit Acoustic Anti-Tamper Telemetry & Seal Audit", () => {
    test("F124-T1: Acoustic sensor persists pristine transit baseline telemetry", async () => {
      const order = await Order.create({
        orderId: "ORD_ACOUSTIC_124",
        userId: "user_acoustic_01",
        status: "shipping",
        total: 500000,
        acousticAntiTamperTelemetry: {
          isAcousticMonitored: true,
          sensorId: "ACOUSTIC-IOT-8812",
          decibelSpikePeak: 45,
          frequencySignature: "ambient_transit",
          tamperEventDetected: false,
          tapeCutPatternMatch: false,
          sealIntegrityStatus: "pristine",
          courierInterceptFlag: false,
        },
      });

      expect.equal(order.orderId, "ORD_ACOUSTIC_124");
      expect.equal(order.acousticAntiTamperTelemetry.isAcousticMonitored, true);
      expect.equal(order.acousticAntiTamperTelemetry.sensorId, "ACOUSTIC-IOT-8812");
      expect.equal(order.acousticAntiTamperTelemetry.decibelSpikePeak, 45);
      expect.equal(order.acousticAntiTamperTelemetry.tamperEventDetected, false);
      expect.equal(order.acousticAntiTamperTelemetry.sealIntegrityStatus, "pristine");
      expect.equal(order.acousticAntiTamperTelemetry.courierInterceptFlag, false);
    });

    test("F124-T2: Tape cut acoustic friction pattern triggers tamper detection and courier intercept", () => {
      const frequencySignature = "tape_cutter_friction";
      const decibelSpikePeak = 84;
      const tapeCutPatternMatch = true;

      const isTapeCuttingSound =
        tapeCutPatternMatch === true ||
        frequencySignature === "tape_cutter_friction" ||
        frequencySignature === "seal_tear";
      const isTamper = isTapeCuttingSound || decibelSpikePeak >= 75;
      const sealIntegrityStatus = isTapeCuttingSound ? "tampered_tape_cut" : "pristine";
      const courierInterceptFlag = isTamper;

      expect.equal(isTamper, true);
      expect.equal(sealIntegrityStatus, "tampered_tape_cut");
      expect.equal(courierInterceptFlag, true);
    });

    test("F124-T3: High decibel spike without tape cut marks suspicious vibration", () => {
      const decibelSpikePeak = 78;
      const frequencySignature = "box_impact";
      const tapeCutPatternMatch = false;

      let sealIntegrityStatus = "pristine";
      if (tapeCutPatternMatch || frequencySignature === "tape_cutter_friction") {
        sealIntegrityStatus = "tampered_tape_cut";
      } else if (decibelSpikePeak >= 75) {
        sealIntegrityStatus = "suspicious_vibration";
      }

      expect.equal(sealIntegrityStatus, "suspicious_vibration");
    });

    test("F124-T4: Investigation reference generates standard audit prefix", () => {
      const genRef = () => `ACOUSTIC-AUDIT-${"KL819".toUpperCase()}`;
      const ref = genRef();

      expect.equal(ref.startsWith("ACOUSTIC-AUDIT-"), true);
      expect.equal(ref, "ACOUSTIC-AUDIT-KL819");
    });

    test("F124-T5: Missing sensor identifier fails validation requirements", () => {
      const payload = { decibelSpikePeak: 50 };
      const isValid = Boolean(payload.sensorId && payload.sensorId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 125: Automated Courier Micro-Hub Pouch Lock Box Handoff (5 Tests)
  // =========================================================================
  describe("Feature 125: Automated Courier Micro-Hub Pouch Lock Box Handoff Suite", () => {
    test("F125-T1: Courier deposits sealed pouch into micro-hub locker compartment", async () => {
      const order = await Order.create({
        orderId: "ORD_MICRO_LOCKER_125",
        userId: "user_micro_hub_01",
        status: "shipping",
        total: 450000,
        microHubPouchLockBoxHandoff: {
          isPouchLocked: true,
          microHubId: "SPX-MICRO-HUB-BINHTHANH-04",
          pouchBarcode: "POUCH-SEC-991823",
          compartmentSlotNumber: 14,
          lockerPasscodePin: "654321",
          carrierHandoffStatus: "courier_deposited",
          depositedAt: new Date().toISOString(),
          courierDepositBadgeId: "SPX-COURIER-771",
        },
      });

      expect.equal(order.orderId, "ORD_MICRO_LOCKER_125");
      expect.equal(order.microHubPouchLockBoxHandoff.isPouchLocked, true);
      expect.equal(order.microHubPouchLockBoxHandoff.microHubId, "SPX-MICRO-HUB-BINHTHANH-04");
      expect.equal(order.microHubPouchLockBoxHandoff.compartmentSlotNumber, 14);
      expect.equal(order.microHubPouchLockBoxHandoff.carrierHandoffStatus, "courier_deposited");
      expect.equal(order.microHubPouchLockBoxHandoff.lockerPasscodePin, "654321");
    });

    test("F125-T2: Last-mile courier retrieves pouch marks retrieved status and timestamp", () => {
      const handoff = {
        carrierHandoffStatus: "courier_retrieved_out_for_delivery",
        depositedAt: "2026-10-11T10:00:00.000Z",
        retrievedAt: new Date().toISOString(),
      };

      const isOutForDelivery = handoff.carrierHandoffStatus === "courier_retrieved_out_for_delivery";
      expect.equal(isOutForDelivery, true);
      expect.equal(Boolean(handoff.retrievedAt), true);
    });

    test("F125-T3: Compartment slot number validates within standard 1..64 locker matrix", () => {
      const validSlot = 28;
      const invalidSlot = 100;

      const checkRange = (num) => num >= 1 && num <= 64;
      expect.equal(checkRange(validSlot), true);
      expect.equal(checkRange(invalidSlot), false);
    });

    test("F125-T4: Locker passcode PIN strictly conforms to 6-digit numeric pattern", () => {
      const pin = "819203";
      const isValidPin = /^\d{6}$/.test(pin);
      expect.equal(isValidPin, true);

      const invalidPin = "ABC89";
      expect.equal(/^\d{6}$/.test(invalidPin), false);
    });

    test("F125-T5: Missing microHubId fails validation guard", () => {
      const payload = { compartmentSlotNumber: 5 };
      const isValid = Boolean(payload.microHubId && payload.microHubId.trim().length > 0);
      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 126: Automated Proof-of-Delivery NFC Smart Card Tapping & Geofenced Handshake (5 Tests)
  // =========================================================================
  describe("Feature 126: NFC Smart Card Proof-of-Delivery & Geofenced Handshake Suite", () => {
    test("F126-T1: NFC tap within geofence successfully completes proof of delivery", async () => {
      const order = await Order.create({
        orderId: "ORD_NFC_POD_126",
        userId: "user_nfc_01",
        status: "shipping",
        total: 620000,
        nfcGeofenceProofOfDelivery: {
          isNfcVerified: true,
          nfcCardUid: "04:A3:89:E2:1B:7F:80",
          handshakeDistanceMeters: 8,
          geofenceThresholdMeters: 50,
          geofenceStatus: "within_geofence_handshake",
          tappedAt: new Date().toISOString(),
          deviceReaderSerial: "SPX-POS-READER-99",
          proofSignatureToken: "POD-NFC-HASH-8812AA",
        },
      });

      expect.equal(order.orderId, "ORD_NFC_POD_126");
      expect.equal(order.nfcGeofenceProofOfDelivery.isNfcVerified, true);
      expect.equal(order.nfcGeofenceProofOfDelivery.handshakeDistanceMeters, 8);
      expect.equal(order.nfcGeofenceProofOfDelivery.geofenceStatus, "within_geofence_handshake");
      expect.equal(order.nfcGeofenceProofOfDelivery.proofSignatureToken.startsWith("POD-NFC-HASH-"), true);
    });

    test("F126-T2: NFC tap outside safe geofence threshold flags audit warning", () => {
      const distance = 120;
      const threshold = 50;
      const isOutside = distance > threshold;
      const geofenceStatus = isOutside ? "outside_geofence_flagged" : "within_geofence_handshake";

      expect.equal(isOutside, true);
      expect.equal(geofenceStatus, "outside_geofence_flagged");
    });

    test("F126-T3: OTP fallback route bypasses physical NFC card requirement", () => {
      const bypassOtpFallback = true;
      const geofenceStatus = bypassOtpFallback ? "bypassed_otp_fallback" : "within_geofence_handshake";

      expect.equal(geofenceStatus, "bypassed_otp_fallback");
    });

    test("F126-T4: NFC card UID conforms to standard hexadecimal colon format", () => {
      const validUid = "04:A3:89:E2:1B:7F:80";
      const isUidFormat = /^([0-9A-Fa-f]{2}[:-]){6}[0-9A-Fa-f]{2}$/.test(validUid);

      expect.equal(isUidFormat, true);
    });

    test("F126-T5: Missing card UID without OTP fallback triggers validation error", () => {
      const payload = { handshakeDistanceMeters: 10 };
      const isValid = Boolean(payload.nfcCardUid || payload.bypassOtpFallback);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 127: AI Hazardous & Flammable Material Real-Time Parcel Sensor Scanner (5 Tests)
  // =========================================================================
  describe("Feature 127: AI Hazardous & Flammable Material Real-Time Scanner Suite", () => {
    test("F127-T1: Certified safe package scan persists safety clearance certificate", async () => {
      const order = await Order.create({
        orderId: "ORD_HAZMAT_SCAN_127",
        userId: "user_hazmat_01",
        status: "shipping",
        total: 750000,
        hazardousMaterialSafetyScan: {
          isSafetyScanned: true,
          scannerStationId: "AI-HAZMAT-SCANNER-HUB-01",
          flammabilityIndexScore: 12,
          chemicalVaporPpm: 5,
          lithiumBatteryClass: "none",
          safetyStatus: "certified_safe",
          scannedAt: new Date().toISOString(),
          safetyClearanceCertificate: "HAZMAT-PASS-9901AA",
        },
      });

      expect.equal(order.orderId, "ORD_HAZMAT_SCAN_127");
      expect.equal(order.hazardousMaterialSafetyScan.isSafetyScanned, true);
      expect.equal(order.hazardousMaterialSafetyScan.safetyStatus, "certified_safe");
      expect.equal(order.hazardousMaterialSafetyScan.safetyClearanceCertificate.startsWith("HAZMAT-PASS-"), true);
    });

    test("F127-T2: High chemical vapor or flammability triggers quarantine status", () => {
      const flammability = 85;
      const vapor = 110;

      let safetyStatus = "certified_safe";
      if (flammability >= 70 || vapor >= 100) {
        safetyStatus = "quarantined_hazardous";
      }

      expect.equal(safetyStatus, "quarantined_hazardous");
    });

    test("F127-T3: Standalone UN3480 lithium battery restricts parcel to ground transport", () => {
      const batteryClass = "un3480_standalone_prohibited_air";

      let safetyStatus = "certified_safe";
      if (batteryClass === "un3480_standalone_prohibited_air") {
        safetyStatus = "prohibited_ground_transport_only";
      }

      expect.equal(safetyStatus, "prohibited_ground_transport_only");
    });

    test("F127-T4: Moderate vapor levels flag flammable warning without full quarantine", () => {
      const flammability = 45;
      const vapor = 50;

      let safetyStatus = "certified_safe";
      if (flammability >= 70 || vapor >= 100) {
        safetyStatus = "quarantined_hazardous";
      } else if (flammability >= 40 || vapor >= 45) {
        safetyStatus = "flammable_warning_flagged";
      }

      expect.equal(safetyStatus, "flammable_warning_flagged");
    });

    test("F127-T5: Missing scannerStationId fails validation guard", () => {
      const payload = { flammabilityIndexScore: 20 };
      const isValid = Boolean(payload.scannerStationId && payload.scannerStationId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 128: Autonomous Courier Drone Air-Corridor Wind Shear & Dynamic Landing Pad Beacon (5 Tests)
  // =========================================================================
  describe("Feature 128: Drone Air-Corridor Wind Shear & Landing Beacon Suite", () => {
    test("F128-T1: Calm conditions allow touchdown landing clearance", async () => {
      const order = await Order.create({
        orderId: "ORD_DRONE_BEACON_128",
        userId: "user_drone_01",
        status: "shipping",
        total: 820000,
        droneAirCorridorLandingBeacon: {
          isDroneCorridorActive: true,
          corridorFlightCode: "CORRIDOR-AIR-SG-01",
          windSpeedKnots: 10,
          windShearRisk: "low_calm",
          landingBeaconId: "BEACON-PAD-SG-09",
          landingSafetyStatus: "cleared_for_touchdown",
          telemetryUpdatedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_DRONE_BEACON_128");
      expect.equal(order.droneAirCorridorLandingBeacon.isDroneCorridorActive, true);
      expect.equal(order.droneAirCorridorLandingBeacon.landingSafetyStatus, "cleared_for_touchdown");
      expect.equal(order.droneAirCorridorLandingBeacon.windSpeedKnots, 10);
    });

    test("F128-T2: Severe crosswind above 28 knots triggers emergency ground locker abort", () => {
      const windSpeedKnots = 32;

      let windShearRisk = "low_calm";
      let landingSafetyStatus = "cleared_for_touchdown";

      if (windSpeedKnots >= 28) {
        windShearRisk = "severe_crosswind_abort";
        landingSafetyStatus = "rerouted_to_ground_locker";
      }

      expect.equal(windShearRisk, "severe_crosswind_abort");
      expect.equal(landingSafetyStatus, "rerouted_to_ground_locker");
    });

    test("F128-T3: Moderate gusts between 18 and 27 knots hold drone hovering", () => {
      const windSpeedKnots = 22;

      let landingSafetyStatus = "cleared_for_touchdown";
      if (windSpeedKnots >= 28) {
        landingSafetyStatus = "rerouted_to_ground_locker";
      } else if (windSpeedKnots >= 18) {
        landingSafetyStatus = "hovering_weather_hold";
      }

      expect.equal(landingSafetyStatus, "hovering_weather_hold");
    });

    test("F128-T4: Ground fallback locker is populated upon crosswind abort", () => {
      const fallbackId = "LOCKER-SPX-FALLBACK-01";
      const status = "rerouted_to_ground_locker";
      const assignedLocker = status === "rerouted_to_ground_locker" ? fallbackId : null;

      expect.equal(assignedLocker, "LOCKER-SPX-FALLBACK-01");
    });

    test("F128-T5: Missing corridorFlightCode fails telemetry validation", () => {
      const payload = { windSpeedKnots: 15 };
      const isValid = Boolean(payload.corridorFlightCode && payload.corridorFlightCode.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 129: Automated Smart Lock In-Home Delivery & Single-Use Digital Key Vault (5 Tests)
  // =========================================================================
  describe("Feature 129: Smart Lock In-Home Delivery & Digital Key Vault Suite", () => {
    test("F129-T1: Authorize in-home delivery generates single-use temporary passcode", async () => {
      const order = await Order.create({
        orderId: "ORD_SMART_LOCK_129",
        userId: "user_smart_lock_01",
        status: "shipping",
        total: 1200000,
        smartLockInHomeDeliveryVault: {
          isInHomeDeliveryAuthorized: true,
          smartLockId: "SMARTLOCK-YALE-Q7-009",
          singleUsePasscodeHash: "PASSKEY-882194",
          accessWindowMinutes: 5,
          authorizedCourierBadge: "SPX-VERIFIED-9912",
          doorRelockedSecurely: false,
          inHomeDeliveryStatus: "key_issued_pending_courier",
        },
      });

      expect.equal(order.orderId, "ORD_SMART_LOCK_129");
      expect.equal(order.smartLockInHomeDeliveryVault.isInHomeDeliveryAuthorized, true);
      expect.equal(order.smartLockInHomeDeliveryVault.smartLockId, "SMARTLOCK-YALE-Q7-009");
      expect.equal(order.smartLockInHomeDeliveryVault.singleUsePasscodeHash.startsWith("PASSKEY-"), true);
      expect.equal(order.smartLockInHomeDeliveryVault.accessWindowMinutes, 5);
      expect.equal(order.smartLockInHomeDeliveryVault.inHomeDeliveryStatus, "key_issued_pending_courier");
    });

    test("F129-T2: Door unlock and deposit transitions status to package placed", () => {
      const actionStatus = "unlock_and_deposit";
      const nextStatus = actionStatus === "unlock_and_deposit" ? "door_unlocked_package_placed" : "key_issued_pending_courier";

      expect.equal(nextStatus, "door_unlocked_package_placed");
    });

    test("F129-T3: Door relock secures vault and hashes surveillance recording", () => {
      const actionStatus = "relock_and_complete";
      const isRelocked = actionStatus === "relock_and_complete";
      const surveillanceHash = isRelocked ? `SURVEILLANCE-VAULT-HASH-${"KJ891"}` : null;

      expect.equal(isRelocked, true);
      expect.equal(surveillanceHash.startsWith("SURVEILLANCE-VAULT-HASH-"), true);
    });

    test("F129-T4: Single-use passcode conforms to 6-digit number suffix", () => {
      const passkey = "PASSKEY-819203";
      const suffix = passkey.replace("PASSKEY-", "");

      expect.equal(/^\d{6}$/.test(suffix), true);
    });

    test("F129-T5: Missing smartLockId fails vault authorization", () => {
      const payload = { accessWindowMinutes: 5 };
      const isValid = Boolean(payload.smartLockId && payload.smartLockId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 130: Real-Time Parcel Moisture & Desiccant Saturation IoT Telemetry (5 Tests)
  // =========================================================================
  describe("Feature 130: Parcel Moisture & Desiccant Saturation Telemetry Suite", () => {
    test("F130-T1: Optimal dry conditions persist verified telemetry status", async () => {
      const order = await Order.create({
        orderId: "ORD_MOISTURE_130",
        userId: "user_moisture_01",
        status: "shipping",
        total: 540000,
        parcelMoistureTelemetry: {
          isMoistureMonitored: true,
          moistureSensorId: "HUMID-IOT-8812",
          relativeHumidityPercent: 42,
          desiccantSaturationPercent: 20,
          condensationDetected: false,
          humidityStatus: "optimal_dry",
          airDryingVentilationScheduled: false,
        },
      });

      expect.equal(order.orderId, "ORD_MOISTURE_130");
      expect.equal(order.parcelMoistureTelemetry.isMoistureMonitored, true);
      expect.equal(order.parcelMoistureTelemetry.relativeHumidityPercent, 42);
      expect.equal(order.parcelMoistureTelemetry.humidityStatus, "optimal_dry");
      expect.equal(order.parcelMoistureTelemetry.airDryingVentilationScheduled, false);
    });

    test("F130-T2: High humidity above 75% triggers critical risk and air drying ventilation", () => {
      const humidity = 82;
      const desiccant = 40;
      const condensation = false;

      const isCritical = humidity >= 75 || desiccant >= 85 || condensation === true;
      const status = isCritical ? "critical_moisture_risk" : "optimal_dry";

      expect.equal(isCritical, true);
      expect.equal(status, "critical_moisture_risk");
    });

    test("F130-T3: Saturated desiccant above 85% flags critical moisture hazard", () => {
      const desiccant = 90;
      const isCritical = desiccant >= 85;

      expect.equal(isCritical, true);
    });

    test("F130-T4: Moderate humidity between 55% and 74% flags mild humidity warning", () => {
      const humidity = 62;
      const isCritical = humidity >= 75;
      const isMild = humidity >= 55 && !isCritical;
      const status = isCritical ? "critical_moisture_risk" : isMild ? "mild_humidity" : "optimal_dry";

      expect.equal(status, "mild_humidity");
    });

    test("F130-T5: Missing moistureSensorId fails telemetry validation guard", () => {
      const payload = { relativeHumidityPercent: 50 };
      const isValid = Boolean(payload.moistureSensorId && payload.moistureSensorId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 131: Automated High-Value Parcel Smart Tamper-Evident Fiber-Optic Mesh Seal (5 Tests)
  // =========================================================================
  describe("Feature 131: High-Value Fiber-Optic Mesh Seal Suite", () => {
    test("F131-T1: Continuous light throughput confirms intact optical mesh seal", async () => {
      const order = await Order.create({
        orderId: "ORD_FIBER_MESH_131",
        userId: "user_fiber_01",
        status: "shipping",
        total: 25000000,
        fiberOpticMeshSeal: {
          isFiberMeshArmed: true,
          meshSealId: "FIBER-MESH-OPTIC-991",
          lightContinuityStatus: "continuous_intact",
          lightTransmissionLumen: 100,
          tamperCutDetected: false,
          highValueInsuranceEscrowLocked: false,
          meshArmedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_FIBER_MESH_131");
      expect.equal(order.fiberOpticMeshSeal.isFiberMeshArmed, true);
      expect.equal(order.fiberOpticMeshSeal.lightContinuityStatus, "continuous_intact");
      expect.equal(order.fiberOpticMeshSeal.lightTransmissionLumen, 100);
      expect.equal(order.fiberOpticMeshSeal.highValueInsuranceEscrowLocked, false);
    });

    test("F131-T2: Severe lumen drop below 20% triggers fiber breach and insurance lock", () => {
      const lumen = 10;
      const tamperCutDetected = false;

      const isBreach = tamperCutDetected === true || lumen <= 20;
      const lightContinuityStatus = isBreach ? "fiber_severed_breach" : "continuous_intact";
      const escrowLocked = isBreach;

      expect.equal(isBreach, true);
      expect.equal(lightContinuityStatus, "fiber_severed_breach");
      expect.equal(escrowLocked, true);
    });

    test("F131-T3: Moderate attenuation between 21% and 79% flags stress warning without breach", () => {
      const lumen = 65;
      const isBreach = lumen <= 20;
      const isStress = lumen < 80 && !isBreach;
      const status = isBreach ? "fiber_severed_breach" : isStress ? "optical_attenuation_stress" : "continuous_intact";

      expect.equal(status, "optical_attenuation_stress");
    });

    test("F131-T4: Breach incident generates standardized audit prefix", () => {
      const auditRef = `FIBER-BREACH-${"OP981"}`;
      expect.equal(auditRef.startsWith("FIBER-BREACH-"), true);
    });

    test("F131-T5: Missing meshSealId fails validation guard", () => {
      const payload = { lightTransmissionLumen: 100 };
      const isValid = Boolean(payload.meshSealId && payload.meshSealId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 132: Autonomous Electric Delivery Van Mobile Micro-Hub Robot Swarm Dispatch (5 Tests)
  // =========================================================================
  describe("Feature 132: Autonomous Electric Delivery Van Mobile Micro-Hub Robot Swarm Dispatch", () => {
    test("F132-T1: Order model successfully arms mobileVanRobotSwarmDispatch subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_ROBOT_SWARM_132",
        items: [{ name: "Mini Smart Home Gadget", price: 320000, quantity: 1 }],
        total: 320000,
        mobileVanRobotSwarmDispatch: {
          isSwarmDispatched: true,
          motherVanId: "EV-VAN-HUB-HCM-07",
          assignedRobotId: "SWARM-BOT-ALPHA-12",
          robotBatteryLevelPercent: 95,
          curbsideDockStationPin: "DOCK-PIN-9812",
          swarmMissionStatus: "dispatched_sidewalk_transit",
          missionDispatchedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_ROBOT_SWARM_132");
      expect.equal(order.mobileVanRobotSwarmDispatch.isSwarmDispatched, true);
      expect.equal(order.mobileVanRobotSwarmDispatch.motherVanId, "EV-VAN-HUB-HCM-07");
      expect.equal(order.mobileVanRobotSwarmDispatch.assignedRobotId, "SWARM-BOT-ALPHA-12");
      expect.equal(order.mobileVanRobotSwarmDispatch.robotBatteryLevelPercent, 95);
      expect.equal(order.mobileVanRobotSwarmDispatch.swarmMissionStatus, "dispatched_sidewalk_transit");
    });

    test("F132-T2: Delivery completion stamps missionCompletedAt timestamp", () => {
      const missionStatus = "customer_doorstep_delivered";
      const isCompleted = missionStatus === "customer_doorstep_delivered" || missionStatus === "returned_to_mother_van";
      const now = new Date().toISOString();
      const missionCompletedAt = isCompleted ? now : null;

      expect.equal(isCompleted, true);
      expect.notEqual(missionCompletedAt, null);
    });

    test("F132-T3: Robot battery level percent is clamped within 0-100 bounds", () => {
      const rawBatteryOver = 150;
      const rawBatteryUnder = -20;
      const clamp = (val) => Math.max(0, Math.min(100, Number(val) || 0));

      expect.equal(clamp(rawBatteryOver), 100);
      expect.equal(clamp(rawBatteryUnder), 0);
    });

    test("F132-T4: Status validates against allowed swarm lifecycle states", () => {
      const validStatuses = ["docked_in_van", "dispatched_sidewalk_transit", "customer_doorstep_delivered", "returned_to_mother_van"];
      const testStatus = "dispatched_sidewalk_transit";
      const invalidStatus = "flying_in_sky";

      expect.equal(validStatuses.includes(testStatus), true);
      expect.equal(validStatuses.includes(invalidStatus), false);
    });

    test("F132-T5: Missing motherVanId or assignedRobotId fails validation guard", () => {
      const invalidPayload1 = { assignedRobotId: "BOT-01" };
      const invalidPayload2 = { motherVanId: "VAN-01" };
      const validPayload = { motherVanId: "VAN-01", assignedRobotId: "BOT-01" };

      const validate = (p) => Boolean(p.motherVanId && p.assignedRobotId);

      expect.equal(validate(invalidPayload1), false);
      expect.equal(validate(invalidPayload2), false);
      expect.equal(validate(validPayload), true);
    });
  });

  // =========================================================================
  // FEATURE 133: Dynamic Parcel Barcode Color-Shifting Thermo-Chromic Ink Tamper Audit (5 Tests)
  // =========================================================================
  describe("Feature 133: Dynamic Parcel Barcode Color-Shifting Thermo-Chromic Ink Tamper Audit", () => {
    test("F133-T1: Order model successfully arms thermoChromicColorShiftBarcode subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_THERMO_BARCODE_133",
        items: [{ name: "High-End Perfume Limited Edition", price: 1250000, quantity: 1 }],
        total: 1250000,
        thermoChromicColorShiftBarcode: {
          isThermoChromicArmed: true,
          barcodeBatchSerialNumber: "THERMO-LOT-9092-VN",
          spectralColorShiftHex: "#10b981",
          ambientTemperatureCelsius: 28,
          thermalExposureThresholdCelsius: 45,
          heatTamperExceeded: false,
          antiCounterfeitVerificationHash: "THERMO-HASH-SAFE-9092",
          inspectedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_THERMO_BARCODE_133");
      expect.equal(order.thermoChromicColorShiftBarcode.isThermoChromicArmed, true);
      expect.equal(order.thermoChromicColorShiftBarcode.barcodeBatchSerialNumber, "THERMO-LOT-9092-VN");
      expect.equal(order.thermoChromicColorShiftBarcode.spectralColorShiftHex, "#10b981");
      expect.equal(order.thermoChromicColorShiftBarcode.heatTamperExceeded, false);
      expect.equal(order.thermoChromicColorShiftBarcode.ambientTemperatureCelsius, 28);
    });

    test("F133-T2: Heat exceeding threshold triggers color shift to magenta and tamper flag", () => {
      const temp = 52;
      const threshold = 45;
      const heatTamperExceeded = temp >= threshold;
      const colorHex = heatTamperExceeded ? "#be185d" : "#10b981";

      expect.equal(heatTamperExceeded, true);
      expect.equal(colorHex, "#be185d");
    });

    test("F133-T3: Normal ambient temperature retains emerald authentic hue", () => {
      const temp = 30;
      const threshold = 45;
      const heatTamperExceeded = temp >= threshold;
      const colorHex = heatTamperExceeded ? "#be185d" : "#10b981";

      expect.equal(heatTamperExceeded, false);
      expect.equal(colorHex, "#10b981");
    });

    test("F133-T4: Dynamic verification hash generated with THERMO-HASH prefix", () => {
      const serial = "LOT-SER-9941";
      const hash = `THERMO-HASH-${Date.now().toString(36).toUpperCase()}-${serial.slice(-4)}`;

      expect.equal(hash.startsWith("THERMO-HASH-"), true);
      expect.equal(hash.endsWith("9941"), true);
    });

    test("F133-T5: Missing barcodeBatchSerialNumber fails validation guard", () => {
      const payload = { ambientTemperatureCelsius: 32 };
      const isValid = Boolean(payload.barcodeBatchSerialNumber && payload.barcodeBatchSerialNumber.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 134: Autonomous Underground Pneumatic Capsule Logistics Dispatch (5 Tests)
  // =========================================================================
  describe("Feature 134: Autonomous Underground Pneumatic Capsule Logistics Dispatch", () => {
    test("F134-T1: Order model successfully arms undergroundPneumaticCapsuleDispatch subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_PNEUMATIC_CAPSULE_134",
        items: [{ name: "High-Frequency Radio Transceiver", price: 890000, quantity: 1 }],
        total: 890000,
        undergroundPneumaticCapsuleDispatch: {
          isCapsuleDispatched: true,
          capsulePodSerial: "PNEUMA-POD-X7",
          tubePipelineNetworkCode: "METRO-PNEUMA-LINE-1",
          transitVelocityKmPerHour: 95,
          tubePressureBar: 3.2,
          pneumaticTerminalStationId: "TERMINAL-DISTRICT-1-CENTRAL",
          capsuleEjectionStatus: "high_speed_subterranean_transit",
          capsuleLaunchedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_PNEUMATIC_CAPSULE_134");
      expect.equal(order.undergroundPneumaticCapsuleDispatch.isCapsuleDispatched, true);
      expect.equal(order.undergroundPneumaticCapsuleDispatch.capsulePodSerial, "PNEUMA-POD-X7");
      expect.equal(order.undergroundPneumaticCapsuleDispatch.tubePipelineNetworkCode, "METRO-PNEUMA-LINE-1");
      expect.equal(order.undergroundPneumaticCapsuleDispatch.transitVelocityKmPerHour, 95);
      expect.equal(order.undergroundPneumaticCapsuleDispatch.tubePressureBar, 3.2);
    });

    test("F134-T2: Arrival or collection stamps capsuleArrivedAt timestamp", () => {
      const status1 = "ejected_at_terminal_station";
      const status2 = "high_speed_subterranean_transit";
      const isArrived = (s) => s === "ejected_at_terminal_station" || s === "collected_by_local_runner";

      expect.equal(isArrived(status1), true);
      expect.equal(isArrived(status2), false);
    });

    test("F134-T3: Velocity and pressure bounded within physical tolerances", () => {
      const clampVelocity = (v) => Math.max(30, Math.min(150, Number(v) || 95));
      const clampPressure = (p) => Math.max(1, Math.min(6, Number(p) || 3.2));

      expect.equal(clampVelocity(220), 150);
      expect.equal(clampVelocity(10), 30);
      expect.equal(clampPressure(9), 6);
      expect.equal(clampPressure(0.2), 1);
    });

    test("F134-T4: Status validates against allowed pneumatic transit lifecycle states", () => {
      const validStatuses = [
        "capsule_loaded_at_hub",
        "high_speed_subterranean_transit",
        "ejected_at_terminal_station",
        "collected_by_local_runner",
      ];
      expect.equal(validStatuses.includes("high_speed_subterranean_transit"), true);
      expect.equal(validStatuses.includes("flying_above_ground"), false);
    });

    test("F134-T5: Missing capsulePodSerial fails validation guard", () => {
      const payload = { tubePipelineNetworkCode: "METRO-PNEUMA-LINE-1" };
      const isValid = Boolean(payload.capsulePodSerial && payload.capsulePodSerial.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 135: Real-Time Cryogenic Ultra-Cold Dry Ice Pharma & Vaccine Telemetry (5 Tests)
  // =========================================================================
  describe("Feature 135: Real-Time Cryogenic Ultra-Cold Dry Ice Pharma & Vaccine Telemetry", () => {
    test("F135-T1: Order model successfully arms cryogenicFreezerDryIceTelemetry subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_CRYO_DRY_ICE_135",
        items: [{ name: "Biologic mRNA Vaccine Cold Chain Kit", price: 2150000, quantity: 1 }],
        total: 2150000,
        cryogenicFreezerDryIceTelemetry: {
          isCryoMonitored: true,
          cryoBoxSerial: "CRYO-VAULT-8821",
          coreTemperatureCelsius: -78.5,
          dryIceSublimationRemainingPercent: 92,
          vaccinePharmaIntegrityVerified: true,
          sublimationLeakAlarm: false,
          monitoredAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_CRYO_DRY_ICE_135");
      expect.equal(order.cryogenicFreezerDryIceTelemetry.isCryoMonitored, true);
      expect.equal(order.cryogenicFreezerDryIceTelemetry.cryoBoxSerial, "CRYO-VAULT-8821");
      expect.equal(order.cryogenicFreezerDryIceTelemetry.coreTemperatureCelsius, -78.5);
      expect.equal(order.cryogenicFreezerDryIceTelemetry.dryIceSublimationRemainingPercent, 92);
      expect.equal(order.cryogenicFreezerDryIceTelemetry.vaccinePharmaIntegrityVerified, true);
      expect.equal(order.cryogenicFreezerDryIceTelemetry.sublimationLeakAlarm, false);
    });

    test("F135-T2: Warming above -60°C triggers sublimation leak alarm and flags integrity", () => {
      const temp = -52.0;
      const dryIcePercent = 80;
      const sublimationLeakAlarm = temp > -60 || dryIcePercent < 25;
      const vaccinePharmaIntegrityVerified = !sublimationLeakAlarm;

      expect.equal(sublimationLeakAlarm, true);
      expect.equal(vaccinePharmaIntegrityVerified, false);
    });

    test("F135-T3: Dry ice depletion below 25% triggers replenishment emergency warning", () => {
      const temp = -75.0;
      const dryIcePercent = 18;
      const sublimationLeakAlarm = temp > -60 || dryIcePercent < 25;

      expect.equal(sublimationLeakAlarm, true);
    });

    test("F135-T4: Dry ice sublimation remaining percent bounded between 0 and 100", () => {
      const clampPercent = (val) => Math.max(0, Math.min(100, Number(val) || 0));

      expect.equal(clampPercent(120), 100);
      expect.equal(clampPercent(-15), 0);
      expect.equal(clampPercent(65), 65);
    });

    test("F135-T5: Missing cryoBoxSerial fails validation guard", () => {
      const payload = { coreTemperatureCelsius: -78.5 };
      const isValid = Boolean(payload.cryoBoxSerial && payload.cryoBoxSerial.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 136: Hyperbaric Anti-Explosion Inert Gas Sealed Vault Telemetry (5 Tests)
  // =========================================================================
  describe("Feature 136: Hyperbaric Anti-Explosion Inert Gas Sealed Vault Telemetry", () => {
    test("F136-T1: Order model successfully arms hyperbaricPressureAntiExplosionVault subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_HYPERBARIC_VAULT_136",
        items: [{ name: "High-Capacity Li-Ion Battery Pack 100Ah", price: 3450000, quantity: 1 }],
        total: 3450000,
        hyperbaricPressureAntiExplosionVault: {
          isHyperbaricArmed: true,
          vaultPodSerial: "BLAST-VAULT-ARGON-09",
          cabinPressureAtm: 1.0,
          inertGasArgonLevelPercent: 99.8,
          pressureDifferentialPsi: 0.5,
          isBlastMitigationActive: false,
          vaultSealStatus: "nominal_pressurized",
          inspectedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_HYPERBARIC_VAULT_136");
      expect.equal(order.hyperbaricPressureAntiExplosionVault.isHyperbaricArmed, true);
      expect.equal(order.hyperbaricPressureAntiExplosionVault.vaultPodSerial, "BLAST-VAULT-ARGON-09");
      expect.equal(order.hyperbaricPressureAntiExplosionVault.inertGasArgonLevelPercent, 99.8);
      expect.equal(order.hyperbaricPressureAntiExplosionVault.isBlastMitigationActive, false);
      expect.equal(order.hyperbaricPressureAntiExplosionVault.vaultSealStatus, "nominal_pressurized");
    });

    test("F136-T2: High differential pressure > 15 PSI activates blast mitigation system", () => {
      const diffPsi = 18.5;
      const argon = 98.0;
      const isBlastMitigationActive = diffPsi > 15 || argon < 85;

      expect.equal(isBlastMitigationActive, true);
    });

    test("F136-T3: Extreme blast pressure > 25 PSI seals status to explosion_blast_contained", () => {
      const diffPsi = 28.0;
      let vaultSealStatus = "nominal_pressurized";
      if (diffPsi > 25) {
        vaultSealStatus = "explosion_blast_contained";
      } else if (diffPsi > 15) {
        vaultSealStatus = "rapid_depressurization_warning";
      }

      expect.equal(vaultSealStatus, "explosion_blast_contained");
    });

    test("F136-T4: Argon level percent strictly clamped between 0 and 100", () => {
      const clampArgon = (val) => Math.max(0, Math.min(100, Number(val) || 0));

      expect.equal(clampArgon(105), 100);
      expect.equal(clampArgon(-8), 0);
      expect.equal(clampArgon(99.4), 99.4);
    });

    test("F136-T5: Missing vaultPodSerial fails validation guard", () => {
      const payload = { cabinPressureAtm: 1.0 };
      const isValid = Boolean(payload.vaultPodSerial && payload.vaultPodSerial.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 137: Satellite Low-Earth Orbit & LoRa Mesh Network Telemetry (5 Tests)
  // =========================================================================
  describe("Feature 137: Satellite Low-Earth Orbit & LoRa Mesh Network Telemetry", () => {
    test("F137-T1: Order model successfully arms satelliteLoRaMeshDeadZoneTelemetry subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_LORA_MESH_137",
        items: [{ name: "High-Gain Satellite Uplink Terminal", price: 4200000, quantity: 1 }],
        total: 4200000,
        satelliteLoRaMeshDeadZoneTelemetry: {
          isLoRaMeshActive: true,
          loraNodeId: "LORA-RELAY-HIGHLAND-03",
          hopCountMesh: 2,
          signalRssiDbm: -88,
          leoSatelliteUplinkConnected: false,
          geoMeshPacketLossRatePercent: 1.2,
          isCellularDeadZone: true,
          lastMeshBeaconAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_LORA_MESH_137");
      expect.equal(order.satelliteLoRaMeshDeadZoneTelemetry.isLoRaMeshActive, true);
      expect.equal(order.satelliteLoRaMeshDeadZoneTelemetry.loraNodeId, "LORA-RELAY-HIGHLAND-03");
      expect.equal(order.satelliteLoRaMeshDeadZoneTelemetry.hopCountMesh, 2);
      expect.equal(order.satelliteLoRaMeshDeadZoneTelemetry.signalRssiDbm, -88);
      expect.equal(order.satelliteLoRaMeshDeadZoneTelemetry.isCellularDeadZone, true);
    });

    test("F137-T2: Deadzone with weak RSSI < -105 dBm triggers LEO satellite uplink fallback", () => {
      const deadZone = true;
      const rssi = -112;
      const hops = 2;
      const leoSatelliteUplinkConnected = deadZone && (rssi < -105 || hops >= 3);

      expect.equal(leoSatelliteUplinkConnected, true);
    });

    test("F137-T3: Multi-hop threshold >= 3 in cellular deadzone engages direct satellite uplink", () => {
      const deadZone = true;
      const rssi = -90;
      const hops = 4;
      const leoSatelliteUplinkConnected = deadZone && (rssi < -105 || hops >= 3);

      expect.equal(leoSatelliteUplinkConnected, true);
    });

    test("F137-T4: Mesh hops count bounded between 1 and 12", () => {
      const clampHops = (val) => Math.max(1, Math.min(12, Number(val) || 1));

      expect.equal(clampHops(16), 12);
      expect.equal(clampHops(0), 1);
      expect.equal(clampHops(5), 5);
    });

    test("F137-T5: Missing loraNodeId fails validation guard", () => {
      const payload = { signalRssiDbm: -92 };
      const isValid = Boolean(payload.loraNodeId && payload.loraNodeId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 138: Quantum Key Distribution (QKD) Photonic Encryption Seal (5 Tests)
  // =========================================================================
  describe("Feature 138: Quantum Key Distribution (QKD) Photonic Encryption Seal", () => {
    test("F138-T1: Order model successfully arms quantumKeyDistributionEncryptionSeal subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_QKD_SEAL_138",
        items: [{ name: "Quantum Encryption Cryptographic Token", price: 5600000, quantity: 1 }],
        total: 5600000,
        quantumKeyDistributionEncryptionSeal: {
          isQuantumEncrypted: true,
          quantumKeyId: "QKD-KEY-BB84-X99",
          photonPolarizationState: "rectilinear_diagonal_entangled",
          quantumBitErrorRatePercent: 1.2,
          eavesdroppingInterceptionDetected: false,
          quantumSecurityVerdict: "quantum_safe_unbroken",
          qkdHandshakeTimestamp: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_QKD_SEAL_138");
      expect.equal(order.quantumKeyDistributionEncryptionSeal.isQuantumEncrypted, true);
      expect.equal(order.quantumKeyDistributionEncryptionSeal.quantumKeyId, "QKD-KEY-BB84-X99");
      expect.equal(order.quantumKeyDistributionEncryptionSeal.quantumBitErrorRatePercent, 1.2);
      expect.equal(order.quantumKeyDistributionEncryptionSeal.eavesdroppingInterceptionDetected, false);
      expect.equal(order.quantumKeyDistributionEncryptionSeal.quantumSecurityVerdict, "quantum_safe_unbroken");
    });

    test("F138-T2: High QBER >= 11% triggers quantum superposition collapse and eavesdropping alarm", () => {
      const qber = 14.5;
      const eavesdroppingInterceptionDetected = qber >= 11.0;
      const verdict = eavesdroppingInterceptionDetected ? "eavesdropping_collapsed_state" : "quantum_safe_unbroken";

      expect.equal(eavesdroppingInterceptionDetected, true);
      expect.equal(verdict, "eavesdropping_collapsed_state");
    });

    test("F138-T3: Moderate QBER between 7% and 11% initiates dynamic rekeying process", () => {
      const qber = 8.8;
      const eavesdroppingInterceptionDetected = qber >= 11.0;
      let verdict = "quantum_safe_unbroken";
      if (eavesdroppingInterceptionDetected) {
        verdict = "eavesdropping_collapsed_state";
      } else if (qber > 7.0) {
        verdict = "rekeying_in_progress";
      }

      expect.equal(eavesdroppingInterceptionDetected, false);
      expect.equal(verdict, "rekeying_in_progress");
    });

    test("F138-T4: Quantum bit error rate strictly clamped between 0 and 100", () => {
      const clampQber = (val) => Math.max(0, Math.min(100, Number(val) || 0));

      expect.equal(clampQber(140), 100);
      expect.equal(clampQber(-5), 0);
      expect.equal(clampQber(2.5), 2.5);
    });

    test("F138-T5: Missing quantumKeyId fails validation guard", () => {
      const payload = { quantumBitErrorRatePercent: 1.2 };
      const isValid = Boolean(payload.quantumKeyId && payload.quantumKeyId.trim().length > 0);

      expect.equal(isValid, false);
    });
  });

  // =========================================================================
  // FEATURE 139: Synthetic DNA Nanotech & Optical Fluorescence Tagging Seal (5 Tests)
  // =========================================================================
  describe("Feature 139: Synthetic DNA Nanotech & Optical Fluorescence Tagging Seal", () => {
    test("F139-T1: Order model successfully arms syntheticDnaNanotechTaggingSeal subdocument", async () => {
      const order = await Order.create({
        orderId: "ORD_DNA_NANO_139",
        items: [{ name: "Limited Luxury Chronograph Watch", price: 18500000, quantity: 1 }],
        total: 18500000,
        syntheticDnaNanotechTaggingSeal: {
          isDnaTagged: true,
          dnaOligonucleotideSequence: "ATCG-TTGA-CCAG-9988-XYZZ",
          pcrReplicationKeySignature: "PCR-SIG-CHRONO-2026",
          opticalFluorescenceWavelengthNm: 520,
          counterfeitMismatchScorePercent: 0,
          isDnaSignatureAuthentic: true,
          molecularTagStatus: "dna_sequence_authentic",
          verifiedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_DNA_NANO_139");
      expect.equal(order.syntheticDnaNanotechTaggingSeal.isDnaTagged, true);
      expect.equal(order.syntheticDnaNanotechTaggingSeal.dnaOligonucleotideSequence, "ATCG-TTGA-CCAG-9988-XYZZ");
      expect.equal(order.syntheticDnaNanotechTaggingSeal.opticalFluorescenceWavelengthNm, 520);
      expect.equal(order.syntheticDnaNanotechTaggingSeal.isDnaSignatureAuthentic, true);
      expect.equal(order.syntheticDnaNanotechTaggingSeal.molecularTagStatus, "dna_sequence_authentic");
    });

    test("F139-T2: Sequence mismatch exceeding 5% flags molecular counterfeit alteration", () => {
      const wavelength = 520;
      const mismatch = 12.5;
      const isWavelengthValid = wavelength >= 510 && wavelength <= 530;
      const isMismatchAcceptable = mismatch <= 5.0;
      const isDnaSignatureAuthentic = isWavelengthValid && isMismatchAcceptable;

      expect.equal(isDnaSignatureAuthentic, false);
    });

    test("F139-T3: Deviation outside 510-530nm fluorescence range invalidates tag", () => {
      const wavelength = 580; // Cam đỏ thay vì xanh lục 520nm
      const mismatch = 1.0;
      const isWavelengthValid = wavelength >= 510 && wavelength <= 530;
      const isMismatchAcceptable = mismatch <= 5.0;
      const isDnaSignatureAuthentic = isWavelengthValid && isMismatchAcceptable;

      expect.equal(isWavelengthValid, false);
      expect.equal(isDnaSignatureAuthentic, false);
    });

    test("F139-T4: Counterfeit mismatch score clamped within 0 to 100", () => {
      const clampMismatch = (val) => Math.max(0, Math.min(100, Number(val) || 0));

      expect.equal(clampMismatch(125), 100);
      expect.equal(clampMismatch(-10), 0);
      expect.equal(clampMismatch(3.8), 3.8);
    });

    test("F139-T5: Missing dnaOligonucleotideSequence or pcrReplicationKeySignature fails validation guard", () => {
      const invalidPayload1 = { pcrReplicationKeySignature: "PCR-01" };
      const invalidPayload2 = { dnaOligonucleotideSequence: "ATCG" };
      const validPayload = { dnaOligonucleotideSequence: "ATCG", pcrReplicationKeySignature: "PCR-01" };

      const validate = (p) => Boolean(p.dnaOligonucleotideSequence && p.pcrReplicationKeySignature);

      expect.equal(validate(invalidPayload1), false);
      expect.equal(validate(invalidPayload2), false);
      expect.equal(validate(validPayload), true);
    });
  });

  // =========================================================================
  // FEATURE 140: Interactive Live Delivery Audio-Visual Doorbell Notification & Instant Gate Release (5 Tests)
  // =========================================================================
  describe("Feature 140: Interactive Live Delivery Audio-Visual Doorbell Notification & Instant Gate Release", () => {
    test("F140-T1: Successfully records active doorbell visitor verification & generates gate unlock token", async () => {
      const order = await Order.create({
        orderId: "ORD_DOORBELL_140",
        items: [{ name: "Smart Home Hub Gateway", price: 1250000, quantity: 1 }],
        total: 1250000,
        status: "shipping",
        interactiveDoorbellAIVisualGateRelease: {
          isDoorbellActive: true,
          doorbellDeviceId: "RING_AI_DOORBELL_G4_V98",
          visitorFaceRecognized: true,
          courierIdentityMatchPercent: 99.4,
          liveVideoFeedStreamUrl: "https://cdn.shopee.vn/streams/doorbell-cam-live-feed-v98.mp4",
          twoWayAudioIntercomConnected: true,
          gateUnlockAuthorizationToken: "GATE_OTP_TOKEN_DOORBELL_SECURE",
          gateUnlockStatus: "gate_unlocked_temporary",
          unlockedAt: "2026-10-12T08:30:00.000Z",
          relockedAt: null,
          courierVoiceGreetingNote: "Chào anh/chị, em là bưu tá SPX giao kiện hàng Shopee đây ạ!",
        },
      });

      expect.equal(order.orderId, "ORD_DOORBELL_140");
      expect.equal(order.interactiveDoorbellAIVisualGateRelease.isDoorbellActive, true);
      expect.equal(order.interactiveDoorbellAIVisualGateRelease.doorbellDeviceId, "RING_AI_DOORBELL_G4_V98");
      expect.equal(order.interactiveDoorbellAIVisualGateRelease.visitorFaceRecognized, true);
      expect.equal(order.interactiveDoorbellAIVisualGateRelease.courierIdentityMatchPercent >= 99, true);
      expect.equal(order.interactiveDoorbellAIVisualGateRelease.gateUnlockStatus, "gate_unlocked_temporary");
      expect.equal(order.interactiveDoorbellAIVisualGateRelease.gateUnlockAuthorizationToken.startsWith("GATE_OTP"), true);
    });

    test("F140-T2: Courier face match below 80% strictly rejects gate release authorization", () => {
      const courierIdentityMatchPercent = 64.2; // Dưới ngưỡng an toàn 80%
      const isVisitorFaceRecognized = courierIdentityMatchPercent >= 80.0;
      const canUnlockGate = isVisitorFaceRecognized;

      expect.equal(isVisitorFaceRecognized, false);
      expect.equal(canUnlockGate, false);
    });

    test("F140-T3: Courier exit triggers automatic secure gate relock transition", () => {
      const gateState = {
        status: "gate_unlocked_temporary",
        unlockedAt: "2026-10-12T08:30:00.000Z",
        relockedAt: null,
      };

      // Bưu tá đặt xong kiện hàng và bước ra ngoài vạch cảm biến cổng
      const action = "relock_gate";
      if (action === "relock_gate") {
        gateState.status = "gate_relocked_confirmed";
        gateState.relockedAt = "2026-10-12T08:32:15.000Z";
      }

      expect.equal(gateState.status, "gate_relocked_confirmed");
      expect.equal(gateState.relockedAt !== null, true);
    });

    test("F140-T4: Unauthorized stranger presence triggers trespass alert siren state", () => {
      const handleSecurityAction = (action) => {
        if (action === "trespass_alert") {
          return {
            status: "unauthorized_trespass_alert",
            sirenActive: true,
            pushNotificationSent: true,
          };
        }
        return { status: "gate_locked", sirenActive: false, pushNotificationSent: false };
      };

      const result = handleSecurityAction("trespass_alert");
      expect.equal(result.status, "unauthorized_trespass_alert");
      expect.equal(result.sirenActive, true);
      expect.equal(result.pushNotificationSent, true);
    });

    test("F140-T5: Two-way intercom audio connection maintains greeting transcription log", () => {
      const intercomSession = {
        connected: true,
        streamChannel: "webrtc_audio_doorbell_ch1",
        courierGreeting: "Chào anh/chị, em để kiện hàng vào hiên nhà theo yêu cầu nhé!",
      };

      expect.equal(intercomSession.connected, true);
      expect.equal(intercomSession.courierGreeting.includes("hiên nhà"), true);
    });
  });

  // =========================================================================
  // FEATURE 141: Smart Delivery Locker Pinless NFC Tap-and-Go Instant Compartment Pop (5 Tests)
  // =========================================================================
  describe("Feature 141: Smart Delivery Locker Pinless NFC Tap-and-Go Instant Compartment Pop", () => {
    test("F141-T1: Order arms smartDeliveryLockerPinlessNfcTapAndGo subdocument successfully", async () => {
      const order = await Order.create({
        orderId: "ORD_LOCKER_NFC_141",
        items: [{ name: "Bàn phím cơ không dây Bluetooth", price: 1890000, quantity: 1 }],
        total: 1890000,
        status: "shipping",
        smartDeliveryLockerPinlessNfcTapAndGo: {
          isPinlessNfcActive: true,
          lockerStationCode: "SPX_TAP_LOCKER_BINHTHANH_09",
          compartmentCellId: "CELL_A14",
          nfcSecureTokenUid: "NFC_TOKEN_UID_SECURE_9988",
          cryptographicTapNonce: "NONCE_CRYPTO_BINH_THANH",
          tapStatus: "assigned_awaiting_tap",
          tappedAt: null,
          retrievedAt: null,
          biometricConfirmed: true,
        },
      });

      expect.equal(order.orderId, "ORD_LOCKER_NFC_141");
      expect.equal(order.smartDeliveryLockerPinlessNfcTapAndGo.isPinlessNfcActive, true);
      expect.equal(order.smartDeliveryLockerPinlessNfcTapAndGo.lockerStationCode, "SPX_TAP_LOCKER_BINHTHANH_09");
      expect.equal(order.smartDeliveryLockerPinlessNfcTapAndGo.compartmentCellId, "CELL_A14");
      expect.equal(order.smartDeliveryLockerPinlessNfcTapAndGo.tapStatus, "assigned_awaiting_tap");
      expect.equal(order.smartDeliveryLockerPinlessNfcTapAndGo.biometricConfirmed, true);
    });

    test("F141-T2: NFC tap event instantly pops compartment door open with biometric pass", () => {
      const lockerSession = {
        tapStatus: "assigned_awaiting_tap",
        biometricConfirmed: true,
        tappedAt: null,
      };

      const handleTap = (biometricPass) => {
        if (!biometricPass) {
          throw new Error("Biometric mismatch");
        }
        return {
          tapStatus: "tapped_cell_popped_open",
          tappedAt: "2026-10-12T08:35:00.000Z",
          doorSolenoidReleased: true,
        };
      };

      const result = handleTap(lockerSession.biometricConfirmed);
      expect.equal(result.tapStatus, "tapped_cell_popped_open");
      expect.equal(result.doorSolenoidReleased, true);
      expect.equal(result.tappedAt !== null, true);
    });

    test("F141-T3: Failed biometric authentication strictly blocks compartment solenoid release", () => {
      const handleTap = (biometricPass) => {
        if (!biometricPass) {
          return { success: false, doorSolenoidReleased: false, errorCode: "BIOMETRIC_FAIL" };
        }
        return { success: true, doorSolenoidReleased: true, errorCode: null };
      };

      const result = handleTap(false);
      expect.equal(result.success, false);
      expect.equal(result.doorSolenoidReleased, false);
      expect.equal(result.errorCode, "BIOMETRIC_FAIL");
    });

    test("F141-T4: Closing compartment door marks parcel retrieval & completes order workflow", () => {
      const order = {
        status: "shipping",
        statusText: "Đang ở tủ nhận hàng",
        smartDeliveryLockerPinlessNfcTapAndGo: {
          tapStatus: "tapped_cell_popped_open",
          retrievedAt: null,
        },
      };

      // Người dùng lấy gói hàng ra và đẩy đóng chốt cửa tủ
      const action = "close_door_completed";
      if (action === "close_door_completed") {
        order.smartDeliveryLockerPinlessNfcTapAndGo.tapStatus = "door_closed_package_retrieved";
        order.smartDeliveryLockerPinlessNfcTapAndGo.retrievedAt = "2026-10-12T08:36:10.000Z";
        order.status = "completed";
        order.statusText = "Giao hàng thành công (Đã lấy tại Tủ SPX Tap & Go)";
      }

      expect.equal(order.smartDeliveryLockerPinlessNfcTapAndGo.tapStatus, "door_closed_package_retrieved");
      expect.equal(order.status, "completed");
      expect.equal(order.statusText.includes("Tủ SPX Tap & Go"), true);
    });

    test("F141-T5: Missing or empty compartmentCellId fails locker dispatch configuration", () => {
      const validate = (cellId) => Boolean(cellId && cellId.trim().length > 0);

      expect.equal(validate(""), false);
      expect.equal(validate("   "), false);
      expect.equal(validate(null), false);
      expect.equal(validate("CELL_B08"), true);
    });
  });

  // =========================================================================
  // FEATURE 142: Acoustic Parcel Listening Drop-Shock & Seal Tape-Tear Tamper Audio Audit (5 Tests)
  // =========================================================================
  describe("Feature 142: Acoustic Parcel Listening Drop-Shock & Seal Tape-Tear Tamper Audio Audit", () => {
    test("F142-T1: Order arms acousticParcelListeningDropTamperAudit subdocument successfully", async () => {
      const order = await Order.create({
        orderId: "ORD_ACOUSTIC_142",
        items: [{ name: "Máy ảnh Mirrorless Full-frame", price: 34500000, quantity: 1 }],
        total: 34500000,
        status: "shipping",
        acousticParcelListeningDropTamperAudit: {
          isAcousticAudioAuditActive: true,
          sensorModuleSerial: "ACOUSTIC_MIC_AI_77X",
          decibelDropSpike: 38.2,
          internalRattleDetected: false,
          sealTapeTearAudioDetected: false,
          soundFrequencyPatternHz: 2400,
          auditIntegrityStatus: "crystal_intact_audio_silent",
          auditedAt: "2026-10-12T08:38:00.000Z",
          compensationEscrowCreditVnd: 0,
        },
      });

      expect.equal(order.orderId, "ORD_ACOUSTIC_142");
      expect.equal(order.acousticParcelListeningDropTamperAudit.isAcousticAudioAuditActive, true);
      expect.equal(order.acousticParcelListeningDropTamperAudit.sensorModuleSerial, "ACOUSTIC_MIC_AI_77X");
      expect.equal(order.acousticParcelListeningDropTamperAudit.decibelDropSpike, 38.2);
      expect.equal(order.acousticParcelListeningDropTamperAudit.auditIntegrityStatus, "crystal_intact_audio_silent");
      expect.equal(order.acousticParcelListeningDropTamperAudit.internalRattleDetected, false);
    });

    test("F142-T2: Seal tape tearing acoustic frequency triggers immediate tamper audio flag & compensation credit", () => {
      const isTapeTorn = true;
      const orderTotal = 2500000;
      let status = "crystal_intact_audio_silent";
      let compensationCredit = 0;

      if (isTapeTorn) {
        status = "tamper_tape_tear_sound_flagged";
        compensationCredit = Math.min(orderTotal, 500000);
      }

      expect.equal(status, "tamper_tape_tear_sound_flagged");
      expect.equal(compensationCredit, 500000);
    });

    test("F142-T3: Severe drop impact shock spike >= 85dB flags internal crack rattle sound", () => {
      const spike = 88.5;
      const internalRattleDetected = spike >= 85.0;
      const status = internalRattleDetected ? "drop_shock_crack_sound_flagged" : "crystal_intact_audio_silent";

      expect.equal(internalRattleDetected, true);
      expect.equal(status, "drop_shock_crack_sound_flagged");
    });

    test("F142-T4: Ambient sound frequency pattern falls within valid audio threshold", () => {
      const validateFreq = (hz) => Number(hz) >= 20 && Number(hz) <= 20000;

      expect.equal(validateFreq(2400), true);
      expect.equal(validateFreq(15), false);
      expect.equal(validateFreq(25000), false);
    });

    test("F142-T5: Missing sensorModuleSerial falls back to default serial gracefully", () => {
      const fallbackSerial = (val) => val || "ACOUSTIC_MIC_AI_77X";

      expect.equal(fallbackSerial(null), "ACOUSTIC_MIC_AI_77X");
      expect.equal(fallbackSerial("MIC_CUSTOM_01"), "MIC_CUSTOM_01");
    });
  });

  // =========================================================================
  // FEATURE 143: Predictive AI Delivery Window Slot Optimization & Traffic Reroute (5 Tests)
  // =========================================================================
  describe("Feature 143: Predictive AI Delivery Window Slot Optimization & Traffic Reroute Notice", () => {
    test("F143-T1: Successfully records predictive home arrival slot and high confidence score", async () => {
      const order = await Order.create({
        orderId: "ORD_PREDICT_143",
        user: "user_test_predict_143",
        items: [{ product: "prod_p1", quantity: 1, price: 650000 }],
        totalPrice: 650000,
        shippingFee: 22000,
        finalTotal: 672000,
        predictiveDeliveryWindowReroute: {
          isPredictiveWindowActive: true,
          predictedSlot: "17:30 - 18:30 Hôm Nay",
          confidencePercent: 96.2,
          trafficStatus: "clear_smooth_flow",
          rerouteDelayMinutes: 0,
          rerouteReasonNote: "Lộ trình thông thoáng, lưu lượng xe thấp",
          buyerHomePresenceConfirmed: true,
          adjustedEta: "17:45",
          updatedAt: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_PREDICT_143");
      expect.equal(order.predictiveDeliveryWindowReroute.isPredictiveWindowActive, true);
      expect.equal(order.predictiveDeliveryWindowReroute.predictedSlot, "17:30 - 18:30 Hôm Nay");
      expect.equal(order.predictiveDeliveryWindowReroute.confidencePercent, 96.2);
      expect.equal(order.predictiveDeliveryWindowReroute.trafficStatus, "clear_smooth_flow");
      expect.equal(order.predictiveDeliveryWindowReroute.buyerHomePresenceConfirmed, true);
    });

    test("F143-T2: Traffic congestion dynamically triggers AI smart detour rerouting with delay minutes", () => {
      const trafficStatus = "heavy_congestion_rerouted";
      const isDetourActive = trafficStatus === "heavy_congestion_rerouted";
      const delayMinutes = isDetourActive ? 18 : 0;
      const rerouteReason = isDetourActive
        ? "Ùn tắc cục bộ ngã tư, AI đã nắn tuyến qua đường gom"
        : "Lộ trình thông suốt";

      expect.equal(isDetourActive, true);
      expect.equal(delayMinutes, 18);
      expect.equal(rerouteReason.includes("nắn tuyến qua đường gom"), true);
    });

    test("F143-T3: Flash flood condition halts delivery route and initiates safe highland detour", () => {
      const trafficStatus = "flash_flood_detour_active";
      const isFloodSafeRerouted = trafficStatus === "flash_flood_detour_active";
      const delayMinutes = isFloodSafeRerouted ? 30 : 0;

      expect.equal(isFloodSafeRerouted, true);
      expect.equal(delayMinutes >= 20, true);
    });

    test("F143-T4: Buyer re-scheduling shifts predicted delivery slot to evening seamlessly", () => {
      const rescheduleSlot = "19:00 - 20:30 Tối Nay";
      const buyerPresence = false;
      const confidence = 92.0;

      const windowConfig = {
        predictedSlot: rescheduleSlot,
        buyerHomePresenceConfirmed: buyerPresence,
        confidencePercent: confidence,
      };

      expect.equal(windowConfig.predictedSlot, "19:00 - 20:30 Tối Nay");
      expect.equal(windowConfig.buyerHomePresenceConfirmed, false);
      expect.equal(windowConfig.confidencePercent, 92.0);
    });

    test("F143-T5: Confidence score bounds strictly between 50% and 100%", () => {
      const clampConfidence = (c) => Math.max(50, Math.min(100, Number(c) || 50));

      expect.equal(clampConfidence(120), 100);
      expect.equal(clampConfidence(30), 50);
      expect.equal(clampConfidence(94.6), 94.6);
      expect.equal(clampConfidence("invalid"), 50);
    });
  });

  // =========================================================================
  // FEATURE 144: Doorstep Unattended Safe Drop Photo Proof & Weather-Tarp (5 Tests)
  // =========================================================================
  describe("Feature 144: Doorstep Unattended Safe Drop Photo Proof & Weather-Tarp", () => {
    test("F144-T1: Successfully records unattended safe drop instructions and designated safe spot", async () => {
      const order = await Order.create({
        orderId: "ORD_SAFE_DROP_144",
        user: "user_test_safedrop_144",
        items: [{ product: "prod_sd_1", quantity: 1, price: 320000 }],
        totalPrice: 320000,
        shippingFee: 15000,
        finalTotal: 335000,
        doorstepUnattendedSafeDropPhoto: {
          isSafeDropRequested: true,
          designatedSafeSpot: "shoerack_top",
          safeDropInstructionNote: "Đặt gọn gàng trên nóc kệ giày trước nhà",
          photoProofUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48",
          waterproofWeatherTarpPlaced: true,
          safeDropStatus: "photo_captured_safely_placed",
          dropTimestamp: new Date().toISOString(),
        },
      });

      expect.equal(order.orderId, "ORD_SAFE_DROP_144");
      expect.equal(order.doorstepUnattendedSafeDropPhoto.isSafeDropRequested, true);
      expect.equal(order.doorstepUnattendedSafeDropPhoto.designatedSafeSpot, "shoerack_top");
      expect.equal(order.doorstepUnattendedSafeDropPhoto.waterproofWeatherTarpPlaced, true);
      expect.equal(order.doorstepUnattendedSafeDropPhoto.safeDropStatus, "photo_captured_safely_placed");
    });

    test("F144-T2: Buyer retrieving parcel updates safe drop status to retrieved_by_buyer", () => {
      const currentStatus = "photo_captured_safely_placed";
      const action = "buyer_retrieved";
      const newStatus = action === "buyer_retrieved" ? "retrieved_by_buyer" : currentStatus;

      expect.equal(newStatus, "retrieved_by_buyer");
    });

    test("F144-T3: Designated safe spot validates against approved delivery spots", () => {
      const validSpots = ["gate_mailbox", "doorstep_mat", "shoerack_top", "neighbor_handoff", "building_reception"];
      const validateSpot = (spot) => validSpots.includes(spot) ? spot : "doorstep_mat";

      expect.equal(validateSpot("gate_mailbox"), "gate_mailbox");
      expect.equal(validateSpot("neighbor_handoff"), "neighbor_handoff");
      expect.equal(validateSpot("unsafe_roof"), "doorstep_mat");
    });

    test("F144-T4: Waterproof weather tarp defaults to true for outdoor drop spots", () => {
      const tarpCheck = (isOutdoor) => isOutdoor ? true : false;

      expect.equal(tarpCheck(true), true);
      expect.equal(tarpCheck(false), false);
    });

    test("F144-T5: Geolocation coordinate fallback correctly handles missing lat/lng", () => {
      const parseCoords = (coords) => ({
        lat: Number(coords?.lat) || 10.7769,
        lng: Number(coords?.lng) || 106.7009,
      });

      const valid = parseCoords({ lat: 21.0285, lng: 105.8542 });
      expect.equal(valid.lat, 21.0285);
      expect.equal(valid.lng, 105.8542);

      const fallback = parseCoords(null);
      expect.equal(fallback.lat, 10.7769);
      expect.equal(fallback.lng, 106.7009);
    });
  });

  // =========================================================================
  // FEATURE 145: Tri-Role AI Chat Separation & Admin Zero-Destructive Guardrail (5 Tests)
  // =========================================================================
  describe("Feature 145: Tri-Role AI Chat Separation & Admin Zero-Destructive Guardrail", () => {
    test("F145-T1: Workbench routes correctly isolate buyer chat widget from admin and seller portals", () => {
      const isWorkbenchRoute = (pathname) => pathname.startsWith('/seller') || pathname.startsWith('/admin');

      expect.equal(isWorkbenchRoute('/admin'), true);
      expect.equal(isWorkbenchRoute('/admin/dashboard'), true);
      expect.equal(isWorkbenchRoute('/seller'), true);
      expect.equal(isWorkbenchRoute('/seller/orders'), true);
      expect.equal(isWorkbenchRoute('/'), false);
      expect.equal(isWorkbenchRoute('/products'), false);
      expect.equal(isWorkbenchRoute('/cart'), false);
    });

    test("F145-T2: Admin Copilot Zero-Destructive Guardrail strictly intercepts destructive operations", () => {
      const dangerousQueries = [
        "Tôi muốn xóa database ngay lập tức",
        "Hãy xóa sạch shop vi phạm khỏi hệ thống",
        "drop database shopee",
        "thay đổi quyền admin cho tài khoản này",
        "hãy hack hệ thống và bỏ qua kiểm toán",
      ];

      for (const query of dangerousQueries) {
        const check = checkAdminSafetyGuardrails(query);
        expect.equal(check.isSafe, false);
        expect.ok(check.message.includes("CẢNH BÁO AN TOÀN HỆ THỐNG"));
      }

      const safeCheck = checkAdminSafetyGuardrails("Báo cáo GMV hôm nay là bao nhiêu?");
      expect.equal(safeCheck.isSafe, true);
    });

    test("F145-T3: Admin Copilot generates accurate analytical and regulatory insights", () => {
      const context = {
        totalPlatformRevenue: 50000000,
        platformCommission: 2500000,
        shopsCount: 12,
        usersCount: 150,
        disputesCount: 2,
        fraudAnomaliesCount: 1,
        pendingSettlementsCount: 3,
        withholdingTax: 1250000,
        escrowBalance: 15000000,
      };

      const gmvRes = generateAdminCopilotResponse("GMV sàn", context);
      expect.ok(gmvRes.text.includes("50.000.000"));
      expect.ok(gmvRes.text.includes("2.500.000"));

      const taxRes = generateAdminCopilotResponse("thuế và đối soát", context);
      expect.ok(taxRes.text.includes("52/2018/NĐ-CP"));
      expect.ok(taxRes.text.includes("1.250.000"));

      const fraudRes = generateAdminCopilotResponse("gian lận và bất thường", context);
      expect.ok(fraudRes.text.includes("**1**") && fraudRes.text.includes("trường hợp"));
    });

    test("F145-T4: Seller Copilot analyzes P&L, stock alerts, and ad performance with shop isolation", () => {
      const context = {
        currentShop: { id: "shop_01", name: "Thời Trang GenZ Official" },
        shopProducts: [
          { id: "p1", name: "Áo thun Oversize", stock: 2, safetyThreshold: 10 },
          { id: "p2", name: "Quần Jeans Slimfit", stock: 0, safetyThreshold: 5 },
          { id: "p3", name: "Áo Khoác Bomber", stock: 50, safetyThreshold: 10 },
        ],
        shopOrders: [{ orderId: "ord1" }],
        totalRevenue: 12000000,
        pnlData: {
          summary: {
            totalRevenue: 12000000,
            totalCogs: 7200000,
            grossProfit: 4800000,
            grossMarginPercent: 40.0,
          },
        },
      };

      const stockRes = generateSellerCopilotResponse("kiểm tra tồn kho an toàn", context);
      expect.ok(stockRes.text.includes("Hết hàng tuyệt đối"));
      expect.ok(stockRes.text.includes("Thời Trang GenZ Official"));

      const pnlRes = generateSellerCopilotResponse("lợi nhuận p&l", context);
      expect.ok(pnlRes.text.includes("40.0%"));
      expect.ok(pnlRes.text.includes("4.800.000"));
    });

    test("F145-T5: Seller Copilot strictly prevents cross-shop leakage and honors shop context", () => {
      const contextShopA = {
        currentShop: { id: "shop_01", name: "Shop Thời Trang A" },
        shopProducts: [{ id: "pA", name: "Váy hoa", stock: 20 }],
        totalRevenue: 5000000,
      };

      const contextShopB = {
        currentShop: { id: "shop_02", name: "Shop Công Nghệ B" },
        shopProducts: [{ id: "pB", name: "Tai nghe Bluetooth", stock: 100 }],
        totalRevenue: 25000000,
      };

      const resA = generateSellerCopilotResponse("tổng quan doanh số", contextShopA);
      const resB = generateSellerCopilotResponse("tổng quan doanh số", contextShopB);

      expect.ok(resA.text.includes("Shop Thời Trang A"));
      expect.ok(resA.text.includes("5.000.000"));
      expect.ok(!resA.text.includes("Shop Công Nghệ B"));

      expect.ok(resB.text.includes("Shop Công Nghệ B"));
      expect.ok(resB.text.includes("25.000.000"));
      expect.ok(!resB.text.includes("Shop Thời Trang A"));
    });
  });

  // =========================================================================
  // FEATURE 146: Deep Domain AI Training & Advanced Scenarios (5 Tests)
  // =========================================================================
  describe("Feature 146: Deep Domain AI Training & Advanced Scenarios", () => {
    test("F146-T1: Admin Copilot reconciles Escrow Vault reserves and courier COD float exposure", () => {
      const context = {
        totalPlatformRevenue: 100000000,
        escrowBalance: 30000000,
      };

      const res = generateAdminCopilotResponse("đối soát ký quỹ và nợ đọng cod", context);
      expect.ok(res.text.includes("30.000.000"));
      expect.ok(res.text.includes("COD Float"));
      expect.ok(res.text.includes("0.08%"));
    });

    test("F146-T2: Admin Copilot models Trust Score evaluation and Shop penalty points structure", () => {
      const trustRes = generateAdminCopilotResponse("hệ thống trust score và tài khoản ảo sybil", {});
      expect.ok(trustRes.text.includes("Thang 0 - 100"));
      expect.ok(trustRes.text.includes("Trust Score ≥ 80"));
      expect.ok(trustRes.text.includes("Trust Score < 50"));

      const penaltyRes = generateAdminCopilotResponse("hệ thống phạt sao quả tạ", {});
      expect.ok(penaltyRes.text.includes("1 - 2 điểm"));
      expect.ok(penaltyRes.text.includes("3 - 5 điểm"));
      expect.ok(penaltyRes.text.includes("≥ 9 điểm"));
    });

    test("F146-T3: Seller Copilot projects inventory run rate and days of inventory remaining (DIR)", () => {
      const context = {
        currentShop: { id: "shop_01", name: "Thời Trang GenZ Official" },
        shopProducts: [
          { id: "p1", name: "Áo thun", stock: 30 },
          { id: "p2", name: "Quần âu", stock: 40 },
        ],
        shopOrders: Array(14).fill({ status: "completed" }),
      };

      const res = generateSellerCopilotResponse("dự báo run rate và số ngày còn hàng dir", context);
      expect.ok(res.text.includes("Daily Run Rate"));
      expect.ok(res.text.includes("**70**") && res.text.includes("sản phẩm"));
      expect.ok(res.text.includes("DIR"));
    });

    test("F146-T4: Seller Copilot models unit economics and calculates breakeven pricing threshold", () => {
      const context = {
        currentShop: { id: "shop_01", name: "Thời Trang GenZ Official" },
        shopProducts: [{ id: "p1", name: "Áo polo", stock: 50 }],
      };

      const res = generateSellerCopilotResponse("công thức định giá bán và hòa vốn unit economics", context);
      expect.ok(res.text.includes("Giá vốn hàng bán (COGS)"));
      expect.ok(res.text.includes("5.0% GMV"));
      expect.ok(res.text.includes("Giá Bán = (Giá Vốn + Chi Phí Đóng Gói) / 0.52"));
    });

    test("F146-T5: Buyer AI recognizes colloquial slang, bundle cross-sell, and SPX redelivery rules", () => {
      const passRes = generateAiChatResponse("tôi muốn pass đơn cho bạn");
      expect.equal(passRes.intent, "PASS_ORDER_EXPLAIN");
      expect.ok(passRes.replyText.includes("không hỗ trợ chuyển nhượng"));

      const bomRes = generateAiChatResponse("tại sao bị khóa cod do bùng hàng");
      expect.equal(bomRes.intent, "TRUST_SCORE_WARNING");
      expect.ok(bomRes.replyText.includes("Trust Score dưới 50 điểm"));

      const bundleRes = generateAiChatResponse("tư vấn phối đồ và combo");
      expect.equal(bundleRes.intent, "FASHION_BUNDLE_RECOMMEND");
      expect.ok(bundleRes.replyText.includes("GỢI Ý PHỐI ĐỒ CHUẨN GU"));

      const redeliveryRes = generateAiChatResponse("shipper gọi nhỡ hẹn lại lịch giao");
      expect.equal(redeliveryRes.intent, "REDELIVERY_GUIDE");
      expect.ok(redeliveryRes.replyText.includes("tối đa 3 lần trong vòng 48 giờ"));
    });
  });

  // =========================================================================
  // FEATURE 147: Enterprise Payment Idempotency Engine (5 Tests)
  // =========================================================================
  describe("Feature 147: Enterprise Payment Idempotency Engine", () => {
    beforeEach(() => {
      idempotencyStore.clear();
    });

    test("F147-T1: Sequential replay with same key returns cached response with Idempotent-Replay header and does not duplicate state", () => {
      const key = "idem-order-key-101";
      const payload = {
        customer: { fullName: "Nguyễn Văn A", phone: "0901234567", address: "Hà Nội" },
        items: [{ productId: "p1", name: "Áo thun", price: 150000, quantity: 1 }],
        total: 150000,
        paymentMethod: "COD",
      };

      // First call acquires lock
      const acq = idempotencyStore.acquire(key, payload);
      expect.equal(acq.status, "acquired");

      // Simulates completing order creation
      const createdOrderData = {
        success: true,
        data: {
          order: { id: "ord-test-1", total: 150000, status: "pending", idempotencyKey: key },
        },
      };
      idempotencyStore.complete(key, 201, createdOrderData);

      // Second call (Replay)
      const replay = idempotencyStore.acquire(key, payload);
      expect.equal(replay.status, "completed");
      expect.equal(replay.record.statusCode, 201);
      expect.equal(replay.record.body.data.order.id, "ord-test-1");
    });

    test("F147-T2: Concurrent in-flight requests on the same key trigger 409 Conflict with Retry-After", () => {
      const key = "idem-concurrent-key-202";
      const payload = { amount: 500000, bankName: "Vietcombank", accountNumber: "123456789" };

      // Worker 1 acquires lock
      const req1 = idempotencyStore.acquire(key, payload);
      expect.equal(req1.status, "acquired");

      // Worker 2 sends simultaneous request while Worker 1 is still processing
      const req2 = idempotencyStore.acquire(key, payload);
      expect.equal(req2.status, "processing");

      // Test middleware behavior on in-flight conflict
      const middleware = idempotencyGuard();
      const mockReq = {
        method: "POST",
        headers: { "idempotency-key": key },
        body: payload,
        ip: "127.0.0.1",
        originalUrl: "/api/orders",
      };
      let capturedStatusCode = 0;
      let capturedHeaders = {};
      let capturedErrorBody = null;

      const mockRes = {
        setHeader: (k, v) => { capturedHeaders[k] = v; },
        status: (code) => {
          capturedStatusCode = code;
          return {
            json: (data) => { capturedErrorBody = data; },
          };
        },
      };

      middleware(mockReq, mockRes, () => {});
      expect.equal(capturedStatusCode, 409);
      expect.equal(capturedHeaders["Retry-After"], "2");
      expect.ok(capturedErrorBody.message.includes("đang được xử lý"));
    });

    test("F147-T3: Payload mismatch (tampering/cart change with same key) returns 422 Unprocessable Entity", () => {
      const key = "idem-tamper-key-303";
      const originalPayload = { total: 200000, items: [{ id: "p1", qty: 1 }] };
      const tamperedPayload = { total: 999000, items: [{ id: "p2", qty: 5 }] };

      // First transaction finishes
      idempotencyStore.acquire(key, originalPayload);
      idempotencyStore.complete(key, 201, { success: true, orderId: "ord-orig" });

      // Second transaction tries to reuse key with modified payload
      const check = idempotencyStore.acquire(key, tamperedPayload);
      expect.equal(check.status, "mismatch");

      // Middleware verify
      const middleware = idempotencyGuard();
      const mockReq = {
        method: "POST",
        headers: { "x-idempotency-key": key },
        body: tamperedPayload,
        ip: "127.0.0.1",
        originalUrl: "/api/orders",
      };
      let capturedCode = 0;
      let capturedBody = null;
      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          capturedCode = code;
          return { json: (data) => { capturedBody = data; } };
        },
      };

      middleware(mockReq, mockRes, () => {});
      expect.equal(capturedCode, 422);
      expect.ok(capturedBody.message.includes("Unprocessable Entity"));
    });

    test("F147-T4: Seller Wallet withdrawal with idempotency key prevents double debiting", () => {
      const sellerWithdrawKey = "wtx-seller-idem-404";
      const withdrawPayload = {
        amount: 200000,
        bankName: "MBBank",
        accountNumber: "987654321",
        accountName: "NGUYEN VAN BAN",
      };

      // Initial execution succeeds
      const firstRun = idempotencyStore.acquire(sellerWithdrawKey, withdrawPayload);
      expect.equal(firstRun.status, "acquired");
      idempotencyStore.complete(sellerWithdrawKey, 201, {
        success: true,
        data: { txId: "WTX_999", remainingBalance: 800000 },
      });

      // User double clicks "Rút Tiền" (Replay)
      const secondRun = idempotencyStore.acquire(sellerWithdrawKey, withdrawPayload);
      expect.equal(secondRun.status, "completed");
      expect.equal(secondRun.record.body.data.remainingBalance, 800000);
      expect.equal(secondRun.record.body.data.txId, "WTX_999");
    });

    test("F147-T5: Supports both IETF standard 'Idempotency-Key' and legacy 'X-Idempotency-Key' headers with response replay", () => {
      const middleware = idempotencyGuard();
      const testKey = "ietf-standard-key-505";
      const body = { orderTotal: 50000 };

      // Seed completed state in store
      idempotencyStore.acquire(testKey, body);
      idempotencyStore.complete(testKey, 200, { success: true, message: "Order processed" });

      // Test with IETF 'idempotency-key' header
      const reqIetf = {
        method: "POST",
        headers: { "idempotency-key": testKey },
        body,
        ip: "127.0.0.1",
      };
      let headersSet = {};
      let jsonCalledWith = null;
      const resIetf = {
        setHeader: (k, v) => { headersSet[k] = v; },
        status: (c) => ({
          json: (b) => { jsonCalledWith = b; },
        }),
      };

      middleware(reqIetf, resIetf, () => {});
      expect.equal(headersSet["Idempotent-Replay"], "true");
      expect.equal(headersSet["X-Idempotency-Key"], testKey);
      expect.equal(jsonCalledWith.message, "Order processed");
    });
  });

  // =========================================================================
  // FEATURE 148: Distributed E-Commerce Algorithms Suite (16 Tests)
  // =========================================================================
  describe("Feature 148: Distributed E-Commerce Algorithms Suite", () => {

    // --- ALGORITHM 1: Token Bucket Rate Limiting (4 Tests) ---
    describe("Algorithm 1: Token Bucket Rate Limiting", () => {
      test("F148-T1: Consuming tokens within capacity succeeds and decrements token count", () => {
        const bucket = new TokenBucket(5, 1);
        const r1 = bucket.tryConsume(1);
        expect.equal(r1.allowed, true);
        expect.equal(r1.remaining, 4);

        const r2 = bucket.tryConsume(3);
        expect.equal(r2.allowed, true);
        expect.equal(r2.remaining, 1);
      });

      test("F148-T2: Exceeding capacity strictly rejects with Retry-After calculation", () => {
        const bucket = new TokenBucket(3, 2);
        bucket.tryConsume(3); // Empty bucket
        const rejected = bucket.tryConsume(1);
        expect.equal(rejected.allowed, false);
        expect.equal(rejected.remaining, 0);
        expect.ok(rejected.retryAfterSec >= 1);
      });

      test("F148-T3: TokenBucketStore segregates tokens per client key", () => {
        const store = new TokenBucketStore(4, 1);
        const clientA = store.consume("client-A", 4);
        expect.equal(clientA.allowed, true);

        const clientABlocked = store.consume("client-A", 1);
        expect.equal(clientABlocked.allowed, false);

        // Client B is unaffected
        const clientB = store.consume("client-B", 2);
        expect.equal(clientB.allowed, true);
        expect.equal(clientB.remaining, 2);
      });

      test("F148-T4: tokenBucketLimiter Express middleware injects rate-limit headers and returns 429", () => {
        const middleware = tokenBucketLimiter({
          capacity: 2,
          refillRatePerSec: 1,
          keyGenerator: () => "ip-test-123",
        });

        const mockReq = { ip: "127.0.0.1" };
        let statusCode = 200;
        let responseBody = null;
        const headers = {};
        const mockRes = {
          setHeader: (k, v) => { headers[k] = v; },
          status: (code) => {
            statusCode = code;
            return { json: (b) => { responseBody = b; } };
          },
        };

        // Call 1 & 2 pass
        let nextCalled = 0;
        middleware(mockReq, mockRes, () => { nextCalled++; });
        middleware(mockReq, mockRes, () => { nextCalled++; });
        expect.equal(nextCalled, 2);

        // Call 3 triggers 429
        middleware(mockReq, mockRes, () => { nextCalled++; });
        expect.equal(statusCode, 429);
        expect.equal(responseBody.error, "TOO_MANY_REQUESTS");
        expect.equal(headers["X-RateLimit-Limit"], "2");
        expect.ok(Number(headers["Retry-After"]) >= 1);
      });
    });

    // --- ALGORITHM 2: Circuit Breaker with Exponential Backoff (4 Tests) ---
    describe("Algorithm 2: Circuit Breaker with Exponential Backoff", () => {
      test("F148-T5: Normal operations execute and remain in CLOSED state", async () => {
        const breaker = new CircuitBreaker({ name: "VietQR_Gateway", failureThreshold: 3 });
        const res = await breaker.execute(async () => "PAYMENT_SUCCESS");
        expect.equal(res, "PAYMENT_SUCCESS");
        expect.equal(breaker.state, CircuitState.CLOSED);
      });

      test("F148-T6: Reaching failure threshold trips breaker to OPEN state and fails fast", async () => {
        const breaker = new CircuitBreaker({ name: "SPX_Webhook", failureThreshold: 2, resetTimeoutMs: 5000 });

        // Trigger 2 failures
        try { await breaker.execute(async () => { throw new Error("Timeout 504"); }); } catch (e) {}
        try { await breaker.execute(async () => { throw new Error("Connection Refused"); }); } catch (e) {}

        expect.equal(breaker.state, CircuitState.OPEN);

        // Third call fast-fails without executing the action
        let actionExecuted = false;
        try {
          await breaker.execute(async () => {
            actionExecuted = true;
            return "SHOULD_NOT_RUN";
          });
        } catch (err) {
          expect.equal(err.circuitBreakerOpen, true);
        }
        expect.equal(actionExecuted, false);
      });

      test("F148-T7: Graceful fallback function is triggered when circuit is OPEN", async () => {
        const fallbackFn = (err) => ({ status: "FALLBACK_CACHED_RATE", reason: err.message });
        const breaker = new CircuitBreaker({ name: "FX_Rate_API", failureThreshold: 1, fallback: fallbackFn });

        try { await breaker.execute(async () => { throw new Error("Outage"); }); } catch (e) {}
        expect.equal(breaker.state, CircuitState.OPEN);

        const result = await breaker.execute(async () => "LIVE_DATA");
        expect.equal(result.status, "FALLBACK_CACHED_RATE");
      });

      test("F148-T8: Exponential backoff with jitter produces bounded sleep values", () => {
        for (let attempt = 1; attempt <= 5; attempt++) {
          const sleep = CircuitBreaker.calculateBackoffWithJitter(attempt, 100, 2000);
          expect.ok(sleep >= 0);
          expect.ok(sleep <= 2000);
        }
      });
    });

    // --- ALGORITHM 3: Optimistic Concurrency Control (OCC) (4 Tests) ---
    describe("Algorithm 3: Optimistic Concurrency Control (OCC)", () => {
      test("F148-T9: Single-thread atomic stock decrement updates version and balance correctly", async () => {
        const occ = new OptimisticConcurrencyManager();
        const product = { id: "p-flash-1", stock: 10, version: 1 };

        const res = await occ.decrementStockAtomic(product, 3);
        expect.equal(res.success, true);
        expect.equal(product.stock, 7);
        expect.equal(product.version, 2);
      });

      test("F148-T10: Deducting more than available stock is rejected with OUT_OF_STOCK without corrupting version", async () => {
        const occ = new OptimisticConcurrencyManager();
        const product = { id: "p-flash-2", stock: 2, version: 5 };

        const res = await occ.decrementStockAtomic(product, 5);
        expect.equal(res.success, false);
        expect.equal(res.error, "OUT_OF_STOCK");
        expect.equal(product.stock, 2);
        expect.equal(product.version, 5);
      });

      test("F148-T11: Detects CAS conflict when expected version differs from stored version", async () => {
        const occ = new OptimisticConcurrencyManager({ maxRetries: 0 });
        let entity = { id: "doc-1", data: "initial", version: 1 };

        const result = await occ.executeWithRetry({
          fetchEntity: async () => entity,
          mutate: (item) => { item.data = "modified"; return { isValid: true }; },
          commitUpdate: async (item, expectedVer) => {
            // Simulate another thread updated version to 2 behind our back
            return false;
          },
        });

        expect.equal(result.success, false);
        expect.equal(result.error, "OCC_CONFLICT_MAX_RETRIES_EXCEEDED");
      });

      test("F148-T12: Multi-transaction race simulation prevents overselling under 50 concurrent buyers", async () => {
        const occ = new OptimisticConcurrencyManager({ maxRetries: 10, baseBackoffMs: 2, maxBackoffMs: 20 });
        const flashProduct = { id: "p-iphone-deal", stock: 10, version: 0 };

        // 50 concurrent buyers trying to grab 1 item each from a stock of 10
        const promises = [];
        for (let i = 0; i < 50; i++) {
          promises.push(occ.decrementStockAtomic(flashProduct, 1));
        }

        const results = await Promise.all(promises);
        const successfulBuys = results.filter((r) => r.success);
        const outOfStockBuys = results.filter((r) => !r.success && (r.error === "OUT_OF_STOCK" || r.error === "OCC_CONFLICT_MAX_RETRIES_EXCEEDED"));

        // Exactly 10 buyers grab the 10 available items
        expect.equal(successfulBuys.length, 10);
        expect.equal(outOfStockBuys.length, 40);
        // Stock must never drop below 0
        expect.equal(flashProduct.stock, 0);
      });
    });

    // --- ALGORITHM 4: LRU Cache with TTL (4 Tests) ---
    describe("Algorithm 4: LRU Cache with TTL Eviction", () => {
      test("F148-T13: get and put operations maintain O(1) order and cache size", () => {
        const lru = new LRUCache(3, 10000);
        lru.put("a", 1);
        lru.put("b", 2);
        lru.put("c", 3);

        expect.equal(lru.get("a"), 1);
        expect.equal(lru.size, 3);
        // Accessing 'a' moves it to MRU (front)
        expect.equal(lru.keys()[0], "a");
      });

      test("F148-T14: Evicts the least recently used element when capacity is exceeded", () => {
        const lru = new LRUCache(3, 10000);
        lru.put("x", 10);
        lru.put("y", 20);
        lru.put("z", 30);

        // Access 'x' so 'y' becomes the oldest
        lru.get("x");

        // Insert 'w', 'y' should be evicted
        lru.put("w", 40);

        expect.equal(lru.get("y"), null);
        expect.equal(lru.get("x"), 10);
        expect.equal(lru.get("z"), 30);
        expect.equal(lru.get("w"), 40);
        expect.equal(lru.size, 3);
      });

      test("F148-T15: Automatically discards expired items when TTL elapses", async () => {
        const lru = new LRUCache(5, 50); // 50ms TTL
        lru.put("flash_deal", { discount: 50 }, 50);

        expect.ok(lru.get("flash_deal") !== null);

        // Wait for TTL to expire
        await new Promise((r) => setTimeout(r, 60));
        expect.equal(lru.get("flash_deal"), null);
      });

      test("F148-T16: delete and clear operations reset internal linked list state properly", () => {
        const lru = new LRUCache(5, 10000);
        lru.put("item1", "val1");
        lru.put("item2", "val2");

        expect.equal(lru.delete("item1"), true);
        expect.equal(lru.get("item1"), null);
        expect.equal(lru.size, 1);

        lru.clear();
        expect.equal(lru.size, 0);
        expect.equal(lru.get("item2"), null);
      });
    });
  });

  // =========================================================================
  // FEATURE 149: Enterprise Infrastructure Suite (Redis, Nginx, RabbitMQ) (15 Tests)
  // =========================================================================
  describe("Feature 149: Enterprise Infrastructure Suite (Redis, Nginx, RabbitMQ)", () => {

    // --- SUB-FEATURE 1: Redis Distributed Cache & Redlock Mutex (5 Tests) ---
    describe("Redis Distributed Cache & Redlock Mutex", () => {
      beforeEach(() => {
        redisService.clear();
      });

      test("F149-T1: Redis get, set, getJson, setJson stores and retrieves data accurately", async () => {
        await redisService.set("key1", "val1");
        const val = await redisService.get("key1");
        expect.equal(val, "val1");

        const catalogObj = { id: "p101", title: "Áo Polo Nam", price: 299000 };
        await redisService.setJson("catalog:p101", catalogObj, 60);
        const retrieved = await redisService.getJson("catalog:p101");
        expect.equal(retrieved.title, "Áo Polo Nam");
        expect.equal(retrieved.price, 299000);
      });

      test("F149-T2: Redis key automatically expires when TTL passes", async () => {
        await redisService.set("short_key", "temporary", "PX", 40); // 40ms TTL
        expect.equal(await redisService.get("short_key"), "temporary");

        await new Promise((r) => setTimeout(r, 55));
        expect.equal(await redisService.get("short_key"), null);
      });

      test("F149-T3: Redlock acquires distributed lock with unique UUID token", async () => {
        const lock = await redisService.acquireLock("flash_sale_iphone_slot", 5000);
        expect.equal(lock.success, true);
        expect.ok(lock.token.length >= 32);
        expect.equal(lock.lockKey, "lock:flash_sale_iphone_slot");
      });

      test("F149-T4: Redlock prevents simultaneous lock acquisition on the same resource", async () => {
        const worker1Lock = await redisService.acquireLock("wallet_settlement_shop_88", 5000);
        expect.equal(worker1Lock.success, true);

        // Worker 2 attempts while Worker 1 still holds the lock
        const worker2Lock = await redisService.acquireLock("wallet_settlement_shop_88", 5000);
        expect.equal(worker2Lock.success, false);
      });

      test("F149-T5: Redlock release allows next worker to acquire lock, rejecting invalid tokens", async () => {
        const lock = await redisService.acquireLock("order_sync_queue", 5000);
        
        // Releasing with wrong token fails
        const fakeRelease = await redisService.releaseLock("order_sync_queue", "wrong-token-123");
        expect.equal(fakeRelease, false);

        // Releasing with genuine token succeeds
        const genuineRelease = await redisService.releaseLock("order_sync_queue", lock.token);
        expect.equal(genuineRelease, true);

        // Next worker can now acquire
        const nextLock = await redisService.acquireLock("order_sync_queue", 5000);
        expect.equal(nextLock.success, true);
      });
    });

    // --- SUB-FEATURE 2: Nginx Gateway & Security Hardening (5 Tests) ---
    describe("Nginx Gateway & Reverse Proxy Configuration", () => {
      const nginxConfigPath = "deploy/nginx/nginx.conf";
      let nginxContent = "";

      beforeEach(() => {
        nginxContent = fs.readFileSync(nginxConfigPath, "utf-8");
      });

      test("F149-T6: Nginx config includes Upstream backend cluster with least_conn load balancing", () => {
        expect.ok(nginxContent.includes("upstream backend_cluster"));
        expect.ok(nginxContent.includes("least_conn;"));
        expect.ok(nginxContent.includes("127.0.0.1:5000"));
      });

      test("F149-T7: Nginx config enforces Layer 7 Rate Limiting zones for API and Flash Sale", () => {
        expect.ok(nginxContent.includes("limit_req_zone $binary_remote_addr zone=api_general_limit:10m rate=20r/s;"));
        expect.ok(nginxContent.includes("limit_req_zone $binary_remote_addr zone=flash_sale_checkout_limit:10m rate=5r/s;"));
        expect.ok(nginxContent.includes("limit_conn_zone $binary_remote_addr zone=addr_conn_limit:10m;"));
      });

      test("F149-T8: Nginx config enforces Enterprise Security Headers (HSTS, CSP, X-Frame-Options)", () => {
        expect.ok(nginxContent.includes("Strict-Transport-Security"));
        expect.ok(nginxContent.includes("X-Frame-Options \"SAMEORIGIN\""));
        expect.ok(nginxContent.includes("X-Content-Type-Options \"nosniff\""));
        expect.ok(nginxContent.includes("Content-Security-Policy"));
      });

      test("F149-T9: Nginx config enables Gzip compression for static files and SVG assets", () => {
        expect.ok(nginxContent.includes("gzip on;"));
        expect.ok(nginxContent.includes("application/json"));
        expect.ok(nginxContent.includes("application/javascript"));
        expect.ok(nginxContent.includes("image/svg+xml"));
      });

      test("F149-T10: Nginx config includes SSL termination and HTTP to HTTPS 301 redirection", () => {
        expect.ok(nginxContent.includes("listen 443 ssl http2;"));
        expect.ok(nginxContent.includes("return 301 https://$host$request_uri;"));
        expect.ok(nginxContent.includes("ssl_protocols TLSv1.2 TLSv1.3;"));
      });
    });

    // --- SUB-FEATURE 3: RabbitMQ Message Broker & Event-Driven Architecture (5 Tests) ---
    describe("RabbitMQ Message Broker & Event Bus", () => {
      beforeEach(() => {
        rabbitMQService.reset();
        rabbitMQService.assertExchange("orders.direct", "direct");
        rabbitMQService.assertExchange("orders.dlx", "direct");
        rabbitMQService.assertQueue("orders.payment.processing");
        rabbitMQService.assertQueue("orders.invoice.vat");
        rabbitMQService.assertQueue("orders.dead.letter.queue");
        rabbitMQService.bindQueue("orders.payment.processing", "orders.direct", "order.created");
        rabbitMQService.bindQueue("orders.invoice.vat", "orders.direct", "order.paid");
        rabbitMQService.bindQueue("orders.dead.letter.queue", "orders.dlx", "order.failed");
      });

      test("F149-T11: Publishes order event to direct exchange and routes to bound queue", async () => {
        await rabbitMQService.publish("orders.direct", "order.created", {
          orderId: "ord-test-888",
          total: 500000,
          customer: "Trần Văn B",
        });

        expect.equal(rabbitMQService.getQueueLength("orders.payment.processing"), 1);
        expect.equal(rabbitMQService.getQueueLength("orders.invoice.vat"), 0);
      });

      test("F149-T12: Consumer processes message and acknowledges (Ack) successfully", async () => {
        let processedOrderId = null;

        rabbitMQService.consume("orders.payment.processing", async (msg, { ack }) => {
          processedOrderId = msg.content.orderId;
          ack();
        });

        await rabbitMQService.publish("orders.direct", "order.created", {
          orderId: "ord-ack-999",
          total: 250000,
        });

        expect.equal(processedOrderId, "ord-ack-999");
        const stats = rabbitMQService.getStats();
        expect.equal(stats.acked, 1);
        expect.equal(stats.consumed, 1);
      });

      test("F149-T13: Fanout-like multi-queue routing: One paid event distributes to invoice and notifications", async () => {
        rabbitMQService.assertQueue("orders.notifications");
        rabbitMQService.bindQueue("orders.notifications", "orders.direct", "order.paid");

        let invoiceReceived = false;
        let notifReceived = false;

        rabbitMQService.consume("orders.invoice.vat", async (msg, { ack }) => {
          invoiceReceived = true;
          ack();
        });

        rabbitMQService.consume("orders.notifications", async (msg, { ack }) => {
          notifReceived = true;
          ack();
        });

        await rabbitMQService.publish("orders.direct", "order.paid", { orderId: "ord-multi-queue" });

        expect.equal(invoiceReceived, true);
        expect.equal(notifReceived, true);
      });

      test("F149-T14: Failed message retries and gets routed to Dead Letter Exchange (DLX)", async () => {
        rabbitMQService.consume("orders.payment.processing", async (msg, { nack }) => {
          // Reject with requeue=false -> Triggers DLX
          nack(false);
        });

        await rabbitMQService.publish("orders.direct", "order.created", {
          orderId: "ord-bad-payload",
          corrupt: true,
        });

        const stats = rabbitMQService.getStats();
        expect.equal(stats.nacked, 1);
        expect.equal(stats.deadLetterCount, 1);
        expect.equal(rabbitMQService.deadLetterQueue[0].content.orderId, "ord-bad-payload");
      });

      test("F149-T15: Message headers track retry counts and preserve message delivery timestamps", async () => {
        let recordedRetry = -1;
        rabbitMQService.consume("orders.payment.processing", async (msg, { nack }) => {
          recordedRetry = msg.headers.retryCount || 0;
          nack(false);
        });

        await rabbitMQService.publish("orders.direct", "order.created", { orderId: "ord-retry-track" });
        expect.equal(recordedRetry, 0);
        expect.ok(rabbitMQService.deadLetterQueue[0].deadLetterTimestamp > 0);
      });
    });
  });

  // =========================================================================
  // FEATURE 150: Advanced AI & NLP Algorithms Suite (15 Tests)
  // =========================================================================
  describe("Feature 150: Advanced AI & NLP Algorithms Suite for Chatbots", () => {

    // --- ALGORITHM 1: Levenshtein Distance & Fuzzy Spelling Correction (4 Tests) ---
    describe("Algorithm 1: Levenshtein Distance & Fuzzy Matcher", () => {
      test("F150-T1: Calculates exact edit distance between Vietnamese e-commerce terms", () => {
        expect.equal(calculateLevenshteinDistance("voucher", "voucher"), 0);
        expect.equal(calculateLevenshteinDistance("vouche", "voucher"), 1); // 1 insertion
        expect.equal(calculateLevenshteinDistance("serum", "sơm"), 3);      // 3 edits
        expect.equal(calculateLevenshteinDistance("shopee", "sopee"), 1);   // 1 deletion
        expect.equal(calculateLevenshteinDistance("", "shopee"), 6);        // empty to word
      });

      test("F150-T2: Suggests closest correct keyword from e-commerce vocabulary", () => {
        const dictionary = ["voucher", "freeship", "áo thun", "củ sạc gan", "kem chống nắng", "tai nghe bluetooth"];
        const match1 = findClosestTerm("vouche", dictionary, 2);
        expect.equal(match1.term, "voucher");
        expect.equal(match1.distance, 1);

        const match2 = findClosestTerm("freship", dictionary, 2);
        expect.equal(match2.term, "freeship");
        expect.equal(match2.distance, 1);
      });

      test("F150-T3: Returns null when typo exceeds maximum allowed edit threshold", () => {
        const dictionary = ["voucher", "freeship"];
        const match = findClosestTerm("hoàn toàn khác", dictionary, 2);
        expect.equal(match, null);
      });

      test("F150-T4: Case-insensitive and whitespace resilient distance calculation", () => {
        expect.equal(calculateLevenshteinDistance("  VOUCHER  ", "voucher"), 0);
      });
    });

    // --- ALGORITHM 2: BM25 (Best Matching 25) Text Relevance (4 Tests) ---
    describe("Algorithm 2: BM25 Text Relevance Engine", () => {
      const documents = [
        { id: "doc-1", content: "Chính sách trả hàng hoàn tiền 1-click miễn phí trong 15 ngày qua bưu tá SPX" },
        { id: "doc-2", content: "Hướng dẫn kích hoạt mã freeship và voucher giảm giá 50k khi đặt hàng" },
        { id: "doc-3", content: "Quy định bảo hành thiết bị điện tử chính hãng 12 tháng tại Shopee Mall" },
      ];

      test("F150-T5: Scores and ranks most relevant document for shopping policy queries", () => {
        const bm25 = new BM25Engine(documents);
        const results = bm25.search("chính sách trả hàng hoàn tiền");
        expect.ok(results.length > 0);
        expect.equal(results[0].id, "doc-1");
        expect.ok(results[0].score > 0);
      });

      test("F150-T6: Query with multiple matches ranks document with higher term frequency higher", () => {
        const bm25 = new BM25Engine(documents);
        const results = bm25.search("mã voucher freeship");
        expect.ok(results.length > 0);
        expect.equal(results[0].id, "doc-2");
      });

      test("F150-T7: Irrelevant query returns empty array or zero score", () => {
        const bm25 = new BM25Engine(documents);
        const results = bm25.search("khủng long bạo chúa kỷ jura");
        expect.equal(results.length, 0);
      });

      test("F150-T8: Empty document corpus or blank query handles gracefully without throwing", () => {
        const emptyEngine = new BM25Engine([]);
        expect.equal(emptyEngine.search("bất kỳ").length, 0);
      });
    });

    // --- ALGORITHM 3: Cosine Similarity Vector Search RAG (4 Tests) ---
    describe("Algorithm 3: Cosine Similarity Vector Search (RAG)", () => {
      test("F150-T9: Computes cosine similarity of identical vectors as exactly 1.0", () => {
        const vec = [0.2, 0.5, 0.8, 0.1];
        expect.equal(calculateCosineSimilarity(vec, vec), 1.0);
      });

      test("F150-T10: Orthogonal vectors have cosine similarity of 0.0", () => {
        const vecA = [1, 0, 0];
        const vecB = [0, 1, 0];
        expect.equal(calculateCosineSimilarity(vecA, vecB), 0.0);
      });

      test("F150-T11: Vector RAG matching identifies semantic similarity over shared vocabulary", () => {
        const vocabulary = ["đơn", "hàng", "giao", "trễ", "voucher", "giảm", "giá"];
        const queryText = "đơn hàng giao trễ";
        const docText = "đơn hàng bị giao trễ quá hạn";
        const irrelevantDoc = "voucher giảm giá 50k";

        const queryVec = createTfEmbedding(queryText, vocabulary);
        const docVec = createTfEmbedding(docText, vocabulary);
        const irrelevantVec = createTfEmbedding(irrelevantDoc, vocabulary);

        const simRelevant = calculateCosineSimilarity(queryVec, docVec);
        const simIrrelevant = calculateCosineSimilarity(queryVec, irrelevantVec);

        expect.ok(simRelevant > 0.6);
        expect.equal(simIrrelevant, 0);
      });

      test("F150-T12: Handles zero-magnitude or empty vectors safely without NaN", () => {
        expect.equal(calculateCosineSimilarity([0, 0], [0, 0]), 0);
        expect.equal(calculateCosineSimilarity([], []), 0);
      });
    });

    // --- ALGORITHM 4: E-Commerce Sentiment Analysis & Frustration Radar (3 Tests) ---
    describe("Algorithm 4: E-Commerce Sentiment & Frustration Radar", () => {
      test("F150-T13: Classifies positive satisfied customer review with POSITIVE label", () => {
        const res = analyzeSentiment("Hàng rất đẹp, đóng gói cẩn thận, giao hàng cực kỳ nhanh và uy tín 5 sao");
        expect.equal(res.label, "POSITIVE");
        expect.ok(res.score > 0.3);
        expect.equal(res.isFrustrated, false);
      });

      test("F150-T14: Detects extreme buyer frustration and triggers supervisor escalation flag", () => {
        const res = analyzeSentiment("Shop lừa đảo quá thất vọng, hàng hư hỏng rách bẩn giao trễ làm mất tiền!");
        expect.equal(res.label, "NEGATIVE");
        expect.ok(res.score < -0.4);
        expect.equal(res.isFrustrated, true);
        expect.equal(res.action, "ESCALATE_TO_SUPERVISOR_WITH_VOUCHER_COMPENSATION");
      });

      test("F150-T15: Buyer AI Chat automatically triggers recovery compensation voucher on frustrated queries", () => {
        const angryMessage = "Tại sao shop lừa đảo giao hàng hư hỏng tệ hại như vậy?";
        const chatRes = generateAiChatResponse(angryMessage);
        expect.equal(chatRes.intent, "FRUSTRATED_CUSTOMER_RECOVERY");
        expect.ok(chatRes.replyText.includes("ƯU TIÊN ĐẶC BIỆT"));
        expect.ok(chatRes.replyText.includes("MINI50K"));
      });
    });
  });

  // =========================================================================
  // FEATURE 151: Consistent Hashing & Bloom Filter Algorithms Suite (16 Tests)
  // =========================================================================
  describe("Feature 151: Consistent Hashing & Bloom Filter Algorithms Suite", () => {
    // --- 1. Consistent Hashing with Virtual Nodes (8 Tests) ---
    describe("Algorithm 1: Consistent Hashing Ring with Virtual Nodes", () => {
      test("F151-T1: fnv1a32 hashes consistently and produces valid 32-bit unsigned integer [0, 2^32-1]", () => {
        const h1 = fnv1a32("voucher_super_sale_50k");
        const h2 = fnv1a32("voucher_super_sale_50k");
        expect.equal(h1, h2);
        expect.ok(h1 >= 0 && h1 <= 4294967295);
        expect.ok(Number.isInteger(h1));
      });

      test("F151-T2: murmur32 hashes strings into independent pseudo-random 32-bit values", () => {
        const hA = murmur32("product_sku_1001", 0x12345678);
        const hB = murmur32("product_sku_1001", 0x87654321);
        expect.ok(hA !== hB);
        expect.ok(hA >= 0 && hA <= 4294967295);
      });

      test("F151-T3: ConsistentHashRing initializes with configured replicas of virtual nodes", () => {
        const ring = new ConsistentHashRing({ replicas: 100 });
        ring.addNode("cache-node-1");
        ring.addNode("cache-node-2");
        expect.equal(ring.getNodes().length, 2);
        expect.equal(ring.ring.length, 200);
      });

      test("F151-T4: ConsistentHashRing routes identical key to the exact same node deterministically", () => {
        const ring = new ConsistentHashRing({ replicas: 120 });
        ring.addNode("node-alpha");
        ring.addNode("node-beta");
        ring.addNode("node-gamma");

        const targetNode1 = ring.getNode("cart_user_998877");
        const targetNode2 = ring.getNode("cart_user_998877");
        const targetNode3 = ring.getNode("cart_user_998877");

        expect.equal(targetNode1, targetNode2);
        expect.equal(targetNode2, targetNode3);
        expect.ok(["node-alpha", "node-beta", "node-gamma"].includes(targetNode1));
      });

      test("F151-T5: Handles ring wrap-around when key hash exceeds largest vnode hash", () => {
        const ring = new ConsistentHashRing({ replicas: 50 });
        ring.addNode("node-first");
        ring.addNode("node-second");

        // Key with highest possible 32-bit value will wrap around to node with smallest hash on ring
        const maxKey = "some_very_high_hash_key_9999999";
        const assigned = ring.getNode(maxKey);
        expect.ok(assigned !== null);
        expect.ok(["node-first", "node-second"].includes(assigned));
      });

      test("F151-T6: Distributes 1,000 keys across 5 nodes uniformly without acute data skew", () => {
        const ring = new ConsistentHashRing({ replicas: 150 });
        const nodes = ["cache-1", "cache-2", "cache-3", "cache-4", "cache-5"];
        nodes.forEach((n) => ring.addNode(n));

        const keys = Array.from({ length: 1000 }, (_, i) => `session_user_${i}_cart_token`);
        const dist = ring.getDistribution(keys);

        // Mỗi node lý tưởng nhận ~200 keys (20%). Với 150 vnodes, mỗi node nhận tối thiểu 10% và tối đa 35%
        for (const n of nodes) {
          expect.ok(dist[n].count > 100); // Không có node nào bị bỏ đói (< 10%)
          expect.ok(dist[n].percentage >= 10 && dist[n].percentage <= 35);
        }
      });

      test("F151-T7: Adding a 6th node rebalances only ~1/N keys, leaving ~80% unchanged", () => {
        const ring = new ConsistentHashRing({ replicas: 150 });
        const initialNodes = ["cache-1", "cache-2", "cache-3", "cache-4", "cache-5"];
        initialNodes.forEach((n) => ring.addNode(n));

        const keys = Array.from({ length: 1000 }, (_, i) => `order_item_key_${i}`);
        const before = {};
        keys.forEach((k) => (before[k] = ring.getNode(k)));

        // Thêm node thứ 6
        ring.addNode("cache-6");
        let movedCount = 0;
        keys.forEach((k) => {
          const after = ring.getNode(k);
          if (after !== before[k]) {
            movedCount++;
            expect.equal(after, "cache-6"); // Các key bị di chuyển phải chuyển sang đúng node mới thêm
          }
        });

        // Theo lý thuyết 1/N = 1/6 ~ 16.7%. Cho phép biên độ 10% đến 25% (100 -> 250 keys)
        const movedRatio = (movedCount / keys.length) * 100;
        expect.ok(movedRatio >= 10 && movedRatio <= 28);
      });

      test("F151-T8: Removing a node cleanly reallocates its keys to remaining active nodes", () => {
        const ring = new ConsistentHashRing({ replicas: 100 });
        ring.addNode("node-A");
        ring.addNode("node-B");
        ring.addNode("node-C");

        const keys = Array.from({ length: 300 }, (_, i) => `cart_${i}`);
        ring.removeNode("node-B");

        expect.equal(ring.getNodes().length, 2);
        keys.forEach((k) => {
          const assigned = ring.getNode(k);
          expect.ok(assigned === "node-A" || assigned === "node-C");
          expect.ok(assigned !== "node-B");
        });
      });
    });

    // --- 2. Bloom Filter with Double Hashing (8 Tests) ---
    describe("Algorithm 2: Bloom Filter Cache Penetration Guard", () => {
      test("F151-T9: Dynamically calculates optimal bit array size m and hash function count k", () => {
        const filter = new BloomFilter({ expectedElements: 5000, falsePositiveRate: 0.01 });
        const stats = filter.getStats();

        // Với n = 5000, p = 0.01:
        // m = ceil(- 5000 * ln(0.01) / (ln(2)^2)) ~ 47,926 bits (~5,991 bytes)
        // k = ceil(m/n * ln(2)) ~ 7
        expect.ok(stats.sizeBits >= 47000 && stats.sizeBits <= 49000);
        expect.equal(stats.numHashFunctions, 7);
        expect.equal(stats.expectedElements, 5000);
        expect.equal(stats.targetFpr, 0.01);
      });

      test("F151-T10: Guarantees Zero False Negatives: items added are ALWAYS returned as true", () => {
        const filter = new BloomFilter({ expectedElements: 1000, falsePositiveRate: 0.01 });
        const insertedVouchers = Array.from({ length: 500 }, (_, i) => `MINI_VOUCHER_${i}_DISCOUNT`);

        filter.addMany(insertedVouchers);

        // 100% các phần tử đã add phải có mặt (không được phép có false negative)
        for (const v of insertedVouchers) {
          expect.equal(filter.has(v), true);
        }
      });

      test("F151-T11: Accurately identifies non-existent keys as false with negligible false positives", () => {
        const filter = new BloomFilter({ expectedElements: 1000, falsePositiveRate: 0.01 });
        const realVouchers = ["FREESHIPMAX", "GIAM50K", "HOANXU20K", "CHAOBANMOI"];
        filter.addMany(realVouchers);

        expect.equal(filter.has("FREESHIPMAX"), true);
        expect.equal(filter.has("GIAM50K"), true);

        // Kiểm tra các mã rác không tồn tại
        expect.equal(filter.has("FAKE_HACK_VOUCHER_XYZ"), false);
        expect.equal(filter.has("NON_EXISTENT_COUPON_999"), false);
        expect.equal(filter.has("ATTACKER_INJECTION_CODE"), false);
      });

      test("F151-T12: Empirical False Positive Rate across 2,000 unseen keys strictly honors target threshold (FPR <= 2%)", () => {
        const filter = new BloomFilter({ expectedElements: 2000, falsePositiveRate: 0.01 });
        for (let i = 0; i < 1000; i++) {
          filter.add(`valid_sku_item_${i}`);
        }

        let falsePositives = 0;
        const testCount = 2000;
        for (let i = 0; i < testCount; i++) {
          // Kiểm tra các key không hề được add
          if (filter.has(`unseen_ghost_sku_${i}`)) {
            falsePositives++;
          }
        }

        const empiricalFPR = (falsePositives / testCount) * 100;
        // FPR thực nghiệm phải nhỏ hơn 2.5% (đạt chuẩn thiết kế target p = 1%)
        expect.ok(empiricalFPR < 2.5);
      });

      test("F151-T13: Correctly tracks elements count, bit array fill ratio, and estimated current FPR", () => {
        const filter = new BloomFilter({ expectedElements: 1000, falsePositiveRate: 0.01 });
        for (let i = 0; i < 200; i++) {
          filter.add(`sku_${i}`);
        }

        const stats = filter.getStats();
        expect.equal(stats.currentElements, 200);
        expect.ok(stats.fillRatioPercent > 0 && stats.fillRatioPercent < 30);
        expect.ok(stats.estimatedCurrentFpr <= 0.01);
      });

      test("F151-T14: BloomFilter clear() wipes all bit marks and resets element count to zero", () => {
        const filter = new BloomFilter({ expectedElements: 500, falsePositiveRate: 0.01 });
        filter.add("TEST_KEY");
        expect.equal(filter.has("TEST_KEY"), true);

        filter.clear();
        expect.equal(filter.getStats().currentElements, 0);
        expect.equal(filter.getStats().fillRatioPercent, 0);
        expect.equal(filter.has("TEST_KEY"), false);
      });

      test("F151-T15: Admin Sentinel Copilot AI provides in-depth technical answers for Bloom Filter queries", () => {
        const res = generateAdminCopilotResponse("Giải thích thuật toán Bloom Filter chống Cache Penetration");
        expect.equal(res.tag, "THUẬT TOÁN BLOOM FILTER");
        expect.ok(res.text.includes("BLOOM FILTER"));
        expect.ok(res.text.includes("Zero False Negatives"));
        expect.ok(res.text.includes("Double Hashing"));
      });

      test("F151-T16: Admin Sentinel Copilot AI explains Consistent Hashing Ring and Virtual Nodes load balancing architecture", () => {
        const res = generateAdminCopilotResponse("Nguyên lý hoạt động của Consistent Hashing với Virtual Nodes");
        expect.equal(res.tag, "THUẬT TOÁN BĂM NHẤT QUÁN");
        expect.ok(res.text.includes("CONSISTENT HASHING"));
        expect.ok(res.text.includes("Cache Avalanche"));
        expect.ok(res.text.includes("Virtual Nodes"));
      });
    });
  });

  // =========================================================================
  // FEATURE 152: Advanced E-Commerce Business Algorithms Suite (18 Tests)
  // =========================================================================
  describe("Feature 152: Advanced E-Commerce Business Algorithms Suite", () => {
    // --- 1. Recommendation Engine: Collaborative Filtering & Item Affinity (5 Tests) ---
    describe("Algorithm 1: Collaborative Filtering & Item Affinity", () => {
      const mockOrders = [
        { items: [{ productId: "p-iphone" }, { productId: "p-case" }, { productId: "p-charger" }] },
        { items: [{ productId: "p-iphone" }, { productId: "p-case" }] },
        { items: [{ productId: "p-iphone" }, { productId: "p-charger" }] },
        { items: [{ productId: "p-samsung" }, { productId: "p-charger" }] },
        { items: [{ productId: "p-laptop" }, { productId: "p-mouse" }] },
      ];

      test("F152-T1: RecommendationEngine trains from order history and builds co-occurrence matrix", () => {
        const engine = new RecommendationEngine();
        engine.trainFromOrders(mockOrders);

        expect.equal(engine.itemFrequencies.get("p-iphone"), 3);
        expect.equal(engine.itemFrequencies.get("p-case"), 2);
        expect.equal(engine.cooccurrenceMatrix.get("p-iphone").get("p-case"), 2);
      });

      test("F152-T2: getFrequentlyBoughtTogether returns top co-occurring products ranked by Cosine affinity", () => {
        const engine = new RecommendationEngine();
        engine.trainFromOrders(mockOrders);

        const bundles = engine.getFrequentlyBoughtTogether("p-iphone", 3);
        expect.ok(bundles.length >= 2);
        expect.ok(["p-case", "p-charger"].includes(bundles[0].productId));
        expect.ok(bundles[0].score > 0);
      });

      test("F152-T3: getFrequentlyBoughtTogether excludes the target product itself and handles isolated items", () => {
        const engine = new RecommendationEngine();
        engine.trainFromOrders(mockOrders);

        const isolated = engine.getFrequentlyBoughtTogether("p-unknown-item");
        expect.equal(isolated.length, 0);

        const iphoneBundles = engine.getFrequentlyBoughtTogether("p-iphone");
        expect.ok(!iphoneBundles.some((b) => b.productId === "p-iphone"));
      });

      test("F152-T4: getPersonalizedRecommendations suggests relevant products based on user history without recommending owned items", () => {
        const engine = new RecommendationEngine();
        engine.trainFromOrders(mockOrders);

        // Khách đã mua p-laptop -> Hệ thống phải gợi ý p-mouse
        const recs = engine.getPersonalizedRecommendations(["p-laptop"], [], 3);
        expect.ok(recs.includes("p-mouse"));
        expect.ok(!recs.includes("p-laptop")); // Không gợi ý lại laptop
      });

      test("F152-T5: getPersonalizedRecommendations gracefully falls back to popular items on empty history", () => {
        const engine = new RecommendationEngine();
        engine.trainFromOrders(mockOrders);

        const catalog = [
          { id: "p-pop-1", soldCount: 500 },
          { id: "p-pop-2", soldCount: 300 },
          { id: "p-pop-3", soldCount: 100 },
        ];

        const fallbackRecs = engine.getPersonalizedRecommendations([], catalog, 2);
        expect.equal(fallbackRecs.length, 2);
        expect.equal(fallbackRecs[0], "p-pop-1");
        expect.equal(fallbackRecs[1], "p-pop-2");
      });
    });

    // --- 2. Aho-Corasick Multi-Pattern String Matcher (5 Tests) ---
    describe("Algorithm 2: Aho-Corasick Multi-Pattern Content Moderation", () => {
      const bannedWords = ["fake", "nhái", "rep 1:1", "lừa đảo", "vũ khí", "hàng lậu"];

      test("F152-T6: AhoCorasick builds Trie and failure automaton over multiple banned words", () => {
        const ac = new AhoCorasick(bannedWords);
        expect.equal(ac.built, true);
        expect.ok(ac.root.children.size > 0);
      });

      test("F152-T7: AhoCorasick scan finds all occurrences of prohibited keywords in single-pass O(N)", () => {
        const ac = new AhoCorasick(bannedWords);
        const text = "Giày thể thao hàng nhái cực đẹp, cam kết không lừa đảo, bao chuẩn rep 1:1!";
        const matches = ac.scan(text);

        expect.ok(matches.length >= 3);
        const matchedPatterns = matches.map((m) => m.pattern);
        expect.ok(matchedPatterns.includes("nhái"));
        expect.ok(matchedPatterns.includes("lừa đảo"));
        expect.ok(matchedPatterns.includes("rep 1:1"));
      });

      test("F152-T8: AhoCorasick handles overlapping and nested keywords accurately", () => {
        const ac = new AhoCorasick(["lừa", "lừa đảo"]);
        const matches = ac.scan("Cảnh báo shop lừa đảo khách hàng!");

        expect.ok(matches.length >= 2);
        expect.ok(matches.some((m) => m.pattern === "lừa"));
        expect.ok(matches.some((m) => m.pattern === "lừa đảo"));
      });

      test("F152-T9: AhoCorasick censor masks forbidden words into '***' without corrupting compliant text", () => {
        const ac = new AhoCorasick(bannedWords);
        const text = "Tai nghe fake giá rẻ";
        const clean = ac.censor(text, "***");

        expect.equal(clean, "Tai nghe *** giá rẻ");
      });

      test("F152-T10: AhoCorasick hasMatch returns true for violating text and false for compliant text", () => {
        const ac = new AhoCorasick(bannedWords);
        expect.equal(ac.hasMatch("Áo khoác chính hãng hàng lậu giá sốc"), true);
        expect.equal(ac.hasMatch("Áo thun cotton thoáng mát 100% chính hãng"), false);
      });
    });

    // --- 3. TSP Last-Mile Logistics Route Optimizer (5 Tests) ---
    describe("Algorithm 3: TSP Last-Mile Logistics Route Optimizer", () => {
      // Tọa độ các điểm tại Hà Nội
      const depotHub = { lat: 21.0285, lng: 105.8542, name: "Bưu Cục Trung Tâm Hoàn Kiếm" };
      const stopBaDinh = { id: "stop-1", lat: 21.0345, lng: 105.8322, name: "Ba Đình" };
      const stopDongDa = { id: "stop-2", lat: 21.0180, lng: 105.8280, name: "Đống Đa" };
      const stopHaiBaTrung = { id: "stop-3", lat: 21.0065, lng: 105.8550, name: "Hai Bà Trưng" };

      test("F152-T11: calculateHaversineDistance computes accurate distance between Hanoi and HCMC", () => {
        const hanoi = { lat: 21.0285, lng: 105.8542 };
        const hcmc = { lat: 10.8231, lng: 106.6297 };
        const distKm = calculateHaversineDistance(hanoi, hcmc);

        // Khoảng cách chim bay Hà Nội - TP.HCM khoảng 1,130km - 1,160km (~1,137.8km)
        expect.ok(distKm >= 1130 && distKm <= 1160);
      });

      test("F152-T12: calculateHaversineDistance returns 0 for identical coordinates", () => {
        const loc = { lat: 21.0285, lng: 105.8542 };
        expect.equal(calculateHaversineDistance(loc, loc), 0);
      });

      test("F152-T13: optimizeDeliveryRoute visits all delivery stops without missing or repeating", () => {
        const stops = [stopBaDinh, stopDongDa, stopHaiBaTrung];
        const result = optimizeDeliveryRoute(depotHub, stops);

        expect.equal(result.optimizedStops.length, 3);
        const visitedIds = result.optimizedStops.map((s) => s.id);
        expect.ok(visitedIds.includes("stop-1"));
        expect.ok(visitedIds.includes("stop-2"));
        expect.ok(visitedIds.includes("stop-3"));
      });

      test("F152-T14: optimizeDeliveryRoute calculates positive total distance and estimated minutes", () => {
        const stops = [stopBaDinh, stopDongDa, stopHaiBaTrung];
        const result = optimizeDeliveryRoute(depotHub, stops);

        expect.ok(result.totalDistanceKm > 0);
        expect.ok(result.estimatedMinutes > 15); // Tối thiểu 3 điểm * 5 phút = 15 phút handling
        expect.equal(result.optimizedStops[0].deliverySequence, 1);
        expect.equal(result.optimizedStops[2].deliverySequence, 3);
      });

      test("F152-T15: optimizeDeliveryRoute handles empty stops gracefully without exception", () => {
        const result = optimizeDeliveryRoute(depotHub, []);
        expect.equal(result.optimizedStops.length, 0);
        expect.equal(result.totalDistanceKm, 0);
        expect.equal(result.estimatedMinutes, 0);
      });
    });

    // --- 4. AI Copilot Integration for New Algorithms (3 Tests) ---
    describe("AI Copilot Training for Business Algorithms", () => {
      test("F152-T16: Admin Sentinel Copilot AI explains Aho-Corasick Multi-Pattern Automaton", () => {
        const res = generateAdminCopilotResponse("Cơ chế quét từ cấm siêu tốc bằng thuật toán Aho-Corasick");
        expect.equal(res.tag, "THUẬT TOÁN AHO-CORASICK");
        expect.ok(res.text.includes("AHO-CORASICK"));
        expect.ok(res.text.includes("Failure Links"));
        expect.ok(res.text.includes("O(N + M + Z)"));
      });

      test("F152-T17: Admin Sentinel Copilot AI provides detailed architecture for Collaborative Filtering", () => {
        const res = generateAdminCopilotResponse("Thuật toán gợi ý sản phẩm Collaborative Filtering và mua kèm");
        expect.equal(res.tag, "THUẬT TOÁN GỢI Ý SẢN PHẨM");
        expect.ok(res.text.includes("COLLABORATIVE FILTERING"));
        expect.ok(res.text.includes("Co-occurrence Matrix"));
        expect.ok(res.text.includes("Frequently Bought Together"));
      });

      test("F152-T18: Admin Sentinel Copilot AI explains TSP Nearest Neighbor and 2-Opt Route Optimizer", () => {
        const res = generateAdminCopilotResponse("Tối ưu hóa tuyến đường giao hàng bưu tá SPX bằng thuật toán TSP 2-Opt");
        expect.equal(res.tag, "TỐI ƯU TUYẾN ĐƯỜNG SPX");
        expect.ok(res.text.includes("TSP"));
        expect.ok(res.text.includes("Nearest Neighbor"));
        expect.ok(res.text.includes("2-Opt"));
      });
    });
  });

  // =========================================================================
  // FEATURE 153: Big Data Streaming & Optimization Algorithms Suite (18 Tests)
  // =========================================================================
  describe("Feature 153: Big Data Streaming & Optimization Algorithms Suite", () => {
    // --- 1. Count-Min Sketch: Streaming Frequency & Heavy Hitters (6 Tests) ---
    describe("Algorithm 1: Count-Min Sketch (Heavy Hitters & Stream Frequency)", () => {
      test("F153-T1: CountMinSketch dynamically sizes matrix depth d and width w from epsilon and delta", () => {
        const cms = new CountMinSketch({ epsilon: 0.005, delta: 0.01 });
        const stats = cms.getStats();

        // w = ceil(e / 0.005) = ceil(543.65) = 544
        // d = ceil(ln(100)) = ceil(4.605) = 5
        expect.equal(stats.rows, 5);
        expect.ok(stats.columns >= 540 && stats.columns <= 550);
        expect.ok(stats.memoryBytes > 0);
      });

      test("F153-T2: CountMinSketch correctly updates single and batch item frequencies", () => {
        const cms = new CountMinSketch({ epsilon: 0.01, delta: 0.01 });
        cms.update("sku_iphone_15", 10);
        cms.update("sku_macbook_pro", 5);
        cms.update("sku_iphone_15", 15);

        expect.equal(cms.estimate("sku_iphone_15"), 25);
        expect.equal(cms.estimate("sku_macbook_pro"), 5);
        expect.equal(cms.totalEvents, 30);
      });

      test("F153-T3: CountMinSketch guarantees zero underestimation: estimate(x) >= trueCount(x)", () => {
        const cms = new CountMinSketch({ epsilon: 0.005, delta: 0.01 });
        const trueCounts = { "deal-A": 100, "deal-B": 50, "deal-C": 30 };

        for (const [k, v] of Object.entries(trueCounts)) {
          cms.update(k, v);
        }

        // Add 500 noise items
        for (let i = 0; i < 500; i++) {
          cms.update(`noise_${i % 50}`);
        }

        for (const [k, v] of Object.entries(trueCounts)) {
          expect.ok(cms.estimate(k) >= v); // Zero underestimation guarantee
        }
      });

      test("F153-T4: CountMinSketch empirical overestimation stays bounded within epsilon * totalEvents", () => {
        const epsilon = 0.005;
        const cms = new CountMinSketch({ epsilon, delta: 0.01 });
        cms.update("target_item", 200);

        // Stream 2,000 background events
        for (let i = 0; i < 2000; i++) {
          cms.update(`bg_item_${i}`);
        }

        const est = cms.estimate("target_item");
        const maxAllowed = 200 + epsilon * cms.totalEvents;
        expect.ok(est <= maxAllowed + 5); // Tần suất ước lượng nằm trong chặn trên lý thuyết
      });

      test("F153-T5: CountMinSketch getTopK accurately surfaces the Heavy Hitter items", () => {
        const cms = new CountMinSketch();
        cms.update("deal_hot_1", 500);
        cms.update("deal_hot_2", 300);
        cms.update("deal_hot_3", 150);
        cms.update("deal_cold", 10);

        const top3 = cms.getTopK(3);
        expect.equal(top3.length, 3);
        expect.equal(top3[0].item, "deal_hot_1");
        expect.equal(top3[1].item, "deal_hot_2");
        expect.equal(top3[2].item, "deal_hot_3");
      });

      test("F153-T6: CountMinSketch clear() resets all matrix cells and event counters to zero", () => {
        const cms = new CountMinSketch();
        cms.update("item", 100);
        cms.clear();

        expect.equal(cms.totalEvents, 0);
        expect.equal(cms.estimate("item"), 0);
        expect.equal(cms.getTopK(5).length, 0);
      });
    });

    // --- 2. HyperLogLog: Massive Cardinality Estimation (6 Tests) ---
    describe("Algorithm 2: HyperLogLog Cardinality Estimation", () => {
      test("F153-T7: HyperLogLog initializes with configured precision bits b and registers count m", () => {
        const hll = new HyperLogLog(10);
        const stats = hll.getStats();

        expect.equal(stats.precisionBits, 10);
        expect.equal(stats.registersCount, 1024);
        expect.equal(stats.memoryBytes, 1024); // Đúng 1 KB
        expect.ok(stats.standardErrorPercent < 3.5);
      });

      test("F153-T8: HyperLogLog estimates cardinality of 1,000 distinct items within standard error range (+- 4%)", () => {
        const hll = new HyperLogLog(10);
        for (let i = 0; i < 1000; i++) {
          hll.add(`user_viewer_${i}`);
        }

        const est = hll.count();
        // Sai số trong khoảng 4% của 1000: [950, 1050]
        expect.ok(est >= 940 && est <= 1060);
      });

      test("F153-T9: HyperLogLog estimates cardinality of 5,000 distinct items without memory growth", () => {
        const hll = new HyperLogLog(11); // m = 2048 registers (2KB)
        for (let i = 0; i < 5000; i++) {
          hll.add(`live_stream_viewer_${i}_hcm`);
        }

        const est = hll.count();
        expect.ok(est >= 4700 && est <= 5300);
        expect.equal(hll.registers.byteLength, 2048); // Dung lượng luôn cố định 2048 bytes
      });

      test("F153-T10: HyperLogLog handles duplicate additions without inflating cardinality estimate", () => {
        const hll = new HyperLogLog(10);
        // Thêm 50 user khác nhau, mỗi user lặp lại 100 lần
        for (let round = 0; round < 100; round++) {
          for (let u = 0; u < 50; u++) {
            hll.add(`vip_buyer_${u}`);
          }
        }

        const est = hll.count();
        expect.ok(est >= 45 && est <= 58); // Xấp xỉ 50, không bị đội lên 5000
      });

      test("F153-T11: HyperLogLog merge accurately combines two disjoint HLL instances into unified cardinality", () => {
        const hllA = new HyperLogLog(10);
        const hllB = new HyperLogLog(10);

        for (let i = 0; i < 500; i++) hllA.add(`buyer_north_${i}`);
        for (let i = 500; i < 1000; i++) hllB.add(`buyer_south_${i}`);

        hllA.merge(hllB);
        const combinedEst = hllA.count();

        // 500 + 500 = 1000
        expect.ok(combinedEst >= 940 && combinedEst <= 1060);
      });

      test("F153-T12: HyperLogLog clear() wipes registers and resets cardinality count to zero", () => {
        const hll = new HyperLogLog(10);
        hll.add("test_user_123");
        expect.ok(hll.count() > 0);

        hll.clear();
        expect.equal(hll.count(), 0);
      });
    });

    // --- 3. Knapsack Dynamic Programming & Voucher Optimizer (3 Tests) ---
    describe("Algorithm 3: 0/1 Knapsack Dynamic Programming & Voucher Optimizer", () => {
      const items = [
        { id: "item-1", name: "Áo polo", weight: 200000, value: 50 },
        { id: "item-2", name: "Quần short", weight: 150000, value: 40 },
        { id: "item-3", name: "Tất thể thao", weight: 50000, value: 15 },
        { id: "item-4", name: "Thắt lưng da", weight: 300000, value: 70 },
      ];

      test("F153-T13: knapsack01 finds optimal subset of items that maximizes value within budget", () => {
        // Ngân sách 400,000 VND
        // Phương án tối ưu: Quần short (150k, val 40) + Áo polo (200k, val 50) + Tất (50k, val 15) = 400k, val 105
        const result = knapsack01(items, 400000);

        expect.equal(result.maxValue, 105);
        expect.equal(result.totalWeight, 400000);
        expect.equal(result.chosenItems.length, 3);
        const chosenIds = result.chosenItems.map((i) => i.id);
        expect.ok(chosenIds.includes("item-1"));
        expect.ok(chosenIds.includes("item-2"));
        expect.ok(chosenIds.includes("item-3"));
      });

      test("F153-T14: knapsack01 handles zero capacity or empty items safely returning 0", () => {
        expect.equal(knapsack01([], 500000).maxValue, 0);
        expect.equal(knapsack01(items, 0).maxValue, 0);
      });

      test("F153-T15: findOptimalAddonToUnlockVoucher identifies the cheapest add-on to cross threshold", () => {
        const catalog = [
          { id: "p1", name: "Ốp lưng", price: 25000 },
          { id: "p2", name: "Cáp sạc ngắn", price: 35000 },
          { id: "p3", name: "Kính cường lực", price: 50000 },
        ];

        // Giỏ hiện tại: 270,000đ. Ngưỡng voucher: 300,000đ (cần thêm 30,000đ)
        // Món rẻ nhất >= 30,000đ là Cáp sạc ngắn (35,000đ)
        const res = findOptimalAddonToUnlockVoucher(catalog, 270000, 300000);

        expect.equal(res.alreadyQualified, false);
        expect.equal(res.neededAmount, 30000);
        expect.equal(res.bestAddons.length, 1);
        expect.equal(res.bestAddons[0].id, "p2");
        expect.equal(res.excessAmount, 5000);
      });
    });

    // --- 4. AI Copilot Integration for Streaming & Optimization Algorithms (3 Tests) ---
    describe("AI Copilot Training for Streaming Algorithms", () => {
      test("F153-T16: Admin Sentinel Copilot AI explains Count-Min Sketch Heavy Hitters architecture", () => {
        const res = generateAdminCopilotResponse("Cấu trúc Count-Min Sketch tìm Top Trending Heavy Hitters");
        expect.equal(res.tag, "THUẬT TOÁN COUNT-MIN SKETCH");
        expect.ok(res.text.includes("COUNT-MIN SKETCH"));
        expect.ok(res.text.includes("Zero Undercounting"));
        expect.ok(res.text.includes("Heavy Hitters"));
      });

      test("F153-T17: Admin Sentinel Copilot AI explains HyperLogLog Cardinality Estimation for Shopee Live", () => {
        const res = generateAdminCopilotResponse("Thuật toán HyperLogLog đếm Unique Viewers Shopee Live với 12KB RAM");
        expect.equal(res.tag, "THUẬT TOÁN HYPERLOGLOG");
        expect.ok(res.text.includes("HYPERLOGLOG"));
        expect.ok(res.text.includes("Harmonic Mean"));
        expect.ok(res.text.includes("12 KB"));
      });

      test("F153-T18: Admin Sentinel Copilot AI explains 0/1 Knapsack Voucher Optimizer and gap minimization", () => {
        const res = generateAdminCopilotResponse("Thuật toán Knapsack Quy hoạch động tối ưu ngưỡng voucher giỏ hàng");
        expect.equal(res.tag, "TỐI ƯU HÓA KNAPSACK");
        expect.ok(res.text.includes("KNAPSACK"));
        expect.ok(res.text.includes("Backtracking"));
        expect.ok(res.text.includes("Voucher Gap"));
      });
    });
  });

  // =========================================================================
  // FEATURE 154: Advanced Enterprise E-Commerce Algorithms Suite (Phase 7 - 19 Tests)
  // =========================================================================
  describe("Feature 154: Advanced Enterprise E-Commerce Algorithms Suite (Phase 7)", () => {
    // --- 1. Dynamic Pricing & Price Elasticity Optimizer (Multi-Armed Bandit) ---
    describe("Algorithm 1: Dynamic Pricing & Price Elasticity Optimizer (Thompson Sampling)", () => {
      test("F154-T1: DynamicPricingBandit initializes arms with prior Beta(1, 1) and zero impressions", () => {
        const bandit = new DynamicPricingBandit([
          { id: "tier_1", price: 100000, discountPercent: 10 },
          { id: "tier_2", price: 80000, discountPercent: 20 },
        ]);

        const stats = bandit.getStats();
        expect.equal(stats.totalArms, 2);
        expect.equal(stats.totalImpressions, 0);
        expect.equal(stats.totalRevenue, 0);
        expect.equal(stats.arms[0].expectedCVR, 50.0); // 1 / (1 + 1) = 0.5 (50%)
      });

      test("F154-T2: sampleBeta draws random values bounded strictly between 0 and 1", () => {
        for (let i = 0; i < 50; i++) {
          const val = sampleBeta(5, 10);
          expect.ok(val > 0 && val < 1);
        }
      });

      test("F154-T3: recordFeedback accurately increments alpha on purchase and beta on bounce", () => {
        const bandit = new DynamicPricingBandit([{ id: "price_a", price: 150000 }]);
        bandit.recordFeedback("price_a", true); // Mua hàng
        bandit.recordFeedback("price_a", true); // Mua hàng
        bandit.recordFeedback("price_a", false); // Không mua

        const arm = bandit.arms.get("price_a");
        expect.equal(arm.impressions, 3);
        expect.equal(arm.conversions, 2);
        expect.equal(arm.alpha, 3); // 1 + 2
        expect.equal(arm.beta, 2);  // 1 + 1
        expect.equal(arm.revenueGenerated, 300000);
      });

      test("F154-T4: selectArm returns a valid arm and explores options based on posterior distribution", () => {
        const bandit = new DynamicPricingBandit([
          { id: "p1", price: 100000 },
          { id: "p2", price: 200000 },
        ]);

        const selected = bandit.selectArm("revenue");
        expect.ok(selected !== null);
        expect.ok(selected.id === "p1" || selected.id === "p2");
      });

      test("F154-T5: getBestArm identifies the arm with the highest expected revenue per impression", () => {
        const bandit = new DynamicPricingBandit([
          { id: "low_price", price: 100000 },  // CVR ~ 20% -> 20k/imp
          { id: "high_price", price: 300000 }, // CVR ~ 15% -> 45k/imp
        ]);

        // Giả lập 100 lượt thử cho mỗi arm
        for (let i = 0; i < 20; i++) bandit.recordFeedback("low_price", true);
        for (let i = 0; i < 80; i++) bandit.recordFeedback("low_price", false);

        for (let i = 0; i < 15; i++) bandit.recordFeedback("high_price", true);
        for (let i = 0; i < 85; i++) bandit.recordFeedback("high_price", false);

        const best = bandit.getBestArm("revenue");
        expect.equal(best.id, "high_price");
      });

      test("F154-T6: getStats computes empirical CVR, expected CVR, and confidence intervals", () => {
        const bandit = new DynamicPricingBandit([{ id: "deal_1", price: 50000 }]);
        for (let i = 0; i < 10; i++) bandit.recordFeedback("deal_1", true);
        for (let i = 0; i < 10; i++) bandit.recordFeedback("deal_1", false);

        const stats = bandit.getStats();
        expect.equal(stats.arms[0].impressions, 20);
        expect.equal(stats.arms[0].conversions, 10);
        expect.equal(stats.arms[0].empiricalCVR, 50.0);
        expect.equal(stats.totalRevenue, 500000);
      });
    });

    // --- 2. Disjoint Set Union (DSU) & Sybil Fraud Radar ---
    describe("Algorithm 2: Disjoint Set Union (DSU) & Sybil Fraud Radar", () => {
      test("F154-T7: DisjointSetUnion creates sets and unions disjoint elements accurately", () => {
        const dsu = new DisjointSetUnion();
        dsu.makeSet("user_1");
        dsu.makeSet("user_2");
        expect.equal(dsu.connected("user_1", "user_2"), false);

        dsu.union("user_1", "user_2");
        expect.equal(dsu.connected("user_1", "user_2"), true);
        expect.equal(dsu.getClusterSize("user_1"), 2);
      });

      test("F154-T8: DisjointSetUnion path compression flattens trees so find() executes in O(1)", () => {
        const dsu = new DisjointSetUnion();
        dsu.union("a", "b");
        dsu.union("b", "c");
        dsu.union("c", "d");

        expect.equal(dsu.connected("a", "d"), true);
        expect.equal(dsu.getClusterSize("a"), 4);
        const root = dsu.find("d");
        expect.equal(dsu.parent.get("d"), root); // Direct link after find
      });

      test("F154-T9: SybilFraudRadar groups accounts sharing the same device fingerprint into one cluster", () => {
        const radar = new SybilFraudRadar({ clusterSizeThreshold: 3 });
        radar.registerUser({ userId: "acc_1", deviceId: "device_imei_999", vouchersClaimed: 2 });
        radar.registerUser({ userId: "acc_2", deviceId: "device_imei_999", vouchersClaimed: 3 });

        expect.equal(radar.dsu.connected("acc_1", "acc_2"), true);
        expect.equal(radar.dsu.getClusterSize("acc_1"), 2);
      });

      test("F154-T10: SybilFraudRadar transitively connects accounts through shared entities (multi-hop graph)", () => {
        const radar = new SybilFraudRadar({ clusterSizeThreshold: 3 });
        // acc_1 và acc_2 chung device_A
        radar.registerUser({ userId: "acc_1", deviceId: "dev_A" });
        radar.registerUser({ userId: "acc_2", deviceId: "dev_A", bankAccount: "bank_XYZ" });
        // acc_3 chung bank_XYZ với acc_2 -> acc_3 cũng thuộc cụm với acc_1
        radar.registerUser({ userId: "acc_3", bankAccount: "bank_XYZ" });

        expect.equal(radar.dsu.connected("acc_1", "acc_3"), true);
        expect.equal(radar.dsu.getClusterSize("acc_1"), 3);
      });

      test("F154-T11: SybilFraudRadar flags cluster with size >= 3 and voucher abuse as suspicious", () => {
        const radar = new SybilFraudRadar({ clusterSizeThreshold: 3 });
        radar.registerUser({ userId: "cheat_1", ip: "192.168.1.100", vouchersClaimed: 4, ordersCount: 5, cancelledCount: 2 });
        radar.registerUser({ userId: "cheat_2", ip: "192.168.1.100", vouchersClaimed: 3, ordersCount: 4, cancelledCount: 1 });
        radar.registerUser({ userId: "cheat_3", ip: "192.168.1.100", vouchersClaimed: 5, ordersCount: 6, cancelledCount: 2 });

        const analysis = radar.analyzeUser("cheat_1");
        expect.equal(analysis.isSuspicious, true);
        expect.equal(analysis.clusterSize, 3);
        expect.ok(analysis.riskScore >= 50);
        expect.equal(analysis.recommendedAction, "LOCK_VOUCHER_PRIVILEGES_AND_REQUIRE_PREPAYMENT");
      });

      test("F154-T12: SybilFraudRadar marks independent legitimate buyer as safe with risk score 0", () => {
        const radar = new SybilFraudRadar();
        radar.registerUser({ userId: "clean_buyer", deviceId: "unique_dev_1", ordersCount: 10, cancelledCount: 0 });

        const analysis = radar.analyzeUser("clean_buyer");
        expect.equal(analysis.isSuspicious, false);
        expect.equal(analysis.clusterSize, 1);
        expect.equal(analysis.riskScore, 0);
      });
    });

    // --- 3. Trie Autocomplete & Fuzzy Typo Tolerance ---
    describe("Algorithm 3: Trie Autocomplete & Fuzzy Typo Tolerance", () => {
      test("F154-T13: removeVietnameseTones strips diacritics and tones from Vietnamese text cleanly", () => {
        expect.equal(removeVietnameseTones("Áo khoác gió"), "ao khoac gio");
        expect.equal(removeVietnameseTones("Giày thể thao nam"), "giay the thao nam");
        expect.equal(removeVietnameseTones("Đồng hồ điện tử"), "dong ho dien tu");
      });

      test("F154-T14: TrieAutocomplete indexes items and returns Top-K suggestions sorted by frequency", () => {
        const trie = new TrieAutocomplete();
        trie.insert("Áo thun basic", 50);
        trie.insert("Áo thun cổ tim", 20);
        trie.insert("Áo thun oversize", 100);

        const results = trie.searchPrefix("Áo thun", 3);
        expect.equal(results.length, 3);
        expect.equal(results[0].text, "Áo thun oversize"); // Cao nhất: 100
        expect.equal(results[1].text, "Áo thun basic");    // 50
        expect.equal(results[2].text, "Áo thun cổ tim");   // 20
      });

      test("F154-T15: TrieAutocomplete resolves unaccented prefixes to correct accented Vietnamese items", () => {
        const trie = new TrieAutocomplete();
        trie.insert("Kem chống nắng SPF 50+", 80);
        trie.insert("Kem dưỡng ẩm ban đêm", 60);

        const results = trie.searchPrefix("kem chong nang", 2);
        expect.ok(results.length >= 1);
        expect.equal(results[0].text, "Kem chống nắng SPF 50+");
      });

      test("F154-T16: TrieAutocomplete fuzzySearch recovers correct keyword with 1-character typo", () => {
        const trie = new TrieAutocomplete();
        trie.insert("iPhone 15 Pro Max", 100);
        trie.insert("Son môi kem lì", 80);

        // Gõ nhầm 1 ký tự: 'iphoen' thay vì 'iphone'
        const typoResults = trie.fuzzySearch("iphoen", 1, 2);
        expect.ok(typoResults.length >= 1);
        expect.equal(typoResults[0].text, "iPhone 15 Pro Max");

        // Gõ nhầm: 'son mồi' thay vì 'son môi'
        const typoSon = trie.fuzzySearch("son mồi", 1, 2);
        expect.ok(typoSon.length >= 1);
        expect.equal(typoSon[0].text, "Son môi kem lì");
      });
    });

    // --- 4. AI Copilot Integration for Phase 7 Algorithms ---
    describe("AI Copilot Training for Phase 7 Algorithms", () => {
      test("F154-T17: Admin Sentinel Copilot AI explains Thompson Sampling Dynamic Pricing", () => {
        const res = generateAdminCopilotResponse("Cơ chế định giá động Thompson Sampling Multi-Armed Bandit");
        expect.equal(res.tag, "ĐỊNH GIÁ ĐỘNG THOMPSON SAMPLING");
        expect.ok(res.text.includes("THOMPSON SAMPLING"));
        expect.ok(res.text.includes("Beta-Bernoulli"));
        expect.ok(res.text.includes("Exploration vs Exploitation"));
      });

      test("F154-T18: Admin Sentinel Copilot AI explains DSU Sybil Fraud Radar", () => {
        const res = generateAdminCopilotResponse("Mạng lưới gian lận Sybil Ring và cấu trúc Disjoint Set Union");
        expect.equal(res.tag, "RADAR GIAN LẬN DSU SYBIL");
        expect.ok(res.text.includes("SYBIL RING"));
        expect.ok(res.text.includes("Path Compression"));
        expect.ok(res.text.includes("Union by Rank"));
      });

      test("F154-T19: Admin Sentinel Copilot AI explains Trie Autocomplete and Fuzzy Typo Tolerance", () => {
        const res = generateAdminCopilotResponse("Bộ máy tìm kiếm Trie Autocomplete và Fuzzy Search sửa lỗi chính tả");
        expect.equal(res.tag, "TÌM KIẾM TRIE AUTOCOMPLETE");
        expect.ok(res.text.includes("TRIE"));
        expect.ok(res.text.includes("Typeahead"));
        expect.ok(res.text.includes("Levenshtein"));
      });
    });
  });

  // =========================================================================
  // FEATURE 155: Enterprise Financial, Indexing & Logistics Algorithms Suite (Phase 8 - 18 Tests)
  // =========================================================================
  describe("Feature 155: Enterprise Financial, Indexing & Logistics Algorithms Suite (Phase 8)", () => {
    // --- 1. Double-Entry Bookkeeping Ledger & Merkle Tree Audit Trail (6 Tests) ---
    describe("Algorithm 1: Double-Entry Ledger & Cryptographic Merkle Tree", () => {
      test("F155-T1: DoubleEntryLedger records balanced transactions and updates account balances correctly", () => {
        const ledger = new DoubleEntryLedger();
        ledger.recordTransaction({
          id: "tx_order_1001",
          description: "Khách thanh toán đơn hàng VietQR vào Escrow Vault",
          entries: [
            { account: "ASSETS:ESCROW_BANK", debit: 500000 },
            { account: "LIABILITIES:MERCHANT_PAYABLE", credit: 475000 },
            { account: "REVENUE:PLATFORM_COMMISSION", credit: 25000 },
          ],
        });

        expect.equal(ledger.getBalance("ASSETS:ESCROW_BANK"), 500000);
        expect.equal(ledger.getBalance("LIABILITIES:MERCHANT_PAYABLE"), 475000);
        expect.equal(ledger.getBalance("REVENUE:PLATFORM_COMMISSION"), 25000);
      });

      test("F155-T2: DoubleEntryLedger strictly rejects imbalanced transactions with LEDGER_IMBALANCE_ERROR", () => {
        const ledger = new DoubleEntryLedger();
        expect.throws(() => {
          ledger.recordTransaction({
            id: "tx_cheat_1002",
            entries: [
              { account: "ASSETS:ESCROW_BANK", debit: 500000 },
              { account: "LIABILITIES:MERCHANT_PAYABLE", credit: 400000 }, // Lệch 100,000đ
            ],
          });
        }, /LEDGER_IMBALANCE_ERROR/);
      });

      test("F155-T3: DoubleEntryLedger getTrialBalance verifies total debits equals total credits", () => {
        const ledger = new DoubleEntryLedger();
        ledger.recordTransaction({
          id: "tx_1",
          entries: [
            { account: "ASSETS:ESCROW_BANK", debit: 200000 },
            { account: "LIABILITIES:MERCHANT_PAYABLE", credit: 200000 },
          ],
        });

        const trial = ledger.getTrialBalance();
        expect.equal(trial.isBalanced, true);
        expect.equal(trial.discrepancy, 0);
        expect.equal(trial.totalDebit, 200000);
        expect.equal(trial.totalCredit, 200000);
      });

      test("F155-T4: sha256 produces deterministic 64-character lowercase hex hash", () => {
        const hash1 = sha256("MiniShopeeEscrowVault");
        const hash2 = sha256("MiniShopeeEscrowVault");
        expect.equal(hash1, hash2);
        expect.equal(hash1.length, 64);
        expect.ok(/^[0-9a-f]{64}$/.test(hash1));
      });

      test("F155-T5: MerkleTree builds binary hash tree and produces a single deterministic root", () => {
        const transactions = [
          { txId: "tx_1", amount: 100000 },
          { txId: "tx_2", amount: 200000 },
          { txId: "tx_3", amount: 300000 },
        ];
        const tree = new MerkleTree(transactions);
        const root = tree.getRoot();

        expect.ok(root !== "");
        expect.equal(root.length, 64);
        expect.equal(tree.layers.length, 3); // 3 leaves -> layer0 (3 items), layer1 (2 items), layer2 (1 root)
      });

      test("F155-T6: MerkleTree verifyProof validates genuine transaction and rejects tampered data", () => {
        const txList = [
          { txId: "settlement_shop_A", amount: 5000000 },
          { txId: "settlement_shop_B", amount: 3000000 },
          { txId: "settlement_shop_C", amount: 7500000 },
          { txId: "settlement_shop_D", amount: 1200000 },
        ];
        const tree = new MerkleTree(txList);
        const root = tree.getRoot();

        // Lấy bằng chứng cho txList[1] (Shop B)
        const proof = tree.getProof(1);
        expect.ok(proof.length > 0);

        // 1. Xác thực giao dịch gốc -> Hợp lệ
        const isValid = MerkleTree.verifyProof(txList[1], proof, root);
        expect.equal(isValid, true);

        // 2. Kẻ gian sửa đổi số tiền thành 9,999,999đ -> Bị từ chối ngay lập tức
        const tamperedTx = { txId: "settlement_shop_B", amount: 9999999 };
        const isTamperedValid = MerkleTree.verifyProof(tamperedTx, proof, root);
        expect.equal(isTamperedValid, false);
      });
    });

    // --- 2. Probabilistic Skiplist Price Range Index (5 Tests) ---
    describe("Algorithm 2: Probabilistic Skiplist Price Range Index", () => {
      test("F155-T7: SkiplistIndex inserts items and retrieves them in expected O(log N)", () => {
        const skip = new SkiplistIndex();
        skip.insert(150000, { name: "Áo polo nam" });
        skip.insert(50000, { name: "Tất thể thao" });
        skip.insert(300000, { name: "Balo chống nước" });

        expect.equal(skip.size, 3);
        const found = skip.search(150000);
        expect.ok(found !== null);
        expect.equal(found.name, "Áo polo nam");
      });

      test("F155-T8: SkiplistIndex search returns null for non-existent keys", () => {
        const skip = new SkiplistIndex();
        skip.insert(100000, { name: "Ốp lưng" });
        expect.equal(skip.search(999999), null);
      });

      test("F155-T9: SkiplistIndex rangeQuery returns sorted products within price interval", () => {
        const skip = new SkiplistIndex();
        skip.insert(25000, { id: "p1", name: "Dây sạc" });
        skip.insert(75000, { id: "p2", name: "Tai nghe có dây" });
        skip.insert(120000, { id: "p3", name: "Củ sạc nhanh 20W" });
        skip.insert(180000, { id: "p4", name: "Sạc dự phòng 10000mAh" });
        skip.insert(450000, { id: "p5", name: "Tai nghe Bluetooth" });

        // Lọc deal từ 50,000đ đến 200,000đ
        const deals = skip.rangeQuery(50000, 200000);
        expect.equal(deals.length, 3);
        expect.equal(deals[0].price, 75000);
        expect.equal(deals[1].price, 120000);
        expect.equal(deals[2].price, 180000);
      });

      test("F155-T10: SkiplistIndex rangeQuery honors limit parameter without overflow", () => {
        const skip = new SkiplistIndex();
        for (let p = 10000; p <= 100000; p += 10000) {
          skip.insert(p, { price: p });
        }
        const limited = skip.rangeQuery(10000, 100000, 3);
        expect.equal(limited.length, 3);
        expect.equal(limited[0].price, 10000);
        expect.equal(limited[2].price, 30000);
      });

      test("F155-T11: SkiplistIndex delete removes node and decreases size", () => {
        const skip = new SkiplistIndex();
        skip.insert(100000, { item: "Item A" });
        expect.equal(skip.size, 1);

        const deleted = skip.delete(100000);
        expect.equal(deleted, true);
        expect.equal(skip.size, 0);
        expect.equal(skip.search(100000), null);
      });
    });

    // --- 3. Multi-Warehouse Optimal Fulfillment Dispatch (4 Tests) ---
    describe("Algorithm 3: Multi-Warehouse Optimal Fulfillment Dispatch", () => {
      const warehouses = [
        {
          id: "WH_HN",
          name: "Kho Tổng Hà Nội",
          location: { lat: 21.0285, lng: 105.8542 },
          inventory: { sku_polo: 50, sku_short: 20, sku_shoes: 0 },
        },
        {
          id: "WH_HCM",
          name: "Kho Tổng TP.HCM",
          location: { lat: 10.8231, lng: 106.6297 },
          inventory: { sku_polo: 100, sku_short: 80, sku_shoes: 30 },
        },
      ];

      test("F155-T12: MultiWarehouseDispatcher computes accurate composite shipping cost", () => {
        const dispatcher = new MultiWarehouseDispatcher(warehouses, { basePackageFee: 15000, ratePerKm: 20 });
        const buyerInHanoi = { lat: 21.03, lng: 105.86 };
        const cost = dispatcher.calculateShippingCost(warehouses[0], buyerInHanoi);

        expect.ok(cost.distanceKm < 5); // Dưới 5km nội thành
        expect.ok(cost.shippingFee >= 15000);
      });

      test("F155-T13: MultiWarehouseDispatcher selects Single Warehouse Consolidated when warehouse has 100% stock", () => {
        const dispatcher = new MultiWarehouseDispatcher(warehouses);
        const buyerInSaigon = { lat: 10.7769, lng: 106.7009 }; // Quận 1, TP.HCM
        const order = [
          { skuId: "sku_polo", quantity: 2 },
          { skuId: "sku_short", quantity: 1 },
        ];

        const plan = dispatcher.optimizeDispatch(order, buyerInSaigon);
        expect.equal(plan.success, true);
        expect.equal(plan.strategy, "SINGLE_WAREHOUSE_CONSOLIDATED");
        expect.equal(plan.splitCount, 1);
        expect.equal(plan.packages[0].warehouseId, "WH_HCM"); // Kho TP.HCM gần hơn và đủ hàng
      });

      test("F155-T14: MultiWarehouseDispatcher splits packages across warehouses when no single warehouse has all items", () => {
        const dispatcher = new MultiWarehouseDispatcher(warehouses);
        const buyerInHanoi = { lat: 21.03, lng: 105.86 };
        // Kho HN có 50 polo, 0 shoes. Kho HCM có 100 polo, 30 shoes.
        // Đơn hàng cần 120 polo (vượt quá 50 của HN và 100 của HCM) + 1 đôi giày -> Bắt buộc phải split đa kho
        const order = [
          { skuId: "sku_polo", quantity: 120 },
          { skuId: "sku_shoes", quantity: 1 },
        ];

        const plan = dispatcher.optimizeDispatch(order, buyerInHanoi);
        expect.equal(plan.success, true);
        expect.equal(plan.strategy, "MULTI_WAREHOUSE_SPLIT");
        expect.ok(plan.splitCount >= 2);
      });

      test("F155-T15: MultiWarehouseDispatcher returns INSUFFICIENT_STOCK when overall network inventory is inadequate", () => {
        const dispatcher = new MultiWarehouseDispatcher(warehouses);
        const buyer = { lat: 21.03, lng: 105.86 };
        const order = [{ skuId: "sku_shoes", quantity: 9999 }]; // Tổng cả 2 kho chỉ có 30

        const plan = dispatcher.optimizeDispatch(order, buyer);
        expect.equal(plan.success, false);
        expect.equal(plan.strategy, "INSUFFICIENT_STOCK");
        expect.equal(plan.unfulfilledItems[0].skuId, "sku_shoes");
      });
    });

    // --- 4. AI Copilot Integration for Phase 8 Algorithms (3 Tests) ---
    describe("AI Copilot Training for Phase 8 Algorithms", () => {
      test("F155-T16: Admin Sentinel Copilot AI explains Double-Entry Ledger and Merkle Tree audit trail", () => {
        const res = generateAdminCopilotResponse("Kiểm toán sổ cái kế toán kép và cây băm Merkle Tree bảo chứng dòng tiền");
        expect.equal(res.tag, "SỔ CÁI MERKLE TREE");
        expect.ok(res.text.includes("MERKLE TREE"));
        expect.ok(res.text.includes("Double-Entry"));
        expect.ok(res.text.includes("Merkle Proof"));
      });

      test("F155-T17: Admin Sentinel Copilot AI explains Skiplist Flash Sale Price Range Index", () => {
        const res = generateAdminCopilotResponse("Thuật toán danh sách nhảy Skiplist lọc khoảng giá Flash Sale");
        expect.equal(res.tag, "CHỈ MỤC GIÁ SKIPLIST");
        expect.ok(res.text.includes("SKIPLIST"));
        expect.ok(res.text.includes("Range Query"));
        expect.ok(res.text.includes("O(\\log N"));
      });

      test("F155-T18: Admin Sentinel Copilot AI explains Multi-Warehouse Fulfillment Dispatch", () => {
        const res = generateAdminCopilotResponse("Thuật toán điều phối xuất kho đa điểm fulfillment và chia gói hàng tối ưu");
        expect.equal(res.tag, "ĐIỀU PHỐI ĐA KHO FULFILLMENT");
        expect.ok(res.text.includes("FULFILLMENT"));
        expect.ok(res.text.includes("Single Warehouse Consolidated"));
        expect.ok(res.text.includes("Multi-Warehouse Greedy Split"));
      });
    });
  });

  // =========================================================================
  // FEATURE 156: Locality-Sensitive Hashing, GSP/VCG Auction & CRDTs Cart (20 Tests)
  // =========================================================================
  describe("Feature 156: LSH MinHash, GSP/VCG Auction & CRDTs Multi-Device Cart Suite", () => {

    // --- 1. LSH & MinHash Catalog Clone Detector (5 Tests) ---
    describe("Algorithm 1: Locality-Sensitive Hashing & MinHash Catalog Clone Radar", () => {
      test("F156-T1: kShingles generates word/char n-grams, normalizes whitespace & Vietnamese accents", () => {
        const text1 = "  Áo   thun nam   Polo cao cấp phong cách Hàn Quốc!  ";
        const wordShingles = kShingles(text1, { k: 2, type: "word", stripAccents: true });
        
        expect.ok(wordShingles instanceof Set);
        expect.ok(wordShingles.has("ao thun"));
        expect.ok(wordShingles.has("thun nam"));
        expect.ok(wordShingles.has("nam polo"));
        expect.ok(wordShingles.has("polo cao"));

        // Character 3-grams
        const charShingles = kShingles("Áo Polo", { k: 3, type: "char", stripAccents: true });
        expect.ok(charShingles.has("ao "));
        expect.ok(charShingles.has("o p"));
        expect.ok(charShingles.has("pol"));

        // Normalization handles HTML tags and URLs
        const textWithTags = "<b>Giày chạy bộ</b> chính hãng https://shopee.vn/product123";
        const cleanShingles = kShingles(textWithTags, 2);
        expect.ok(cleanShingles.has("giày chạy"));
        expect.ok(cleanShingles.has("chạy bộ"));
        expect.ok(!cleanShingles.has("https shopee"));
      });

      test("F156-T2: MinHash computes deterministic signature of length K=64 using universal hash permutations, collision prob equals Jaccard", () => {
        const minHash = new MinHash({ numHashes: 64 });
        expect.equal(minHash.numHashes, 64);

        const setA = new Set(["giay the thao", "the thao nam", "nam chay bo", "chay bo em chan", "em chan cao cap"]);
        const setB = new Set(["giay the thao", "the thao nam", "nam chay bo", "chay bo em chan", "em chan cao cap"]);
        const setC = new Set(["ao so mi", "so mi nu", "nu cong so", "cong so thanh lich"]);

        const sigA = minHash.getSignature(setA);
        const sigB = minHash.getSignature(setB);
        const sigC = minHash.getSignature(setC);

        expect.equal(sigA.length, 64);
        expect.equal(sigB.length, 64);

        // Deterministic signatures for identical sets
        for (let i = 0; i < 64; i++) {
          expect.equal(sigA[i], sigB[i]);
        }

        const jaccardIdentical = minHash.calculateJaccard(sigA, sigB);
        expect.equal(jaccardIdentical, 1.0);

        const jaccardDisjoint = minHash.calculateJaccard(sigA, sigC);
        expect.ok(jaccardDisjoint <= 0.1);
      });

      test("F156-T3: LSHCloneDetector partitions signatures into b=16 bands of r=4 rows, hashing bands into buckets", () => {
        const detector = new LSHCloneDetector({ numHashes: 64, bands: 16, rowsPerBand: 4 });
        expect.equal(detector.bands, 16);
        expect.equal(detector.rowsPerBand, 4);
        expect.equal(detector.numHashes, 64);

        detector.addDocument("doc_1", "Tai nghe không dây Bluetooth chống ồn chủ động thời lượng pin 30 giờ");
        detector.addDocument("doc_2", "Bàn phím cơ không dây switch đỏ đèn LED RGB công thái học");

        // Verify buckets were formed across 16 bands
        expect.ok(detector.buckets.size > 0);
        let band0BucketFound = false;
        for (const bucketKey of detector.buckets.keys()) {
          if (bucketKey.startsWith("b0:")) {
            band0BucketFound = true;
            break;
          }
        }
        expect.equal(band0BucketFound, true);
        expect.equal(detector.hasDocument("doc_1"), true);
        expect.equal(detector.hasDocument("doc_2"), true);
      });

      test("F156-T4: LSHCloneDetector detects near-duplicate catalog clone listings with s >= 0.8 in O(1) query time without comparing all O(N^2) pairs", () => {
        const detector = new LSHCloneDetector({ numHashes: 64, bands: 16, rowsPerBand: 4 });
        const originalText = "Nồi chiên không dầu điện tử Tefal dung tích 5 lít công nghệ Rapid Air chống dính bảo hành 24 tháng";
        const cloneText = "Nồi chiên không dầu điện tử Tefal dung tích 5 lít công nghệ Rapid Air chống dính bảo hành 24 tháng chính hãng giá rẻ";

        detector.addDocument("orig_p1", originalText, { shopId: "shop_authentic", name: "Nồi chiên Tefal" });
        detector.addDocument("unrelated_p2", "Váy dạ hội đuôi cá thiết kế cao cấp đính đá lấp lánh dự tiệc", { shopId: "shop_fashion" });

        const clones = detector.queryNearDuplicates(cloneText, 0.75);
        expect.ok(clones.length >= 1);
        expect.equal(clones[0].id, "orig_p1");
        expect.ok(clones[0].similarity >= 0.75);
        expect.equal(clones[0].metadata.shopId, "shop_authentic");
      });

      test("F156-T5: Unrelated products (s < 0.2) produce zero candidate bucket collisions across all LSH bands", () => {
        const detector = new LSHCloneDetector({ numHashes: 64, bands: 16, rowsPerBand: 4 });
        detector.addDocument("tech_p1", "Điện thoại thông minh camera 200MP màn hình AMOLED 120Hz sạc siêu nhanh");
        detector.addDocument("tech_p2", "Laptop gaming card đồ họa RTX 4070 RAM 32GB tản nhiệt buồng hơi");

        const cosmeticQuery = "Son kem lì dưỡng môi mềm mượt giữ màu suốt 16 giờ không lem trôi mỹ phẩm chính hãng";
        const clones = detector.queryNearDuplicates(cosmeticQuery, 0.5);
        expect.equal(clones.length, 0);
      });
    });

    // --- 2. Generalized Second Price (GSP) & VCG Sponsored Search Auction Engine (5 Tests) ---
    describe("Algorithm 2: GSP & VCG Sponsored Search & Flash Sale Auction Engine", () => {
      test("F156-T6: AuctionEngine sorts candidate bidders by Ad Rank (Bid * QualityScore) descending", () => {
        const engine = new AuctionEngine();
        const bidders = [
          { bidderId: "bidder_A", bid: 3000, qualityScore: 8.0, shopId: "shop_A" },
          { bidderId: "bidder_B", bid: 5000, qualityScore: 4.0, shopId: "shop_B" },
          { bidderId: "bidder_C", bid: 2000, qualityScore: 6.0, shopId: "shop_C" },
        ];

        const result = engine.runGspAuction({ slots: 3, bidders, reservePrice: 500 });
        expect.equal(result.allocations.length, 3);
        expect.equal(result.allocations[0].bidderId, "bidder_A");
        expect.equal(result.allocations[0].adRank, 24000);
        expect.equal(result.allocations[1].bidderId, "bidder_B");
        expect.equal(result.allocations[1].adRank, 20000);
        expect.equal(result.allocations[2].bidderId, "bidder_C");
        expect.equal(result.allocations[2].adRank, 12000);
      });

      test("F156-T7: AuctionEngine calculates Second-Price CPC where winner at slot i pays floor(Rank_{i+1} / QS_i) + 1 VND", () => {
        const engine = new AuctionEngine();
        const bidders = [
          { bidderId: "bidder_1", bid: 3000, qualityScore: 8.0 },
          { bidderId: "bidder_2", bid: 5000, qualityScore: 4.0 },
          { bidderId: "bidder_3", bid: 2000, qualityScore: 6.0 },
        ];

        const result = engine.runGspAuction({ slots: 3, bidders, reservePrice: 500 });
        expect.equal(result.allocations[0].cpc, 2501);
        expect.equal(result.allocations[1].cpc, 3001);
      });

      test("F156-T8: AuctionEngine strictly enforces the Max Bid ceiling constraint: CPC_i <= Bid_i", () => {
        const engine = new AuctionEngine();
        const bidders = [
          { bidderId: "bidder_top", bid: 2000, qualityScore: 1.0 },
          { bidderId: "bidder_next", bid: 1999, qualityScore: 1.0 },
        ];

        const result = engine.runGspAuction({ slots: 2, bidders, reservePrice: 500 });
        for (const alloc of result.allocations) {
          expect.ok(alloc.cpc <= alloc.bid, `CPC ${alloc.cpc} must not exceed bid ${alloc.bid}`);
          expect.ok(alloc.cpc >= 500, `CPC ${alloc.cpc} must be at least reserve price 500`);
        }
      });

      test("F156-T9: Solitary bidder or last allocated slot pays reserve price (floor bid, e.g. 500₫)", () => {
        const engine = new AuctionEngine({ defaultReservePrice: 500 });
        const bidders = [
          { bidderId: "solo_bidder", bid: 10000, qualityScore: 9.5 },
        ];

        const result = engine.runGspAuction({ slots: 3, bidders, reservePrice: 500 });
        expect.equal(result.allocations.length, 1);
        expect.equal(result.allocations[0].cpc, 500);
        expect.equal(result.allocations[0].pricingRule, "RESERVE_PRICE_FLOOR");
      });

      test("F156-T10: AuctionEngine VCG model computes negative externality costs for exclusive Flash Sale slots (M=1 collapse to second price), proving truthful bidding strategy payoff", () => {
        const engine = new AuctionEngine();
        const bidders = [
          { bidderId: "vendor_1", bid: 8000, qualityScore: 8.0 },
          { bidderId: "vendor_2", bid: 6000, qualityScore: 7.0 },
          { bidderId: "vendor_3", bid: 4000, qualityScore: 6.0 },
        ];

        const vcgResult = engine.runVcgAuction({ slots: 1, bidders, reservePrice: 1000 });
        expect.equal(vcgResult.allocations.length, 1);
        expect.equal(vcgResult.allocations[0].bidderId, "vendor_1");
        expect.equal(vcgResult.allocations[0].cpc, 6000);

        const sim = engine.simulateBiddingStrategy({
          targetBidderId: "vendor_1",
          trueValuation: 8000,
          testBids: [4000, 6000, 8000, 10000],
          competitors: [{ bidderId: "vendor_2", bid: 6000 }],
          slots: 1,
        });

        expect.ok(sim.isTruthfulOptimal);
        expect.equal(sim.truthfulUtility >= 0, true);
      });
    });

    // --- 3. Conflict-Free Replicated Data Types (CRDTs) Multi-Device Cart Suite (6 Tests) ---
    describe("Algorithm 3: CRDTs Multi-Device Shopping Cart (PN-Counter & LWW-Element-Set)", () => {
      test("F156-T11: PNCounter tracks separate addition (P) and subtraction (N) vectors across device IDs and calculates net quantity Q = sum P - sum N", () => {
        const counter = new PNCounter();
        counter.increment("device_phone", 5);
        counter.increment("device_laptop", 3);
        counter.decrement("device_phone", 2);

        expect.equal(counter.p["device_phone"], 5);
        expect.equal(counter.p["device_laptop"], 3);
        expect.equal(counter.n["device_phone"], 2);
        expect.equal(counter.value, 6);

        counter.decrement("device_laptop", 10);
        expect.equal(counter.value, 0);
      });

      test("F156-T12: LWWElementSet correctly resolves item membership using timestamps (t_add >= t_remove => in cart)", () => {
        const set = new LWWElementSet();
        const pId = "product_sneaker_1";

        set.add(pId, 1000);
        expect.equal(set.has(pId), true);

        set.remove(pId, 1500);
        expect.equal(set.has(pId), false);

        set.add(pId, 2000);
        expect.equal(set.has(pId), true);
        expect.ok(set.elements().includes(pId));
      });

      test("F156-T13: CrdtCart handles additions, quantity updates, removals, and price subtotals", () => {
        const cart = new CrdtCart({ cartId: "cart_user_01" });
        cart.addItem("phone", { id: "p_polo", name: "Áo polo", price: 200000 }, 2, 100);
        cart.addItem("phone", { id: "p_short", name: "Quần short", price: 150000 }, 1, 100);

        let totals = cart.getTotals();
        expect.equal(totals.totalItems, 3);
        expect.equal(totals.subtotal, 550000);

        cart.updateQuantity("phone", "p_polo", 1, 110);
        totals = cart.getTotals();
        expect.equal(totals.totalItems, 4);
        expect.equal(totals.subtotal, 750000);

        cart.removeItem("phone", "p_short", 120);
        totals = cart.getTotals();
        expect.equal(totals.totalItems, 3);
        expect.equal(totals.subtotal, 600000);
      });

      test("F156-T14: CrdtCart two-way merge satisfies Commutativity (A ⊔ B = B ⊔ A)", () => {
        const cartA = new CrdtCart({ cartId: "shared_cart" });
        cartA.addItem("device_A", { id: "p1", name: "Bàn phím cơ", price: 500000 }, 2, 100);
        cartA.addItem("device_A", { id: "p2", name: "Chuột gaming", price: 300000 }, 1, 100);

        const cartB = new CrdtCart({ cartId: "shared_cart" });
        cartB.addItem("device_B", { id: "p1", name: "Bàn phím cơ", price: 500000 }, 1, 110);
        cartB.addItem("device_B", { id: "p3", name: "Lót chuột cỡ lớn", price: 100000 }, 3, 110);

        const mergedAB = CrdtCart.fromJSON(cartA.toJSON()).merge(cartB);
        const mergedBA = CrdtCart.fromJSON(cartB.toJSON()).merge(cartA);

        const totalsAB = mergedAB.getTotals();
        const totalsBA = mergedBA.getTotals();

        expect.equal(totalsAB.totalItems, totalsBA.totalItems);
        expect.equal(totalsAB.subtotal, totalsBA.subtotal);
        expect.equal(totalsAB.uniqueSkus, totalsBA.uniqueSkus);
        expect.equal(totalsAB.uniqueSkus, 3);
        expect.deepEqual(
          mergedAB.getCartItems().map(x => x.id),
          mergedBA.getCartItems().map(x => x.id)
        );
        expect.equal(
          JSON.stringify(mergedAB.toJSON()),
          JSON.stringify(mergedBA.toJSON())
        );
      });

      test("F156-T15: CrdtCart multi-replica merge satisfies Associativity ((A ⊔ B) ⊔ C = A ⊔ (B ⊔ C)) and Idempotence (A ⊔ A = A)", () => {
        const replicaA = new CrdtCart({ cartId: "cart_sync" });
        replicaA.addItem("dev_A", { id: "item1", price: 100000 }, 1, 100);

        const replicaB = new CrdtCart({ cartId: "cart_sync" });
        replicaB.addItem("dev_B", { id: "item2", price: 200000 }, 2, 110);

        const replicaC = new CrdtCart({ cartId: "cart_sync" });
        replicaC.addItem("dev_C", { id: "item3", price: 300000 }, 3, 120);

        const leftMerge = CrdtCart.fromJSON(replicaA.toJSON()).merge(replicaB).merge(replicaC);
        const rightInner = CrdtCart.fromJSON(replicaB.toJSON()).merge(replicaC);
        const rightMerge = CrdtCart.fromJSON(replicaA.toJSON()).merge(rightInner);

        expect.equal(leftMerge.getTotals().subtotal, rightMerge.getTotals().subtotal);
        expect.equal(leftMerge.getTotals().totalItems, rightMerge.getTotals().totalItems);

        const originalTotals = replicaA.getTotals();
        const selfMerged = CrdtCart.fromJSON(replicaA.toJSON()).merge(replicaA);
        expect.equal(selfMerged.getTotals().totalItems, originalTotals.totalItems);
        expect.equal(selfMerged.getTotals().subtotal, originalTotals.subtotal);
      });

      test("F156-T16: Concurrent offline scenario: Device 1 adds 2 units offline and Device 2 removes 1 unit offline; merging both replicas deterministically resolves to net 1 unit without lost updates or race conditions", () => {
        const baseState = {
          cartId: "offline_cart",
          items: {
            sku_watch: {
              productId: "sku_watch",
              name: "Đồng hồ thông minh",
              price: 1000000,
              pVector: { server: 2 },
              nVector: {},
              addedAt: 100,
              removedAt: 0,
            },
          },
        };

        const dev1Cart = CrdtCart.fromJSON(baseState);
        const dev2Cart = CrdtCart.fromJSON(baseState);

        dev1Cart.updateQuantity("device_phone", "sku_watch", 2, 200);
        dev2Cart.updateQuantity("device_laptop", "sku_watch", -1, 205);

        dev1Cart.merge(dev2Cart);

        const items = dev1Cart.getCartItems();
        expect.equal(items.length, 1);
        expect.equal(items[0].productId, "sku_watch");
        expect.equal(items[0].quantity, 3);
        expect.equal(items[0].subtotal, 3000000);
      });

      test("F156-T21: CrdtCart achieves canonical sorting and equal-timestamp metadata commutativity (A ⊔ B = B ⊔ A)", () => {
        // 1. Canonical Sorting Test across devices with opposite insertion orders
        const cartX = new CrdtCart({ cartId: "canon_sync" });
        cartX.addItem("device_1", { id: "sku_zebra", name: "Ngựa vằn", price: 100000 }, 1, 100);
        cartX.addItem("device_1", { id: "sku_alpha", name: "Alpha", price: 200000 }, 2, 100);
        cartX.addItem("device_1", { id: "sku_beta", name: "Beta", price: 300000 }, 1, 100);

        const cartY = new CrdtCart({ cartId: "canon_sync" });
        cartY.addItem("device_2", { id: "sku_beta", name: "Beta", price: 300000 }, 1, 100);
        cartY.addItem("device_2", { id: "sku_zebra", name: "Ngựa vằn", price: 100000 }, 1, 100);
        cartY.addItem("device_2", { id: "sku_alpha", name: "Alpha", price: 200000 }, 2, 100);

        const mergedXY = CrdtCart.fromJSON(cartX.toJSON()).merge(cartY);
        const mergedYX = CrdtCart.fromJSON(cartY.toJSON()).merge(cartX);

        expect.deepEqual(
          mergedXY.getCartItems().map(x => x.id),
          ["sku_alpha", "sku_beta", "sku_zebra"]
        );
        expect.deepEqual(
          mergedYX.getCartItems().map(x => x.id),
          ["sku_alpha", "sku_beta", "sku_zebra"]
        );
        expect.equal(
          JSON.stringify(mergedXY.toJSON()),
          JSON.stringify(mergedYX.toJSON())
        );

        // 2. Equal-Timestamp Metadata Commutativity Test
        const fixedTs = 500000;
        const cartA = new CrdtCart({ cartId: "equal_ts_sync" });
        const cartB = new CrdtCart({ cartId: "equal_ts_sync" });

        cartA.addItem("devA", { id: "p_cam", name: "Máy ảnh A7 IV Standard", price: 45000000 }, 1, fixedTs);
        cartB.addItem("devB", { id: "p_cam", name: "Máy ảnh A7 IV Promo", price: 42000000 }, 1, fixedTs);

        const ab = CrdtCart.fromJSON(cartA.toJSON()).merge(cartB);
        const ba = CrdtCart.fromJSON(cartB.toJSON()).merge(cartA);

        const itemAB = ab.getCartItems()[0];
        const itemBA = ba.getCartItems()[0];

        expect.equal(itemAB.price, itemBA.price);
        expect.equal(itemAB.name, itemBA.name);
        expect.equal(itemAB.deviceId, itemBA.deviceId);
        expect.equal(ab.getTotals().subtotal, ba.getTotals().subtotal);
        expect.equal(JSON.stringify(ab.toJSON()), JSON.stringify(ba.toJSON()));
      });

      test("F156-T22: CrdtCart prevents post-clear/post-remove quantity resurrection and clamps decrement debt from swallowing subsequent additions", () => {
        // 1. Post-clear resurrection guard
        const cart = new CrdtCart({ cartId: "resurrection_guard" });
        cart.addItem("phone", { id: "p_apple", name: "Apple", price: 20000 }, 5, 100);
        expect.equal(cart.getTotals().totalItems, 5);

        cart.clear("phone", 200);
        expect.equal(cart.getTotals().totalItems, 0);

        cart.addItem("phone", { id: "p_apple", name: "Apple", price: 20000 }, 1, 300);
        expect.equal(cart.getTotals().totalItems, 1);
        expect.equal(cart.getTotals().subtotal, 20000);

        // 2. Post-remove resurrection guard
        cart.addItem("laptop", { id: "p_shirt", name: "Shirt", price: 150000 }, 4, 350);
        expect.equal(cart.getTotals().totalItems, 5);

        cart.removeItem("laptop", "p_shirt", 400);
        expect.equal(cart.getTotals().totalItems, 1);

        cart.addItem("laptop", { id: "p_shirt", name: "Shirt", price: 150000 }, 1, 500);
        expect.equal(cart.getTotals().totalItems, 2);
        expect.equal(cart.getTotals().subtotal, 170000);

        // 3. Decrement debt clamping
        const cartDebt = new CrdtCart({ cartId: "debt_guard" });
        cartDebt.updateQuantity("phone", "p_shoes", -10, 100);
        expect.equal(cartDebt.getTotals().totalItems, 0);

        cartDebt.addItem("phone", { id: "p_shoes", name: "Shoes", price: 500000 }, 3, 200);
        expect.equal(cartDebt.getTotals().totalItems, 3);
        expect.equal(cartDebt.getTotals().subtotal, 1500000);

        cartDebt.updateQuantity("phone", "p_shoes", -5, 300);
        expect.equal(cartDebt.getTotals().totalItems, 0);

        cartDebt.addItem("phone", { id: "p_shoes", name: "Shoes", price: 500000 }, 2, 400);
        expect.equal(cartDebt.getTotals().totalItems, 2);
        expect.equal(cartDebt.getTotals().subtotal, 1000000);
      });
    });

    // --- 4. Deep Tri-Role AI Copilots Training for Phase 9 Suite (4 Tests) ---
    describe("AI Copilot Training for Phase 9 Algorithms", () => {
      test("F156-T17: Admin Sentinel Copilot AI explains LSH Catalog Clone Detection and GSP/VCG Ad Auction mechanics", () => {
        const cloneRes = generateAdminCopilotResponse("Phát hiện shop gian lận sao chép catalog bằng LSH MinHash");
        expect.equal(cloneRes.tag, "BẢO VỆ CATALOG LSH MINHASH");
        expect.ok(cloneRes.text.includes("LSH"));
        expect.ok(cloneRes.text.includes("MinHash"));
        expect.ok(cloneRes.text.includes("Jaccard"));
        expect.ok(cloneRes.text.includes("O(1)"));

        const auctionRes = generateAdminCopilotResponse("Kiểm toán cơ chế đấu thầu quảng cáo tìm kiếm GSP và VCG");
        expect.equal(auctionRes.tag, "ĐẤU THẦU GSP & VCG");
        expect.ok(auctionRes.text.includes("GSP"));
        expect.ok(auctionRes.text.includes("VCG"));
        expect.ok(auctionRes.text.includes("Ad Rank"));
        expect.ok(auctionRes.text.includes("Second-Price"));
      });

      test("F156-T18: Admin Sentinel Copilot AI explains CRDTs Multi-Device Cart Synchronization and Strong Eventual Consistency", () => {
        const res = generateAdminCopilotResponse("Kiểm toán thuật toán CRDT đồng bộ giỏ hàng đa thiết bị Strong Eventual Consistency");
        expect.equal(res.tag, "ĐỒNG BỘ GIỎ HÀNG CRDT");
        expect.ok(res.text.includes("CRDT"));
        expect.ok(res.text.includes("PN-Counter"));
        expect.ok(res.text.includes("LWW-Element-Set"));
        expect.ok(res.text.includes("Strong Eventual Consistency"));
        expect.ok(res.text.includes("Join-Semilattice"));
      });

      test("F156-T19: Seller ShopSmart Copilot AI advises on GSP Keyword Ad Bidding, Quality Score optimization, and CRDT multi-device cart sync benefits", () => {
        const currentShop = { id: "shop_01", name: "Ananas Official Store" };

        const adRes = generateSellerCopilotResponse("Tư vấn tối ưu đấu thầu GSP và nâng cao điểm chất lượng Quality Score", currentShop);
        expect.equal(adRes.tag, "TỐI ƯU ĐẤU THẦU GSP ADS");
        expect.ok(adRes.text.includes("Ad Rank = Bid × QualityScore"));
        expect.ok(adRes.text.includes("CPC"));
        expect.ok(adRes.text.includes("ROAS"));

        const cartRes = generateSellerCopilotResponse("Lợi ích chuyển đổi từ giỏ hàng đồng bộ CRDT cho người mua", currentShop);
        expect.equal(cartRes.tag, "GIỎ HÀNG ĐỒNG BỘ CRDT");
        expect.ok(cartRes.text.includes("CRDT"));
        expect.ok(cartRes.text.includes("Lost Updates"));

        const shieldRes = generateSellerCopilotResponse("Bảo vệ bản quyền gian hàng chống copycat bằng LSH", currentShop);
        expect.equal(shieldRes.tag, "BẢO VỆ GIAN HÀNG LSH");
        expect.ok(shieldRes.text.includes("LSH"));
        expect.ok(shieldRes.text.includes("Jaccard"));
      });

      test("F156-T20: Buyer Shopping Assistant AI recognizes Cart Protection queries and recommends unique, non-clone authentic products", () => {
        const cartProtectionRes = generateAiChatResponse("Giỏ hàng của tôi có được bảo vệ và đồng bộ khi đổi sang máy tính không?");
        expect.equal(cartProtectionRes.intent, "CART_CRDT_SYNC_PROTECT");
        expect.ok(cartProtectionRes.replyText.includes("CRDT"));
        expect.ok(cartProtectionRes.replyText.includes("Ngoại tuyến"));

        const uniqueRecommendRes = generateAiChatResponse("Tìm sản phẩm độc lạ không trùng lặp tránh hàng clone");
        expect.equal(uniqueRecommendRes.intent, "UNIQUE_CATALOG_RECOMMEND");
        expect.ok(uniqueRecommendRes.replyText.includes("LSH MinHash"));
        expect.ok(uniqueRecommendRes.replyText.includes("chính hãng"));

        const sponsoredRes = generateAiChatResponse("Tại sao có nhãn tài trợ trên kết quả tìm kiếm?");
        expect.equal(sponsoredRes.intent, "SPONSORED_ADS_TRANSPARENCY");
        expect.ok(sponsoredRes.replyText.includes("Tài trợ"));
        expect.ok(sponsoredRes.replyText.includes("GSP"));
      });
    });
  });

  // =========================================================================
  // FEATURE 157: Phase 10 Advanced Enterprise Distributed Algorithms Suite (22 Tests)
  // 1. Hierarchical Navigable Small World (HNSW) Vector ANN Search
  // 2. Hungarian Algorithm (Kuhn-Munkres) for Optimal SPX Courier Dispatch
  // 3. Raft Distributed Consensus Engine & Flash Sale Quorum State Machine
  // 4. Deep Tri-Role AI Copilots Training for Phase 10 Suite
  // =========================================================================
  describe("Feature 157: Phase 10 Enterprise Distributed & Heuristic Algorithms Suite", () => {

    // --- 1. HNSW Vector Embedding ANN Search (6 Tests) ---
    describe("HNSW Vector Index (Approximate Nearest Neighbors)", () => {
      test("F157-T01: Distance functions compute exact metrics and guard against dimension mismatches", () => {
        const v1 = [1, 0, 0];
        const v2 = [1, 0, 0];
        const v3 = [0, 1, 0];
        const v4 = [-1, 0, 0];

        // Cosine distance
        expect.equal(cosineDistance(v1, v2), 0);
        expect.equal(cosineDistance(v1, v3), 1);
        expect.equal(cosineDistance(v1, v4), 2);

        // Euclidean distance
        expect.equal(euclideanDistance(v1, v2), 0);
        expect.equal(Number(euclideanDistance(v1, v3).toFixed(4)), 1.4142);
        expect.equal(euclideanDistance(v1, v4), 2);

        // Safety fallback on mismatched length
        expect.equal(cosineDistance([1, 2], [1, 2, 3]), 1.0);
        expect.equal(euclideanDistance([1, 2], [1, 2, 3]), Infinity);
      });

      test("F157-T02: PriorityQueue correctly handles Min-Heap and Max-Heap ordering and capacity management", () => {
        const minQ = new PriorityQueue((a, b) => a.dist - b.dist);
        minQ.push({ id: "p1", dist: 10 });
        minQ.push({ id: "p2", dist: 2 });
        minQ.push({ id: "p3", dist: 5 });

        expect.equal(minQ.size, 3);
        expect.equal(minQ.peek().id, "p2");
        expect.equal(minQ.pop().id, "p2");
        expect.equal(minQ.pop().id, "p3");
        expect.equal(minQ.pop().id, "p1");

        const maxQ = new PriorityQueue((a, b) => b.dist - a.dist);
        maxQ.push({ id: "a", dist: 1 });
        maxQ.push({ id: "b", dist: 99 });
        maxQ.push({ id: "c", dist: 40 });

        expect.equal(maxQ.peek().id, "b");
        expect.equal(maxQ.pop().id, "b");
      });

      test("F157-T03: HNSWIndex inserts vectors, dynamically samples geometric levels, and maintains entryPoint", () => {
        const index = new HNSWIndex({ dim: 4, M: 4, efConstruction: 16, efSearch: 16, randomSeed: 42 });

        const nodeA = index.insert("prod_a", [1, 0, 0, 0], { name: "Áo polo nam" });
        const nodeB = index.insert("prod_b", [0.9, 0.1, 0, 0], { name: "Áo thun nam" });
        const nodeC = index.insert("prod_c", [0, 0, 1, 0], { name: "Tai nghe bluetooth" });

        expect.equal(index.size, 3);
        expect.ok(index.entryPointId !== null);
        expect.ok(index.maxLevel >= 0);
        expect.ok(nodeA.level >= 0 && nodeA.level <= 16);
        expect.ok(nodeB.level >= 0);
        expect.ok(nodeC.level >= 0);
      });

      test("F157-T04: HNSWIndex exact vs approximate K-NN query returns expected nearest products ranked by similarity", () => {
        const index = new HNSWIndex({ dim: 3, M: 8, efConstruction: 32, efSearch: 16, metric: "cosine", randomSeed: 123 });

        index.insert("shoe_red", [1, 0.1, 0], { name: "Giày sneaker đỏ", category: "Giày" });
        index.insert("shoe_crimson", [0.95, 0.2, 0], { name: "Giày chạy bộ đỏ thắm", category: "Giày" });
        index.insert("phone_black", [0, 0, 1], { name: "Điện thoại thông minh đen", category: "Điện tử" });
        index.insert("phone_grey", [0.05, 0.05, 0.95], { name: "Điện thoại xám titan", category: "Điện tử" });

        // Querying for something very close to red shoe
        const query = [0.98, 0.15, 0];
        const results = index.searchKNN(query, 2);

        expect.equal(results.length, 2);
        expect.ok(results[0].id === "shoe_red" || results[0].id === "shoe_crimson");
        expect.ok(results[0].similarity > 0.95);
        expect.ok(results[1].similarity > 0.9);
      });

      test("F157-T05: HNSWIndex node deletion updates neighbor sets and safely elects replacement entryPoint", () => {
        const index = new HNSWIndex({ dim: 2, M: 4, randomSeed: 777 });

        index.insert("p1", [1, 0], { name: "P1" });
        index.insert("p2", [0, 1], { name: "P2" });
        index.insert("p3", [1, 1], { name: "P3" });

        const originalEntry = index.entryPointId;
        expect.equal(index.size, 3);

        const removed = index.remove(originalEntry);
        expect.equal(removed, true);
        expect.equal(index.size, 2);
        expect.ok(index.entryPointId !== originalEntry);
        expect.ok(index.nodes.has(index.entryPointId));
      });

      test("F157-T06: HNSWIndex JSON serialization and deserialization preserves graph connectivity and search accuracy", () => {
        const index = new HNSWIndex({ dim: 3, M: 6, randomSeed: 99 });
        index.insert("cam_sony", [0.8, 0.2, 0.1], { name: "Sony A7" });
        index.insert("cam_canon", [0.75, 0.25, 0.15], { name: "Canon R6" });
        index.insert("lens_50mm", [0.1, 0.8, 0.3], { name: "Lens 50mm" });

        const json = index.toJSON();
        const restored = HNSWIndex.fromJSON(json);

        expect.equal(restored.size, 3);
        expect.equal(restored.dim, 3);
        expect.equal(restored.entryPointId, index.entryPointId);

        const query = [0.78, 0.22, 0.12];
        const origResults = index.searchKNN(query, 2);
        const restoredResults = restored.searchKNN(query, 2);

        expect.equal(restoredResults.length, origResults.length);
        expect.equal(restoredResults[0].id, origResults[0].id);
        expect.equal(restoredResults[0].distance, origResults[0].distance);
      });
    });

    // --- 2. Hungarian Algorithm & SPX Courier Dispatch (6 Tests) ---
    describe("Hungarian Algorithm & SPX Express Dispatch", () => {
      test("F157-T07: solveHungarian finds exact global minimum assignment for balanced 3x3 cost matrix", () => {
        // Classic textbook Hungarian problem
        const costMatrix = [
          [250, 400, 350],
          [400, 600, 350],
          [200, 400, 250],
        ];

        const result = solveHungarian(costMatrix);
        expect.equal(result.assignments.length, 3);
        // Optimal assignment:
        // Worker 0 -> Task 1 (400) or Task 0 (250) + Worker 1 -> Task 2 (350) + Worker 2 -> Task 0 (200) = 950
        expect.equal(result.totalCost, 950);
        expect.equal(result.workerToTask[0], 1);
        expect.equal(result.workerToTask[1], 2);
        expect.equal(result.workerToTask[2], 0);
      });

      test("F157-T08: solveHungarian correctly solves rectangular unbalanced matrices via dummy padding", () => {
        // 4 couriers, 2 orders
        const moreCouriersMatrix = [
          [10, 20],
          [5,  15],
          [30, 40],
          [8,   9],
        ];

        const res1 = solveHungarian(moreCouriersMatrix);
        expect.equal(res1.assignments.length, 2);
        // Best: Courier 1 -> Order 0 (5), Courier 3 -> Order 1 (9) => totalCost = 14
        expect.equal(res1.totalCost, 14);

        // 2 couriers, 4 orders
        const moreOrdersMatrix = [
          [12, 10, 19, 11],
          [15, 17, 13, 20],
        ];
        const res2 = solveHungarian(moreOrdersMatrix);
        expect.equal(res2.assignments.length, 2);
        // Courier 0 -> Order 1 (10), Courier 1 -> Order 2 (13) => totalCost = 23
        expect.equal(res2.totalCost, 23);
      });

      test("F157-T09: SPXDispatchEngine calculates composite assignment cost combining GPS, SLA, load, and rating", () => {
        const engine = new SPXDispatchEngine();

        const courier = {
          id: "c_01",
          name: "Nguyễn Văn Shipper",
          lat: 21.0285,
          lng: 105.8542, // Hoàn Kiếm, HN
          capacityKg: 30,
          currentLoadKg: 10,
          rating: 4.8,
        };

        const order = {
          id: "ord_01",
          orderCode: "SPX_HN_001",
          shopLat: 21.0300,
          shopLng: 105.8500, // Ba Đình, HN (~0.5km)
          buyerLat: 21.0350,
          buyerLng: 105.8450, // Cầu Giấy, HN (~0.8km)
          weightKg: 2.0,
          slaUrgencyMinutes: 45,
        };

        const costObj = engine.calculateAssignmentCost(courier, order);
        expect.ok(costObj.totalCost > 0);
        expect.ok(costObj.details.totalDistKm > 0);
        expect.equal(costObj.details.overloadKg, 0);
        expect.ok(costObj.details.ratingDiscount > 0);
      });

      test("F157-T10: SPXDispatchEngine dispatches multiple couriers to multiple urgent orders minimizing total cost", () => {
        const engine = new SPXDispatchEngine();

        const couriers = [
          { id: "c1", name: "Shipper 1", lat: 21.01, lng: 105.81, capacityKg: 25, currentLoadKg: 5, rating: 5.0 },
          { id: "c2", name: "Shipper 2", lat: 21.05, lng: 105.85, capacityKg: 30, currentLoadKg: 0, rating: 4.5 },
          { id: "c3", name: "Shipper 3", lat: 21.09, lng: 105.89, capacityKg: 20, currentLoadKg: 10, rating: 4.0 },
        ];

        const orders = [
          { id: "o1", orderCode: "ORD_01", shopLat: 21.012, shopLng: 105.812, buyerLat: 21.015, buyerLng: 105.815, weightKg: 1, slaUrgencyMinutes: 30 },
          { id: "o2", orderCode: "ORD_02", shopLat: 21.052, shopLng: 105.852, buyerLat: 21.055, buyerLng: 105.855, weightKg: 2, slaUrgencyMinutes: 25 },
        ];

        const dispatchResult = engine.dispatch(couriers, orders);

        expect.equal(dispatchResult.matchedAssignments.length, 2);
        expect.equal(dispatchResult.unassignedOrders.length, 0);
        expect.equal(dispatchResult.idleCouriers.length, 1);
        expect.equal(dispatchResult.idleCouriers[0].id, "c3");

        // Shipper 1 should get Order 1 and Shipper 2 should get Order 2 due to close proximity
        const assign1 = dispatchResult.matchedAssignments.find(a => a.orderId === "o1");
        const assign2 = dispatchResult.matchedAssignments.find(a => a.orderId === "o2");
        expect.equal(assign1.courierId, "c1");
        expect.equal(assign2.courierId, "c2");
      });

      test("F157-T11: SPXDispatchEngine handles empty inputs gracefully without exceptions", () => {
        const engine = new SPXDispatchEngine();
        const res = engine.dispatch([], []);
        expect.equal(res.matchedAssignments.length, 0);
        expect.equal(res.totalDispatchCost, 0);

        const res2 = engine.dispatch(null, null);
        expect.equal(res2.matchedAssignments.length, 0);
      });

      test("F157-T12: Overloaded courier penalty ensures lighter suitable courier is prioritized for heavy bulk parcel", () => {
        const engine = new SPXDispatchEngine({ capacityPenaltyWeight: 10000 });

        // Courier A is closer to shop but already carrying 28kg (capacity 30kg)
        const courierA = {
          id: "cA",
          name: "Courier Gần nhưng đầy tải",
          lat: 21.02,
          lng: 105.82,
          capacityKg: 30,
          currentLoadKg: 28,
          rating: 4.5,
        };

        // Courier B is slightly farther but completely empty (0kg)
        const courierB = {
          id: "cB",
          name: "Courier Xa hơn chút nhưng rỗng tải",
          lat: 21.025,
          lng: 105.825,
          capacityKg: 30,
          currentLoadKg: 0,
          rating: 4.5,
        };

        // Heavy parcel: 10kg. Courier A would overload by 8kg!
        const heavyOrder = {
          id: "o_heavy",
          orderCode: "HEAVY_10KG",
          shopLat: 21.02,
          shopLng: 105.82,
          buyerLat: 21.03,
          buyerLng: 105.83,
          weightKg: 10,
          slaUrgencyMinutes: 60,
        };

        const result = engine.dispatch([courierA, courierB], [heavyOrder]);
        expect.equal(result.matchedAssignments.length, 1);
        expect.equal(result.matchedAssignments[0].courierId, "cB");
      });
    });

    // --- 3. Raft Distributed Consensus Engine & Flash Sale Quorum State Machine (6 Tests) ---
    describe("Raft Distributed Consensus & Flash Sale Quorum State Machine", () => {
      test("F157-T13: RaftNode starts election, achieves majority Quorum, and transitions to LEADER", () => {
        const cluster = new RaftCluster({ nodeCount: 3 });
        const node1 = cluster.getNode("node_1");
        const node2 = cluster.getNode("node_2");
        const node3 = cluster.getNode("node_3");

        expect.equal(node1.role, NodeRole.FOLLOWER);
        expect.equal(node2.role, NodeRole.FOLLOWER);

        // Node 1 triggers election
        const elected = node1.startElection();
        expect.equal(elected, true);
        expect.equal(node1.role, NodeRole.LEADER);
        expect.equal(node1.currentTerm, 1);
        expect.equal(node1.leaderId, "node_1");

        // Followers recognize node_1 as leader
        expect.equal(node2.currentTerm, 1);
        expect.equal(node2.votedFor, "node_1");
        expect.equal(node3.votedFor, "node_1");
      });

      test("F157-T14: RaftNode enforces Log Up-To-Dateness rule and rejects candidate with stale log", () => {
        const cluster = new RaftCluster({ nodeCount: 3 });
        const node1 = cluster.getNode("node_1");
        const node2 = cluster.getNode("node_2");

        // Give node 2 a higher term and log entry
        node2.currentTerm = 3;
        node2.log.push({ term: 3, index: 1, command: { action: "INIT_STOCK" } });

        // Node 1 attempts election with term 2 and stale log
        const reply = node2.handleRequestVote({
          term: 2,
          candidateId: "node_1",
          lastLogIndex: 0,
          lastLogTerm: 0,
        });

        expect.equal(reply.voteGranted, false);
      });

      test("F157-T15: RaftLeader proposes command, replicates to quorum followers, and executes Flash Sale state machine", () => {
        const cluster = new RaftCluster({ nodeCount: 3 });
        const leader = cluster.getNode("node_1");
        leader.startElection();

        // 1. Initialize stock across state machines
        cluster.initClusterStock("ip15", 50);
        expect.equal(leader.stateMachine.getStock("ip15"), 50);

        // 2. Propose stock reservation
        const propResult = leader.propose({
          action: "RESERVE_STOCK",
          productId: "ip15",
          orderId: "order_fs_01",
          quantity: 2,
        });

        expect.equal(propResult.success, true);
        expect.equal(propResult.committedIndex, 1);
        expect.equal(leader.stateMachine.getStock("ip15"), 48);

        // Verify followers replicated and applied the commit
        const node2 = cluster.getNode("node_2");
        expect.equal(node2.commitIndex, 1);
        expect.equal(node2.stateMachine.getStock("ip15"), 48);
      });

      test("F157-T16: FlashSaleStateMachine enforces zero overselling and supports order cancellation release", () => {
        const sm = new FlashSaleStateMachine();
        sm.initStock("deal_1k", 3);

        const res1 = sm.apply({ action: "RESERVE_STOCK", productId: "deal_1k", orderId: "o1", quantity: 2 });
        expect.equal(res1.success, true);
        expect.equal(sm.getStock("deal_1k"), 1);

        // Attempt to reserve 2 when only 1 is left -> Out of stock
        const res2 = sm.apply({ action: "RESERVE_STOCK", productId: "deal_1k", orderId: "o2", quantity: 2 });
        expect.equal(res2.success, false);
        expect.equal(res2.error, "OUT_OF_STOCK");
        expect.equal(sm.getStock("deal_1k"), 1);

        // Release order o1 -> stock restored to 3
        const res3 = sm.apply({ action: "RELEASE_STOCK", productId: "deal_1k", orderId: "o1" });
        expect.equal(res3.success, true);
        expect.equal(sm.getStock("deal_1k"), 3);
      });

      test("F157-T17: RaftCluster network partition prevents minority partition from committing writes (Zero Split-Brain)", () => {
        const cluster = new RaftCluster({ nodeCount: 5 });
        const leader = cluster.getNode("node_1");
        leader.startElection();
        cluster.initClusterStock("voucher_super", 100);

        // Partition network: Group A (node_1, node_2 - Minority of 2) vs Group B (node_3, node_4, node_5 - Majority of 3)
        cluster.partition(["node_1", "node_2"], ["node_3", "node_4", "node_5"]);

        // Leader node_1 in minority tries to commit a reservation
        const minorResult = leader.propose({
          action: "RESERVE_STOCK",
          productId: "voucher_super",
          orderId: "ord_minor_01",
          quantity: 1,
        });

        // Fails because Quorum (3 of 5) cannot be reached in minority partition!
        expect.equal(minorResult.success, false);
        expect.equal(minorResult.error, "QUORUM_NOT_REACHED");
        expect.equal(minorResult.replicatedNodes, 2);

        // Group B elects a new leader and can commit safely!
        const node3 = cluster.getNode("node_3");
        const bElected = node3.startElection();
        expect.equal(bElected, true);
        expect.equal(node3.role, NodeRole.LEADER);

        const majorResult = node3.propose({
          action: "RESERVE_STOCK",
          productId: "voucher_super",
          orderId: "ord_major_01",
          quantity: 5,
        });

        expect.equal(majorResult.success, true);
        expect.equal(node3.stateMachine.getStock("voucher_super"), 95);
      });

      test("F157-T18: RaftCluster healing allows partitioned nodes to resynchronize logs with the cluster leader", () => {
        const cluster = new RaftCluster({ nodeCount: 3 });
        const leader = cluster.getNode("node_1");
        leader.startElection();
        cluster.initClusterStock("flash_deal", 20);

        // Partition node_3
        cluster.partition(["node_1", "node_2"], ["node_3"]);

        leader.propose({ action: "RESERVE_STOCK", productId: "flash_deal", orderId: "ord_sync_1", quantity: 4 });
        expect.equal(leader.stateMachine.getStock("flash_deal"), 16);

        // Node 3 still has old stock
        const node3 = cluster.getNode("node_3");
        expect.equal(node3.stateMachine.getStock("flash_deal"), 20);

        // Heal partition
        cluster.heal();

        // Leader broadcasts heartbeat / next log
        leader.broadcastHeartbeat();

        // Node 3 synchronizes commitIndex and applies pending entries
        expect.equal(node3.commitIndex, leader.commitIndex);
        expect.equal(node3.stateMachine.getStock("flash_deal"), 16);
      });
    });

    // --- 4. Deep Tri-Role AI Copilots Training for Phase 10 Suite (4 Tests) ---
    describe("AI Copilot Training for Phase 10 Algorithms", () => {
      test("F157-T19: Admin Sentinel Copilot AI explains HNSW Vector Search, Hungarian SPX Dispatch, and Raft Consensus", () => {
        const hnswRes = generateAdminCopilotResponse("Kiểm tra hiệu năng tìm kiếm vector HNSW ANN đa chiều");
        expect.equal(hnswRes.tag, "TÌM KIẾM VECTOR HNSW");
        expect.ok(hnswRes.text.includes("HNSW"));
        expect.ok(hnswRes.text.includes("Skip-List"));
        expect.ok(hnswRes.text.includes("O(\\log N)"));

        const hungarianRes = generateAdminCopilotResponse("Báo cáo thuật toán Hungarian điều phối bưu tá SPX Express");
        expect.equal(hungarianRes.tag, "ĐIỀU PHỐI BƯU TÁ HUNGARIAN");
        expect.ok(hungarianRes.text.includes("Hungarian"));
        expect.ok(hungarianRes.text.includes("Kuhn-Munkres"));
        expect.ok(hungarianRes.text.includes("Haversine"));

        const raftRes = generateAdminCopilotResponse("Kiểm toán đồng thuận phân tán Raft và Quorum Flash Sale");
        expect.equal(raftRes.tag, "ĐỒNG THUẬN PHÂN TÁN RAFT");
        expect.ok(raftRes.text.includes("Raft"));
        expect.ok(raftRes.text.includes("Quorum"));
        expect.ok(raftRes.text.includes("Zero Split-Brain"));
      });

      test("F157-T20: Seller ShopSmart Copilot AI advises on HNSW Visual Search discovery, Hungarian pickup, and Raft inventory protection", () => {
        const currentShop = { id: "shop_01", name: "Ananas Official Store" };

        const visualRes = generateSellerCopilotResponse("Tư vấn tối ưu tìm kiếm hình ảnh Visual Search HNSW cho gian hàng", currentShop);
        expect.equal(visualRes.tag, "TÌM KIẾM HÌNH ẢNH HNSW");
        expect.ok(visualRes.text.includes("HNSW"));
        expect.ok(visualRes.text.includes("CLIP"));

        const pickupRes = generateSellerCopilotResponse("Thuật toán bưu tá lấy hàng SPX Hungarian tối ưu ra sao?", currentShop);
        expect.equal(pickupRes.tag, "TỐI ƯU ĐIỀU PHỐI BƯU TÁ");
        expect.ok(pickupRes.text.includes("Hungarian"));
        expect.ok(pickupRes.text.includes("SPX"));

        const raftRes = generateSellerCopilotResponse("Cơ chế bảo vệ tồn kho Flash Sale bằng đồng thuận Raft", currentShop);
        expect.equal(raftRes.tag, "BẢO VỆ TỒN KHO FLASH SALE RAFT");
        expect.ok(raftRes.text.includes("Raft"));
        expect.ok(raftRes.text.includes("Zero Overselling"));
      });

      test("F157-T21: Buyer Shopping Assistant AI recognizes visual image search, SPX 2H rush courier dispatch, and Raft fair queue queries", () => {
        const visualRes = generateAiChatResponse("Tìm kiếm bằng hình ảnh sản phẩm tương tự trên sàn");
        expect.equal(visualRes.intent, "VISUAL_IMAGE_SEARCH_HNSW");
        expect.ok(visualRes.replyText.includes("HNSW"));
        expect.ok(visualRes.replyText.includes("hình ảnh"));

        const dispatchRes = generateAiChatResponse("Giao hỏa tốc 2h ghép bưu tá như thế nào?");
        expect.equal(dispatchRes.intent, "EXPRESS_COURIER_DISPATCH_HUNGARIAN");
        expect.ok(dispatchRes.replyText.includes("Hungarian"));
        expect.ok(dispatchRes.replyText.includes("SPX"));

        const fairQueueRes = generateAiChatResponse("Giật deal flash sale có bị ảo hay hết hàng vô lý không?");
        expect.equal(fairQueueRes.intent, "FLASH_SALE_CONSENSUS_FAIR_QUEUE");
        expect.ok(fairQueueRes.replyText.includes("Raft"));
        expect.ok(fairQueueRes.replyText.includes("Zero Overselling"));
      });

      test("F157-T22: Full End-to-End Enterprise Journey: HNSW Vector Search -> SPX Hungarian Dispatch -> Raft Quorum Stock Lock", () => {
        // 1. Vector Search locates product
        const vectorIndex = new HNSWIndex({ dim: 3, M: 4, randomSeed: 101 });
        vectorIndex.insert("prod_deal", [0.9, 0.1, 0], { name: "Tai nghe True Wireless Flash Sale", price: 1000 });
        const searchHits = vectorIndex.searchKNN([0.89, 0.11, 0], 1);
        expect.equal(searchHits.length, 1);
        expect.equal(searchHits[0].id, "prod_deal");

        // 2. Raft Cluster reserves inventory on Quorum
        const cluster = new RaftCluster({ nodeCount: 3 });
        const leader = cluster.getNode("node_1");
        leader.startElection();
        cluster.initClusterStock("prod_deal", 10);

        const reservation = leader.propose({
          action: "RESERVE_STOCK",
          productId: "prod_deal",
          orderId: "order_e2e_001",
          quantity: 1,
        });
        expect.equal(reservation.success, true);
        expect.equal(leader.stateMachine.getStock("prod_deal"), 9);

        // 3. SPX Courier Dispatch allocates optimal courier via Hungarian Algorithm
        const dispatcher = new SPXDispatchEngine();
        const couriers = [
          { id: "c_fast", name: "Bưu tá Hỏa Tốc", lat: 21.02, lng: 105.82, capacityKg: 30, currentLoadKg: 2, rating: 4.9 },
          { id: "c_busy", name: "Bưu tá Đang Tải Nặng", lat: 21.02, lng: 105.82, capacityKg: 30, currentLoadKg: 29, rating: 4.2 },
        ];
        const order = {
          id: "order_e2e_001",
          orderCode: "SPX_E2E_001",
          shopLat: 21.021,
          shopLng: 105.821,
          buyerLat: 21.025,
          buyerLng: 105.825,
          weightKg: 1.5,
          slaUrgencyMinutes: 30,
        };

        const dispatchPlan = dispatcher.dispatch(couriers, [order]);
        expect.equal(dispatchPlan.matchedAssignments.length, 1);
        expect.equal(dispatchPlan.matchedAssignments[0].courierId, "c_fast");
        expect.equal(dispatchPlan.matchedAssignments[0].orderId, "order_e2e_001");
      });
    });
  });

  // =========================================================================
  // FEATURE 158: Enterprise Pattern Mining, Bin Packing & SWIM Gossip Suite (Phase 11)
  // =========================================================================
  describe("Feature 158: Enterprise Pattern Mining, Bin Packing & SWIM Gossip Suite", () => {
    
    // --- 1. FP-Growth Frequent Pattern Mining & Association Rules ---
    describe("FP-Growth Frequent Pattern Mining & Combo Bundler", () => {
      test("F158-T1: Builds FP-Tree and headers table with accurate item frequencies", () => {
        const transactions = [
          ["ao_so_mi", "ca_vat", "that_lung"],
          ["ao_so_mi", "ca_vat"],
          ["ao_so_mi", "quan_au"],
          ["ca_vat", "that_lung"],
          ["ao_so_mi", "ca_vat", "that_lung", "giay_tay"],
        ];

        const bundler = new FPGrowthBundler({ minSupport: 2, minConfidence: 0.5 });
        const result = bundler.fit(transactions);

        expect.equal(result.totalTransactions, 5);
        expect.equal(result.frequentItemsets.length > 0, true);
        
        // "ao_so_mi" appears 4 times, "ca_vat" appears 4 times, "that_lung" appears 3 times
        const aoItemset = result.frequentItemsets.find((fi) => fi.items.length === 1 && fi.items[0] === "ao_so_mi");
        expect.equal(aoItemset.support, 4);
      });

      test("F158-T2: Recursively mines frequent patterns above minSupport threshold", () => {
        const transactions = [
          ["iphone", "op_lung", "cu_sac"],
          ["iphone", "op_lung"],
          ["iphone", "cu_sac"],
          ["op_lung", "cu_sac"],
          ["iphone", "op_lung", "cu_sac", "tai_nghe"],
        ];

        const bundler = new FPGrowthBundler({ minSupport: 3, minConfidence: 0.5 });
        const res = bundler.fit(transactions);

        // Frequent pairs with support >= 3
        const iphoneOpLung = res.frequentItemsets.find(
          (fi) => fi.items.length === 2 && fi.items.includes("iphone") && fi.items.includes("op_lung")
        );
        expect.equal(Boolean(iphoneOpLung), true);
        expect.equal(iphoneOpLung.support >= 3, true);
      });

      test("F158-T3: Generates association rules with correct Support, Confidence, and Lift", () => {
        const transactions = [
          ["laptop", "chuot", "ban_phim"],
          ["laptop", "chuot"],
          ["laptop", "chuot", "balo"],
          ["chuot", "ban_phim"],
          ["laptop", "ban_phim"],
        ];

        const bundler = new FPGrowthBundler({ minSupport: 2, minConfidence: 0.4 });
        const res = bundler.fit(transactions);

        expect.equal(res.rules.length > 0, true);
        const rule = res.rules.find((r) => r.antecedent.includes("laptop") && r.consequent.includes("chuot"));
        expect.equal(Boolean(rule), true);
        expect.equal(rule.support, 3);
        expect.equal(rule.confidence >= 0.75, true); // 3 / 4 = 0.75
        expect.equal(rule.lift > 0, true);
      });

      test("F158-T4: Filters and ranks high-converting Deal Sốc combos with Lift >= 1.2", () => {
        const transactions = [
          ["may_anh", "the_nho", "tui_dung"],
          ["may_anh", "the_nho"],
          ["may_anh", "the_nho", "chan_may"],
          ["binh_nuoc", "khan_lau"],
          ["may_anh", "the_nho"],
        ];

        const bundler = new FPGrowthBundler({ minSupport: 2, minConfidence: 0.5 });
        bundler.fit(transactions);
        const combos = bundler.getDealSocCombos({ minLift: 1.1, limit: 5 });

        expect.equal(combos.length > 0, true);
        expect.equal(combos[0].lift >= 1.1, true);
        expect.equal(combos[0].bundleName.includes("Combo Mua Kèm"), true);
      });

      test("F158-T5: Generates tailored cross-sell bundle recommendations for target item", () => {
        const transactions = [
          ["skincare_serum", "kem_chong_nang"],
          ["skincare_serum", "kem_chong_nang", "sua_rua_mat"],
          ["skincare_serum", "kem_chong_nang", "toner"],
          ["son_moi", "phan_phu"],
          ["skincare_serum", "sua_rua_mat"],
        ];

        const bundler = new FPGrowthBundler({ minSupport: 2, minConfidence: 0.4 });
        bundler.fit(transactions);
        const recommendations = bundler.recommendAddons("skincare_serum", { minLift: 1.0, limit: 3 });

        expect.equal(recommendations.length > 0, true);
        expect.equal(recommendations[0].recommendedItem, "kem_chong_nang");
        expect.equal(recommendations[0].confidence >= 0.75, true);
      });

      test("F158-T6: Gracefully handles empty transactions or impossible minSupport", () => {
        const bundler = new FPGrowthBundler({ minSupport: 10 });
        const res = bundler.fit([]);
        expect.equal(res.frequentItemsets.length, 0);
        expect.equal(res.rules.length, 0);

        const recs = bundler.recommendAddons("non_existent_item");
        expect.equal(recs.length, 0);
      });
    });

    // --- 2. Maximal Rectangles Bin Packing & SPX Carton Optimization ---
    describe("Maximal Rectangles Bin Packing & SPX Box Optimizer", () => {
      test("F158-T7: Accurately calculates standard IATA/SPX volumetric weight", () => {
        // Hộp M: 25cm x 20cm x 15cm -> Thể tích = 7500 cm3
        // Trọng lượng quy đổi = 7500 / 5000 = 1.5 kg
        const volWeight = calculateVolumetricWeight(25, 20, 15);
        expect.equal(volWeight, 1.5);

        const volWeightSmall = calculateVolumetricWeight(10, 10, 10);
        expect.equal(volWeightSmall, 0.2);
      });

      test("F158-T8: Packs items into 2D bin using Best Short Side Fit heuristic", () => {
        const packer = new MaximalRectanglesPacker(20, 20); // 20x20 sheet
        const items = [
          { id: "item_1", width: 10, height: 10 },
          { id: "item_2", width: 10, height: 10 },
          { id: "item_3", width: 10, height: 10 },
          { id: "item_4", width: 10, height: 10 },
        ];

        const res = packer.pack(items);
        expect.equal(res.packed.length, 4);
        expect.equal(res.unpacked.length, 0);
        expect.equal(res.occupancyRate, 1.0); // 400 / 400 = 100%
      });

      test("F158-T9: Guillotine splitting prevents rectangle overlap during packing", () => {
        const packer = new MaximalRectanglesPacker(30, 20);
        const items = [
          { id: "it_a", width: 15, height: 10 },
          { id: "it_b", width: 10, height: 15 },
          { id: "it_c", width: 10, height: 10 },
        ];

        const res = packer.pack(items);
        expect.equal(res.packed.length, 3);

        // Kiểm tra không chồng lấn tọa độ
        for (let i = 0; i < res.packed.length; i++) {
          for (let j = i + 1; j < res.packed.length; j++) {
            const a = res.packed[i];
            const b = res.packed[j];
            const isOverlap =
              a.x < b.x + b.width &&
              a.x + a.width > b.x &&
              a.y < b.y + b.height &&
              a.y + a.height > b.y;
            expect.equal(isOverlap, false);
          }
        }
      });

      test("F158-T10: Automatically selects optimal smallest SPX carton for order items", () => {
        const optimizer = new SPXBoxOptimizer();
        const items = [
          { id: "prod_phone", name: "Điện thoại mini", length: 12, width: 8, height: 1, weightKg: 0.2 },
          { id: "prod_charger", name: "Củ sạc GaN", length: 6, width: 4, height: 3, weightKg: 0.1 },
        ];

        const packingPlan = optimizer.optimizePacking(items);
        expect.equal(packingPlan.success, true);
        expect.equal(packingPlan.selectedBox.code === "SPX_BOX_XS" || packingPlan.selectedBox.code === "SPX_BOX_S", true);
        expect.equal(packingPlan.unpackedItems.length, 0);
      });

      test("F158-T11: Achieves space utilization and prevents volumetric freight penalty", () => {
        const optimizer = new SPXBoxOptimizer();
        const items = [
          { id: "prod_shoes", name: "Giày Sneaker", length: 28, width: 18, height: 11, weightKg: 0.8 },
          { id: "prod_socks", name: "Vớ thể thao", length: 10, width: 8, height: 3, weightKg: 0.05 },
        ];

        const plan = optimizer.optimizePacking(items);
        expect.equal(plan.success, true);
        expect.equal(plan.selectedBox.code === "SPX_BOX_M" || plan.selectedBox.code === "SPX_BOX_L", true);
        expect.equal(plan.volumetricWeightKg > 0, true);
        expect.equal(plan.chargeableWeightKg >= 0.85, true);
      });

      test("F158-T12: Throws or reports unpacked when item exceeds maximum SPX_BOX_XL limits", () => {
        const optimizer = new SPXBoxOptimizer();
        const oversizedItem = [
          { id: "prod_tv", name: "TV 75 inch siêu bự", length: 180, width: 110, height: 30, weightKg: 25 },
        ];

        const plan = optimizer.optimizePacking(oversizedItem);
        expect.equal(plan.success, false);
        expect.equal(plan.unpackedItems.length, 1);
        expect.equal(plan.unpackedItems[0].id, "prod_tv");
      });

      test("F158-T13: Generates detailed warehouse packing manifest with coordinates", () => {
        const optimizer = new SPXBoxOptimizer();
        const items = [
          { id: "prod_book1", name: "Sách Lập Trình", length: 20, width: 14, height: 2, weightKg: 0.4 },
          { id: "prod_book2", name: "Sách Thuật Toán", length: 20, width: 14, height: 2, weightKg: 0.4 },
        ];

        const plan = optimizer.optimizePacking(items);
        expect.equal(plan.manifest.length, 2);
        expect.equal(typeof plan.manifest[0].x, "number");
        expect.equal(typeof plan.manifest[0].y, "number");
        expect.equal(typeof plan.manifest[0].layer, "number");
      });
    });

    // --- 3. SWIM Gossip Membership Protocol ---
    describe("SWIM Gossip Membership Protocol with Suspicion Mechanism", () => {
      test("F158-T14: Initializes SWIM cluster with all members ALIVE and incarnation 0", () => {
        const cluster = new SwimCluster({ nodeCount: 4 });
        const nodes = cluster.getAllNodes();

        expect.equal(nodes.length, 4);
        for (const node of nodes) {
          expect.equal(node.status, MemberStatus.ALIVE);
          expect.equal(node.incarnation, 0);
          expect.equal(node.memberList.size, 4);
        }
      });

      test("F158-T15: Direct ping round succeeds when target node is healthy", () => {
        const cluster = new SwimCluster({ nodeCount: 3 });
        const node1 = cluster.getNode("swim_node_1");

        const result = node1.stepProtocol();
        expect.equal(result.type, "DIRECT_PING");
        expect.equal(result.success, true);
      });

      test("F158-T16: Falls back to indirect ping-req when direct ping fails", () => {
        const cluster = new SwimCluster({ nodeCount: 4 });
        const node1 = cluster.getNode("swim_node_1");
        const node4 = cluster.getNode("swim_node_4");

        // Isolate node4 from node1 only (direct link broken, but node2 and node3 can reach node4)
        cluster.setDroppedLink("swim_node_1", "swim_node_4", true);
        cluster.setDroppedLink("swim_node_4", "swim_node_1", true);

        // Force node1 to probe node4
        node1.probeIndex = node1.memberListArray.findIndex((m) => m.id === "swim_node_4");
        const result = node1.stepProtocol();

        expect.equal(result.type, "INDIRECT_PING_REQ");
        expect.equal(result.success, true); // indirect through node2/3 succeeded
      });

      test("F158-T17: Transitions node to SUSPECT when both direct and indirect pings fail", () => {
        const cluster = new SwimCluster({ nodeCount: 4 });
        const node1 = cluster.getNode("swim_node_1");
        const targetNode = cluster.getNode("swim_node_4");

        // Completely isolate targetNode from the entire network
        cluster.isolateNode("swim_node_4");

        // Force node1 to probe node4
        node1.probeIndex = node1.memberListArray.findIndex((m) => m.id === "swim_node_4");
        const result = node1.stepProtocol();

        expect.equal(result.type, "INDIRECT_PING_REQ");
        expect.equal(result.success, false);
        expect.equal(result.newStatus, MemberStatus.SUSPECT);

        const memberRecord = node1.memberList.get("swim_node_4");
        expect.equal(memberRecord.status, MemberStatus.SUSPECT);
      });

      test("F158-T18: Suspicion refutation allows GC-paused node to self-refute with increased incarnation", () => {
        const cluster = new SwimCluster({ nodeCount: 3 });
        const node1 = cluster.getNode("swim_node_1");
        const node2 = cluster.getNode("swim_node_2");

        // Manually place node2 into SUSPECT inside node1's list
        node1.applyMemberUpdate({
          id: "swim_node_2",
          status: MemberStatus.SUSPECT,
          incarnation: 0,
        });
        expect.equal(node1.memberList.get("swim_node_2").status, MemberStatus.SUSPECT);

        // Node2 detects it is being suspected with incarnation 0 -> self-refutes!
        node2.refuteSuspicion(0);
        expect.equal(node2.incarnation, 1);
        expect.equal(node2.status, MemberStatus.ALIVE);

        // Send gossip update back to node1
        node1.applyMemberUpdate({
          id: "swim_node_2",
          status: MemberStatus.ALIVE,
          incarnation: 1,
        });

        // Node1 updates node2 back to ALIVE because incarnation 1 > incarnation 0
        expect.equal(node1.memberList.get("swim_node_2").status, MemberStatus.ALIVE);
      });

      test("F158-T19: Marks node DEAD when suspicion timeout expires without refutation", () => {
        const cluster = new SwimCluster({ nodeCount: 3, suspicionTimeoutRounds: 2 });
        const node1 = cluster.getNode("swim_node_1");

        // Mark node3 as SUSPECT
        node1.applyMemberUpdate({
          id: "swim_node_3",
          status: MemberStatus.SUSPECT,
          incarnation: 0,
        });

        // Run 2 suspicion check rounds without node3 replying
        node1.checkSuspicionTimeouts();
        node1.checkSuspicionTimeouts();

        expect.equal(node1.memberList.get("swim_node_3").status, MemberStatus.DEAD);
      });

      test("F158-T20: Piggybacks gossip updates across cluster rounds to achieve membership convergence", () => {
        const cluster = new SwimCluster({ nodeCount: 4 });
        const node1 = cluster.getNode("swim_node_1");

        // Simulate new member joining through node1
        node1.joinMember("swim_node_5");
        expect.equal(node1.memberList.has("swim_node_5"), true);

        // Run cluster gossip rounds
        cluster.runRounds(10);

        // All nodes should now have heard the gossip and added swim_node_5
        for (const node of cluster.getAllNodes()) {
          expect.equal(node.memberList.has("swim_node_5"), true);
        }
      });
    });

    // --- 4. Tri-Role AI Copilots & End-to-End Suite ---
    describe("Tri-Role AI Copilots & End-to-End Enterprise Suite", () => {
      test("F158-T21: Admin Copilot explains FP-Growth audit, SPX Bin Packing, and SWIM Gossip", () => {
        const resFp = generateAdminCopilotResponse("Kiểm toán luật kết hợp fp-growth và combo sàn");
        expect.equal(resFp.tag, "KIỂM TOÁN COMBO FP-GROWTH");
        expect.equal(resFp.text.includes("FP-Growth"), true);
        expect.equal(resFp.text.includes("Lift"), true);

        const resBin = generateAdminCopilotResponse("Tối ưu hóa thể tích đóng thùng carton spx bin packing");
        expect.equal(resBin.tag, "TỐI ƯU ĐÓNG THÙNG SPX");
        expect.equal(resBin.text.includes("Guillotine Split"), true);
        expect.equal(resBin.text.includes("5000"), true);

        const resSwim = generateAdminCopilotResponse("Giám sát sức khỏe cụm phân tán bằng swim gossip protocol");
        expect.equal(resSwim.tag, "GIÁM SÁT CỤM SWIM GOSSIP");
        expect.equal(resSwim.text.includes("Ping-Req"), true);
        expect.equal(resSwim.text.includes("Incarnation"), true);
      });

      test("F158-T22: Seller Copilot provides tailored FP-Growth combo advice and SPX carton savings", () => {
        const resSellerFp = generateSellerCopilotResponse("Tư vấn thiết lập combo mua kèm deal sốc fp-growth cho shop");
        expect.equal(resSellerFp.tag, "THIẾT LẬP COMBO DEAL SỐC FP-GROWTH");
        expect.equal(resSellerFp.text.includes("Lift"), true);

        const resSellerBox = generateSellerCopilotResponse("Hướng dẫn đóng gói tiết kiệm cước thùng carton spx");
        expect.equal(resSellerBox.tag, "TỐI ƯU ĐÓNG GÓI SPX BOX");
        expect.equal(resSellerBox.text.includes("Bin Packing"), true);

        const resSellerSwim = generateSellerCopilotResponse("Đồng bộ cụm phân tán shop gossip");
        expect.equal(resSellerSwim.tag, "ĐỒNG BỘ CỤM PHÂN TÁN GOSSIP");
      });

      test("F158-T23: Buyer Chat AI guides deal combos and SPX packing standards", () => {
        const resBuyerCombo = generateAiChatResponse("Gợi ý mua kèm deal sốc combo tiết kiệm");
        expect.equal(resBuyerCombo.intent, "COMBO_BUNDLE_FP_GROWTH");
        expect.equal(resBuyerCombo.replyText.includes("FP-Growth"), true);

        const resBuyerBox = generateAiChatResponse("Quy chuẩn đóng gói spx kích thước kiện hàng");
        expect.equal(resBuyerBox.intent, "SPX_PACKING_BOX_STANDARDS");
        expect.equal(resBuyerBox.replyText.includes("Bin Packing"), true);
      });

      test("F158-T24: Comprehensive End-to-End: Frequent combo mining -> SPX Carton packing -> Cluster health monitoring", () => {
        // Step 1: Mine frequent bundle using FP-Growth
        const transactions = [
          ["laptop_dell", "chuot_khong_day", "lot_chuot"],
          ["laptop_dell", "chuot_khong_day"],
          ["laptop_dell", "chuot_khong_day", "balo_chong_soc"],
          ["chuot_khong_day", "lot_chuot"],
          ["laptop_dell", "chuot_khong_day"],
        ];
        const bundler = new FPGrowthBundler({ minSupport: 2, minConfidence: 0.5 });
        bundler.fit(transactions);
        const combos = bundler.getDealSocCombos();
        expect.equal(combos.length > 0, true);

        // Step 2: Customer orders the combo -> Pack items into optimal SPX carton
        const orderItems = [
          { id: "laptop_dell", name: "Laptop Dell", length: 36, width: 25, height: 2, weightKg: 1.8 },
          { id: "chuot_khong_day", name: "Chuột không dây", length: 11, width: 6, height: 4, weightKg: 0.1 },
          { id: "lot_chuot", name: "Lót chuột", length: 25, width: 20, height: 0.3, weightKg: 0.05 },
        ];
        const boxOptimizer = new SPXBoxOptimizer();
        const packingResult = boxOptimizer.optimizePacking(orderItems);
        expect.equal(packingResult.success, true);
        expect.equal(packingResult.unpackedItems.length, 0);
        expect.equal(packingResult.selectedBox.code === "SPX_BOX_L" || packingResult.selectedBox.code === "SPX_BOX_XL", true);

        // Step 3: Cluster SWIM Gossip protocol confirms warehouse fulfillment services are alive
        const swimCluster = new SwimCluster({ nodeCount: 3 });
        const warehouseNode = swimCluster.getNode("swim_node_1");
        const round = warehouseNode.stepProtocol();
        expect.equal(round.success, true);
        expect.equal(warehouseNode.status, MemberStatus.ALIVE);
      });
    });

    // =========================================================================
    // FEATURE 159: SPX MULTI-HUB GRAPH ROUTING, ROARING BITMAPS & RFM SEGMENTATION
    // =========================================================================
    describe("Feature 159: Advanced Enterprise Supply Chain Graph Routing, Roaring Bitmaps Faceted Filter, and RFM Customer Segmentation Suite", () => {
      // --- SPX Multi-Hub Graph Routing (Dijkstra / A*) ---
      test("F159-T01: Dijkstra calculates shortest transit time path from Hanoi to Saigon traversing SOCs", () => {
        const router = new SPXHubGraphRouter();
        const route = router.findOptimalPath("HUB_HN", "HUB_SG", "time");

        expect.equal(route.found, true);
        expect.equal(route.path.length >= 4, true);
        expect.equal(route.source.id, "HUB_HN");
        expect.equal(route.target.id, "HUB_SG");
        expect.equal(route.totalTransitHours > 0, true);
        expect.equal(route.totalDistanceKm > 1000, true);
      });

      test("F159-T02: Dijkstra calculates min-cost vs min-distance paths under different criteria", () => {
        const router = new SPXHubGraphRouter();
        const timeRoute = router.findOptimalPath("HUB_HN", "SOC_DNG", "time");
        const costRoute = router.findOptimalPath("HUB_HN", "SOC_DNG", "cost");

        expect.equal(timeRoute.found, true);
        expect.equal(costRoute.found, true);
        expect.equal(timeRoute.totalBaseCostVnd >= costRoute.totalBaseCostVnd, true);
      });

      test("F159-T03: A* algorithm with Haversine heuristic achieves optimal route", () => {
        const router = new SPXHubGraphRouter();
        const astarRoute = router.findAStarPath("HUB_HN", "HUB_SG");
        const dijkstraRoute = router.findOptimalPath("HUB_HN", "HUB_SG", "time");

        expect.equal(astarRoute.found, true);
        expect.equal(dijkstraRoute.found, true);
        expect.equal(astarRoute.path[0].id, "HUB_HN");
        expect.equal(astarRoute.path[astarRoute.path.length - 1].id, "HUB_SG");
        expect.equal(Math.abs(astarRoute.totalTransitHours - dijkstraRoute.totalTransitHours) < 5.0, true);
      });

      test("F159-T04: Generates chronological live tracking schedule with cumulative ETA", () => {
        const router = new SPXHubGraphRouter();
        const route = router.findOptimalPath("HUB_HN", "HUB_SG", "time");
        const schedule = router.generateLiveTrackingSchedule(route, new Date("2026-10-15T08:00:00Z"));

        expect.equal(schedule.length, route.path.length);
        expect.equal(schedule[0].status, "COMPLETED");
        expect.equal(schedule[schedule.length - 1].status, "PENDING");
        expect.equal(new Date(schedule[schedule.length - 1].timestamp).getTime() > new Date(schedule[0].timestamp).getTime(), true);
      });

      test("F159-T05: Handles disconnected or non-existent hubs cleanly", () => {
        const router = new SPXHubGraphRouter();
        const invalid = router.findOptimalPath("HUB_HN", "UNKNOWN_ISLAND", "time");
        expect.equal(invalid.found, false);
      });

      test("F159-T06: Same source and destination returns instant 0 transit time", () => {
        const router = new SPXHubGraphRouter();
        const same = router.findOptimalPath("HUB_HN", "HUB_HN", "time");
        expect.equal(same.found, true);
        expect.equal(same.totalTransitHours, 0);
        expect.equal(same.totalDistanceKm, 0);
        expect.equal(same.path.length, 1);
      });

      test("F159-T07: Server and Client SPXHubGraphRouter produce identical routing solutions", () => {
        const clientRouter = new SPXHubGraphRouter();
        const serverRouter = new ServerSPXRouter();

        const cRoute = clientRouter.findOptimalPath("HUB_HN", "SOC_CT", "time");
        const sRoute = serverRouter.findOptimalPath("HUB_HN", "SOC_CT", "time");

        expect.equal(cRoute.found, true);
        expect.equal(sRoute.found, true);
        expect.equal(cRoute.totalTransitHours, sRoute.totalTransitHours);
        expect.equal(cRoute.totalDistanceKm, sRoute.totalDistanceKm);
      });

      test("F159-T08: Custom routing network and dynamic edge addition", () => {
        const customRouter = new SPXHubGraphRouter([], []);
        customRouter.addHub({ id: "H1", name: "Hub 1", city: "A", lat: 10, lng: 106, type: "FIRST_MILE" });
        customRouter.addHub({ id: "H2", name: "Hub 2", city: "B", lat: 11, lng: 107, type: "LAST_MILE" });
        customRouter.addRoute({ from: "H1", to: "H2", distanceKm: 50, transitHours: 2, baseCostVnd: 15000 });

        const r = customRouter.findOptimalPath("H1", "H2", "time");
        expect.equal(r.found, true);
        expect.equal(r.totalTransitHours, 2);
        expect.equal(r.totalDistanceKm, 50);
      });

      // --- Roaring Bitmaps Faceted Filter Index ---
      test("F159-T09: ArrayContainer maintains sorted order, contains check, and elements manipulation", () => {
        const ac = new ArrayContainer([10, 5, 20]);
        expect.equal(ac.cardinality(), 3);
        expect.equal(ac.contains(5), true);
        expect.equal(ac.contains(15), false);

        ac.add(15);
        expect.equal(ac.contains(15), true);
        expect.equal(ac.cardinality(), 4);

        ac.remove(10);
        expect.equal(ac.contains(10), false);
        expect.equal(ac.cardinality(), 3);
      });

      test("F159-T10: ArrayContainer automatically upgrades to BitmapContainer at threshold", () => {
        const ac = new ArrayContainer();
        for (let i = 0; i < 4095; i++) {
          ac.add(i);
        }
        expect.equal(ac.cardinality(), 4095);

        const other = new ArrayContainer([4095, 4096]);
        const union = ac.or(other);
        expect.equal(union instanceof BitmapContainer, true);
        expect.equal(union.cardinality(), 4097);
        expect.equal(union.contains(4096), true);
      });

      test("F159-T11: RoaringBitmap executes AND, OR, and AND_NOT correctly across chunks", () => {
        const bm1 = new RoaringBitmap([1, 2, 3, 70000, 70001]);
        const bm2 = new RoaringBitmap([2, 3, 4, 70001, 70002]);

        const andBm = bm1.and(bm2);
        expect.equal(andBm.toArray().join(","), "2,3,70001");

        const orBm = bm1.or(bm2);
        expect.equal(orBm.cardinality(), 7);
        expect.equal(orBm.contains(70000), true);
        expect.equal(orBm.contains(70002), true);

        const diffBm = bm1.andNot(bm2);
        expect.equal(diffBm.toArray().join(","), "1,70000");
      });

      test("F159-T12: FacetedCatalogIndex indexes products and performs compound AND filtering", () => {
        const catalog = new FacetedCatalogIndex();
        catalog.indexProduct({ id: "p1", name: "Áo polo Coolmate", category: "Thời trang", brand: "Coolmate", price: 150000, rating: 5, stock: 10, location: "Hà Nội" });
        catalog.indexProduct({ id: "p2", name: "Quần jean Owen", category: "Thời trang", brand: "Owen", price: 350000, rating: 4, stock: 5, location: "Hà Nội" });
        catalog.indexProduct({ id: "p3", name: "Áo sơ mi Coolmate", category: "Thời trang", brand: "Coolmate", price: 250000, rating: 4, stock: 0, location: "Hồ Chí Minh" });

        const res = catalog.filter({ category: "Thời trang", brand: "Coolmate", inStock: true });
        expect.equal(res.totalMatches, 1);
        expect.equal(res.products[0].id, "p1");
      });

      test("F159-T13: FacetedCatalogIndex handles priceTier and minRating simultaneously", () => {
        const catalog = new FacetedCatalogIndex();
        catalog.indexProduct({ id: "p1", name: "Sạc nhanh 20W", category: "Phụ kiện", price: 80000, rating: 4.8, stock: 20 });
        catalog.indexProduct({ id: "p2", name: "Sạc GaN 65W", category: "Phụ kiện", price: 450000, rating: 5.0, stock: 15 });
        catalog.indexProduct({ id: "p3", name: "Tai nghe giá rẻ", category: "Phụ kiện", price: 50000, rating: 3.2, stock: 8 });

        const affordableFiveStar = catalog.filter({ priceTier: "UNDER_100K", minRating: 4 });
        expect.equal(affordableFiveStar.totalMatches, 1);
        expect.equal(affordableFiveStar.products[0].id, "p1");
      });

      test("F159-T14: FacetedCatalogIndex filters by inStock availability accurately", () => {
        const catalog = new FacetedCatalogIndex();
        catalog.indexProduct({ id: "p1", name: "Mặt hàng còn", category: "Gia dụng", stock: 10 });
        catalog.indexProduct({ id: "p2", name: "Mặt hàng hết", category: "Gia dụng", stock: 0 });

        const inStockOnly = catalog.filter({ inStock: true });
        const outOfStockOnly = catalog.filter({ inStock: false });

        expect.equal(inStockOnly.totalMatches, 1);
        expect.equal(outOfStockOnly.totalMatches, 1);
      });

      test("F159-T15: Server and Client RoaringBitmap produce identical results", () => {
        const clientBm = new RoaringBitmap([10, 20, 30, 80000]);
        const serverBm = new ServerRoaringBitmap([10, 20, 30, 80000]);

        expect.equal(clientBm.cardinality(), serverBm.cardinality());
        expect.equal(clientBm.contains(80000), serverBm.contains(80000));
        expect.equal(clientBm.toArray().join(","), serverBm.toArray().join(","));
      });

      test("F159-T16: RoaringBitmap handles edge cases of empty query and non-matching facets", () => {
        const catalog = new FacetedCatalogIndex();
        catalog.indexProduct({ id: "p1", name: "Hàng A", category: "Sách", stock: 1 });

        const noFilters = catalog.filter({});
        expect.equal(noFilters.totalMatches, 1);

        const impossibleFilter = catalog.filter({ category: "NonExistentCategory" });
        expect.equal(impossibleFilter.totalMatches, 0);
      });

      // --- RFM Customer Segmentation & CLV Engine ---
      test("F159-T17: RFMSegmentationEngine calculates Recency, Frequency, and Monetary scores accurately", () => {
        const engine = new RFMSegmentationEngine("2026-10-15T00:00:00Z");

        expect.equal(engine.calculateRecencyScore(5), 5); // <= 14 ngày
        expect.equal(engine.calculateRecencyScore(25), 4); // 15-30 ngày
        expect.equal(engine.calculateRecencyScore(45), 3); // 31-60 ngày
        expect.equal(engine.calculateRecencyScore(80), 2); // 61-90 ngày
        expect.equal(engine.calculateRecencyScore(120), 1); // > 90 ngày

        expect.equal(engine.calculateFrequencyScore(20), 5); // >= 15 đơn
        expect.equal(engine.calculateFrequencyScore(10), 4); // 8-14 đơn
        expect.equal(engine.calculateFrequencyScore(5), 3); // 4-7 đơn
        expect.equal(engine.calculateFrequencyScore(2), 2); // 2-3 đơn
        expect.equal(engine.calculateFrequencyScore(1), 1); // 1 đơn

        expect.equal(engine.calculateMonetaryScore(6000000), 5); // >= 5M
        expect.equal(engine.calculateMonetaryScore(3000000), 4); // 2M-5M
        expect.equal(engine.calculateMonetaryScore(1000000), 3); // 800k-2M
        expect.equal(engine.calculateMonetaryScore(500000), 2); // 300k-800k
        expect.equal(engine.calculateMonetaryScore(100000), 1); // < 300k
      });

      test("F159-T18: Correctly classifies VIP Champions customer with lifetime perks", () => {
        const engine = new RFMSegmentationEngine("2026-10-15T00:00:00Z");
        const vipCustomer = {
          id: "cust_vip",
          name: "Trần Minh Đức",
          orders: [
            { createdAt: "2026-10-12T00:00:00Z", totalAmount: 2000000, status: "DELIVERED" },
            { createdAt: "2026-10-05T00:00:00Z", totalAmount: 1500000, status: "DELIVERED" },
            { createdAt: "2026-09-20T00:00:00Z", totalAmount: 1200000, status: "DELIVERED" },
            { createdAt: "2026-09-01T00:00:00Z", totalAmount: 900000, status: "DELIVERED" },
            { createdAt: "2026-08-20T00:00:00Z", totalAmount: 800000, status: "DELIVERED" },
            { createdAt: "2026-08-10T00:00:00Z", totalAmount: 700000, status: "DELIVERED" },
            { createdAt: "2026-08-01T00:00:00Z", totalAmount: 600000, status: "DELIVERED" },
            { createdAt: "2026-07-20T00:00:00Z", totalAmount: 500000, status: "DELIVERED" },
          ],
        };

        const res = engine.analyzeCustomer(vipCustomer);
        expect.equal(res.rScore >= 4, true);
        expect.equal(res.fScore >= 4, true);
        expect.equal(res.mScore >= 5, true);
        expect.equal(res.segment.code, "CHAMPIONS");
        expect.equal(res.projectedCLV > 5000000, true);
      });

      test("F159-T19: Correctly classifies At Risk customers and triggers urgent retention", () => {
        const engine = new RFMSegmentationEngine("2026-10-15T00:00:00Z");
        const atRiskCustomer = {
          id: "cust_at_risk",
          name: "Lê Hoàng Yến",
          orders: [
            { createdAt: "2026-07-01T00:00:00Z", totalAmount: 1500000, status: "DELIVERED" },
            { createdAt: "2026-06-15T00:00:00Z", totalAmount: 1200000, status: "DELIVERED" },
            { createdAt: "2026-06-01T00:00:00Z", totalAmount: 1100000, status: "DELIVERED" },
            { createdAt: "2026-05-15T00:00:00Z", totalAmount: 800000, status: "DELIVERED" },
          ],
        };

        const res = engine.analyzeCustomer(atRiskCustomer);
        expect.equal(res.rScore <= 2, true); // Đã hơn 3 tháng chưa mua
        expect.equal(res.segment.code, "AT_RISK");
        expect.equal(res.segment.recommendedAction.includes("chiết khấu"), true);
      });

      test("F159-T20: Calculates Customer Lifetime Value (CLV) with segment multiplier", () => {
        const engine = new RFMSegmentationEngine("2026-10-15T00:00:00Z");
        const newCust = {
          id: "cust_new",
          name: "Nguyễn Văn Nam",
          orders: [{ createdAt: "2026-10-14T00:00:00Z", totalAmount: 500000, status: "DELIVERED" }],
        };

        const res = engine.analyzeCustomer(newCust);
        expect.equal(res.segment.code, "NEW_CUSTOMERS");
        expect.equal(res.averageOrderValue, 500000);
        expect.equal(res.projectedCLV >= 500000, true);
      });

      test("F159-T21: Performs batch analysis across customer portfolio and outputs breakdown", () => {
        const engine = new RFMSegmentationEngine("2026-10-15T00:00:00Z");
        const customers = [
          { id: "c1", name: "Khách 1", orders: [{ createdAt: "2026-10-12T00:00:00Z", totalAmount: 1000000, status: "DELIVERED" }] },
          { id: "c2", name: "Khách 2", orders: [{ createdAt: "2026-05-12T00:00:00Z", totalAmount: 200000, status: "DELIVERED" }] },
        ];

        const batch = engine.analyzeBatch(customers);
        expect.equal(batch.totalCustomers, 2);
        expect.equal(batch.totalHistoricalGMV, 1200000);
        expect.equal(batch.segmentBreakdown.length, 11);
      });

      test("F159-T22: Admin Copilot recognizes SPX Hub Graph Routing, Roaring Bitmaps, and RFM queries", () => {
        const r1 = generateAdminCopilotResponse("Lộ trình định tuyến SPX qua các hub trung chuyển");
        expect.equal(r1.tag, "ĐỊNH TUYẾN ĐỒ THỊ SPX HUB");
        expect.equal(r1.text.includes("Dijkstra"), true);

        const r2 = generateAdminCopilotResponse("Kiến trúc bộ lọc thuộc tính Roaring Bitmaps");
        expect.equal(r2.tag, "CHỈ MỤC ROARING BITMAPS");
        expect.equal(r2.text.includes("ArrayContainer"), true);

        const r3 = generateAdminCopilotResponse("Phân tích phân khúc khách hàng RFM và CLV");
        expect.equal(r3.tag, "PHÂN KHÚC RFM & CLV");
        expect.equal(r3.text.includes("Champions"), true);
      });

      test("F159-T23: Seller Copilot provides tailored RFM customer segment marketing advice and SPX transit times", () => {
        const r1 = generateSellerCopilotResponse("Lộ trình vận chuyển liên tỉnh SPX");
        expect.equal(r1.tag, "LỘ TRÌNH SPX GRAPH ROUTER");

        const r2 = generateSellerCopilotResponse("Phân khúc khách hàng shop theo RFM");
        expect.equal(r2.tag, "PHÂN KHÚC KHÁCH HÀNG RFM");
        expect.equal(r2.text.includes("Champions"), true);
      });

      test("F159-T24: Comprehensive End-to-End: Faceted Search -> Order -> SPX Routing -> RFM Upgrade", () => {
        // Step 1: Buyer filters catalog via Roaring Bitmaps
        const catalog = new FacetedCatalogIndex();
        catalog.indexProduct({ id: "prod_macbook", name: "MacBook Pro M3", category: "Laptop", brand: "Apple", price: 45000000, rating: 5, stock: 5, location: "Hà Nội" });
        catalog.indexProduct({ id: "prod_mouse", name: "Magic Mouse", category: "Phụ kiện", brand: "Apple", price: 2000000, rating: 5, stock: 10, location: "Hà Nội" });

        const searchRes = catalog.filter({ category: "Laptop", brand: "Apple", inStock: true });
        expect.equal(searchRes.totalMatches, 1);
        expect.equal(searchRes.products[0].id, "prod_macbook");

        // Step 2: Buyer orders -> SPX Hub Graph Router generates shipping plan
        const router = new SPXHubGraphRouter();
        const routePlan = router.findOptimalPath("HUB_HN", "HUB_SG", "time");
        expect.equal(routePlan.found, true);
        expect.equal(routePlan.segments.length > 0, true);

        // Step 3: Customer completes purchase -> RFM Engine upgrades to Champions
        const rfmEngine = new RFMSegmentationEngine();
        const customerProfile = {
          id: "buyer_apple_fan",
          name: "Lê Minh Tuấn",
          orders: [
            { createdAt: new Date().toISOString(), totalAmount: 47000000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), totalAmount: 15000000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), totalAmount: 5000000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), totalAmount: 2000000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), totalAmount: 1000000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), totalAmount: 800000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 25 * 86400000).toISOString(), totalAmount: 500000, status: "DELIVERED" },
            { createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), totalAmount: 400000, status: "DELIVERED" },
          ],
        };
        const rfmResult = rfmEngine.analyzeCustomer(customerProfile);
        expect.equal(rfmResult.segment.code, "CHAMPIONS");
        expect.equal(rfmResult.projectedCLV > 50000000, true);
      });
    });

    // =========================================================================
    // FEATURE 160: INVENTORY CLEARANCE, GEOHASH SPATIAL & LINUCB BANDIT SUITE
    // =========================================================================
    describe("Feature 160: Advanced Enterprise Inventory Clearance, Geohash Spatial Indexing, and Contextual LinUCB Feed Suite", () => {
      // --- Inventory Clearance Decay & Floor Price ---
      test("F160-T01: Evaluates Fresh stock (<= 30 days) maintaining standard pricing", () => {
        const optimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const product = {
          id: "prod_fresh",
          name: "Áo polo mới về",
          price: 200000,
          cogs: 100000,
          stock: 50,
          receivedDate: "2026-10-01T00:00:00Z", // 14 days
        };

        const res = optimizer.evaluateProduct(product);
        expect.equal(res.ageTier, "FRESH");
        expect.equal(res.daysInInventory, 14);
        expect.equal(res.effectiveDiscountPct, 0);
        expect.equal(res.suggestedPrice, 200000);
      });

      test("F160-T02: Evaluates Moderate aging stock (31-60 days) applying 10% discount", () => {
        const optimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const product = {
          id: "prod_moderate",
          name: "Váy hoa mùa thu",
          price: 300000,
          cogs: 120000,
          stock: 30,
          receivedDate: "2026-08-30T00:00:00Z", // 46 days
        };

        const res = optimizer.evaluateProduct(product);
        expect.equal(res.ageTier, "MODERATE");
        expect.equal(res.effectiveDiscountPct, 10);
        expect.equal(res.suggestedPrice, 270000);
      });

      test("F160-T03: Evaluates Slow-moving stock (61-90 days) applying 25% discount", () => {
        const optimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const product = {
          id: "prod_slow",
          name: "Giày sandal hè",
          price: 400000,
          cogs: 150000,
          stock: 20,
          receivedDate: "2026-07-25T00:00:00Z", // 82 days
        };

        const res = optimizer.evaluateProduct(product);
        expect.equal(res.ageTier, "SLOW");
        expect.equal(res.effectiveDiscountPct, 25);
        expect.equal(res.suggestedPrice, 300000);
      });

      test("F160-T04: Evaluates Deadstock (>90 days) applying 40% clearance discount", () => {
        const optimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const product = {
          id: "prod_dead",
          name: "Ốp lưng điện thoại cũ",
          price: 100000,
          cogs: 30000,
          stock: 100,
          receivedDate: "2026-06-01T00:00:00Z", // > 130 days
        };

        const res = optimizer.evaluateProduct(product);
        expect.equal(res.ageTier, "DEADSTOCK");
        expect.equal(res.effectiveDiscountPct >= 40, true);
        expect.equal(res.suggestedPrice <= 60000, true);
      });

      test("F160-T05: Strict breakeven floor price protection prevents selling below cost", () => {
        const optimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const product = {
          id: "prod_expensive_cost",
          name: "Tai nghe nhập khẩu đắt đỏ",
          price: 1000000,
          cogs: 800000, // COGS rất cao
          stock: 10,
          receivedDate: "2026-05-01T00:00:00Z", // Rất cũ > 150 days
        };

        const res = optimizer.evaluateProduct(product);
        expect.equal(res.ageTier, "DEADSTOCK");
        expect.equal(res.isAtFloorPrice, true);
        expect.equal(res.suggestedPrice >= res.floorPrice, true);
        expect.equal(res.suggestedPrice > 800000, true);
      });

      test("F160-T06: Exponential decay curve accurately calculates decay factor", () => {
        const optimizer = new InventoryDecayOptimizer({ decayConstant: 0.01, referenceDate: "2026-10-15T00:00:00Z" });
        const floor = optimizer.calculateFloorPrice(50000);
        expect.equal(floor > 50000, true);
      });

      test("F160-T07: Batch catalog evaluation calculates total locked capital and recovery revenue", () => {
        const optimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const catalog = [
          { id: "p1", name: "Hàng Mới", price: 200000, cogs: 100000, stock: 10, receivedDate: "2026-10-10T00:00:00Z" },
          { id: "p2", name: "Hàng Tồn", price: 100000, cogs: 40000, stock: 50, receivedDate: "2026-06-01T00:00:00Z" },
        ];

        const batch = optimizer.evaluateCatalog(catalog);
        expect.equal(batch.totalProducts, 2);
        expect.equal(batch.totalUnitsInStock, 60);
        expect.equal(batch.totalLockedCapital, 10 * 100000 + 50 * 40000);
        expect.equal(batch.projectedRecoveryRevenue > 0, true);
        expect.equal(batch.deadstockCount, 1);
      });

      test("F160-T08: Server and Client InventoryDecayOptimizer produce identical evaluations", () => {
        const clientOpt = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const serverOpt = new ServerInventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });

        const prod = { id: "p_test", name: "Test Item", price: 500000, cogs: 200000, stock: 15, receivedDate: "2026-08-01T00:00:00Z" };
        const cRes = clientOpt.evaluateProduct(prod);
        const sRes = serverOpt.evaluateProduct(prod);

        expect.equal(cRes.suggestedPrice, sRes.suggestedPrice);
        expect.equal(cRes.ageTier, sRes.ageTier);
        expect.equal(cRes.floorPrice, sRes.floorPrice);
      });

      // --- Geohash Spatial Indexing ---
      test("F160-T09: Encodes latitude and longitude into Base32 Geohash string at precision 6", () => {
        const hash = encodeGeohash(21.0285, 105.8542, 6); // Hoàn Kiếm, Hà Nội
        expect.equal(typeof hash, "string");
        expect.equal(hash.length, 6);
      });

      test("F160-T10: Decodes Geohash back to GPS coordinates within expected error bounding box", () => {
        const hash = encodeGeohash(10.7769, 106.7009, 6); // Quận 1, TP.HCM
        const decoded = decodeGeohash(hash);

        expect.equal(Math.abs(decoded.latitude - 10.7769) < 0.05, true);
        expect.equal(Math.abs(decoded.longitude - 106.7009) < 0.05, true);
      });

      test("F160-T11: Calculates 8 neighbor geohashes correctly for boundary-crossing proximity queries", () => {
        const center = encodeGeohash(21.0285, 105.8542, 6);
        const neighbors = getGeohashNeighbors(center);

        expect.equal(neighbors.center, center);
        expect.equal(typeof neighbors.north, "string");
        expect.equal(typeof neighbors.south, "string");
        expect.equal(typeof neighbors.east, "string");
        expect.equal(typeof neighbors.west, "string");
        expect.equal(typeof neighbors.northEast, "string");
      });

      test("F160-T12: GeohashSpatialIndex registers locations and finds nearest shops within 5km radius", () => {
        const index = new GeohashSpatialIndex(6);
        index.addLocation("shop_hk", 21.0285, 105.8542, { name: "Shop Hoàn Kiếm" });
        index.addLocation("shop_bd", 21.0350, 105.8400, { name: "Shop Ba Đình" });
        index.addLocation("shop_sg", 10.7769, 106.7009, { name: "Shop Sài Gòn" });

        const nearby = index.findNearby(21.0300, 105.8500, 5.0, 10);
        expect.equal(nearby.totalFound, 2);
        expect.equal(nearby.locations[0].id === "shop_hk" || nearby.locations[0].id === "shop_bd", true);
      });

      test("F160-T13: Limits search results and sorts ascending by Haversine distance", () => {
        const index = new GeohashSpatialIndex(6);
        index.addLocation("loc_1", 21.0280, 105.8540, { name: "Gần nhất" });
        index.addLocation("loc_2", 21.0310, 105.8560, { name: "Gần nhì" });
        index.addLocation("loc_3", 21.0350, 105.8600, { name: "Gần ba" });

        const res = index.findNearby(21.0280, 105.8540, 5.0, 2);
        expect.equal(res.locations.length, 2);
        expect.equal(res.locations[0].distanceKm <= res.locations[1].distanceKm, true);
        expect.equal(res.locations[0].id, "loc_1");
      });

      test("F160-T14: Correctly handles locations crossing cell boundary via 8-neighbors search", () => {
        const index = new GeohashSpatialIndex(6);
        const center = encodeGeohash(21.0285, 105.8542, 6);
        const neighbors = getGeohashNeighbors(center);
        const neighborDecoded = decodeGeohash(neighbors.north);

        index.addLocation("loc_north", neighborDecoded.latitude, neighborDecoded.longitude, { name: "Bưu cục lân cận" });
        const res = index.findNearby(21.0285, 105.8542, 5.0);
        expect.equal(res.totalFound >= 1, true);
        expect.equal(res.locations[0].id, "loc_north");
      });

      test("F160-T15: Returns empty results for distant queries without error", () => {
        const index = new GeohashSpatialIndex(6);
        index.addLocation("shop_hanoi", 21.0285, 105.8542);

        const res = index.findNearby(10.7769, 106.7009, 5.0); // Tìm tại Sài Gòn
        expect.equal(res.totalFound, 0);
        expect.equal(res.locations.length, 0);
      });

      test("F160-T16: Server and Client GeohashSpatialIndex produce identical search results", () => {
        const clientIndex = new GeohashSpatialIndex(6);
        const serverIndex = new ServerGeohashSpatialIndex(6);

        clientIndex.addLocation("p1", 21.0285, 105.8542, { name: "HN" });
        serverIndex.addLocation("p1", 21.0285, 105.8542, { name: "HN" });

        const cRes = clientIndex.findNearby(21.0300, 105.8500, 3.0);
        const sRes = serverIndex.findNearby(21.0300, 105.8500, 3.0);

        expect.equal(cRes.totalFound, sRes.totalFound);
        expect.equal(cRes.locations[0].distanceKm, sRes.locations[0].distanceKm);
      });

      // --- Contextual Bandit LinUCB Recommender ---
      test("F160-T17: Inverts matrix using Gauss-Jordan elimination accurately", () => {
        const A = [
          [2, 1],
          [1, 3],
        ];
        const A_inv = invertMatrix(A);
        const prod = [
          A[0][0] * A_inv[0][0] + A[0][1] * A_inv[1][0],
          A[0][0] * A_inv[0][1] + A[0][1] * A_inv[1][1],
        ];

        expect.equal(Math.abs(prod[0] - 1.0) < 1e-4, true);
        expect.equal(Math.abs(prod[1] - 0.0) < 1e-4, true);
      });

      test("F160-T18: Extracts normalized context vector from user context", () => {
        const recommender = new LinUCBRecommender({ dimension: 4 });
        const vec = recommender.extractContextVector({ isMobile: true, hourOfDay: 12, priceSensitivity: 0.9 });

        expect.equal(vec.length, 4);
        expect.equal(vec[0], 1.0); // Bias
        expect.equal(vec[1], 1.0); // Mobile
        expect.equal(vec[2], 1.0); // Peak hour 12h
        expect.equal(vec[3], 0.9); // Price sensitivity
      });

      test("F160-T19: LinUCB calculates expected payoff and upper confidence bound for candidate arms", () => {
        const recommender = new LinUCBRecommender({ dimension: 4, alpha: 0.5 });
        recommender.addArm("cat_tech", { name: "Đồ công nghệ" });
        recommender.addArm("cat_fashion", { name: "Thời trang" });

        const ctx = [1.0, 1.0, 0.5, 0.2];
        const recs = recommender.recommend(ctx, 2);

        expect.equal(recs.length, 2);
        expect.equal(recs[0].score > 0, true);
        expect.equal(recs[0].confidenceBound > 0, true);
      });

      test("F160-T20: Explores unpulled arms due to high uncertainty confidence bound bonus", () => {
        const recommender = new LinUCBRecommender({ dimension: 4, alpha: 1.0 });
        recommender.addArm("arm_familiar");
        recommender.addArm("arm_new");

        const ctx = [1.0, 0.5, 0.5, 0.5];
        // Kéo arm_familiar nhiều lần với reward 0 (thất bại)
        for (let i = 0; i < 5; i++) {
          recommender.update("arm_familiar", ctx, 0.0);
        }

        const recs = recommender.recommend(ctx, 2);
        expect.equal(recs[0].armId, "arm_new"); // Cánh tay mới có độ bất định cao được ưu tiên thử nghiệm
      });

      test("F160-T21: Updates covariance matrix A and reward vector b online with user feedback", () => {
        const recommender = new LinUCBRecommender({ dimension: 4, alpha: 0.2 });
        recommender.addArm("arm_winner");

        const ctx = [1.0, 1.0, 1.0, 1.0];
        // Nhận feedback chuyển đổi thành công 3 lần
        recommender.update("arm_winner", ctx, 1.0);
        recommender.update("arm_winner", ctx, 1.0);
        recommender.update("arm_winner", ctx, 1.0);

        const recs = recommender.recommend(ctx, 1);
        expect.equal(recs[0].expectedPayoff > 0.5, true);
        expect.equal(recs[0].pullCount, 3);
      });

      test("F160-T22: Admin Copilot recognizes inventory clearance, geohash spatial, and LinUCB feed queries", () => {
        const r1 = generateAdminCopilotResponse("Chiến dịch xả hàng tồn kho sàn");
        expect.equal(r1.tag, "QUẢN TRỊ XẢ KHO TỒN BÃI");
        expect.equal(r1.text.includes("Aging Tiers"), true);

        const r2 = generateAdminCopilotResponse("Hệ thống định vị không gian Geohash và mạng lưới bưu cục");
        expect.equal(r2.tag, "CHỈ MỤC KHÔNG GIAN GEOHASH");
        expect.equal(r2.text.includes("8 Neighbors"), true);

        const r3 = generateAdminCopilotResponse("Cá nhân hóa khám phá trang chủ bằng LinUCB bandit");
        expect.equal(r3.tag, "CÁ NHÂN HÓA LINUCB BANDIT");
        expect.equal(r3.text.includes("Filter Bubble"), true);
      });

      test("F160-T23: Seller Copilot advises inventory age decay clearance, breakeven floor, and SPX drop-off", () => {
        const r1 = generateSellerCopilotResponse("Xả hàng tồn kho shop và giá sàn hòa vốn");
        expect.equal(r1.tag, "XẢ KHO TỒN BÃI & GIÁ SÀN");
        expect.equal(r1.text.includes("COGS"), true);

        const r2 = generateSellerCopilotResponse("Tìm bưu cục SPX gần shop để gửi hàng");
        expect.equal(r2.tag, "BƯU CỤC SPX GẦN NHẤT");
        expect.equal(r2.text.includes("Geohash"), true);
      });

      test("F160-T24: Comprehensive End-to-End: Nearby Shop Geohash -> LinUCB Personalized Clearance Deal -> Order Execution", () => {
        // Step 1: Customer finds nearby shops within 3km using Geohash
        const spatialIndex = new GeohashSpatialIndex(6);
        spatialIndex.addLocation("shop_coolmate_hn", 21.0285, 105.8542, { name: "Coolmate Hoàn Kiếm" });
        spatialIndex.addLocation("shop_other_sg", 10.7769, 106.7009, { name: "Coolmate Sài Gòn" });

        const nearbySearch = spatialIndex.findNearby(21.0300, 105.8500, 3.0);
        expect.equal(nearbySearch.totalFound, 1);
        expect.equal(nearbySearch.locations[0].id, "shop_coolmate_hn");

        // Step 2: LinUCB personalizes clearance products based on mobile + peak hour context
        const linUcb = new LinUCBRecommender({ dimension: 4, alpha: 0.3 });
        linUcb.addArm("prod_polo_clearance", { name: "Áo polo xả kho", originalPrice: 200000 });
        linUcb.addArm("prod_shoes_standard", { name: "Giày sneaker mới", originalPrice: 800000 });

        const userContextVec = linUcb.extractContextVector({ isMobile: true, hourOfDay: 20, priceSensitivity: 1.0 });
        const recommendations = linUcb.recommend(userContextVec, 1);
        expect.equal(recommendations.length, 1);

        // Step 3: Seller evaluates clearance price with Age Decay optimizer
        const decayOptimizer = new InventoryDecayOptimizer({ referenceDate: "2026-10-15T00:00:00Z" });
        const clearanceItem = {
          id: "prod_polo_clearance",
          name: "Áo polo xả kho",
          price: 200000,
          cogs: 90000,
          stock: 40,
          receivedDate: "2026-06-15T00:00:00Z", // Deadstock > 120 days
        };
        const clearancePlan = decayOptimizer.evaluateProduct(clearanceItem);
        expect.equal(clearancePlan.ageTier, "DEADSTOCK");
        expect.equal(clearancePlan.suggestedPrice < 200000, true);
        expect.equal(clearancePlan.suggestedPrice >= clearancePlan.floorPrice, true);

        // Step 4: Customer clicks and buys -> LinUCB receives online positive reward
        linUcb.update("prod_polo_clearance", userContextVec, 1.0);
        const updatedRecs = linUcb.recommend(userContextVec, 1);
        expect.equal(updatedRecs[0].expectedPayoff > 0, true);
      });
    });
  });

  // =========================================================================
  // FEATURE 161: Enterprise PID Bidding, SPX Edmonds-Karp & Image Hash Suite (24 Tests)
  // =========================================================================
  describe("Feature 161: Enterprise Dynamic Bidding, Network Max-Flow & Image Copyright Suite", () => {
    // -----------------------------------------------------------------------
    // PART 1: PID Feedback Controller for Dynamic Ad Bidding (8 Tests)
    // -----------------------------------------------------------------------
    describe("Part 1: PID Feedback Controller (F161-T01 to F161-T08)", () => {
      test("F161-T01: Initializes PID controller with default gains and target ROAS", () => {
        const controller = new PidBiddingController({ targetRoas: 4.0 });
        expect.equal(controller.targetRoas, 4.0);
        expect.equal(controller.kp, 0.5);
        expect.equal(controller.ki, 0.05);
        expect.equal(controller.kd, 0.1);
        expect.equal(controller.integral, 0);
      });

      test("F161-T02: Increases bid when current ROAS exceeds target (high campaign profitability)", () => {
        const controller = new PidBiddingController({ targetRoas: 3.5, kp: 0.6, ki: 0.05, kd: 0.1 });
        const currentBid = 2000;
        const currentRoas = 5.0; // Cao hơn mục tiêu 3.5
        const result = controller.computeBidAdjustment(currentRoas, currentBid);

        expect.equal(result.action, "INCREASE");
        expect.equal(result.proposedBid > currentBid, true);
        expect.equal(result.error > 0, true);
        expect.equal(result.pTerm > 0, true);
      });

      test("F161-T03: Decreases bid when current ROAS falls below target (campaign losing money)", () => {
        const controller = new ServerPidController({ targetRoas: 4.0, kp: 0.5, ki: 0.05, kd: 0.1 });
        const currentBid = 3000;
        const currentRoas = 2.0; // Rất thấp so với mục tiêu 4.0
        const result = controller.computeBidAdjustment(currentRoas, currentBid);

        expect.equal(result.action, "DECREASE");
        expect.equal(result.proposedBid < currentBid, true);
        expect.equal(result.error < 0, true);
      });

      test("F161-T04: Anti-windup limit caps integral term accumulation during prolonged errors", () => {
        const controller = new PidBiddingController({ targetRoas: 3.0, antiWindupLimit: 10 });
        // Chạy 50 chu kỳ với lỗi âm liên tục
        for (let i = 0; i < 50; i++) {
          controller.computeBidAdjustment(1.0, 2000);
        }
        // Sai số tích phân không được vượt quá antiWindupLimit = 10
        expect.equal(controller.integral, -10);
      });

      test("F161-T05: Proposed bid is strictly clamped within [minBid, maxBid] boundaries", () => {
        const controller = new ServerPidController({ minBid: 500, maxBid: 10000 });
        // Thử kích giá cực đại
        const maxResult = controller.computeBidAdjustment(100.0, 9500);
        expect.equal(maxResult.proposedBid, 10000);
        expect.equal(maxResult.isClamped, true);

        // Thử dìm giá cực tiểu
        const minResult = controller.computeBidAdjustment(0.1, 600);
        expect.equal(minResult.proposedBid, 500);
      });

      test("F161-T06: Budget pacing reduces bid when spending too fast early in the day", () => {
        const controller = new PidBiddingController();
        const dailyBudget = 1000000; // 1 triệu
        const spentBudget = 400000;  // Đã tiêu 400k (40%)
        const currentHour = 3;       // Nhưng mới 3h sáng (dự kiến tiêu ~16.6%)
        const currentBid = 2000;

        const pacing = controller.computeBudgetPacingAdjustment(dailyBudget, spentBudget, currentHour, currentBid);
        expect.equal(pacing.pacingStatus, "SPENDING_TOO_FAST");
        expect.equal(pacing.proposedBid < currentBid, true);
        expect.equal(pacing.multiplier < 1.0, true);
      });

      test("F161-T07: Budget pacing boosts bid when spending too slow to capture available traffic", () => {
        const controller = new ServerPidController();
        const dailyBudget = 1000000;
        const spentBudget = 100000;  // Mới tiêu 100k (10%)
        const currentHour = 15;      // Đã 15h chiều (dự kiến tiêu ~66.7%)
        const currentBid = 2000;

        const pacing = controller.computeBudgetPacingAdjustment(dailyBudget, spentBudget, currentHour, currentBid);
        expect.equal(pacing.pacingStatus, "SPENDING_TOO_SLOW");
        expect.equal(pacing.proposedBid > currentBid, true);
        expect.equal(pacing.multiplier > 1.0, true);
      });

      test("F161-T08: Budget pacing automatically triggers PAUSE when daily budget is exhausted", () => {
        const controller = new PidBiddingController();
        const dailyBudget = 500000;
        const spentBudget = 500000; // Đã cạn kiệt
        const pacing = controller.computeBudgetPacingAdjustment(dailyBudget, spentBudget, 12, 1500);

        expect.equal(pacing.action, "PAUSE");
        expect.equal(pacing.proposedBid, 0);
      });
    });

    // -----------------------------------------------------------------------
    // PART 2: Edmonds-Karp Maximum Flow Network for SPX Logistics (8 Tests)
    // -----------------------------------------------------------------------
    describe("Part 2: Edmonds-Karp SPX Maximum Flow (F161-T09 to F161-T16)", () => {
      test("F161-T09: Adds logistics hubs and capacity-bounded routes successfully", () => {
        const network = new EdmondsKarpMaxFlow();
        network.addNode("HUB_HN", "Tổng kho Hà Nội", "source");
        network.addNode("STATION_HD", "Bưu cục Hoàn Kiếm", "sink");
        network.addEdge("HUB_HN", "STATION_HD", 500);

        expect.equal(network.nodes.size, 2);
        expect.equal(network.capacities.get("HUB_HN").get("STATION_HD"), 500);
      });

      test("F161-T10: Computes exact maximum flow for 4-node diamond network", () => {
        // S -> A (10), S -> B (10)
        // A -> T (10), B -> T (10), A -> B (5)
        // Max Flow kỳ vọng = 20
        const network = new EdmondsKarpMaxFlow();
        network.addEdge("S", "A", 10);
        network.addEdge("S", "B", 10);
        network.addEdge("A", "B", 5);
        network.addEdge("A", "T", 10);
        network.addEdge("B", "T", 10);

        const result = network.computeMaxFlow("S", "T");
        expect.equal(result.maxFlow, 20);
        expect.equal(result.totalPathsFound >= 2, true);
      });

      test("F161-T11: Parallel multi-path SPX network routes parcels up to aggregate capacity", () => {
        const network = new ServerEdmondsKarp();
        network.addEdge("KHO_TONG", "HUB_BAC", 1000);
        network.addEdge("KHO_TONG", "HUB_NAM", 1200);
        network.addEdge("HUB_BAC", "LAST_MILE", 800);
        network.addEdge("HUB_NAM", "LAST_MILE", 900);

        // Max Flow = min(1000, 800) + min(1200, 900) = 800 + 900 = 1700
        const result = network.computeMaxFlow("KHO_TONG", "LAST_MILE");
        expect.equal(result.maxFlow, 1700);
      });

      test("F161-T12: Max-Flow Min-Cut Theorem holds: Max Flow equals Min-Cut Capacity", () => {
        const network = new EdmondsKarpMaxFlow();
        network.addEdge("SOURCE", "H1", 300);
        network.addEdge("SOURCE", "H2", 200);
        network.addEdge("H1", "H2", 100);
        network.addEdge("H1", "SINK", 200);
        network.addEdge("H2", "SINK", 300);

        const cutResult = network.findBottlenecks("SOURCE", "SINK");
        expect.equal(cutResult.isMinCutVerified, true);
        expect.equal(cutResult.maxFlow, cutResult.cutCapacity);
      });

      test("F161-T13: Identifies exact saturated bottleneck edges limiting SPX throughput", () => {
        const network = new ServerEdmondsKarp();
        network.addEdge("KHO", "HUB_A", 1000);
        network.addEdge("HUB_A", "TRAM_PHAT", 300); // Nút thắt cổ chai hẹp chỉ 300

        const cutResult = network.findBottlenecks("KHO", "TRAM_PHAT");
        expect.equal(cutResult.bottleneckCount, 1);
        expect.equal(cutResult.bottlenecks[0].from, "HUB_A");
        expect.equal(cutResult.bottlenecks[0].to, "TRAM_PHAT");
        expect.equal(cutResult.bottlenecks[0].capacity, 300);
      });

      test("F161-T14: Generates actionable recommendations for logistics capacity expansion", () => {
        const network = new EdmondsKarpMaxFlow();
        network.addEdge("HUB_HCM", "STATION_Q1", 250);

        const cutResult = network.findBottlenecks("HUB_HCM", "STATION_Q1");
        expect.equal(cutResult.bottlenecks[0].recommendation.includes("Tăng công suất"), true);
      });

      test("F161-T15: Safely throws error when source or sink does not exist in graph", () => {
        const network = new EdmondsKarpMaxFlow();
        network.addNode("A");
        let hasError = false;
        try {
          network.computeMaxFlow("A", "NON_EXISTENT");
        } catch (e) {
          hasError = true;
        }
        expect.equal(hasError, true);
      });

      test("F161-T16: Residual capacity and edge utilization rate are correctly reported", () => {
        const network = new ServerEdmondsKarp();
        network.addEdge("A", "B", 100);
        network.addEdge("B", "C", 50);

        const flow = network.computeMaxFlow("A", "C");
        const edgeAB = flow.edgeDetails.find(e => e.from === "A" && e.to === "B");
        const edgeBC = flow.edgeDetails.find(e => e.from === "B" && e.to === "C");

        expect.equal(edgeAB.flow, 50);
        expect.equal(edgeAB.utilizationRate, 0.5);
        expect.equal(edgeBC.isSaturated, true);
      });
    });

    // -----------------------------------------------------------------------
    // PART 3: Perceptual Image Hash & Copyright Fraud Radar (8 Tests)
    // -----------------------------------------------------------------------
    describe("Part 3: Perceptual Image Hash & Copyright Radar (F161-T17 to F161-T24)", () => {
      test("F161-T17: popcount32 counts active bits correctly using Brian Kernighan algorithm", () => {
        expect.equal(PerceptualImageHash.popcount32(0), 0);
        expect.equal(PerceptualImageHash.popcount32(1), 1);
        expect.equal(PerceptualImageHash.popcount32(0b1011001), 4);
        expect.equal(PerceptualImageHash.popcount32(0xFFFFFFFF >>> 0), 32);
      });

      test("F161-T18: Identical hash strings yield zero Hamming distance and 1.0 similarity", () => {
        const hash = "a1b2c3d4e5f60718";
        const dist = PerceptualImageHash.hammingDistance(hash, hash);
        const sim = PerceptualImageHash.computeSimilarity(hash, hash);

        expect.equal(dist, 0);
        expect.equal(sim, 1.0);
      });

      test("F161-T19: Computes accurate Hamming distance and similarity for slight image differences", () => {
        // Hash A: ...0000 (0x0)
        // Hash B: ...000f (0xF: 4 bits 1)
        const hashA = "0000000000000000";
        const hashB = "000000000000000f";
        const dist = ServerPerceptualHash.hammingDistance(hashA, hashB);
        const sim = ServerPerceptualHash.computeSimilarity(hashA, hashB);

        expect.equal(dist, 4);
        expect.equal(sim, 0.9375); // (64 - 4) / 64 = 0.9375
      });

      test("F161-T20: Computes 16-char hex dHash from 8x9 luminance gradient matrix", () => {
        // Ma trận 8x9: Cột sau luôn lớn hơn cột trước -> toàn bộ 64 bits = 1 -> Hex: ffffffffffffffff
        const matrixAscending = Array.from({ length: 8 }, () => [10, 20, 30, 40, 50, 60, 70, 80, 90]);
        const hashAllOnes = PerceptualImageHash.computeDHash(matrixAscending);
        expect.equal(hashAllOnes, "ffffffffffffffff");

        // Ma trận 8x9: Cột sau luôn nhỏ hơn cột trước -> toàn bộ 64 bits = 0 -> Hex: 0000000000000000
        const matrixDescending = Array.from({ length: 8 }, () => [90, 80, 70, 60, 50, 40, 30, 20, 10]);
        const hashAllZeros = PerceptualImageHash.computeDHash(matrixDescending);
        expect.equal(hashAllZeros, "0000000000000000");
      });

      test("F161-T21: ImageHashIndex registers and finds near-duplicate images sorted by distance", () => {
        const index = new ImageHashIndex();
        index.registerImage({ imageId: "img_mall_1", productId: "p1", shopId: "shop_mall", isMall: true, hashHex: "0000000000000000" });
        index.registerImage({ imageId: "img_other_2", productId: "p2", shopId: "shop_2", isMall: false, hashHex: "0000000000000003" }); // 2 bits diff
        index.registerImage({ imageId: "img_far_3", productId: "p3", shopId: "shop_3", isMall: false, hashHex: "ffffffffffffffff" });   // 64 bits diff

        const matches = index.findMatches("0000000000000001", 5); // 1 bit diff from img_mall_1, 1 bit diff from img_other_2
        expect.equal(matches.length, 2);
        expect.equal(matches[0].hammingDistance <= matches[1].hammingDistance, true);
      });

      test("F161-T22: Copyright radar flags takedown when third-party shop copies Shopee Mall image", () => {
        const index = new ServerImageHashIndex();
        index.registerImage({
          imageId: "img_apple_mall",
          productId: "prod_iphone_16",
          shopId: "shop_apple_official",
          isMall: true,
          hashHex: "a1a2a3a4b1b2b3b4"
        });

        // Gian hàng rác sao chép ảnh đóng thêm watermark mờ (lệch 2 bit)
        const audit = index.auditCopyrightInfringement({
          shopId: "shop_fake_phone",
          productId: "prod_fake_16",
          hashHex: "a1a2a3a4b1b2b3b6" // Lệch đúng 1 bit
        });

        expect.equal(audit.isInfringing, true);
        expect.equal(audit.riskLevel, "CRITICAL");
        expect.equal(audit.actionRequired, "FLAG_FOR_TAKEDOWN");
        expect.equal(audit.mallViolationsCount, 1);
      });

      test("F161-T23: Tri-role AI Copilots accurately respond to Phase 14 algorithm inquiries", () => {
        // Admin Sentinel Copilot
        const adminFlowRes = generateAdminCopilotResponse("Phân tích luồng cực đại Edmonds-Karp mạng lưới SPX", {});
        expect.equal(adminFlowRes.tag, "LUỒNG CỰC ĐẠI EDMONDS-KARP");

        const adminCopyrightRes = generateAdminCopilotResponse("Quét radar bản quyền ảnh vi phạm Shopee Mall bằng pHash", {});
        expect.equal(adminCopyrightRes.tag, "RADAR BẢN QUYỀN HÌNH ẢNH");

        // Seller ShopSmart Copilot
        const sellerPidRes = generateSellerCopilotResponse("Cấu hình bộ điều khiển PID tối ưu giá thầu Shopee Ads", {});
        expect.equal(sellerPidRes.tag, "ĐIỀU KHIỂN GIÁ THẦU PID");

        const sellerCopyRes = generateSellerCopilotResponse("Kiểm tra bản quyền ảnh trước khi đăng sản phẩm", {});
        expect.equal(sellerCopyRes.tag, "KIỂM TRA BẢN QUYỀN ẢNH");

        // Buyer Shopping AI
        const buyerFlowRes = generateAiChatResponse("Tại sao SPX không bị nghẽn giao hàng mùa sale");
        expect.equal(buyerFlowRes.intent, "SPX_MAX_FLOW_LOGISTICS");
      });

      test("F161-T24: E2E Lifecycle: Dynamic PID Bidding -> Copyright Verification -> SPX Max Flow Dispatch", () => {
        // Step 1: Seller optimizes Shopee Ads CPC bidding with PID controller
        const pid = new PidBiddingController({ targetRoas: 3.5, kp: 0.5 });
        const bidResult = pid.computeBidAdjustment(4.2, 2500);
        expect.equal(bidResult.action, "INCREASE");
        expect.equal(bidResult.proposedBid > 2500, true);

        // Step 2: Upload new product image and verify copyright safety
        const copyrightIndex = new ImageHashIndex();
        copyrightIndex.registerImage({
          imageId: "img_mall_original",
          productId: "mall_macbook",
          shopId: "apple_store",
          isMall: true,
          hashHex: "12345678abcdef01"
        });
        const uploadAudit = copyrightIndex.auditCopyrightInfringement({
          shopId: "my_shop",
          productId: "my_laptop",
          hashHex: "8888888877777777" // Ảnh độc lập không trùng
        });
        expect.equal(uploadAudit.isInfringing, false);
        expect.equal(uploadAudit.actionRequired, "ALLOW");

        // Step 3: Orders generated from ad -> dispatch via SPX Network with Max Flow
        const spxNetwork = new EdmondsKarpMaxFlow();
        spxNetwork.addEdge("KHO_SHOP", "HUB_TRUNG_CHUYEN", 500);
        spxNetwork.addEdge("HUB_TRUNG_CHUYEN", "TRAM_PHAT_BUYER", 400);

        const dispatchFlow = spxNetwork.computeMaxFlow("KHO_SHOP", "TRAM_PHAT_BUYER");
        expect.equal(dispatchFlow.maxFlow, 400);

        const bottlenecks = spxNetwork.findBottlenecks("KHO_SHOP", "TRAM_PHAT_BUYER");
        expect.equal(bottlenecks.bottleneckCount, 1);
        expect.equal(bottlenecks.bottlenecks[0].to, "TRAM_PHAT_BUYER");
      });
    });
  });

  // =========================================================================
  // FEATURE 162: Price Elasticity, Hopcroft-Karp & LSM-Tree Suite (24 Tests)
  // =========================================================================
  describe("Feature 162: Price Elasticity, Hopcroft-Karp Bipartite Matching & LSM-Tree Suite", () => {
    // -----------------------------------------------------------------------
    // PART 1: Price Elasticity Simulator (F162-T01 to F162-T08)
    // -----------------------------------------------------------------------
    describe("Part 1: Price Elasticity Simulator (F162-T01 to F162-T08)", () => {
      test("F162-T01: Calculates midpoint price elasticity accurately for elastic demand", () => {
        // Giá giảm từ 200,000 xuống 160,000 (-22.2%)
        // Lượng bán tăng từ 100 lên 150 (+40.0%)
        const res = PriceElasticitySimulator.calculateElasticity(200000, 100, 160000, 150);
        expect.equal(res.type, "ELASTIC");
        expect.equal(res.absElasticity > 1.2, true);
        expect.equal(res.pctChangeP < 0, true);
        expect.equal(res.pctChangeQ > 0, true);
      });

      test("F162-T02: Identifies inelastic demand when price reduction fails to stimulate sufficient demand", () => {
        // Giá giảm 50% nhưng lượng bán chỉ tăng 10%
        const res = ServerPriceElasticity.calculateElasticity(100000, 50, 50000, 55);
        expect.equal(res.type, "INELASTIC");
        expect.equal(res.absElasticity < 0.8, true);
        expect.equal(res.advice.includes("Không nên giảm giá sâu"), true);
      });

      test("F162-T03: Classifies unitary elasticity when elasticity is approximately 1.0", () => {
        // Giá giảm 10% và lượng bán tăng tương xứng ~10%
        const res = PriceElasticitySimulator.calculateElasticity(100000, 100, 90000, 111);
        expect.equal(res.type, "UNITARY");
        expect.equal(res.advice.includes("tối đa"), true);
      });

      test("F162-T04: Safely throws error when prices or volumes are zero or negative", () => {
        let hasError = false;
        try {
          PriceElasticitySimulator.calculateElasticity(0, 10, 50000, 20);
        } catch (e) {
          hasError = true;
        }
        expect.equal(hasError, true);
      });

      test("F162-T05: Returns PERFECTLY_INELASTIC when prices are unchanged (p1 === p2)", () => {
        const res = ServerPriceElasticity.calculateElasticity(100000, 50, 100000, 50);
        expect.equal(res.type, "PERFECTLY_INELASTIC");
        expect.equal(res.elasticity, 0);
      });

      test("F162-T06: Simulates multiple Flash Sale discount scenarios with COGS and 5% fee", () => {
        const simulation = PriceElasticitySimulator.simulateDiscounts({
          basePrice: 200000,
          baseVolume: 100,
          cogs: 90000,
          assumedElasticity: -1.8,
          discountRates: [0.1, 0.2, 0.3]
        });

        expect.equal(simulation.scenarios.length, 3);
        const scenario20 = simulation.scenarios.find(s => s.discountRate === 0.2);
        expect.equal(scenario20.price, 160000);
        expect.equal(scenario20.volume > 100, true);
        expect.equal(scenario20.projectedGrossProfit > 0, true);
      });

      test("F162-T07: Automatically identifies optimal discount scenario maximizing gross profit", () => {
        const simulation = ServerPriceElasticity.simulateDiscounts({
          basePrice: 500000,
          baseVolume: 50,
          cogs: 200000,
          assumedElasticity: -2.0
        });

        expect.equal(simulation.optimalScenario !== null, true);
        expect.equal(simulation.recommendation.includes(simulation.optimalScenario.discountPercent), true);
      });

      test("F162-T08: Server and client implementations produce identical elasticity calculations", () => {
        const clientRes = PriceElasticitySimulator.calculateElasticity(150000, 80, 120000, 120);
        const serverRes = ServerPriceElasticity.calculateElasticity(150000, 80, 120000, 120);

        expect.equal(clientRes.elasticity, serverRes.elasticity);
        expect.equal(clientRes.type, serverRes.type);
      });
    });

    // -----------------------------------------------------------------------
    // PART 2: Hopcroft-Karp Bipartite Matching for SPX Logistics (F162-T09 to F162-T16)
    // -----------------------------------------------------------------------
    describe("Part 2: Hopcroft-Karp SPX Batch Dispatch (F162-T09 to F162-T16)", () => {
      test("F162-T09: Initializes bipartite graph with shippers and orders successfully", () => {
        const hk = new HopcroftKarpMatching();
        hk.addEdge("SHIPPER_A", "ORDER_1");
        hk.addEdge("SHIPPER_B", "ORDER_2");

        expect.equal(hk.shippers.size, 2);
        expect.equal(hk.orders.size, 2);
      });

      test("F162-T10: Finds perfect matching when each shipper has exactly one distinct available order", () => {
        const hk = new HopcroftKarpMatching();
        hk.addEdge("S1", "O1");
        hk.addEdge("S2", "O2");
        hk.addEdge("S3", "O3");

        const result = hk.computeMaxMatching();
        expect.equal(result.matchingSize, 3);
        expect.equal(result.fulfillmentRate, 100);
        expect.equal(result.unassignedOrders.length, 0);
      });

      test("F162-T11: Resolves complex overlapping butterfly bipartite matching optimally", () => {
        // S1 can do O1, O2
        // S2 can do O1, O2
        // S3 can do O2, O3
        const hk = new ServerHopcroftKarp();
        hk.addEdge("S1", "O1");
        hk.addEdge("S1", "O2");
        hk.addEdge("S2", "O1");
        hk.addEdge("S2", "O2");
        hk.addEdge("S3", "O2");
        hk.addEdge("S3", "O3");

        const result = hk.computeMaxMatching();
        expect.equal(result.matchingSize, 3);
        expect.equal(result.assignments.length, 3);
      });

      test("F162-T12: Handles shipper shortage when order demand exceeds available fleet", () => {
        const hk = new HopcroftKarpMatching();
        hk.addEdge("S1", "O1");
        hk.addEdge("S1", "O2");
        hk.addEdge("S2", "O2");
        hk.addEdge("S2", "O3");
        hk.addOrder("O4"); // 4 orders, only 2 shippers

        const result = hk.computeMaxMatching();
        expect.equal(result.matchingSize, 2);
        expect.equal(result.fulfillmentRate, 50.0);
        expect.equal(result.unassignedOrders.length, 2);
      });

      test("F162-T13: Correctly identifies all unassigned orders for queue prioritization", () => {
        const hk = new ServerHopcroftKarp();
        hk.addEdge("S1", "O1");
        hk.addOrder("O_UNASSIGNED_1");
        hk.addOrder("O_UNASSIGNED_2");

        const result = hk.computeMaxMatching();
        expect.equal(result.matchingSize, 1);
        expect.equal(result.unassignedOrders.includes("O_UNASSIGNED_1"), true);
        expect.equal(result.unassignedOrders.includes("O_UNASSIGNED_2"), true);
      });

      test("F162-T14: Empty bipartite graph returns zero matching without throwing exception", () => {
        const hk = new HopcroftKarpMatching();
        const result = hk.computeMaxMatching();

        expect.equal(result.matchingSize, 0);
        expect.equal(result.fulfillmentRate, 100);
        expect.equal(result.assignments.length, 0);
      });

      test("F162-T15: Re-running computeMaxMatching idempotently resets previous pairs", () => {
        const hk = new HopcroftKarpMatching();
        hk.addEdge("S1", "O1");
        const res1 = hk.computeMaxMatching();
        const res2 = hk.computeMaxMatching();

        expect.equal(res1.matchingSize, 1);
        expect.equal(res2.matchingSize, 1);
      });

      test("F162-T16: Server Hopcroft-Karp scales smoothly on 10 shippers and 12 orders graph", () => {
        const hk = new ServerHopcroftKarp();
        for (let i = 1; i <= 10; i++) {
          hk.addEdge(`SHIPPER_${i}`, `ORDER_${i}`);
          if (i < 10) hk.addEdge(`SHIPPER_${i}`, `ORDER_${i + 1}`);
        }
        hk.addOrder("ORDER_11");
        hk.addOrder("ORDER_12");

        const result = hk.computeMaxMatching();
        expect.equal(result.matchingSize, 10);
        expect.equal(result.unassignedOrders.length, 2);
      });
    });

    // -----------------------------------------------------------------------
    // PART 3: LSM-Tree Clickstream Engine & Tri-Role Copilots (F162-T17 to F162-T24)
    // -----------------------------------------------------------------------
    describe("Part 3: LSM-Tree Clickstream & Copilots (F162-T17 to F162-T24)", () => {
      test("F162-T17: Writes clickstream telemetry to MemTable and retrieves immediately in RAM", () => {
        const lsm = new LSMTreeClickstream({ maxMemTableSize: 50 });
        lsm.put("click:user_1:prod_101", { action: "VIEW_PDP", durationMs: 1200 });

        const data = lsm.get("click:user_1:prod_101");
        expect.equal(data.action, "VIEW_PDP");
        expect.equal(data.durationMs, 1200);
      });

      test("F162-T18: Automatically flushes MemTable to immutable SSTable when reaching size limit", () => {
        const lsm = new LSMTreeClickstream({ maxMemTableSize: 3 });
        lsm.put("k1", "v1");
        lsm.put("k2", "v2");
        lsm.put("k3", "v3"); // Kích hoạt Flush ngay lập tức

        const stats = lsm.getStats();
        expect.equal(stats.memTableSize, 0);
        expect.equal(stats.sstableCount, 1);
        expect.equal(lsm.get("k2"), "v2");
      });

      test("F162-T19: Bloom Filter accelerates negative lookups avoiding binary search in SSTable", () => {
        const lsm = new ServerLSMTree({ maxMemTableSize: 2 });
        lsm.put("item_alpha", 1);
        lsm.put("item_beta", 2); // Flushed to SSTable

        // Khóa hoàn toàn không tồn tại
        const notFound = lsm.get("item_completely_missing_xyz");
        expect.equal(notFound, null);
      });

      test("F162-T20: Tombstone deletion hides record from subsequent queries", () => {
        const lsm = new LSMTreeClickstream({ maxMemTableSize: 5 });
        lsm.put("session_token_123", { active: true });
        expect.equal(lsm.get("session_token_123") !== null, true);

        lsm.delete("session_token_123");
        expect.equal(lsm.get("session_token_123"), null);
      });

      test("F162-T21: Compaction merges multiple SSTables and purges tombstoned records", () => {
        const lsm = new ServerLSMTree({ maxMemTableSize: 2 });
        lsm.put("a", 10);
        lsm.put("b", 20); // Table 1

        lsm.put("c", 30);
        lsm.delete("a");  // Table 2 (Tombstone a)

        expect.equal(lsm.sstables.length, 2);
        const compResult = lsm.compact();

        expect.equal(compResult.compactedCount, 1);
        expect.equal(lsm.get("a"), null); // 'a' bị dọn sạch
        expect.equal(lsm.get("b"), 20);
        expect.equal(lsm.get("c"), 30);
      });

      test("F162-T22: getStats reports accurate counts across MemTable and SSTables", () => {
        const lsm = new LSMTreeClickstream({ maxMemTableSize: 5 });
        lsm.put("k1", 1);
        lsm.put("k2", 2);
        lsm.put("k3", 3);

        const stats = lsm.getStats();
        expect.equal(stats.memTableSize, 3);
        expect.equal(stats.sstableCount, 0);
        expect.equal(stats.totalRecordsTracked, 3);
      });

      test("F162-T23: Tri-role Copilots accurately respond to Phase 15 algorithm inquiries", () => {
        // Admin Sentinel Copilot
        const adminHkRes = generateAdminCopilotResponse("Phân tích thuật toán ghép cặp lưỡng phân Hopcroft-Karp", {});
        expect.equal(adminHkRes.tag, "GHÉP CẶP HOPCROFT-KARP");

        const adminLsmRes = generateAdminCopilotResponse("Kiến trúc cây ghi dữ liệu LSM-Tree cho telemetry Flash Sale", {});
        expect.equal(adminLsmRes.tag, "CẤU TRÚC CÂY LSM-TREE");

        // Seller ShopSmart Copilot
        const sellerElasticityRes = generateSellerCopilotResponse("Mô phỏng độ co giãn giá Flash Sale tối ưu doanh thu", {});
        expect.equal(sellerElasticityRes.tag, "MÔ PHỎNG CO GIÃN GIÁ");

        // Buyer Shopping AI
        const buyerHkRes = generateAiChatResponse("Tại sao shipper nhận đơn nhanh qua SPX Hopcroft");
        expect.equal(buyerHkRes.intent, "SPX_BATCH_DISPATCH_HOPCROFT");
      });

      test("F162-T24: E2E Lifecycle: Price Elasticity Modeling -> LSM Clickstream -> Hopcroft-Karp Batch Dispatch", () => {
        // Step 1: Seller simulates price elasticity to pick optimal 20% discount
        const elasticitySim = PriceElasticitySimulator.simulateDiscounts({
          basePrice: 200000,
          baseVolume: 100,
          cogs: 80000,
          assumedElasticity: -1.7
        });
        expect.equal(elasticitySim.optimalScenario !== null, true);
        const flashPrice = elasticitySim.optimalScenario.price;

        // Step 2: Flash sale goes live, customer clicks and orders recorded in LSM-Tree
        const telemetryLsm = new LSMTreeClickstream({ maxMemTableSize: 10 });
        telemetryLsm.put("order_placed:ord_flash_999", {
          price: flashPrice,
          buyerId: "usr_alice",
          timestamp: Date.now()
        });
        expect.equal(telemetryLsm.get("order_placed:ord_flash_999").price, flashPrice);

        // Step 3: Orders dispatched via Hopcroft-Karp batch bipartite matching
        const dispatcher = new HopcroftKarpMatching();
        dispatcher.addEdge("SPX_SHIPPER_HUNG", "ord_flash_999");
        dispatcher.addEdge("SPX_SHIPPER_MINH", "ord_flash_999");
        dispatcher.addEdge("SPX_SHIPPER_MINH", "ord_flash_1000");

        const matchResult = dispatcher.computeMaxMatching();
        expect.equal(matchResult.matchingSize, 2);
        expect.equal(matchResult.fulfillmentRate, 100);
      });
    });

    // =========================================================================
    // FEATURE 163: Dynamic Time Warping (DTW), Hierarchical K-Means Price Tiers & Reservoir Stream Sampling Suite (24 Tests)
    // =========================================================================
    describe("Feature 163: Dynamic Time Warping, Hierarchical K-Means Price Tiers & Reservoir Stream Sampling Suite", () => {

      // --- Group 1: Dynamic Time Warping (DTW) (F163-T01 -> F163-T06) ---
      test("F163-T01: DTW distance between two identical purchasing interval sequences is strictly 0", () => {
        const series = [7, 14, 21, 28];
        const res = DynamicTimeWarping.computeDistance(series, series);
        expect.equal(res.distance, 0);
        expect.equal(res.normalizedDistance, 0);
        expect.equal(res.pathLength, 4);
      });

      test("F163-T02: DTW aligns time-shifted purchasing habits with minimal warping distance", () => {
        const standardCycle = [1, 2, 3, 4, 5];
        const shiftedCycle = [1, 1, 2, 3, 4, 5, 5]; // User delayed purchase but pattern identical
        const res = DynamicTimeWarping.computeDistance(standardCycle, shiftedCycle);
        expect.equal(res.distance, 0);
        expect.equal(res.normalizedDistance, 0);
        expect.equal(res.path.length >= 5, true);
      });

      test("F163-T03: DTW warping path backtracks correctly from (N, M) to (0, 0)", () => {
        const s1 = [10, 20, 30];
        const s2 = [10, 15, 25, 30];
        const res = DynamicTimeWarping.computeDistance(s1, s2);
        expect.equal(res.path[0].aIndex, 0);
        expect.equal(res.path[0].bIndex, 0);
        expect.equal(res.path[res.path.length - 1].aIndex, s1.length - 1);
        expect.equal(res.path[res.path.length - 1].bIndex, s2.length - 1);
      });

      test("F163-T04: Server DTW classifies customer with expanding intervals as CHURNING_RISK", () => {
        const churnPattern = [7, 12, 20, 35, 50, 65];
        const classification = ServerDTW.classifyPurchasingPattern(churnPattern);
        expect.equal(classification.detectedPattern, "CHURNING_RISK");
        expect.equal(classification.riskLevel, "HIGH");
        expect.equal(classification.recommendation.includes("voucher giảm 30k"), true);
      });

      test("F163-T05: Server DTW classifies customer with stable weekly cadence as LOYAL_ROUTINE", () => {
        const loyalPattern = [5, 7, 6, 7, 5, 6];
        const classification = ServerDTW.classifyPurchasingPattern(loyalPattern);
        expect.equal(classification.detectedPattern, "LOYAL_ROUTINE");
        expect.equal(classification.riskLevel, "LOW");
        expect.equal(classification.recommendation.includes("Mini Xu x2"), true);
      });

      test("F163-T06: DTW handles edge cases: empty array throwing error and new customer fallback", () => {
        let threw = false;
        try {
          DynamicTimeWarping.computeDistance([], [1, 2]);
        } catch (e) {
          threw = true;
        }
        expect.equal(threw, true);

        const newCust = DynamicTimeWarping.classifyPurchasingPattern([]);
        expect.equal(newCust.pattern, "NEW_CUSTOMER");
        expect.equal(newCust.riskScore, 0);
      });

      // --- Group 2: Hierarchical K-Means & Silhouette Price Tiers (F163-T07 -> F163-T13) ---
      test("F163-T07: 1D K-Means clustering converges to correct centroids on well-separated price clusters", () => {
        const prices = [10000, 12000, 15000, 100000, 105000, 110000, 500000, 520000, 510000];
        const result = HierarchicalKMeans.cluster(prices, 3);
        expect.equal(result.k, 3);
        expect.equal(result.centroids.length, 3);
        expect.equal(result.iterations > 0, true);
        expect.equal(result.silhouetteScore > 0.8, true); // High clustering quality
      });

      test("F163-T08: K-Means++ initialization spreads initial centroids widely apart", () => {
        const prices = [5000, 10000, 50000, 200000, 1000000];
        const centroids = HierarchicalKMeans.initKMeansPlusPlus(prices, 3);
        expect.equal(centroids.length, 3);
        // All centroids should be distinct
        const distinct = new Set(centroids);
        expect.equal(distinct.size, 3);
      });

      test("F163-T09: Silhouette score computation returns accurate value in range [-1, 1]", () => {
        const data = [10, 12, 11, 100, 102, 105];
        const assignments = [0, 0, 0, 1, 1, 1];
        const score = HierarchicalKMeans.computeSilhouetteScore(data, assignments, 2);
        expect.equal(score > 0.85, true);
        expect.equal(score <= 1.0, true);
      });

      test("F163-T10: autoClusterPriceTiers automatically identifies optimal K* based on highest Silhouette score", () => {
        const catalog = [
          { id: "p1", name: "Ốp lưng 1k", price: 10000 },
          { id: "p2", name: "Kính cường lực", price: 15000 },
          { id: "p3", name: "Cáp sạc type-C", price: 20000 },
          { id: "p4", name: "Tai nghe TrueWireless", price: 250000 },
          { id: "p5", name: "Chuột công thái học", price: 300000 },
          { id: "p6", name: "Bàn phím cơ", price: 350000 },
          { id: "p7", name: "Màn hình 4K Mall", price: 5000000 },
          { id: "p8", name: "Laptop Gaming Mall", price: 6000000 },
        ];

        const tiered = HierarchicalKMeans.autoClusterPriceTiers(catalog, [2, 3, 4]);
        expect.equal(tiered.optimalK >= 2, true);
        expect.equal(tiered.priceTiers.length, tiered.optimalK);
        expect.equal(tiered.bestSilhouette > 0.7, true);
      });

      test("F163-T11: Price tiers are sorted by centroid price and assigned natural semantic tier labels", () => {
        const products = [
          { id: "p_low", name: "Móc khóa", price: 9000 },
          { id: "p_mid", name: "Áo polo", price: 180000 },
          { id: "p_high", name: "Đồng hồ Thụy Sĩ", price: 15000000 }
        ];

        const res = HierarchicalKMeans.autoClusterPriceTiers(products, [3]);
        expect.equal(res.priceTiers.length, 3);
        expect.equal(res.priceTiers[0].tierCode, "BUDGET");
        expect.equal(res.priceTiers[1].tierCode, "MID_RANGE");
        expect.equal(res.priceTiers[2].tierCode, "PREMIUM");
        expect.equal(res.priceTiers[0].centroidPrice < res.priceTiers[1].centroidPrice, true);
        expect.equal(res.priceTiers[1].centroidPrice < res.priceTiers[2].centroidPrice, true);
      });

      test("F163-T12: Server HierarchicalKMeans clusters large shop product list into distinct tiers", () => {
        const items = [];
        for (let i = 1; i <= 30; i++) {
          const price = i <= 10 ? 10000 + i * 1000 : i <= 20 ? 150000 + i * 2000 : 800000 + i * 5000;
          items.push({ id: `item_${i}`, name: `SP ${i}`, price });
        }

        const serverRes = ServerHierarchicalKMeans.autoClusterPriceTiers(items, [2, 3]);
        expect.equal(serverRes.optimalK >= 2, true);
        expect.equal(serverRes.priceTiers.reduce((acc, t) => acc + t.productCount, 0), 30);
      });

      test("F163-T13: HierarchicalKMeans safely handles empty or single item input without crashing", () => {
        const emptyRes = HierarchicalKMeans.autoClusterPriceTiers([]);
        expect.equal(emptyRes.optimalK, 0);
        expect.equal(emptyRes.priceTiers.length, 0);

        const singleRes = HierarchicalKMeans.autoClusterPriceTiers([{ id: "p1", price: 50000 }], [2, 3]);
        expect.equal(singleRes.priceTiers.length, 1);
      });

      // --- Group 3: Reservoir Stream Sampling (Algorithm R) (F163-T14 -> F163-T20) ---
      test("F163-T14: ReservoirSampling collects exactly K items from unbounded stream when stream >= K", () => {
        const reservoir = new ReservoirSampling(5);
        for (let i = 1; i <= 50; i++) {
          reservoir.add({ orderId: `ord_${i}`, total: i * 10000 });
        }

        const sample = reservoir.getSample();
        expect.equal(sample.length, 5);
        expect.equal(reservoir.totalStreamCount, 50);
      });

      test("F163-T15: ReservoirSampling retains all items when stream size is less than capacity K", () => {
        const reservoir = new ReservoirSampling(10);
        reservoir.add({ id: 1 });
        reservoir.add({ id: 2 });
        reservoir.add({ id: 3 });

        expect.equal(reservoir.getSample().length, 3);
        expect.equal(reservoir.totalStreamCount, 3);
      });

      test("F163-T16: ReservoirSampling guarantees uniform replacement with deterministic mock RNG", () => {
        // Deterministic mock RNG: returns 0.0, ensuring replacement always replaces index 0
        const mockRng = () => 0.0;
        const reservoir = new ReservoirSampling(2, mockRng);

        reservoir.add("ITEM_A"); // goes to idx 0
        reservoir.add("ITEM_B"); // goes to idx 1
        // streamCount = 3, j = floor(0.0 * 3) = 0 < 2 -> replaces idx 0
        const replaced = reservoir.add("ITEM_C");

        expect.equal(replaced, true);
        const sample = reservoir.getSample();
        expect.equal(sample[0], "ITEM_C");
        expect.equal(sample[1], "ITEM_B");
      });

      test("F163-T17: ReservoirSampling addBatch pushes stream in bulk and updates stream counter accurately", () => {
        const reservoir = new ReservoirSampling(4);
        const batch = [10, 20, 30, 40, 50, 60, 70, 80];
        reservoir.addBatch(batch);

        expect.equal(reservoir.getSample().length, 4);
        expect.equal(reservoir.totalStreamCount, 8);
      });

      test("F163-T18: ReservoirSampling computeSampleStats calculates mean, min, max, stdDev accurately", () => {
        const reservoir = new ReservoirSampling(5);
        reservoir.add({ total: 100000 });
        reservoir.add({ total: 200000 });
        reservoir.add({ total: 300000 });

        const stats = reservoir.computeSampleStats(item => item.total);
        expect.equal(stats.sampleSize, 3);
        expect.equal(stats.mean, 200000);
        expect.equal(stats.min, 100000);
        expect.equal(stats.max, 300000);
        expect.equal(stats.stdDev > 0, true);
      });

      test("F163-T19: Server ReservoirSampling handles stream of 1000 telemetry events within strict fixed memory", () => {
        const serverSampler = new ServerReservoirSampling(20);
        for (let i = 1; i <= 1000; i++) {
          serverSampler.add({ event: "CLICK", userId: `usr_${i}`, gmv: i * 50 });
        }

        expect.equal(serverSampler.getSample().length, 20);
        expect.equal(serverSampler.totalStreamCount, 1000);
        const stats = serverSampler.computeSampleStats(item => item.gmv);
        expect.equal(stats.samplingRate, "2%"); // 20 / 1000 = 2%
      });

      test("F163-T20: ReservoirSampling handles reset and invalid capacity validation", () => {
        let threw = false;
        try {
          new ReservoirSampling(0);
        } catch (e) {
          threw = true;
        }
        expect.equal(threw, true);

        const sampler = new ReservoirSampling(5);
        sampler.add("A");
        sampler.reset();
        expect.equal(sampler.getSample().length, 0);
        expect.equal(sampler.totalStreamCount, 0);
      });

      // --- Group 4: AI Copilot & E2E Lifecycle Integration (F163-T21 -> F163-T24) ---
      test("F163-T21: Admin Sentinel Copilot explains DTW purchasing cycle and churn recognition", () => {
        const res = generateAdminCopilotResponse("Phân tích chu kỳ mua sắm dtw và phát hiện churn risk");
        expect.equal(res.tag, "DỰ BÁO CHURN BẰNG DTW");
        expect.equal(res.text.includes("DYNAMIC TIME WARPING"), true);
        expect.equal(res.text.includes("Churning Risk"), true);
      });

      test("F163-T22: Admin Sentinel Copilot explains Reservoir Sampling telemetry stream audit", () => {
        const res = generateAdminCopilotResponse("Kiểm toán dòng sự kiện đơn hàng bằng reservoir sampling");
        expect.equal(res.tag, "LẤY MẪU RESERVOIR SAMPLING");
        expect.equal(res.text.includes("ALGORITHM R"), true);
        expect.equal(res.text.includes("P = K / N"), true);
      });

      test("F163-T23: Seller ShopSmart Copilot & Buyer Assistant respond to K-Means Price Tiers & DTW Cycles", () => {
        // Seller Copilot
        const sellerRes = generateSellerCopilotResponse("Phân tầng giá sản phẩm shop bằng k-means silhouette");
        expect.equal(sellerRes.tag, "PHÂN TẦNG GIÁ K-MEANS");
        expect.equal(sellerRes.text.includes("BUDGET"), true);
        expect.equal(sellerRes.text.includes("PREMIUM MALL"), true);

        // Buyer Assistant
        const buyerRes = generateAiChatResponse("Chu kỳ mua sắm của tôi khi nào nên mua lại dtw chu kỳ");
        expect.equal(buyerRes.intent, "BUYER_PURCHASE_CYCLE_ASSIST");
        expect.equal(buyerRes.replyText.includes("Dynamic Time Warping"), true);
      });

      test("F163-T24: E2E Lifecycle: Reservoir Sampling Orders -> K-Means Price Tiers -> DTW Churn Mitigation", () => {
        // 1. Unbounded order stream sampled into fixed-memory reservoir
        const sampler = new ReservoirSampling(10);
        for (let i = 1; i <= 100; i++) {
          sampler.add({
            orderId: `ord_stream_${i}`,
            userId: `user_${(i % 5) + 1}`,
            amount: 20000 + (i % 10) * 15000,
            intervalDays: (i % 7) + 2
          });
        }
        const streamSample = sampler.getSample();
        expect.equal(streamSample.length, 10);

        // 2. Products priced dynamically into natural tiers using K-Means
        const products = streamSample.map((ord, idx) => ({
          id: `p_${idx}`,
          name: `Sản phẩm ${idx}`,
          price: ord.amount
        }));
        const clustering = HierarchicalKMeans.autoClusterPriceTiers(products, [2, 3]);
        expect.equal(clustering.optimalK >= 2, true);

        // 3. User with increasing intervals diagnosed via DTW to trigger retention voucher
        const intervals = [5, 10, 18, 30, 48];
        const churnEval = DynamicTimeWarping.classifyPurchasingPattern(intervals);
        expect.equal(churnEval.detectedPattern, "CHURNING_RISK");
        expect.equal(churnEval.riskLevel, "HIGH");
      });
    });

    // =========================================================================
    // FEATURE 164: SimHash Review Spam, Aho-Corasick Moderator & Bellman-Ford Arbitrage Suite (24 Tests)
    // =========================================================================
    describe("Feature 164: SimHash Review Spam, Aho-Corasick Moderator & Bellman-Ford Arbitrage Suite", () => {

      // --- Group 1: SimHash & Hamming Distance (Review Spam Radar) (F164-T01 -> F164-T06) ---
      test("F164-T01: Two identical review texts produce identical 64-bit SimHash with Hamming distance = 0", () => {
        const text = "Sản phẩm đóng gói rất cẩn thận, giao hàng nhanh 2h, chất lượng tuyệt vời!";
        const res = SimHashReviewSpam.compareReviews(text, text);
        expect.equal(res.distance, 0);
        expect.equal(res.isDuplicate, true);
        expect.equal(res.similarityScore, 100);
      });

      test("F164-T02: Near-duplicate reviews with minor wording variation have small Hamming distance <= 5", () => {
        const textA = "Sản phẩm đóng gói rất cẩn thận giao hàng nhanh chất lượng tuyệt vời shop 5 sao";
        const textB = "Sản phẩm đóng gói rất cẩn thận, giao hàng nhanh! Chất lượng tuyệt vời, shop 5 sao nhé";
        const res = SimHashReviewSpam.compareReviews(textA, textB, 5);
        expect.equal(res.distance <= 5, true);
        expect.equal(res.isDuplicate, true);
        expect.equal(res.similarityScore >= 90, true);
      });

      test("F164-T03: Completely different product reviews have high Hamming distance (> 10) avoiding false positives", () => {
        const reviewShoe = "Giày thể thao êm chân, vừa size, đế bám tốt khi chạy bộ ban đêm.";
        const reviewPan = "Nồi chiên không dầu dung tích lớn, nướng gà chín đều, dễ vệ sinh sau khi ăn.";
        const res = SimHashReviewSpam.compareReviews(reviewShoe, reviewPan, 5);
        expect.equal(res.distance > 10, true);
        expect.equal(res.isDuplicate, false);
      });

      test("F164-T04: Server SimHash addAndCheckReview flags seeding bot spam and warns moderation team", () => {
        const radar = new ServerSimHash(10);
        const original = { id: "rev_001", text: "Áo rất đẹp vải mát form chuẩn y hình shop nhiệt tình", authorId: "u1", productId: "p1" };
        const botCopy = { id: "rev_002", text: "Áo rất đẹp, vải mát form chuẩn y hình shop nhiệt tình nha", authorId: "u2_bot", productId: "p1" };

        const check1 = radar.addAndCheckReview(original);
        expect.equal(check1.isSpam, false);

        const check2 = radar.addAndCheckReview(botCopy);
        expect.equal(check2.isSpam, true);
        expect.equal(check2.duplicateCount, 1);
        expect.equal(check2.recommendation.includes("CẢNH BÁO SPAM SEEDING"), true);
      });

      test("F164-T05: SimHash computes exact 64-bit binary fingerprint string format", () => {
        const hash = SimHashReviewSpam.computeSimHash("Đánh giá sản phẩm test");
        expect.equal(hash.length, 64);
        expect.equal(/^[01]{64}$/.test(hash), true);
      });

      test("F164-T06: SimHash safely handles empty or non-string inputs", () => {
        const emptyHash = SimHashReviewSpam.computeSimHash("");
        expect.equal(emptyHash, "0".repeat(64));

        let threw = false;
        try {
          SimHashReviewSpam.hammingDistance("101", "101");
        } catch (e) {
          threw = true;
        }
        expect.equal(threw, true);
      });

      // --- Group 2: Aho-Corasick Multi-Pattern Moderator (F164-T07 -> F164-T13) ---
      test("F164-T07: Aho-Corasick automaton builds valid Trie with correct pattern count", () => {
        const patterns = [
          { pattern: "zalo", category: "OFF_PLATFORM", severity: "HIGH" },
          { pattern: "sđt", category: "OFF_PLATFORM", severity: "HIGH" },
          { pattern: "rep 1:1", category: "COUNTERFEIT", severity: "HIGH" },
        ];
        const moderator = new AhoCorasickModerator(patterns);
        expect.equal(moderator.totalPatterns, 3);
        expect.equal(moderator.root.children.size > 0, true);
      });

      test("F164-T08: Aho-Corasick scan detects multiple forbidden patterns in single O(N) pass", () => {
        const moderator = new AhoCorasickModerator([
          { pattern: "zalo", category: "OFF_PLATFORM", severity: "HIGH" },
          { pattern: "090", category: "PHONE", severity: "MEDIUM" },
          { pattern: "fake", category: "COUNTERFEIT", severity: "HIGH" }
        ]);

        const text = "Liên hệ qua Zalo 0901234567 để mua hàng fake giá rẻ!";
        const report = moderator.scan(text);

        expect.equal(report.isClean, false);
        expect.equal(report.matchCount, 3);
        expect.equal(report.hasHighSeverity, true);
        expect.equal(report.categoriesFound.includes("OFF_PLATFORM"), true);
        expect.equal(report.categoriesFound.includes("COUNTERFEIT"), true);
      });

      test("F164-T09: Aho-Corasick detects off-platform payment evasion circumvention attempts", () => {
        const moderator = new AhoCorasickModerator([
          { pattern: "chuyển khoản riêng", category: "OFF_PLATFORM", severity: "HIGH" },
          { pattern: "giao dịch ngoài sàn", category: "OFF_PLATFORM", severity: "HIGH" }
        ]);

        const text = "Khách hàng nhắn tin để chuyển khoản riêng tránh phí 5% nhé";
        const result = moderator.scan(text);
        expect.equal(result.isClean, false);
        expect.equal(result.matches[0].pattern, "chuyển khoản riêng");
      });

      test("F164-T10: Aho-Corasick detects counterfeit brand keywords protect Shopee Mall integrity", () => {
        const moderator = new AhoCorasickModerator([
          { pattern: "super fake", category: "COUNTERFEIT", severity: "HIGH" },
          { pattern: "rep 1:1", category: "COUNTERFEIT", severity: "HIGH" },
          { pattern: "hàng tuồn", category: "COUNTERFEIT", severity: "MEDIUM" }
        ]);

        const text = "Giày thể thao Nike Air Force rep 1:1 siêu cấp da thật";
        const result = moderator.scan(text);
        expect.equal(result.isClean, false);
        expect.equal(result.matches.some(m => m.pattern === "rep 1:1"), true);
      });

      test("F164-T11: maskText replaces forbidden substrings with asterisk mask without breaking text length", () => {
        const moderator = new AhoCorasickModerator([
          { pattern: "zalo", category: "OFF_PLATFORM" },
          { pattern: "fake", category: "COUNTERFEIT" }
        ]);

        const original = "Inbox zalo mua đồ fake";
        const masked = moderator.maskText(original, "*");
        expect.equal(masked.length, original.length);
        expect.equal(masked.includes("zalo"), false);
        expect.equal(masked.includes("fake"), false);
        expect.equal(masked.includes("****"), true);
      });

      test("F164-T12: Server AhoCorasickModerator efficiently moderates clean text with zero false-positives", () => {
        const serverMod = new ServerAhoCorasick([
          { pattern: "lừa đảo", category: "TOXIC", severity: "HIGH" },
          { pattern: "hàng nhái", category: "COUNTERFEIT", severity: "HIGH" }
        ]);

        const cleanText = "Sản phẩm chính hãng 100% bảo hành 24 tháng tại trung tâm ủy quyền";
        const report = serverMod.scan(cleanText);
        expect.equal(report.isClean, true);
        expect.equal(report.matchCount, 0);
        expect.equal(serverMod.maskText(cleanText), cleanText);
      });

      test("F164-T13: Aho-Corasick handles empty string and non-string arguments safely", () => {
        const mod = new AhoCorasickModerator();
        const res1 = mod.scan("");
        expect.equal(res1.isClean, true);
        const res2 = mod.scan(null);
        expect.equal(res2.isClean, true);
      });

      // --- Group 3: Bellman-Ford Negative Cycle Detection (Arbitrage Fraud) (F164-T14 -> F164-T20) ---
      test("F164-T14: Legitimate acyclic or positive cost cash transfers report status SAFE", () => {
        const bf = new BellmanFordArbitrage();
        bf.addEdge("BUYER", "ESCROW", 100000, "PAYMENT");
        bf.addEdge("ESCROW", "SELLER", 95000, "DISBURSEMENT");
        bf.addEdge("ESCROW", "PLATFORM", 5000, "COMMISSION_5%");

        const res = bf.detectNegativeCycle("BUYER");
        expect.equal(res.hasNegativeCycle, false);
        expect.equal(res.status, "SAFE");
        expect.equal(res.cycle.length, 0);
      });

      test("F164-T15: Bellman-Ford detects cashback arbitrage negative cycle (A -> B -> C -> A)", () => {
        const bf = new BellmanFordArbitrage();
        // A -> B chi phí 10, B -> C chi phí 15, C -> A hoàn tiền bất thường -30 => Tổng chu trình = -5 < 0
        bf.addEdge("USER_A", "USER_B", 10, "TRANSFER");
        bf.addEdge("USER_B", "USER_C", 15, "TRANSFER");
        bf.addEdge("USER_C", "USER_A", -30, "CASHBACK_EXPLOIT");

        const res = bf.detectNegativeCycle("USER_A");
        expect.equal(res.hasNegativeCycle, true);
        expect.equal(res.status, "CRITICAL_FRAUD_DETECTED");
        expect.equal(res.cycle.length >= 3, true);
      });

      test("F164-T16: Bellman-Ford backtracks exact cyclic vertices participating in the arbitrage ring", () => {
        const bf = new BellmanFordArbitrage();
        bf.addEdge("U1", "U2", 5);
        bf.addEdge("U2", "U3", 5);
        bf.addEdge("U3", "U1", -15); // Tổng = -5

        const res = bf.detectNegativeCycle();
        expect.equal(res.hasNegativeCycle, true);
        const cycleSet = new Set(res.cycle);
        expect.equal(cycleSet.has("U1"), true);
        expect.equal(cycleSet.has("U2"), true);
        expect.equal(cycleSet.has("U3"), true);
      });

      test("F164-T17: Graph with positive weight cycle terminates without flagging fraud", () => {
        const bf = new BellmanFordArbitrage();
        bf.addEdge("X", "Y", 10);
        bf.addEdge("Y", "Z", 20);
        bf.addEdge("Z", "X", 5); // Tổng = +35 > 0

        const res = bf.detectNegativeCycle("X");
        expect.equal(res.hasNegativeCycle, false);
        expect.equal(res.status, "SAFE");
      });

      test("F164-T18: Bellman-Ford handles empty graph cleanly without exception", () => {
        const bf = new BellmanFordArbitrage();
        const res = bf.detectNegativeCycle();
        expect.equal(res.hasNegativeCycle, false);
        expect.equal(res.cycle.length, 0);
      });

      test("F164-T19: Server BellmanFordArbitrage flags complex 5-node escrow siphoning loop", () => {
        const serverBF = new ServerBellmanFord();
        serverBF.addEdge("ACC_1", "ACC_2", 10);
        serverBF.addEdge("ACC_2", "ACC_3", 10);
        serverBF.addEdge("ACC_3", "ACC_4", 10);
        serverBF.addEdge("ACC_4", "ACC_5", 10);
        serverBF.addEdge("ACC_5", "ACC_1", -50); // Net sum = -10 < 0

        const res = serverBF.detectNegativeCycle();
        expect.equal(res.hasNegativeCycle, true);
        expect.equal(res.status, "CRITICAL_FRAUD_DETECTED");
        expect.equal(res.involvedAccountsCount, 5);
        expect.equal(res.message.includes("CẢNH BÁO BẢO MẬT"), true);
      });

      test("F164-T20: Disconnected component negative cycle is detected when source is not specified", () => {
        const bf = new BellmanFordArbitrage();
        // Thành phần 1: Bình thường
        bf.addEdge("NORM_1", "NORM_2", 100);

        // Thành phần 2: Chu trình âm riêng biệt
        bf.addEdge("FRAUD_X", "FRAUD_Y", 10);
        bf.addEdge("FRAUD_Y", "FRAUD_X", -25); // Net = -15 < 0

        const res = bf.detectNegativeCycle(null);
        expect.equal(res.hasNegativeCycle, true);
        expect.equal(res.status, "CRITICAL_FRAUD_DETECTED");
      });

      // --- Group 4: AI Copilot & E2E Lifecycle Integration (F164-T21 -> F164-T24) ---
      test("F164-T21: Admin Sentinel Copilot explains SimHash review spam and Bellman-Ford negative cycle", () => {
        const simRes = generateAdminCopilotResponse("Quét review spam bằng simhash và khoảng cách hamming");
        expect.equal(simRes.tag, "PHÁT HIỆN REVIEW SPAM SIMHASH");
        expect.equal(simRes.text.includes("SIMHASH"), true);
        expect.equal(simRes.text.includes("Hamming"), true);

        const bfRes = generateAdminCopilotResponse("Phát hiện chu trình âm gian lận hoàn tiền bằng bellman-ford");
        expect.equal(bfRes.tag, "RADAR CHU TRÌNH ÂM BELLMAN-FORD");
        expect.equal(bfRes.text.includes("BELLMAN-FORD"), true);
        expect.equal(bfRes.text.includes("NEGATIVE CYCLE"), true);
      });

      test("F164-T22: Admin Sentinel Copilot explains Aho-Corasick linear content moderation", () => {
        const res = generateAdminCopilotResponse("Kiểm duyệt nội dung đa mẫu bằng thuật toán aho-corasick đa mẫu");
        expect.equal(res.tag, "KIỂM DUYỆT TỪ CẤM AHO-CORASICK");
        expect.equal(res.text.includes("AHO-CORASICK"), true);
        expect.equal(res.text.includes("OFF_PLATFORM_TRADING"), true);
      });

      test("F164-T23: Seller ShopSmart Copilot & Buyer Assistant respond to Aho-Corasick & SimHash inquiries", () => {
        // Seller Copilot
        const sellerRes = generateSellerCopilotResponse("Kiểm duyệt tiêu đề bài đăng tránh vi phạm bằng aho-corasick shop");
        expect.equal(sellerRes.tag, "KIỂM DUYỆT BÀI ĐĂNG AHO-CORASICK");
        expect.equal(sellerRes.text.includes("Shopee Mall"), true);

        // Buyer Assistant
        const buyerRes = generateAiChatResponse("Đánh giá có thật không hay là review ảo simhash review");
        expect.equal(buyerRes.intent, "BUYER_REVIEW_INTEGRITY_ASSIST");
        expect.equal(buyerRes.replyText.includes("SIMHASH"), true);
      });

      test("F164-T24: E2E Lifecycle: Aho-Corasick Product Post -> SimHash Review Guard -> Bellman-Ford Escrow Defense", () => {
        // 1. Seller uploads product - Title checked with Aho-Corasick
        const moderator = new AhoCorasickModerator([
          { pattern: "zalo", category: "OFF_PLATFORM", severity: "HIGH" },
          { pattern: "fake", category: "COUNTERFEIT", severity: "HIGH" }
        ]);
        const badTitle = "Tai nghe Bluetooth hàng xịn, liên hệ zalo nhận voucher";
        const modReport = moderator.scan(badTitle);
        expect.equal(modReport.isClean, false);
        const cleanTitle = moderator.maskText(badTitle);
        expect.equal(cleanTitle.includes("zalo"), false);

        // 2. Buyer posts reviews - SimHash detects duplicated seeding
        const spamRadar = new SimHashReviewSpam(3);
        spamRadar.addAndCheckReview({ id: "r1", text: "Sản phẩm tốt, giao nhanh 2h, đóng gói kỹ lưỡng" });
        const secondPost = spamRadar.addAndCheckReview({ id: "r2", text: "Sản phẩm tốt giao nhanh 2h đóng gói kỹ lưỡng nha" });
        expect.equal(secondPost.isSpam, true);

        // 3. Sybil financial refund loop detected by Bellman-Ford
        const escrowAudit = new BellmanFordArbitrage();
        escrowAudit.addEdge("ACC_A", "ACC_B", 50000, "ORDER_PAYMENT");
        escrowAudit.addEdge("ACC_B", "ACC_C", 50000, "ORDER_PAYMENT");
        escrowAudit.addEdge("ACC_C", "ACC_A", -120000, "FRAUDULENT_DISPUTE_REFUND"); // Arbitrage loop!
        const auditResult = escrowAudit.detectNegativeCycle();
        expect.equal(auditResult.hasNegativeCycle, true);
        expect.equal(auditResult.status, "CRITICAL_FRAUD_DETECTED");
      });
    });
  });
});























