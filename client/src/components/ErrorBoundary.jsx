import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircleIcon, RefreshIcon, HomeIcon } from './OrdersIcons';

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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <span style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircleIcon size={38} color="#f59e0b" />
              </span>
            </div>
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
                style={{ padding: "10px 20px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <RefreshIcon size={13} color="#ffffff" />
                </span>
                <span>Tải Lại Trang</span>
              </button>
              <Link
                to="/"
                className="shopee-btn shopee-btn-secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{ padding: "10px 20px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(234, 88, 12, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <HomeIcon size={13} color="#ea580c" />
                </span>
                <span>Về Trang Chủ</span>
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
