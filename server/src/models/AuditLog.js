import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, default: "" },
    userRole: { type: String, default: "admin" },
    action: { type: String, required: true }, // e.g., "SHOP_LOCK", "PRODUCT_APPROVE", "DISPUTE_RESOLVE", "CAMPAIGN_CREATE"
    entityType: { type: String, default: "SYSTEM" }, // "SHOP", "USER", "PRODUCT", "ORDER", "CAMPAIGN", "DISPUTE"
    entityId: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "127.0.0.1" },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export const recordAuditLog = async ({
  userId,
  userName = "Hệ Thống",
  userRole = "admin",
  action,
  entityType = "SYSTEM",
  entityId = "",
  details = {},
  ip = "127.0.0.1",
  userAgent = "",
}) => {
  const logEntry = {
    _id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    userName,
    userRole,
    action,
    entityType,
    entityId,
    details,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await AuditLogModel.create(logEntry);
    } else {
      await memoryStore.auditLogs.create(logEntry);
    }
  } catch (err) {
    console.error("[AuditLog] Failed to record log:", err.message);
  }
  return logEntry;
};

const AuditLog = new Proxy(AuditLogModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.auditLogs[prop]) {
      return memoryStore.auditLogs[prop];
    }
    return target[prop];
  },
});

export default AuditLog;
