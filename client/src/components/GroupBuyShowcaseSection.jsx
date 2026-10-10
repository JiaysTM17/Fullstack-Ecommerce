import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { fetchGroupBuyDealsAPI, joinGroupBuyTeamAPI } from '../services/api';

export default function GroupBuyShowcaseSection() {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [joiningTeam, setJoiningTeam] = useState(null);

  useEffect(() => {
    fetchGroupBuyDealsAPI()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setDeals(res);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoinOrCreateTeam = async (deal, team = null) => {
    try {
      const res = await joinGroupBuyTeamAPI(deal.id, team ? team.teamId : null, "Bạn (Khách hàng)");
      if (res?.data?.team || res?.team) {
        showToast(
          team
            ? `🎉 Đã tham gia nhóm mua chung! Bạn được áp dụng Giá Nhóm: ${formatCurrency(deal.groupPrice)}`
            : `🚀 Đã mở nhóm Mua Chung mới! Chia sẻ liên kết nhóm để nhận Giá Nhóm ${formatCurrency(deal.groupPrice)}`,
          'success'
        );
        // Thêm vào giỏ với giá ưu đãi nhóm
        addToCart({
          _id: deal.id,
          id: deal.id,
          name: `[MUA CHUNG] ${deal.name}`,
          price: deal.groupPrice,
          image: deal.image,
          quantity: 1,
        });
        setSelectedDeal(null);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi tham gia nhóm', 'error');
    }
  };

  if (loading && deals.length === 0) return null;
  if (!loading && deals.length === 0) return null;

  return (
    <section style={{
      margin: '28px 0',
      background: 'linear-gradient(135deg, #fff7ed 0%, #fff1f2 50%, #fdf4ff 100%)',
      borderRadius: '16px',
      border: '1.5px solid #fed7aa',
      padding: '24px 20px',
      boxShadow: '0 4px 20px -2px rgba(249, 115, 22, 0.08)'
    }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '24px',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ea580c, #f43f5e)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)'
          }}>
            👥
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>MUA CHUNG THEO NHÓM - RẺ HƠN ĐẾN 35%</span>
              <span style={{ fontSize: '11px', background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                HOT TREND
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#c2410c', marginTop: '3px' }}>
              Rủ bạn bè hoặc ghép nhóm có sẵn với người mua khác để mở khóa Giá Mua Chung độc quyền!
            </p>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: '#9a3412', fontWeight: 700, background: '#ffedd5', padding: '6px 12px', borderRadius: '20px' }}>
          ⚡ Đảm bảo hoàn tiền 100% nếu không đủ người
        </div>
      </div>

      {/* Grid sản phẩm Mua Chung */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {deals.map((deal) => (
          <div
            key={deal.id}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #fed7aa',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {/* Image & Discount Badge */}
            <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
              <img
                src={deal.image}
                alt={deal.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                GIẢM -{deal.discountPercent}% NHÓM
              </span>

              <span style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                Nhóm {deal.targetMembers} người
              </span>
            </div>

            {/* Content Body */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700, textTransform: 'uppercase' }}>
                  {deal.shopName}
                </div>
                <h4 style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '4px 0 8px',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {deal.name}
                </h4>

                {/* Pricing row */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#dc2626' }}>
                    {formatCurrency(deal.groupPrice)}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatCurrency(deal.regularPrice)}
                  </span>
                </div>

                {/* Active Teams snippet */}
                {deal.activeTeams && deal.activeTeams.length > 0 && (
                  <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '8px', marginBottom: '12px', border: '1px solid #ffedd5' }}>
                    <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: 700, marginBottom: '6px' }}>
                      🔥 Nhóm đang chờ ghép ({deal.activeTeams.length} nhóm):
                    </div>
                    {deal.activeTeams.slice(0, 1).map((team) => (
                      <div key={team.teamId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img
                            src={team.leaderAvatar}
                            alt={team.leaderName}
                            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: '11.5px', color: '#1e293b', fontWeight: 600 }}>
                            {team.leaderName} (còn {team.remainingSlots} chỗ)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinOrCreateTeam(deal, team)}
                          style={{
                            background: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Ghép Ngay
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => addToCart({ ...deal, price: deal.regularPrice })}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                  title="Mua lẻ giá gốc không cần ghép nhóm"
                >
                  Mua Lẻ {formatCurrency(deal.regularPrice)}
                </button>
                <button
                  type="button"
                  onClick={() => handleJoinOrCreateTeam(deal)}
                  style={{
                    background: 'linear-gradient(135deg, #ea580c, #f43f5e)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  👥 Mở Nhóm Mua
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
