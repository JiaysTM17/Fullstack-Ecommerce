import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { apiRequest } from "../services/api";

const LOCAL_QA_KEY_PREFIX = "mini_shopee_qa_";

export default function ProductQASection({ productId, shopName = "Thời Trang GenZ Official" }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingQId, setReplyingQId] = useState(null);
  const [replyText, setReplyText] = useState("");

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
      const res = await apiRequest(`/api/products/${productId}/questions`);
      if (res?.data?.questions) {
        setQuestions(res.data.questions);
        return;
      }
    } catch (err) {
      // Backend offline or product fallback
    }

    // Fallback: Local questions or initial mocks
    const local = getLocalQuestions();
    if (local && local.length > 0) {
      setQuestions(local);
    } else {
      const initialMock = [
        {
          _id: `q_mock_${productId}_1`,
          userName: "Thanh Tùng",
          question: "Chất liệu sản phẩm có bền màu và thoáng khí không shop?",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          helpfulCount: 5,
          answers: [
            {
              _id: `ans_mock_1`,
              authorName: shopName,
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

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    setSubmitting(true);
    const authorName = user?.fullName || user?.name || "Khách Hàng Mini Shopee";
    const newQObj = {
      _id: `q_user_${Date.now()}`,
      productId,
      userName: authorName,
      question: newQuestionText.trim(),
      createdAt: new Date().toISOString(),
      answers: [],
      helpfulCount: 0,
    };

    try {
      const res = await apiRequest(`/api/products/${productId}/questions`, {
        method: "POST",
        body: JSON.stringify({ question: newQuestionText.trim(), userName: authorName }),
      });
      if (res?.data?.question) {
        setQuestions((prev) => [res.data.question, ...prev]);
        showToast("Đã gửi câu hỏi thành công! Shop sẽ phản hồi trong giây lát.", "success");
        setNewQuestionText("");
        setSubmitting(false);
        return;
      }
    } catch (err) {
      // Offline fallback
    }

    const updated = [newQObj, ...questions];
    setQuestions(updated);
    saveLocalQuestions(updated);
    showToast("Đã gửi câu hỏi thành công! Shop sẽ phản hồi trong giây lát.", "success");
    setNewQuestionText("");
    setSubmitting(false);
  };

  const handleVoteQuestion = async (questionId) => {
    try {
      await apiRequest(`/api/products/${productId}/questions/${questionId}/vote`, { method: "POST" });
    } catch {}

    const updated = questions.map((q) => {
      if (q._id === questionId) {
        return { ...q, helpfulCount: (q.helpfulCount || 0) + 1 };
      }
      return q;
    });
    setQuestions(updated);
    saveLocalQuestions(updated);
    showToast("Đã ghi nhận bình chọn hữu ích!", "success");
  };

  const handleAddReply = (questionId) => {
    if (!replyText.trim()) return;
    const authorName = user?.role === "seller" ? shopName : user?.fullName || user?.name || "Cộng đồng Shopee";
    const isShop = user?.role === "seller" || user?.role === "admin";

    const newAns = {
      _id: `ans_${Date.now()}`,
      authorName,
      isShopOwner: isShop,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = questions.map((q) => {
      if (q._id === questionId) {
        return {
          ...q,
          answers: [...(q.answers || []), newAns],
        };
      }
      return q;
    });

    setQuestions(updated);
    saveLocalQuestions(updated);
    setReplyText("");
    setReplyingQId(null);
    showToast("Đã gửi câu trả lời thành công!", "success");
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
              Hỏi đáp trực tiếp với Shop và những người mua trước
            </span>
          </div>
        </div>
      </div>

      {/* Ask Question Form */}
      <form onSubmit={handleAskQuestion} style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Bạn có câu hỏi gì về kích cỡ, chất liệu hay cách sử dụng sản phẩm? Hỏi ngay..."
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: "13.5px",
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
              padding: "10px 20px",
              fontSize: "13.5px",
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
      </form>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted, #94a3b8)" }}>
          <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>💡</span>
          <p style={{ margin: 0, fontSize: "14px" }}>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi cho sản phẩm này!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {questions.map((q) => (
            <div
              key={q._id}
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
                    }}
                  >
                    Q
                  </span>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>
                    {q.question}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleVoteQuestion(q._id)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-medium, #cbd5e1)",
                    borderRadius: "16px",
                    padding: "3px 10px",
                    fontSize: "12px",
                    color: "var(--text-secondary, #64748b)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                  }}
                  title="Bình chọn câu hỏi hữu ích"
                >
                  👍 Hữu ích ({q.helpfulCount || 0})
                </button>
              </div>

              <div style={{ fontSize: "11.5px", color: "var(--text-muted, #94a3b8)", marginLeft: "28px", marginBottom: "12px" }}>
                Hỏi bởi <strong>{q.userName}</strong> • {new Date(q.createdAt).toLocaleDateString("vi-VN")}
              </div>

              {/* Answers */}
              <div style={{ marginLeft: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {q.answers && q.answers.length > 0 ? (
                  q.answers.map((ans) => (
                    <div
                      key={ans._id}
                      style={{
                        background: ans.isShopOwner ? "rgba(234, 88, 12, 0.05)" : "#fff",
                        border: ans.isShopOwner ? "1px solid rgba(234, 88, 12, 0.2)" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px" }}>{ans.isShopOwner ? "🏪" : "💬"}</span>
                        <strong style={{ fontSize: "13px", color: ans.isShopOwner ? "var(--primary-color, #ea580c)" : "inherit" }}>
                          {ans.authorName}
                        </strong>
                        {ans.isShopOwner && (
                          <span
                            style={{
                              background: "var(--primary-color, #ea580c)",
                              color: "#fff",
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "1px 5px",
                              borderRadius: "4px",
                            }}
                          >
                            Người bán
                          </span>
                        )}
                        <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto" }}>
                          {new Date(ans.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary, #1e293b)", lineHeight: "1.4" }}>
                        {ans.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted, #94a3b8)", fontStyle: "italic" }}>
                    Chưa có phản hồi. Shop đang chuẩn bị câu trả lời.
                  </div>
                )}

                {/* Reply action */}
                {replyingQId === q._id ? (
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
                      onClick={() => handleAddReply(q._id)}
                      style={{
                        padding: "6px 12px",
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
                      onClick={() => setReplyingQId(null)}
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
                    onClick={() => setReplyingQId(q._id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
