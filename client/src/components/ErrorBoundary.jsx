import React from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="shopee-container" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{
            maxWidth: "500px",
            margin: "0 auto",
            background: "var(--bg-card, #ffffff)",
            padding: "36px 24px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid var(--border-medium, #e2e8f0)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary, #1e293b)" }}>
              Đã xảy ra sự cố khi tải trang
            </h2>
            <p style={{ color: "var(--text-secondary, #64748b)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              {this.state.error?.message || "Hệ thống tạm thời gặp gián đoạn. Vui lòng tải lại hoặc quay về trang chủ."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={this.handleReload}
                style={{ padding: "10px 20px", fontWeight: 600 }}
              >
                🔄 Tải Lại Trang
              </button>
              <Link
                to="/"
                className="shopee-btn shopee-btn-secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{ padding: "10px 20px", fontWeight: 600, textDecoration: "none" }}
              >
                🏠 Về Trang Chủ
              </Link>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
