import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "mini-shopee-enterprise-jwt-secret-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Native crypto fallback helpers for base64url HMAC
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf8");
}

function nativeSign(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function nativeVerify(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token structure");
  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    const err = new Error("Token expired");
    err.name = "TokenExpiredError";
    throw err;
  }
  return payload;
}

export const generateToken = (payload) => {
  const data = {
    id: payload.id || payload._id,
    email: payload.email,
    role: payload.role,
    shopId: payload.shopId || null,
  };

  try {
    return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch {
    return nativeSign(data, JWT_SECRET);
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw err;
    return nativeVerify(token, JWT_SECRET);
  }
};

export default { generateToken, verifyToken };
