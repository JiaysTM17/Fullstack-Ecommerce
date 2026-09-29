import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getProductQuestions,
  askProductQuestion,
  voteProductQuestion,
  answerProductQuestion,
} from "../services/productService";

const LOCAL_QA_KEY_PREFIX = "mini_shopee_qa_";
const VOTED_QA_KEY = "mini_shopee_qa_voted_questions";

export default function ProductQASection({ productId, shopName = "Thời Trang GenZ Official" }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingQId, setReplyingQId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const getVotedQuestions = () => {
    try {
      const raw = localStorage.getItem(VOTED_QA_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getLocalQuestions = () => {
    try {
      const raw = localStorage.getItem(`${LOCAL_QA_KEY_PREFIX}${productId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalQuestions = (qs) => {
    try {
      localStorage.setItem(`${LOCAL_QA_KEY_PREFIX}${productId}`, JSON.stringify(qs));
    } catch {}
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const list = await getProductQuestions(productId);
      if (Array.isArray(list) && list.length > 0) {
        setQuestions(list);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Backend offline or fallback
    }

    // Fallback: Local questions or initial mocks
    const local = getLocalQuestions();
    if (local && local.length > 0) {
      setQuestions(local);
    } else {
      const initialMock = [
        {
          _id: `q_mock_${productId}_1`,
          id: `q_mock_${productId}_1`,
          productId,
          userName: "Thanh Tùng",
          customerName: "Thanh Tùng",
          question: "Chất liệu sản phẩm có bền màu và thoáng khí không shop?",
          questionText: "Chất liệu sản phẩm có bền màu và thoáng khí không shop?",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          askedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          helpfulCount: 5,
          upvotes: 5,
          isAnswered: true,
          answer: "Dạ chào bạn, sản phẩm được hoàn thiện từ chất liệu cao cấp dệt sợi tự nhiên, thoáng mát và bền màu sau nhiều lần giặt ạ!",
          answeredAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
          answeredBy: shopName,
          answers: [
            {
              _id: `ans_mock_1`,
              id: `ans_mock_1`,
              authorName: shopName,
              answeredBy: shopName,
              isShopOwner: true,
              content: "Dạ chào bạn, sản phẩm được hoàn thiện từ chất liệu cao cấp dệt sợi tự nhiên, thoáng mát và bền màu sau nhiều lần giặt ạ!",
              createdAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
            },
          ],
        },
      ];
      setQuestions(initialMock);
      saveLocalQuestions(initialMock);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (productId) {
      loadQuestions();
    }
  }, [productId]);

  useEffect(() => {
    if (user?.fullName || user?.name) {
      setAuthorNameInput(user.fullName || user.name);
    }
  }, [user]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    const qText = newQuestionText.trim();
    if (!qText) {
      showToast(t("enter_question_text", "Vui lòng nhập nội dung câu hỏi!"), "warning");
      return;
    }

    setSubmitting(true);
    const authorName = (authorNameInput.trim() || user?.fullName || user?.name || "Khách Hàng Mini Shopee").trim();

    try {
      const created = await askProductQuestion(productId, {
        question: qText,
        questionText: qText,
        userName: authorName,
        customerName: authorName,
      });

      if (created) {
        setQuestions((prev) => [created, ...prev]);
        saveLocalQuestions([created, ...questions]);
        showToast(t("question_sent_success", "Đã gửi câu hỏi thành công! Shop sẽ phản hồi sớm."), "success");
        setNewQuestionText("");
        setSubmitting(false);
        return;
      }
    } catch (err) {
      // Offline fallback already handled in productService
    }

    const newQObj = {
      _id: `q_user_${Date.now()}`,
      id: `q_user_${Date.now()}`,
      productId,
      userName: authorName,
      customerName: authorName,
      question: qText,
      questionText: qText,
      createdAt: new Date().toISOString(),
      askedAt: new Date().toISOString(),
      answers: [],
      helpfulCount: 0,
      upvotes: 0,
      isAnswered: false,
      answer: null,
      answeredAt: null,
      answeredBy: null,
    };

    const updated = [newQObj, ...questions];
    setQuestions(updated);
    saveLocalQuestions(updated);
    showToast(t("question_sent_success", "Đã gửi câu hỏi thành công! Shop sẽ phản hồi sớm."), "success");
    setNewQuestionText("");
    setSubmitting(false);
  };

  const handleVoteQuestion = async (questionId) => {
    const votedList = getVotedQuestions();
    if (votedList.includes(questionId)) {
      showToast(t("already_voted_qa", "Bạn đã bình chọn cho câu hỏi này rồi!"), "info");
      return;
    }

    try {
      await voteProductQuestion(productId, questionId);
    } catch (err) {
      console.warn("Vote API error:", err);
    }

    // Persist vote guard in localStorage
    const updatedVoted = [...votedList, questionId];
    try {
      localStorage.setItem(VOTED_QA_KEY, JSON.stringify(updatedVoted));
    } catch {}

    const updated = questions.map((q) => {
      const qId = q._id || q.id;
      if (qId === questionId) {
        const nextVotes = (q.helpfulCount || q.upvotes || 0) + 1;
        return {
          ...q,
          helpfulCount: nextVotes,
          upvotes: nextVotes,
        };
      }
      return q;
    });

    setQuestions(updated);
    saveLocalQuestions(updated);
    showToast(t("vote_success", "Cảm ơn bạn đã bình chọn câu hỏi hữu ích!"), "success");
  };

  const handleAddReply = async (questionId) => {
    const text = replyText.trim();
    if (!text) return;

    const isShop = user?.role === "seller" || user?.role === "admin";
    const authorName = isShop ? shopName : user?.fullName || user?.name || "Cộng đồng Shopee";

    try {
      await answerProductQuestion(productId, questionId, {
        content: text,
        answerText: text,
        authorName,
        answeredBy: authorName,
        isShopOwner: isShop,
      });
    } catch (err) {
      console.warn("Answer API error:", err);
    }

    const now = new Date().toISOString();
    const newAns = {
      _id: `ans_${Date.now()}`,
      id: `ans_${Date.now()}`,
      authorName,
      answeredBy: authorName,
      isShopOwner: isShop,
      content: text,
      answer: text,
      createdAt: now,
      answeredAt: now,
    };

    const updated = questions.map((q) => {
      const qId = q._id || q.id;
      if (qId === questionId) {
        const answersList = Array.isArray(q.answers) ? [...q.answers, newAns] : [newAns];
        return {
          ...q,
          answers: answersList,
          isAnswered: true,
          answer: text,
          answeredAt: now,
          answeredBy: authorName,
        };
      }
      return q;
    });

    setQuestions(updated);
    saveLocalQuestions(updated);
    setReplyText("");
    setReplyingQId(null);
    showToast(t("reply_sent_success", "Đã gửi câu trả lời thành công!"), "success");
  };

  const hasUserVoted = (questionId) => {
    return getVotedQuestions().includes(questionId);
  };

  return (
    <div
      style={{
        marginTop: "32px",
        background: "var(--bg-card, #ffffff)",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid var(--border-medium, #e2e8f0)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--border-medium, #f1f5f9)",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>💬</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
              {t("qa_title", "Hỏi & Đáp về sản phẩm")} ({questions.length})
            </h3>
            <span style={{ fontSize: "12.5px", color: "var(--text-secondary, #64748b)" }}>
              Hỏi đáp trực tiếp với Người bán và cộng đồng người mua
            </span>
          </div>
        </div>
      </div>

      {/* Ask Question Form */}
      <form onSubmit={handleAskQuestion} style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder={t("your_name_placeholder", "Tên của bạn (tùy chọn)...")}
              value={authorNameInput}
              onChange={(e) => setAuthorNameInput(e.target.value)}
              style={{
                width: "220px",
                padding: "9px 12px",
                fontSize: "13px",
                borderRadius: "8px",
                border: "1px solid var(--border-medium, #cbd5e1)",
                outline: "none",
                background: "var(--bg-muted, #f8fafc)",
                color: "var(--text-primary, #0f172a)",
              }}
            />
            <input
              type="text"
              placeholder="Bạn có câu hỏi gì về kích cỡ, chất liệu hay cách sử dụng sản phẩm? Hỏi ngay..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              style={{
                flex: 1,
                minWidth: "260px",
                padding: "9px 14px",
                fontSize: "13px",
                borderRadius: "8px",
                border: "1px solid var(--border-medium, #cbd5e1)",
                outline: "none",
                background: "var(--bg-muted, #f8fafc)",
                color: "var(--text-primary, #0f172a)",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary-color, #ea580c)";
                e.target.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-medium, #cbd5e1)";
                e.target.style.background = "var(--bg-muted, #f8fafc)";
              }}
            />
            <button
              type="submit"
              disabled={submitting || !newQuestionText.trim()}
              style={{
                padding: "9px 20px",
                fontSize: "13px",
                fontWeight: 700,
                background: !newQuestionText.trim() ? "var(--bg-disabled, #e2e8f0)" : "var(--primary-color, #ea580c)",
                color: !newQuestionText.trim() ? "var(--text-disabled, #94a3b8)" : "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: !newQuestionText.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "Đang gửi..." : "Gửi câu hỏi"}
            </button>
          </div>
        </div>
      </form>

      {/* Questions List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b", fontSize: "13px" }}>
          Đang tải câu hỏi...
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted, #94a3b8)" }}>
          <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>💡</span>
          <p style={{ margin: 0, fontSize: "14px" }}>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi cho sản phẩm này!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {questions.map((q) => {
            const qId = q._id || q.id;
            const qText = q.question || q.questionText || "";
            const author = q.userName || q.customerName || "Khách hàng";
            const dateStr = q.createdAt || q.askedAt;
            const votes = q.helpfulCount !== undefined ? q.helpfulCount : q.upvotes || 0;
            const voted = hasUserVoted(qId);
            const answers = Array.isArray(q.answers) ? q.answers : [];

            return (
              <div
                key={qId}
                style={{
                  border: "1px solid var(--border-medium, #e2e8f0)",
                  borderRadius: "10px",
                  padding: "16px",
                  background: "#fafafa",
                }}
              >
                {/* Question Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: "var(--primary-color, #ea580c)",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 800,
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      Q
                    </span>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>
                      {qText}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVoteQuestion(qId)}
                    style={{
                      background: voted ? "rgba(234, 88, 12, 0.1)" : "none",
                      border: voted ? "1px solid #ea580c" : "1px solid var(--border-medium, #cbd5e1)",
                      borderRadius: "16px",
                      padding: "3px 10px",
                      fontSize: "12px",
                      color: voted ? "#ea580c" : "var(--text-secondary, #64748b)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                      fontWeight: voted ? 700 : 500,
                      transition: "all 0.15s ease",
                    }}
                    title={voted ? "Bạn đã bình chọn hữu ích cho câu hỏi này" : "Bình chọn câu hỏi hữu ích"}
                  >
                    👍 Hữu ích ({votes})
                  </button>
                </div>

                <div style={{ fontSize: "11.5px", color: "var(--text-muted, #94a3b8)", marginLeft: "28px", marginBottom: "12px" }}>
                  Hỏi bởi <strong>{author}</strong> • {dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : ""}
                </div>

                {/* Answers List */}
                <div style={{ marginLeft: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {answers.length > 0 ? (
                    answers.map((ans, idx) => {
                      const ansId = ans._id || ans.id || `ans_${idx}`;
                      const isShop = ans.isShopOwner || ans.authorName === shopName;
                      const ansAuthor = ans.authorName || ans.answeredBy || (isShop ? shopName : "Cộng đồng Shopee");
                      const ansContent = ans.content || ans.answer || "";
                      const ansDate = ans.createdAt || ans.answeredAt;

                      return (
                        <div
                          key={ansId}
                          style={{
                            background: isShop ? "rgba(234, 88, 12, 0.05)" : "#fff",
                            border: isShop ? "1px solid rgba(234, 88, 12, 0.25)" : "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "10px 14px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px" }}>{isShop ? "🏪" : "💬"}</span>
                            <strong style={{ fontSize: "13px", color: isShop ? "#ea580c" : "inherit" }}>
                              {ansAuthor}
                            </strong>
                            {isShop && (
                              <span
                                style={{
                                  background: "#ea580c",
                                  color: "#fff",
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                🏪 Người bán
                              </span>
                            )}
                            <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto" }}>
                              {ansDate ? new Date(ansDate).toLocaleDateString("vi-VN") : ""}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary, #1e293b)", lineHeight: "1.4" }}>
                            {ansContent}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: "12.5px", color: "var(--text-muted, #94a3b8)", fontStyle: "italic" }}>
                      Chưa có phản hồi. Shop đang chuẩn bị câu trả lời.
                    </div>
                  )}

                  {/* Reply Action */}
                  {replyingQId === qId ? (
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời của bạn..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          fontSize: "12.5px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-medium, #cbd5e1)",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddReply(qId)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "var(--primary-color, #ea580c)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Gửi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingQId(null);
                          setReplyText("");
                        }}
                        style={{
                          padding: "6px 10px",
                          fontSize: "12px",
                          background: "none",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyingQId(qId)}
                      style={{
                        alignSelf: "flex-start",
                        background: "none",
                        border: "none",
                        color: "var(--primary-color, #ea580c)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      💬 Trả lời câu hỏi này
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
