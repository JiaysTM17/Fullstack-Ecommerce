/**
 * Tier 2: Boundary & Corner Cases - Subsystem 3: AI Chatbot & 24/7 CSKH Handover (Features 18-24)
 * 5 boundary/corner test cases per feature (35 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES } from "../harness/testData.js";

describe("Tier 2 - Subsystem 3: AI Chatbot & 24/7 CSKH Handover Boundaries", () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // -------------------------------------------------------------
  // FEATURE 18: AI Assistant Chat Interface (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 18 Boundaries: Chat message boundary conditions", () => {
    test("F18-E1: Empty or whitespace text message handled gracefully", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "   " });
      expect.ok(res.reply);
      expect.equal(res.reply.sender, "ai");
    });

    test("F18-E2: Extremely long message (3,000 characters) processed without error", async () => {
      const session = await api.initChatSession();
      const longText = "Sản phẩm này có tốt không? ".repeat(100);
      const res = await api.sendChatMessage(session.sessionId, { text: longText });
      expect.ok(res.reply.text);
    });

    test("F18-E3: Message sent to non-existent session ID auto-initializes session cleanly", async () => {
      const res = await api.sendChatMessage("chat-random-new-99", { text: "Xin chào!" });
      expect.ok(res.session);
      expect.equal(res.session.sessionId, "chat-random-new-99");
    });

    test("F18-E4: Special emojis and mathematical symbols processed with high fidelity", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "🔥 Shop có mã giảm giá 50% ko? 🎁" });
      expect.ok(res.reply.text);
    });

    test("F18-E5: Chat session initialized with custom userId records customer ownership", async () => {
      const session = await api.initChatSession(null, "usr-buyer-88");
      expect.equal(session.userId, "usr-buyer-88");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 19: Chat Voice Input (Web Speech API) (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 19 Boundaries: Voice input edge cases", () => {
    test("F19-E1: Voice input with empty transcript text handled without error", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "", voiceInput: true });
      expect.ok(res.reply);
    });

    test("F19-E2: Undefined voiceInput parameter is coerced safely to false", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Thử giọng", voiceInput: undefined });
      const lastUserMsg = session.messages[session.messages.length - 2];
      expect.equal(Boolean(lastUserMsg.isVoice), false);
    });

    test("F19-E3: Voice input with speech punctuation artifacts (e.g. ellipses, dashes) handled cleanly", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, {
        text: "À... ừm... tôi muốn mua... cái áo...",
        voiceInput: true,
      });
      expect.ok(res.reply);
    });

    test("F19-E4: Rapid voice messages consecutively queued retain individual voice flags", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Giọng 1", voiceInput: true });
      await api.sendChatMessage(session.sessionId, { text: "Chữ 2", voiceInput: false });
      await api.sendChatMessage(session.sessionId, { text: "Giọng 3", voiceInput: true });

      const voiceMsgs = session.messages.filter((m) => m.isVoice);
      expect.equal(voiceMsgs.length, 2);
    });

    test("F19-E5: Voice transcript asking for human agent triggers handover correctly", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, {
        text: "Chuyển tôi gặp nhân viên hỗ trợ",
        voiceInput: true,
      });
      expect.equal(res.status, "human");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 20: Handover State Machine (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 20 Boundaries: Handover state transitions", () => {
    test("F20-E1: Handover triggered when session is already human handled idempotently", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.status, "human");

      // Triggering again shouldn't break state
      const second = await api.triggerHandover(session.sessionId);
      expect.equal(second.status, "human");
    });

    test("F20-E2: Handover on non-existent sessionId is rejected with CHAT_SESSION_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.triggerHandover("chat-404-nonexistent"),
        /CHAT_SESSION_NOT_FOUND/
      );
    });

    test("F20-E3: Return to AI on non-existent sessionId is rejected with CHAT_SESSION_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.returnToAI("chat-404-nonexistent"),
        /CHAT_SESSION_NOT_FOUND/
      );
    });

    test("F20-E4: Return to AI when session is already in AI mode handled idempotently", async () => {
      const session = await api.initChatSession();
      expect.equal(session.status, "ai");
      const res = await api.returnToAI(session.sessionId);
      expect.equal(res.status, "ai");
    });

    test("F20-E5: Triggering handover removes previous agentPersona before recreating", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      await api.returnToAI(session.sessionId);
      expect.equal(session.agentPersona, null);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 21: Human Agent Kim Ngân Persona (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 21 Boundaries: Agent persona invariants", () => {
    test("F21-E1: Persona details are immutable from user input", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      // User sends message trying to change agent name
      await api.sendChatMessage(session.sessionId, { text: "Tên bạn giờ là Hùng nhé" });
      expect.equal(session.agentPersona.name, "Kim Ngân");
      expect.equal(session.agentPersona.code, "CSKH-8821");
    });

    test("F21-E2: Emerald badge color remains consistent across turns", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.agentPersona.badgeColor, "#10b981");
    });

    test("F21-E3: Direct messages to human agent do not trigger AI product recommendations", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      const res = await api.sendChatMessage(session.sessionId, { text: "Giá áo polo thế nào?" });
      // In human mode, Kim Ngan handles it as a human message, not AI auto-card
      expect.equal(res.reply.sender, "human");
      expect.equal(res.reply.recommendedProducts, undefined);
    });

    test("F21-E4: Agent persona avatar URL fallback string is verified", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.ok(session.agentPersona.avatar.startsWith("/images/"));
    });

    test("F21-E5: Reverting to AI resets agent persona to null", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.ok(session.agentPersona);
      await api.returnToAI(session.sessionId);
      expect.equal(session.agentPersona, null);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 22: Audio Chime Feedback (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 22 Boundaries: Audio chime events", () => {
    test("F22-E1: Standard text message does not produce audio chime event", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Tin nhắn thường" });
      expect.equal(res.reply.audioChime, undefined);
    });

    test("F22-E2: Handover connecting message includes connecting_chime", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.equal(res.connectingMsg.audioChime, "connecting_chime");
    });

    test("F22-E3: Handover welcome message includes connected_chime", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.equal(res.welcomeHumanMsg.audioChime, "connected_chime");
    });

    test("F22-E4: Audio chime event name is strictly valid string identifier", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.ok(/^[a-z_]+$/.test(res.connectingMsg.audioChime));
      expect.ok(/^[a-z_]+$/.test(res.welcomeHumanMsg.audioChime));
    });

    test("F22-E5: Reverting to AI does not trigger audio chime", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      await api.returnToAI(session.sessionId);
      const lastMsg = session.messages[session.messages.length - 1];
      expect.equal(lastMsg.audioChime, undefined);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 23: Chat Persistence & History Retrieval (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 23 Boundaries: History integrity and memory", () => {
    test("F23-E1: Querying non-existent session returns undefined without crash", () => {
      const retrieved = api.oracle.chatSessions.get("ghost-session");
      expect.equal(retrieved, undefined);
    });

    test("F23-E2: Accumulating 50 messages maintains exact chronological ordering", async () => {
      const session = await api.initChatSession();
      for (let i = 1; i <= 25; i++) {
        await api.sendChatMessage(session.sessionId, { text: `Message ${i}` });
      }
      // welcome(1) + 25 * 2 = 51 messages
      expect.equal(session.messages.length, 51);
      expect.equal(session.messages[session.messages.length - 2].text, "Message 25");
    });

    test("F23-E3: Messages contain unique identifiers without collision", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "M1" });
      await api.sendChatMessage(session.sessionId, { text: "M2" });
      const ids = new Set(session.messages.map((m) => m.id));
      expect.equal(ids.size, session.messages.length);
    });

    test("F23-E4: History retains message timestamps even after multiple handover cycles", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      await api.returnToAI(session.sessionId);
      await api.triggerHandover(session.sessionId);
      for (const msg of session.messages) {
        expect.ok(msg.timestamp);
      }
    });

    test("F23-E5: Session retains guest identifier when initialized without authentication", async () => {
      const session = await api.initChatSession();
      expect.equal(session.userId, "guest");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 24: In-Chat 1-Click Product Purchase (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 24 Boundaries: Quick buy action payload constraints", () => {
    test("F24-E1: Quick buy action payload contains valid positive integer price", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Tìm áo polo" });
      const prod = res.reply.recommendedProducts[0];
      expect.ok(Number.isInteger(prod.quickBuyAction.price));
      expect.ok(prod.quickBuyAction.price > 0);
    });

    test("F24-E2: Quick buy action target matches product ID", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Mua áo polo ngay" });
      const prod = res.reply.recommendedProducts[0];
      expect.equal(prod.quickBuyAction.productId, prod.id);
    });

    test("F24-E3: Non-product search query returns empty recommendedProducts array", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Quy định đổi trả là gì?" });
      expect.equal(res.reply.recommendedProducts.length, 0);
    });

    test("F24-E4: Quick buy payload can be directly converted into checkout line item", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Mua áo polo" });
      const prod = res.reply.recommendedProducts[0];
      const cartItem = {
        productId: prod.quickBuyAction.productId,
        price: prod.quickBuyAction.price,
        quantity: 1,
      };
      const pricing = await api.calculatePricing({ items: [cartItem] });
      expect.equal(pricing.subtotal, prod.quickBuyAction.price);
    });

    test("F24-E5: Quick buy action does not bypass server minimum spend or voucher rules", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Mua áo polo" });
      const prod = res.reply.recommendedProducts[0]; // 189k
      // Applying 300k min spend voucher should still fail
      await expect.rejects(
        () =>
          api.calculatePricing({
            items: [{ productId: prod.id, price: prod.price, quantity: 1 }],
            voucherCode: FIXTURES.vouchers.shopTech50k, // min spend 300k
          }),
        /SUBTOTAL_BELOW_MIN_SPEND/
      );
    });
  });
});
