import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, default: "System" },
    userRole: { type: String, default: "admin" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "127.0.0.1" },
  },
  { timestamps: true }
);

const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

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

export async function recordAuditLog(logData) {
  try {
    return await AuditLog.create(logData);
  } catch (err) {
    console.warn("[AuditLog] Failed to record audit log:", err.message);
    return null;
  }
}

export default AuditLog;
