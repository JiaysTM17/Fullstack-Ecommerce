import React from 'react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { CartIcon, TruckIcon, ScaleIcon, CloseIcon, StarIcon, CheckIcon, TrashIcon, PackageIcon, TagIcon, ShieldCheckIcon, StoreIcon } from './OrdersIcons';

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
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                flexShrink: 0,
              }}
            >
              <ScaleIcon size={16} color="#ffffff" />
            </div>
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
                      top: '2px',
                      right: '2px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      padding: 0,
                    }}
                    title="Xóa sản phẩm"
                    aria-label="Xóa sản phẩm khỏi so sánh"
                  >
                    <CloseIcon size={10} color="#ffffff" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScaleIcon size={12} color="#ffffff" />
            </span>
            <span>{t('compare_view_btn')}</span>
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrashIcon size={10} color="#dc2626" />
            </span>
            <span>{t('compare_clear_all')}</span>
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
            animation: 'modalOverlayFadeIn 0.22s ease-out forwards',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="anim-modal-content"
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <ScaleIcon size={22} color="#ffffff" />
                </div>
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
                  style={{ fontSize: '12.5px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrashIcon size={10} color="#dc2626" />
                  </span>
                  <span>{t('compare_clear_all')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  aria-label="Đóng bảng so sánh"
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={12} color="#ef4444" />
                  </span>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PackageIcon size={13} color="#ea580c" />
                        </span>
                        <span>Sản phẩm</span>
                      </div>
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
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                                  padding: 0,
                                }}
                                title="Xóa sản phẩm này khỏi so sánh"
                                aria-label="Xóa sản phẩm khỏi so sánh"
                              >
                                <CloseIcon size={12} color="#ffffff" />
                              </button>
                            </div>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{p.name}</strong>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-primary"
                              style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', marginTop: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              onClick={() => addToCart(p, 1)}
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CartIcon size={12} color="#ffffff" />
                              </span>
                              <span>Thêm vào giỏ</span>
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Price */}
                  <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(236, 72, 153, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TagIcon size={13} color="#ec4899" />
                        </span>
                        <span>{t('compare_price')}</span>
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
                        </span>
                        <span>{t('compare_rating')}</span>
                      </div>
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <span style={{ color: '#d97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <StarIcon size={11} color="#f59e0b" fill="#f59e0b" />
                          </span>
                          <span>{p.rating || 4.9}</span>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                          ({p.reviewCount || 100}+ đánh giá)
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Brand & Category */}
                  <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', background: 'var(--bg-muted, #f8fafc)', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheckIcon size={13} color="#16a34a" />
                        </span>
                        <span>{t('compare_brand')} / {t('compare_category')}</span>
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(13, 148, 136, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <StoreIcon size={13} color="#0d9488" />
                        </span>
                        <span>Cửa hàng (Shop)</span>
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TruckIcon size={13} color="#0284c7" />
                        </span>
                        <span>{t('compare_stock')}</span>
                      </div>
                    </th>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} style={{ padding: '12px 14px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon size={11} color="#16a34a" />
                          </span>
                          <span>Còn {p.stock || 50} sản phẩm</span>
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TruckIcon size={11} color="#0284c7" />
                          </span>
                          <span>Giao nhanh SPX 24h</span>
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
