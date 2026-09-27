/**
 * Tier 1: Feature Coverage - Subsystem 3: AI Chatbot & 24/7 CSKH Handover (Features 18-24)
 * 5 isolated happy-path test cases per feature (35 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";

describe("Tier 1 - Subsystem 3: AI Chatbot & 24/7 CSKH Handover", () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // -------------------------------------------------------------
  // FEATURE 18: AI Assistant Chat Interface (5 tests)
  // -------------------------------------------------------------
  describe("Feature 18: AI Assistant Chat Interface", () => {
    test("F18-T1: Initializing chat session provides welcome greeting", async () => {
      const session = await api.initChatSession();
      expect.ok(session.sessionId);
      expect.equal(session.status, "ai");
      expect.ok(session.messages[0].text.includes("Trợ lý AI"));
    });

    test("F18-T2: Sending a customer message receives an automated AI reply", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Xin chào bạn!" });
      expect.equal(res.reply.sender, "ai");
      expect.ok(res.reply.text.length > 0);
    });

    test("F18-T3: Chat session defaults to AI mode before any handover", async () => {
      const session = await api.initChatSession();
      expect.equal(session.status, "ai");
      expect.equal(session.agentPersona, null);
    });

    test("F18-T4: Unique session ID generated per customer", async () => {
      const s1 = await api.initChatSession();
      const s2 = await api.initChatSession();
      expect.notEqual(s1.sessionId, s2.sessionId);
    });

    test("F18-T5: ISO timestamps recorded on every message turn", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Kiểm tra giờ" });
      expect.ok(Date.parse(res.reply.timestamp) > 0);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 19: Chat Voice Input (Web Speech API) (5 tests)
  // -------------------------------------------------------------
  describe("Feature 19: Chat Voice Input (Web Speech API)", () => {
    test("F19-T1: Message payload correctly tags voiceInput flag", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Tìm áo polo nam", voiceInput: true });
      const userMsg = session.messages.find((m) => m.text === "Tìm áo polo nam");
      expect.equal(userMsg.isVoice, true);
    });

    test("F19-T2: Voice transcript query in Vietnamese is answered appropriately", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, {
        text: "Tôi muốn tìm áo polo cotton thoáng mát",
        voiceInput: true,
      });
      expect.ok(res.reply.recommendedProducts.length > 0 || res.reply.text.length > 0);
    });

    test("F19-T3: Standard text message has isVoice flag as false", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Tin nhắn gõ phím", voiceInput: false });
      const userMsg = session.messages.find((m) => m.text === "Tin nhắn gõ phím");
      expect.equal(userMsg.isVoice, false);
    });

    test("F19-T4: Voice input triggers conversational context correctly", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Giá sản phẩm này bao nhiêu?", voiceInput: true });
      expect.equal(res.reply.sender, "ai");
    });

    test("F19-T5: Multiple voice queries maintain chronological order in chat history", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Giọng nói 1", voiceInput: true });
      await api.sendChatMessage(session.sessionId, { text: "Giọng nói 2", voiceInput: true });
      expect.equal(session.messages[1].text, "Giọng nói 1");
      expect.equal(session.messages[3].text, "Giọng nói 2");
      expect.equal(session.messages[4].sender, "ai");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 20: Handover State Machine (5 tests)
  // -------------------------------------------------------------
  describe("Feature 20: Handover State Machine", () => {
    test("F20-T1: Customer keyword 'gặp nhân viên' triggers handover state transition", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Tôi muốn gặp nhân viên CSKH" });
      expect.equal(res.status, "human");
      expect.equal(session.status, "human");
    });

    test("F20-T2: Handover process includes connecting intermediate state", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.ok(res.connectingMsg);
      expect.equal(res.connectingMsg.sender, "system");
    });

    test("F20-T3: Handover connecting state specifies 1200ms delay", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.equal(res.connectingMsg.delayMs, 1200);
    });

    test("F20-T4: Status successfully updates to 'human' after connection completes", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.status, "human");
    });

    test("F20-T5: Customer can revert back to AI assistant from human mode", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      const res = await api.returnToAI(session.sessionId);
      expect.equal(res.status, "ai");
      expect.equal(session.status, "ai");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 21: Human Agent Kim Ngân (CSKH-8821) Persona (5 tests)
  // -------------------------------------------------------------
  describe("Feature 21: Human Agent Kim Ngân Persona", () => {
    test("F21-T1: Persona name is assigned as 'Kim Ngân'", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.agentPersona.name, "Kim Ngân");
    });

    test("F21-T2: Agent code is officially registered as 'CSKH-8821'", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.agentPersona.code, "CSKH-8821");
    });

    test("F21-T3: Dedicated emerald badge color is assigned to agent persona", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.agentPersona.badgeColor, "#10b981");
    });

    test("F21-T4: Agent avatar image URL points to CSKH asset", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      expect.equal(session.agentPersona.avatar, "/images/cskh-kimngan.png");
    });

    test("F21-T5: Subsequent chat message in human mode is signed by Kim Ngân", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      const res = await api.sendChatMessage(session.sessionId, { text: "Đơn hàng của mình bị trễ" });
      expect.equal(res.reply.sender, "human");
      expect.equal(res.reply.agentCode, "CSKH-8821");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 22: Audio Chime Feedback (Web Audio API) (5 tests)
  // -------------------------------------------------------------
  describe("Feature 22: Audio Chime Feedback (Web Audio API)", () => {
    test("F22-T1: Connecting step includes audioChime event 'connecting_chime'", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.equal(res.connectingMsg.audioChime, "connecting_chime");
    });

    test("F22-T2: Handover connected message triggers 'connected_chime'", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.equal(res.welcomeHumanMsg.audioChime, "connected_chime");
    });

    test("F22-T3: Handover chime cues are distinct and sequenced", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      expect.notEqual(res.connectingMsg.audioChime, res.welcomeHumanMsg.audioChime);
    });

    test("F22-T4: Audio chime parameters exist in serializable JSON message payload", async () => {
      const session = await api.initChatSession();
      const res = await api.triggerHandover(session.sessionId);
      const serialized = JSON.stringify(res.welcomeHumanMsg);
      expect.ok(serialized.includes("connected_chime"));
    });

    test("F22-T5: AI greetings do not require connecting sound cue", async () => {
      const session = await api.initChatSession();
      expect.equal(session.messages[0].audioChime, undefined);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 23: Chat Persistence & History Retrieval (5 tests)
  // -------------------------------------------------------------
  describe("Feature 23: Chat Persistence & History Retrieval", () => {
    test("F23-T1: Complete conversation history is accumulated in session", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Hỏi câu 1" });
      await api.sendChatMessage(session.sessionId, { text: "Hỏi câu 2" });
      // welcome (1) + 2 * (user + ai) = 5 messages
      expect.equal(session.messages.length, 5);
    });

    test("F23-T2: Retrieving session by ID returns exact existing messages", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Tin nhắn lưu trữ" });
      const retrieved = api.oracle.chatSessions.get(session.sessionId);
      expect.equal(retrieved.sessionId, session.sessionId);
      expect.equal(retrieved.messages.length, 3);
    });

    test("F23-T3: Handover transition messages are fully retained in history", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      const messages = session.messages.map((m) => m.sender);
      expect.ok(messages.includes("system"));
      expect.ok(messages.includes("human"));
    });

    test("F23-T4: Returning to AI assistant logs system event in history", async () => {
      const session = await api.initChatSession();
      await api.triggerHandover(session.sessionId);
      await api.returnToAI(session.sessionId);
      const lastMsg = session.messages[session.messages.length - 1];
      expect.equal(lastMsg.sender, "system");
      expect.ok(lastMsg.text.includes("quay lại"));
    });

    test("F23-T5: Session persistence separates user messages from bot messages", async () => {
      const session = await api.initChatSession();
      await api.sendChatMessage(session.sessionId, { text: "Người dùng gửi" });
      const userMsg = session.messages.find((m) => m.text === "Người dùng gửi");
      expect.equal(userMsg.sender, "user");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 24: In-Chat 1-Click Product Purchase (5 tests)
  // -------------------------------------------------------------
  describe("Feature 24: In-Chat 1-Click Product Purchase", () => {
    test("F24-T1: Product recommendation query returns in-chat product cards", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Gợi ý mua áo polo" });
      expect.ok(res.reply.recommendedProducts.length > 0);
    });

    test("F24-T2: In-chat product card contains product name, price, and image", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Tôi muốn mua điện thoại" });
      const prod = res.reply.recommendedProducts[0];
      expect.ok(prod.name);
      expect.ok(prod.price > 0);
      expect.ok(prod.image);
    });

    test("F24-T3: Recommended product contains quickBuyAction payload", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Xem giá áo nam" });
      const prod = res.reply.recommendedProducts[0];
      expect.ok(prod.quickBuyAction);
      expect.equal(prod.quickBuyAction.productId, prod.id);
    });

    test("F24-T4: Quick buy action price matches product listed price", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Tư vấn áo polo" });
      const prod = res.reply.recommendedProducts[0];
      expect.equal(prod.quickBuyAction.price, prod.price);
    });

    test("F24-T5: Non-shopping inquiry does not return unsolicited product cards", async () => {
      const session = await api.initChatSession();
      const res = await api.sendChatMessage(session.sessionId, { text: "Hôm nay thời tiết thế nào?" });
      expect.equal(res.reply.recommendedProducts.length, 0);
    });
  });
});
