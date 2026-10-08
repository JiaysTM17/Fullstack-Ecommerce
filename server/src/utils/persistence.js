import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "../../data");
const STORE_FILE = join(DATA_DIR, "store.json");

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Save the current in-memory state to disk as JSON
 * Called after every write operation to ensure persistence
 */
export function saveToDisk(memoryStoreInstance) {
  try {
    ensureDataDir();
    const snapshot = {
      _savedAt: new Date().toISOString(),
      _version: 2,
      users: memoryStoreInstance.usersStore,
      shops: memoryStoreInstance.shopsStore,
      products: memoryStoreInstance.productsStore,
      orders: memoryStoreInstance.ordersStore,
      vouchers: memoryStoreInstance.vouchersStore,
      carts: memoryStoreInstance.cartsStore,
      reviews: memoryStoreInstance.reviewsStore,
      categories: memoryStoreInstance.categoriesStore,
      questions: memoryStoreInstance.questionsStore || [],
      auditLogs: memoryStoreInstance.auditLogsStore || [],
      campaigns: memoryStoreInstance.campaignsStore || [],
      disputes: memoryStoreInstance.disputesStore || [],
      adsCampaigns: memoryStoreInstance.adsCampaignsStore || [],
    };
    writeFileSync(STORE_FILE, JSON.stringify(snapshot, null, 2), "utf8");
    return true;
  } catch (err) {
    logger.error(`[Persistence] Error saving to disk: ${err.message}`);
    return false;
  }
}

/**
 * Load state from disk JSON file
 * Returns null if no saved state exists
 */
export function loadFromDisk() {
  try {
    if (!existsSync(STORE_FILE)) {
      return null;
    }
    const raw = readFileSync(STORE_FILE, "utf8");
    const data = JSON.parse(raw);
    logger.info(`[Persistence] Loaded store from disk (saved at ${data._savedAt})`);
    return data;
  } catch (err) {
    logger.error(`[Persistence] Error loading from disk: ${err.message}`);
    return null;
  }
}

/**
 * Clear saved state (for testing/reset)
 */
export function clearDiskStore() {
  try {
    if (existsSync(STORE_FILE)) {
      writeFileSync(STORE_FILE, "{}", "utf8");
    }
    return true;
  } catch {
    return false;
  }
}

export default { saveToDisk, loadFromDisk, clearDiskStore };
