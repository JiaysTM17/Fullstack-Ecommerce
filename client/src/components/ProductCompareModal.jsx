import React from 'react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProductCompareModal() {
  const { comparedProducts, removeFromCompare, clearCompare, isModalOpen, setIsModalOpen } = useCompare();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  if (comparedProducts.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Drawer / Bar */}
      {!isModalOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 990,
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            padding: '10px 20px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.22)',
            border: '1px solid var(--border-medium, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚖️</span>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {t('compare_drawer_title')} ({comparedProducts.length}/3):
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {comparedProducts.map((p) => {
              const id = p._id || p.id;
              return (
                <div
                  key={id}
                  style={{
                    position: 'relative',
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                  }}
                  title={p.name}
                >
                  <img
                    src={p.image || p.images?.[0]}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCompare(id)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Xóa sản phẩm"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700 }}
            onClick={() => setIsModalOpen(true)}
          >
            {t('compare_view_btn')}
          </button>

          <button
            type="button"
            onClick={clearCompare}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              fontSize: '12.5px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {t('compare_clear_all')}
          </button>
        </div>
      )}

      {/* Full Comparison Table Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-medium, #e2e8f0)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>⚖️</span>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {t('compare_title')}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Đối chiếu thông số kỹ thuật, giá cả và bảo hành giữa các sản phẩm ({comparedProducts.length}/3)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={clearCompare}
                  className="shopee-btn shopee-btn-secondary"
                  style={{ fontSize: '12.5px', padding: '6px 12px' }}
                >
                  {t('compare_clear_all')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Comparison Grid Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <tbody>
                  {/* Row: Product Head / Card */}
                  <tr style={{ borderBottom: '2px solid var(--border-medium, #cbd5e1)' }}>
                    <th style={{ width: '160px', padding: '14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      Sản phẩm
                    </th>
                    {comparedProducts.map((p) => {
                      const id = p._id || p.id;
                      return (
                        <td key={id} style={{ padding: '14px', verticalAlign: 'top', width: `${80 / comparedProducts.length}%` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9' }}>
                              <img src={p.image || p.images?.[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              <button
                                type="button"
                                onClick={() => removeFromCompare(id)}
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.5)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                }}
                                title="Xóa"
                              >
                                ✕
                              </button>
                            </div>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{p.name}</strong>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-primary"
                              style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', marginTop: '6px' }}
                              onClick={() => addToCart(p, 1)}
                            >
                              🛒 Thêm vào giỏ
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Price */}
                  <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      {t('compare_price')}
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>
                          {formatCurrency(p.price)}
                        </span>
                        {p.originalPrice > p.price && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatCurrency(p.originalPrice)}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Rating */}
                  <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      {t('compare_rating')}
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <span style={{ color: '#ffa41c', fontWeight: 700 }}>★ {p.rating || 4.9}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                          ({p.reviewCount || 100}+ đánh giá)
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Brand & Category */}
                  <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      {t('compare_brand')} / {t('compare_category')}
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <div><strong>{p.brand || 'Chính hãng'}</strong></div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{p.category}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Shop */}
                  <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      Cửa hàng (Shop)
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 600 }}>{p.shopName || 'Thời Trang GenZ'}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Stock & Delivery */}
                  <tr>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      {t('compare_stock')}
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Còn {p.stock || 50} sản phẩm</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          🚀 Giao nhanh SPX 24h
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
