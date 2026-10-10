import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchActiveLiveStreamAPI } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  SparklesIcon,
  ShoppingBagIcon,
  CartIcon,
  CloseIcon,
  ChevronRightIcon,
  StarIcon,
  BoltIcon,
} from './OrdersIcons';

export default function LiveStreamFloatingWidget() {
  const [session, setSession] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [likes, setLikes] = useState(24500);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchActiveLiveStreamAPI();
        if (active && data) {
          setSession(data);
          setLikes(data.likeCount || 24500);
          setComments(data.mockChatMessages || []);
        }
      } catch (err) {
        console.warn('Live stream fetch fallback:', err?.message);
      }
    })();
    return () => { active = false; };
  }, []);

  if (isDismissed || !session) return null;

  const pinned = session.pinnedProduct;

  const handleQuickBuy = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    showToast(`Đã thêm ${product.name} vào giỏ hàng với giá deal Livestream!`, 'success');
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (!hasLiked) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
      showToast('Cảm ơn bạn đã thả tim cho buổi Livestream! ❤️', 'info');
    }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const msg = {
      id: `msg_local_${Date.now()}`,
      user: 'Bạn',
      text: newComment.trim(),
      time: 'Vừa xong',
    };
    setComments((prev) => [msg, ...prev]);
    setNewComment('');
  };

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.95); }
        }
      `}</style>

      {/* Floating Minimized Pill / Circle */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          style={{
            position: 'fixed',
            bottom: '95px',
            right: '22px',
            zIndex: 99997,
            cursor: 'pointer',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
            color: '#ffffff',
            padding: '6px 14px 6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.3)',
            animation: 'liveGlow 2.5s infinite ease-in-out',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          title="Bấm để xem Shopee Live đang phát trực tiếp"
        >
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #ffffff',
              flexShrink: 0,
            }}
          >
            <img
              src={session.host?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"}
              alt="Host"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '8px',
                fontWeight: 900,
                textAlign: 'center',
                lineHeight: '11px',
                textTransform: 'uppercase',
              }}
            >
              LIVE
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  animation: 'livePulse 1.2s infinite ease-in-out',
                }}
              />
              <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Shopee Live
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#fecaca', whiteSpace: 'nowrap' }}>
              {session.viewerCount.toLocaleString('vi-VN')} đang xem
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Live Stream Overlay Mini-Player */
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            zIndex: 99999,
            width: '320px',
            maxHeight: '480px',
            borderRadius: '16px',
            background: '#090d16',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(220, 38, 38, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'inherit',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '10px 12px',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#090d16',
                  color: '#ef4444',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                }}
              >
                🔴 LIVE
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fef2f2' }}>
                {session.host?.name || 'Trực Tiếp'}
              </span>
              <span style={{ fontSize: '10px', color: '#fecaca' }}>
                👁️ {session.viewerCount.toLocaleString('vi-VN')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px', fontSize: '12px' }}
                title="Thu nhỏ"
              >
                ⎯
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px', display: 'flex' }}
                title="Đóng"
              >
                <CloseIcon size={14} color="#ffffff" />
              </button>
            </div>
          </div>

          {/* Video Mock Stage / Stream View */}
          <div
            style={{
              position: 'relative',
              height: '140px',
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src={pinned?.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"}
              alt="Live Stage"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#fde047',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BoltIcon size={11} color="#fde047" />
              <span>Voucher: {session.liveVoucher?.code || 'LIVEHOT50'}</span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={handleLike}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: hasLiked ? '#ef4444' : 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'transform 0.15s ease',
                }}
              >
                ❤️
              </button>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#ffffff' }}>
                {likes.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Pinned Showcase Product Deal */}
          {pinned && (
            <div
              style={{
                padding: '10px 12px',
                background: '#111827',
                borderTop: '1px solid #1f2937',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <img
                src={pinned.image}
                alt={pinned.name}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #374151', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '8px', fontWeight: 900, padding: '1px 4px', borderRadius: '3px' }}>
                    ĐANG GHIM
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pinned.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#ef4444' }}>
                    {formatCurrency(pinned.price)}
                  </span>
                  <span style={{ fontSize: '10px', color: '#9ca3af', textDecoration: 'line-through' }}>
                    {formatCurrency(pinned.originalPrice)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleQuickBuy(e, pinned)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CartIcon size={12} color="#ffffff" />
                <span>Mua</span>
              </button>
            </div>
          )}

          {/* Real-time Live Comments Stream */}
          <div
            style={{
              flex: 1,
              padding: '8px 12px',
              overflowY: 'auto',
              maxHeight: '120px',
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: '6px',
              fontSize: '11px',
              background: '#090d16',
            }}
          >
            {comments.slice(0, 10).map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.35 }}>
                <span style={{ fontWeight: 800, color: '#93c5fd', whiteSpace: 'nowrap' }}>
                  {c.user}:
                </span>
                <span style={{ color: '#e5e7eb' }}>{c.text}</span>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleSendComment}
            style={{
              padding: '8px 12px',
              background: '#111827',
              borderTop: '1px solid #1f2937',
              display: 'flex',
              gap: '6px',
            }}
          >
            <input
              type="text"
              placeholder="Bình luận trên livestream..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                flex: 1,
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '5px 10px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              style={{
                background: newComment.trim() ? '#ef4444' : '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
