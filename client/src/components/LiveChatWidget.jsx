import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useCoins } from '../context/CoinContext';
import RewardsHubModal from './RewardsHubModal';
import {
  generateAiChatResponse,
  VOUCHER_KNOWLEDGE,
  MALL_STORES_KNOWLEDGE,
  lookupCustomerOrders,
} from '../services/chatAiEngine';
import { FALLBACK_PRODUCTS } from '../services/productService';
import {
  SparklesIcon,
  Volume2Icon,
  VolumeXIcon,
  MicIcon,
  SendIcon,
  TrashIcon,
  ShoppingBagIcon,
  PackageIcon,
  TicketIcon,
  StoreIcon,
  UserIcon,
  ShieldIcon,
  RefreshIcon,
  CartIcon,
  BoltIcon,
  CheckIcon,
  TruckIcon,
  CoinIcon,
  CalendarIcon,
  ChatIcon,
  CloseIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon,
} from './OrdersIcons';

const CHAT_STORAGE_KEY = 'mini_shopee_live_chat_history_v2';
const SOUND_SETTING_KEY = 'mini_shopee_chat_sound_enabled';

/**
 * Hiệu ứng âm thanh sinh động bằng Web Audio API thuần (không cần tải file ngoài)
 */
function playAudioChime(type = 'message', enabled = true) {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'message') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'cart') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } else if (type === 'voucher') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // ignore
  }
}

/**
 * Biểu tượng Trợ lý Mua Sắm & CSKH AI (Smart Shopping Assistant Bot Icon)
 * Thiết kế chuẩn TMĐT: Robot tư vấn thân thiện đeo tai nghe CSKH và huy hiệu giỏ hàng/túi mua sắm
 */
export function ShoppingBotIcon({ size = 32, glow = false }) {
  const gradId = `shopBotGrad_${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        filter: glow
          ? 'drop-shadow(0 4px 12px rgba(234, 88, 12, 0.5)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.45))'
          : 'none',
        flexShrink: 0,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={`${gradId}_head`} x1="10" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {/* Vòng nền gradient thông minh */}
      <circle cx="22" cy="22" r="20" fill={`url(#${gradId})`} />

      {/* Quai đeo tai nghe CSKH (Headset Band) */}
      <path
        d="M11 20C11 13.9 15.9 9 22 9C28.1 9 33 13.9 33 20"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Ốp tai nghe bên trái */}
      <rect x="9" y="18" width="4" height="8" rx="2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />

      {/* Ốp tai nghe bên phải */}
      <rect x="31" y="18" width="4" height="8" rx="2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />

      {/* Micrô CSKH vươn ra miệng */}
      <path
        d="M33 24C33 28 30 30 25 30"
        stroke="#38bdf8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="24" cy="30" r="1.6" fill="#facc15" />

      {/* Đầu Robot Mua Sắm (Mặt bot) */}
      <rect
        x="13"
        y="13"
        width="18"
        height="15"
        rx="5"
        fill={`url(#${gradId}_head)`}
        stroke="#0f172a"
        strokeWidth="1.2"
      />

      {/* Màn hình hiển thị mắt bot (Visor) */}
      <rect x="15" y="16" width="14" height="6.5" rx="3" fill="#0f172a" />

      {/* Cặp mắt phát sáng thân thiện (Curved Happy Eyes) */}
      <path d="M17 19.2C17.6 18.2 19 18.2 19.6 19.2" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24.4 19.2C25 18.2 26.4 18.2 27 19.2" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Nụ cười vui vẻ */}
      <path d="M19.5 24.5C20.5 25.5 23.5 25.5 24.5 24.5" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" />

      {/* Huy hiệu Giỏ Hàng Mua Sắm (Shopping Cart Badge) ở góc dưới */}
      <g transform="translate(14, 30)">
        <rect x="0" y="0" width="16" height="11" rx="3" fill="#ffffff" stroke="#ea580c" strokeWidth="1.2" />
        {/* Biểu tượng xe đẩy / túi hàng mini */}
        <path d="M3 3H5L6.5 8H13L14 4H5.5" stroke="#ea580c" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7.5" cy="9.5" r="0.8" fill="#ea580c" />
        <circle cx="12" cy="9.5" r="0.8" fill="#ea580c" />
      </g>
    </svg>
  );
}

// Giữ BotIcon tương thích ngược nếu component khác tham chiếu
export const BotIcon = ShoppingBotIcon;

// Thông tin Nhân viên hỗ trợ trực tuyến (Human Agent Handover)
const HUMAN_AGENT = {
  name: 'Kim Ngân',
  title: 'Chuyên Viên CSKH Hạng Nhất',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
  id: 'CSKH-8821',
  role: 'Human Support Specialist',
  status: 'Trực tuyến • Sẵn sàng hỗ trợ 24/7',
};

const DEFAULT_WELCOME_MESSAGES = [
  {
    id: 'msg_welcome_1',
    sender: 'agent',
    agentName: 'Trợ Lý Mua Sắm & CSKH AI 24/7',
    avatar: null,
    text: 'Xin chào! Tôi là Trợ Lý Mua Sắm & CSKH AI.\n\nTôi hỗ trợ bạn tìm nhanh 100+ sản phẩm theo tầm giá, áp mã giảm giá kép (Dual Voucher), kiểm tra vận đơn SPX Express, nhận lượt quay may mắn và kết nối Chuyên viên tư vấn trực tiếp bất cứ lúc nào!',
    time: 'Vừa xong',
    suggestions: [
      'Gợi ý đồ công nghệ hot',
      'Tra cứu đơn hàng của tôi',
      'Lấy voucher 15% & Freeship',
      'Vòng quay & Shopee Xu',
      'Gặp nhân viên tư vấn trực',
    ],
  },
];

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(SOUND_SETTING_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [targetShop, setTargetShop] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [agentRating, setAgentRating] = useState(null);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  // Chế độ hội thoại: 'ai' | 'handover_connecting' | 'human'
  const [chatMode, setChatMode] = useState('ai');

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WELCOME_MESSAGES;
    } catch {
      return DEFAULT_WELCOME_MESSAGES;
    }
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { addToCart, applyVoucher } = useCart();
  const { showToast } = useToast();

  const coinCtx = useCoins() || {};
  const {
    coins = 0,
    totalSpins = 0,
    dailySpinsRemaining = 0,
    orderSpins = 0,
    checkInToday,
  } = coinCtx;

  // Cuộn mượt xuống cuối danh sách tin nhắn
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping, chatMode]);

  // Lưu lịch sử hội thoại
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Lưu cài đặt âm thanh
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_SETTING_KEY, JSON.stringify(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Lắng nghe sự kiện mở chat từ trang chi tiết shop
  useEffect(() => {
    const handleOpenChat = (event) => {
      const detail = event.detail;
      if (detail && detail.shopName) {
        setTargetShop({
          name: detail.shopName,
          id: detail.shopId,
          avatar: detail.shopAvatar,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `msg_shop_${Date.now()}`,
            sender: 'agent',
            agentName: detail.shopName,
            avatar: detail.shopAvatar || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100',
            text: `Dạ chào bạn! Đây là kênh chat chính thức của gian hàng ${detail.shopName}. Gian hàng sẵn sàng tư vấn mẫu mã, kiểm tra còn hàng và gửi tặng ưu đãi cho bạn ạ!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Xem sản phẩm của shop', 'Shop có mã giảm giá không?', 'Thời gian giao hàng'],
          },
        ]);
      }
      setIsOpen(true);
    };

    window.addEventListener('open_live_chat', handleOpenChat);
    return () => window.removeEventListener('open_live_chat', handleOpenChat);
  }, []);

  // Xử lý sao chép voucher
  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      playAudioChime('voucher', soundEnabled);
      showToast(`Đã sao chép mã "${code}" vào bộ nhớ tạm!`, 'success');
      setTimeout(() => setCopiedCode(null), 2500);
    });
  };

  // Áp dụng voucher thẳng vào hệ thống giỏ hàng
  const handleApplyVoucherToCart = async (voucher) => {
    try {
      const code = typeof voucher === 'string' ? voucher : voucher.code;
      if (applyVoucher) {
        const res = await applyVoucher(code);
        playAudioChime('voucher', soundEnabled);
        if (res && res.success) {
          showToast(`Đã áp dụng mã "${code}" thành công vào đơn hàng!`, 'success');
          return;
        } else if (res && res.message) {
          showToast(res.message, 'info');
          return;
        }
      }
      playAudioChime('voucher', soundEnabled);
      showToast(`Đã lưu mã "${code}" vào giỏ hàng!`, 'success');
    } catch {
      handleCopyVoucher(voucher.code || voucher);
    }
  };

  // Thêm trực tiếp sản phẩm vào giỏ hàng
  const handleDirectAddToCart = (product) => {
    if (!product) return;
    addToCart(product, 1);
    playAudioChime('cart', soundEnabled);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`, 'success');
  };

  // Mua ngay trực tiếp: thêm vào giỏ và chuyển đến trang thanh toán
  const handleDirectBuyNow = (product) => {
    if (!product) return;
    addToCart(product, 1);
    playAudioChime('cart', soundEnabled);
    showToast(`Đang chuyển bạn đến đơn hàng với "${product.name}"...`, 'success');
    setIsOpen(false);
    navigate('/checkout');
  };

  // Điểm danh nhận Shopee Xu
  const handleQuickCheckIn = () => {
    if (typeof checkInToday === 'function') {
      const res = checkInToday();
      playAudioChime('voucher', soundEnabled);
      if (res && res.success) {
        showToast(res.message || 'Điểm danh thành công! Đã cộng Shopee Xu.', 'success');
      } else {
        showToast(res?.message || 'Bạn đã điểm danh hôm nay rồi!', 'info');
      }
    } else {
      showToast('Đã nhận xu thưởng điểm danh hôm nay!', 'success');
    }
  };

  // Nhận diện giọng nói tiếng Việt bằng Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech.', 'info');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Đang lắng nghe giọng nói của bạn...', 'info');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Chuyển giao sang Chuyên viên trực (Handover Protocol)
  const handleTriggerHandover = () => {
    setIsTyping(false);
    setChatMode('handover_connecting');

    const sysMsg = {
      id: `msg_sys_${Date.now()}`,
      sender: 'system',
      text: '[HỆ THỐNG] Đang chuyển giao cuộc trò chuyện sang Chuyên Viên CSKH Kim Ngân (#CSKH-8821)... Lịch sử trao đổi đã được đồng bộ.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, sysMsg]);

    setTimeout(() => {
      setChatMode('human');
      playAudioChime('message', soundEnabled);
      const humanWelcome = {
        id: `msg_human_${Date.now()}`,
        sender: 'human_agent',
        agentName: `${HUMAN_AGENT.name} (${HUMAN_AGENT.title})`,
        avatar: HUMAN_AGENT.avatar,
        text: `Dạ em là Kim Ngân - Chuyên viên CSKH trực tuyến của sàn Fullstack E-Commerce. Em đã tiếp nhận yêu cầu của mình. Em có thể trực tiếp hỗ trợ vấn đề gì cho anh/chị ngay bây giờ ạ?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Kiểm tra tiến độ đơn hàng gấp',
          'Yêu cầu hoàn tiền / đổi trả',
          'Tư vấn chính sách bảo hành',
          'Quay lại Trợ lý AI',
        ],
      };
      setMessages((prev) => [...prev, humanWelcome]);
    }, 1000);
  };

  // Quay lại Trợ lý AI
  const handleSwitchBackToAI = () => {
    setChatMode('ai');
    playAudioChime('message', soundEnabled);
    const returnMsg = {
      id: `msg_sys_${Date.now()}`,
      sender: 'system',
      text: '[HỆ THỐNG] Đã kết thúc phiên hỗ trợ nhân viên trực. Quyền hỗ trợ đã được chuyển lại cho Trợ Lý AI 24/7.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, returnMsg]);
  };

  // Gửi tin nhắn và xử lý qua chatAiEngine.js
  const handleSendMessage = (textToSend) => {
    const content = (textToSend || inputMessage).trim();
    if (!content) return;

    const userMsg = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const lower = content.toLowerCase();

    // 1. Nếu đang ở chế độ NHÂN VIÊN TRỰC (HUMAN AGENT MODE)
    if (chatMode === 'human') {
      setTimeout(() => {
        if (/quay lại ai|về ai|bot|trợ lý|tự động/i.test(lower)) {
          setIsTyping(false);
          handleSwitchBackToAI();
          return;
        }

        const engineRes = generateAiChatResponse(content, {
          chatMode: 'human',
          userCoins: coins,
          totalSpins,
          dailySpinsRemaining,
          orderSpins,
          targetShop,
        });

        playAudioChime('message', soundEnabled);
        const agentMsg = {
          id: `msg_human_${Date.now()}`,
          sender: 'human_agent',
          agentName: `Chuyên viên ${HUMAN_AGENT.name}`,
          avatar: HUMAN_AGENT.avatar,
          text: engineRes.replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: engineRes.suggestions || [
            'Kiểm tra đơn hàng',
            'Yêu cầu hoàn tiền',
            'Bảo hành chính hãng',
            'Quay lại Trợ lý AI',
          ],
          vouchers: engineRes.vouchers || null,
          showRatingPrompt: true,
        };

        setMessages((prev) => [...prev, agentMsg]);
        setIsTyping(false);
      }, 850);
      return;
    }

    // 2. Nếu người dùng yêu cầu gặp nhân viên trực
    if (
      /gặp nhân viên|nhân viên|tư vấn viên|người trực|human|người thật|kết nối cskh|gọi cskh/i.test(
        lower
      )
    ) {
      setTimeout(() => {
        handleTriggerHandover();
      }, 450);
      return;
    }

    // 3. Xử lý phản hồi chuyên sâu qua AI Engine
    setTimeout(() => {
      const engineRes = generateAiChatResponse(content, {
        chatMode: 'ai',
        userCoins: coins,
        totalSpins,
        dailySpinsRemaining,
        orderSpins,
        targetShop,
      });

      playAudioChime('message', soundEnabled);
      const agentMsg = {
        id: `msg_agent_${Date.now()}`,
        sender: 'agent',
        agentName: targetShop ? targetShop.name : 'Trợ Lý Mua Sắm AI',
        avatar: targetShop?.avatar || null,
        text: engineRes.replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: engineRes.products || null,
        vouchers: engineRes.vouchers || null,
        orders: engineRes.orders || null,
        rewardsInfo: engineRes.rewardsInfo || null,
        stores: engineRes.stores || null,
        suggestions: engineRes.suggestions || [],
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện này?')) {
      setMessages(DEFAULT_WELCOME_MESSAGES);
      setChatMode('ai');
      setAgentRating(null);
      localStorage.removeItem(CHAT_STORAGE_KEY);
      showToast('Đã làm mới cuộc hội thoại!', 'info');
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatPopUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes botGlow {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(234, 88, 12, 0.45), 0 0 16px rgba(56, 189, 248, 0.35);
          }
          50% {
            box-shadow: 0 10px 30px rgba(234, 88, 12, 0.7), 0 0 24px rgba(56, 189, 248, 0.6);
          }
        }
        @keyframes soundWave {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @media (max-width: 768px) {
          .live-chat-floating-btn {
            bottom: 76px !important;
            right: 14px !important;
            width: 48px !important;
            height: 48px !important;
          }
          .live-chat-window-box {
            bottom: 8px !important;
            right: 8px !important;
            left: 8px !important;
            width: auto !important;
            max-width: calc(100vw - 16px) !important;
            height: calc(100vh - 80px) !important;
            max-height: 90vh !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      {/* Nút bấm Floating Trigger mở Chatbot: Biểu tượng Trợ lý Mua sắm Robot CSKH */}
      {!isOpen && (
        <button
          type="button"
          className="live-chat-floating-btn"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '22px',
            right: '22px',
            zIndex: 99998,
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #ea580c 100%)',
            color: '#fff',
            border: '2px solid rgba(254, 215, 170, 0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s',
            animation: 'botGlow 3s infinite ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(3deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
          title="Trợ Lý Mua Sắm & CSKH AI 24/7"
          aria-label="Mở Trợ lý Mua Sắm & CSKH"
        >
          <ShoppingBotIcon size={36} glow />
          <span
            style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #090d16',
              boxShadow: '0 0 8px #22c55e',
            }}
          />
        </button>
      )}

      {/* Cửa sổ Chatbot: Kích thước vừa vặn (385px x 500px), không tròng lên thanh Header */}
      {isOpen && (
        <div
          className="anim-chat-box live-chat-window-box"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100000,
            width: isExpanded ? 'min(720px, calc(100vw - 28px))' : '385px',
            maxWidth: 'calc(100vw - 24px)',
            height: isExpanded
              ? 'min(620px, calc(100vh - 120px))'
              : 'min(500px, calc(100vh - 160px))',
            maxHeight: 'calc(100vh - 140px)',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '20px',
            boxShadow:
              '0 18px 45px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(234, 88, 12, 0.2)',
            border: '1px solid var(--border-medium, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
            animation: 'chatPopUp 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Header Cửa Sổ Chat: Gọn gàng, tinh tế, không chiếm diện tích */}
          <div
            style={{
              padding: '10px 14px',
              background:
                chatMode === 'human'
                  ? 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              transition: 'background 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                {chatMode === 'human' ? (
                  <img
                    src={HUMAN_AGENT.avatar}
                    alt={HUMAN_AGENT.name}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #34d399',
                      boxShadow: '0 0 8px rgba(52, 211, 153, 0.5)',
                    }}
                  />
                ) : targetShop?.avatar ? (
                  <img
                    src={targetShop.avatar}
                    alt={targetShop.name}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255,255,255,0.6)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#090d16',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #ea580c',
                      boxShadow: '0 0 10px rgba(234, 88, 12, 0.4)',
                    }}
                  >
                    <ShoppingBotIcon size={26} glow />
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '1.5px solid #090d16',
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '13px',
                    lineHeight: '1.2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>
                    {chatMode === 'human'
                      ? `${HUMAN_AGENT.name}`
                      : targetShop
                      ? targetShop.name
                      : 'Trợ Lý Mua Sắm AI'}
                  </span>
                  <span
                    style={{
                      background:
                        chatMode === 'human'
                          ? '#10b981'
                          : 'linear-gradient(135deg, #ea580c, #f97316)',
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '5px',
                      fontWeight: 800,
                      letterSpacing: '0.2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {chatMode === 'human' ? 'CSKH' : 'AI 2.0'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  {chatMode === 'human'
                    ? 'Chuyên viên đang hỗ trợ trực tiếp'
                    : 'Trực tuyến 24/7'}
                </div>
              </div>
            </div>

            {/* Thanh công cụ Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Nút chuyển đổi Human / AI */}
              {chatMode === 'ai' ? (
                <button
                  type="button"
                  onClick={handleTriggerHandover}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 7px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 2px 5px rgba(16, 185, 129, 0.4)',
                  }}
                  title="Chuyển sang Chuyên viên tư vấn trực tiếp"
                >
                  <span><UserIcon size={12} color="#ffffff" /></span>
                  <span style={{ display: isExpanded ? 'inline' : 'none' }}>Gặp CSKH</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSwitchBackToAI}
                  style={{
                    background: 'linear-gradient(135deg, #ea580c, #f97316)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 7px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 2px 5px rgba(234, 88, 12, 0.4)',
                  }}
                  title="Quay lại Trợ lý AI"
                >
                  <span><SparklesIcon size={12} color="#ffffff" /></span>
                  <span style={{ display: isExpanded ? 'inline' : 'none' }}>Về AI</span>
                </button>
              )}

              {/* Bật / tắt âm thanh thông báo */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !soundEnabled;
                  setSoundEnabled(nextVal);
                  showToast(
                    nextVal ? 'Đã bật âm thanh' : 'Đã tắt âm thanh',
                    'info'
                  );
                }}
                style={{
                  background: soundEnabled ? 'rgba(255,255,255,0.15)' : 'rgba(239, 68, 68, 0.25)',
                  border: 'none',
                  color: soundEnabled ? '#cbd5e1' : '#fca5a5',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                {soundEnabled ? <Volume2Icon size={13} color="#38bdf8" /> : <VolumeXIcon size={13} color="#f87171" />}
              </button>

              {/* Phóng to / Thu nhỏ kích thước chat */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '11px',
                  borderRadius: '5px',
                }}
                title={isExpanded ? 'Thu nhỏ khung chat' : 'Phóng to khung chat'}
              >
                {isExpanded ? '⤡' : '⤢'}
              </button>

              {/* Xóa lịch sử chat */}
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Làm mới lịch sử chat"
              >
                <TrashIcon size={12} color="#cbd5e1" />
              </button>

              {/* Thu nhỏ / Đóng */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                title="Thu nhỏ"
              >
                —
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#ea580c',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Đóng chat"
              >
                <CloseIcon size={14} color="#64748b" />
              </button>
            </div>
          </div>

          {/* Banner Trạng Thái Chuyển Giao Handover */}
          {chatMode === 'human' && (
            <div
              style={{
                padding: '5px 12px',
                background:
                  'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(14, 165, 233, 0.12))',
                borderBottom: '1px solid rgba(34, 197, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                  }}
                />
                Phiên trực: <strong>#CSKH-8821 (Kim Ngân)</strong>
              </span>
              <button
                type="button"
                onClick={handleSwitchBackToAI}
                style={{
                  background: 'transparent',
                  border: '1px solid #16a34a',
                  color: '#16a34a',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '9.5px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Về Trợ lý AI
              </button>
            </div>
          )}

          {chatMode === 'handover_connecting' && (
            <div
              style={{
                padding: '6px 12px',
                background:
                  'linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(6, 182, 212, 0.12))',
                borderBottom: '1px solid rgba(234, 88, 12, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#ea580c',
                fontWeight: 600,
              }}
            >
              <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-flex', alignItems: 'center' }}>
                <ClockIcon size={12} color="#ea580c" />
              </span>
              Đang điều phối Chuyên viên CSKH trực tuyến...
            </div>
          )}

          {/* Quick Intent Pills: Chủ đề truy cập nhanh */}
          <div
            className="mega-menu-scroll-hide"
            style={{
              padding: '6px 10px',
              background: 'var(--bg-muted, #f8fafc)',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              gap: '5px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {chatMode === 'human' ? (
              [
                { label: 'Tiến độ đơn hàng', text: 'Nhờ em kiểm tra tiến độ đơn hàng gần nhất của anh/chị', icon: <PackageIcon size={12} color="#0284c7" /> },
                { label: 'Đổi trả / Hoàn tiền', text: 'Anh/chị cần hỗ trợ hoàn tiền hoặc đổi sản phẩm', icon: <RefreshIcon size={12} color="#9333ea" /> },
                { label: 'Bảo hành chính hãng', text: 'Chính sách bảo hành sản phẩm thực hiện thế nào em?', icon: <ShieldIcon size={12} color="#16a34a" /> },
                { label: 'Về Trợ lý AI', text: 'Quay lại Trợ lý AI', icon: <SparklesIcon size={12} color="#8b5cf6" /> },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.text)}
                  style={{
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid #10b981',
                    color: '#065f46',
                    padding: '2.5px 8px',
                    borderRadius: '10px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {chip.icon}
                  <span>{chip.label}</span>
                </button>
              ))
            ) : (
              [
                { label: 'Tư Vấn AI', text: 'Bạn có thể giúp gì cho tôi?', icon: <SparklesIcon size={12} color="#8b5cf6" /> },
                { label: 'Gợi Ý Hot', text: 'Gợi ý sản phẩm bán chạy nhất hiện nay', icon: <ShoppingBagIcon size={12} color="#ea580c" /> },
                { label: 'Tra Cứu Đơn', text: 'Kiểm tra đơn hàng của tôi', icon: <PackageIcon size={12} color="#0284c7" /> },
                { label: 'Săn Voucher', text: 'Cho tôi xin mã giảm giá và freeship', icon: <TicketIcon size={12} color="#ea580c" /> },
                { label: 'Vòng Quay & Xu', text: 'Vòng quay may mắn và xu thưởng', icon: <CoinIcon size={12} color="#f59e0b" /> },
                { label: '12 Mall Shop', text: 'Khám phá các gian hàng chính hãng', icon: <StoreIcon size={12} color="#dc2626" /> },
                { label: 'Gặp CSKH', text: 'Cho tôi gặp nhân viên trực CSKH', icon: <UserIcon size={12} color="#059669" /> },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.text)}
                  style={{
                    background:
                      idx === 6
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))'
                        : 'var(--bg-card, #ffffff)',
                    border:
                      idx === 6
                        ? '1px solid #10b981'
                        : '1px solid var(--border-medium, #cbd5e1)',
                    color: idx === 6 ? '#059669' : 'var(--text-primary, #0f172a)',
                    padding: '2.5px 8px',
                    borderRadius: '10px',
                    fontSize: '10.5px',
                    fontWeight: idx === 6 ? 700 : 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {chip.icon}
                  <span>{chip.label}</span>
                </button>
              ))
            )}
          </div>

          {/* Danh Sách Tin Nhắn Đa Phương Tiện */}
          <div
            style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-page, #f8fafc)',
            }}
          >
            {messages.map((m) => {
              // Tin nhắn hệ thống (System Notification)
              if (m.sender === 'system') {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'center',
                      margin: '4px 0',
                      padding: '6px 12px',
                      background:
                        'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(6, 182, 212, 0.08))',
                      border: '1px dashed rgba(234, 88, 12, 0.35)',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: 'var(--text-secondary, #475569)',
                      textAlign: 'center',
                      maxWidth: '94%',
                      lineHeight: '1.4',
                    }}
                  >
                    {m.text}
                  </div>
                );
              }

              const isUser = m.sender === 'user';
              const isHuman = m.sender === 'human_agent';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '7px',
                  }}
                >
                  {!isUser &&
                    (isHuman ? (
                      <img
                        src={HUMAN_AGENT.avatar}
                        alt="Kim Ngan"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          marginTop: '2px',
                          border: '1.5px solid #10b981',
                        }}
                      />
                    ) : m.avatar ? (
                      <img
                        src={m.avatar}
                        alt="Agent"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#090d16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #ea580c',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <ShoppingBotIcon size={20} color="#ea580c" />
                      </div>
                    ))}

                  <div style={{ maxWidth: isExpanded ? '90%' : '86%', width: '100%' }}>
                    {!isUser && m.agentName && (
                      <div
                        style={{
                          fontSize: '10.5px',
                          color: isHuman ? '#059669' : 'var(--text-muted, #64748b)',
                          marginBottom: '2px',
                          marginLeft: '3px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{m.agentName}</span>
                        {isHuman && (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#059669',
                              fontSize: '8.5px',
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                          >
                            Human
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isUser
                          ? 'var(--primary-color, #ea580c)'
                          : 'var(--bg-card, #ffffff)',
                        color: isUser ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '12.5px',
                        lineHeight: '1.45',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))',
                        border: isUser
                          ? 'none'
                          : isHuman
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid var(--border-medium, #e2e8f0)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {m.text}

                      {/* Card Sản Phẩm Gợi Ý Thông Minh: Tích hợp Thêm vào giỏ & Mua ngay */}
                      {m.products && m.products.length > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'grid',
                            gridTemplateColumns:
                              isExpanded && m.products.length > 1
                                ? 'repeat(auto-fill, minmax(260px, 1fr))'
                                : '1fr',
                            gap: '7px',
                          }}
                        >
                          {m.products.map((prod) => (
                            <div
                              key={prod.id || prod._id}
                              style={{
                                display: 'flex',
                                gap: '8px',
                                background: 'var(--bg-muted, #f1f5f9)',
                                border: '1px solid var(--border-medium, #cbd5e1)',
                                borderRadius: '8px',
                                padding: '7px',
                                alignItems: 'center',
                              }}
                            >
                              <img
                                src={prod.image}
                                alt={prod.name}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {prod.name}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    marginTop: '2px',
                                  }}
                                >
                                  <span
                                    style={{
                                      color: '#ea580c',
                                      fontWeight: 800,
                                      fontSize: '12px',
                                    }}
                                  >
                                    {(prod.price || 0).toLocaleString('vi-VN')}₫
                                  </span>
                                  {prod.originalPrice > prod.price && (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        textDecoration: 'line-through',
                                        color: 'var(--text-muted, #94a3b8)',
                                      }}
                                    >
                                      {prod.originalPrice.toLocaleString('vi-VN')}₫
                                    </span>
                                  )}
                                  {prod.rating && (
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        color: '#f59e0b',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                    >
                                      <StarIcon size={11} fill="#f59e0b" color="#f59e0b" />
                                      <span>{prod.rating}</span>
                                    </span>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '4px',
                                    marginTop: '5px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleDirectAddToCart(prod)}
                                    style={{
                                      background: 'linear-gradient(135deg, #ea580c, #f97316)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '5px',
                                      padding: '3px 7px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                    title="Thêm vào giỏ hàng"
                                  >
                                    <CartIcon size={11} color="#ea580c" />
                                    <span>Thêm giỏ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectBuyNow(prod)}
                                    style={{
                                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '5px',
                                      padding: '3px 7px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                    title="Mua ngay lập tức và chuyển đến thanh toán"
                                  >
                                    <BoltIcon size={11} color="#ffffff" />
                                    <span>Mua ngay</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigate(`/products/${prod.id || prod._id}`);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      color: 'var(--primary-color, #4f46e5)',
                                      border: '1px solid rgba(79, 70, 229, 0.35)',
                                      borderRadius: '5px',
                                      padding: '3px 6px',
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      <span>Chi tiết</span>
                                      <ChevronRightIcon size={10} color="var(--primary-color, #4f46e5)" />
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card Voucher Khuyến Mãi: Áp Dụng Ngay & Sao Chép */}
                      {m.vouchers && m.vouchers.length > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '7px',
                          }}
                        >
                          {m.vouchers.map((vc) => (
                            <div
                              key={vc.code}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background:
                                  'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(245, 158, 11, 0.08))',
                                border: '1px dashed #ea580c',
                                borderRadius: '8px',
                                padding: '7px 9px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <strong style={{ fontSize: '12px', color: '#ea580c' }}>
                                    {vc.code}
                                  </strong>
                                  <span
                                    style={{
                                      background: '#ea580c',
                                      color: '#fff',
                                      fontSize: '9px',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {vc.discount}
                                  </span>
                                  {vc.badge && (
                                    <span
                                      style={{
                                        background: 'rgba(234, 88, 12, 0.15)',
                                        color: '#ea580c',
                                        fontSize: '8.5px',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {vc.badge}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted, #64748b)',
                                    marginTop: '2px',
                                  }}
                                >
                                  {vc.desc}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleApplyVoucherToCart(vc)}
                                  style={{
                                    background: '#ea580c',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '4px 7px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title="Áp dụng mã này trực tiếp vào giỏ hàng"
                                >
                                  <BoltIcon size={11} color="#ea580c" />
                                  <span>Dùng ngay</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyVoucher(vc.code)}
                                  style={{
                                    background:
                                      copiedCode === vc.code
                                        ? '#22c55e'
                                        : 'var(--bg-muted, #e2e8f0)',
                                    color:
                                      copiedCode === vc.code
                                        ? '#ffffff'
                                        : 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '4px 7px',
                                    fontSize: '10.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                  }}
                                >
                                  {copiedCode === vc.code ? <CheckIcon size={12} color="#ffffff" /> : 'Copy'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card Tra Cứu Đơn Hàng & Tiến Độ SPX Express */}
                      {m.orders && m.orders.length > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '7px',
                          }}
                        >
                          {m.orders.map((ord, idx) => (
                            <div
                              key={ord.id || ord._id || idx}
                              style={{
                                background: 'var(--bg-muted, #f1f5f9)',
                                border: '1px solid var(--border-medium, #cbd5e1)',
                                borderRadius: '8px',
                                padding: '8px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    color: '#ea580c',
                                  }}
                                >
                                  #{ord.id || ord._id || `ORD-${Date.now().toString().slice(-6)}`}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    color: '#16a34a',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                  }}
                                >
                                  {ord.status || 'Đang giao hàng (SPX Express)'}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  marginTop: '3px',
                                  color: 'var(--text-muted, #64748b)',
                                }}
                              >
                                Tổng tiền:{' '}
                                <strong style={{ color: '#ea580c' }}>
                                  {(ord.totalAmount || ord.total || 0).toLocaleString('vi-VN')}₫
                                </strong>
                              </div>

                              {/* Thanh Tiến Trình Vận Chuyển */}
                              <div
                                style={{
                                  marginTop: '6px',
                                  padding: '5px 7px',
                                  background: 'var(--bg-card, #ffffff)',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '10px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    color: '#16a34a',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><CheckIcon size={11} color="#16a34a" /> Đặt hàng</span>
                                  <ChevronRightIcon size={11} color="#94a3b8" />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><CheckIcon size={11} color="#16a34a" /> Đóng gói</span>
                                  <ChevronRightIcon size={11} color="#94a3b8" />
                                  <span style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}><TruckIcon size={12} color="#0284c7" /> Đang giao</span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '9.5px',
                                    color: '#64748b',
                                    marginTop: '3px',
                                  }}
                                >
                                  Dự kiến: <strong>Hôm nay (trước 18:00)</strong> qua SPX Now
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            style={{
                              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              marginTop: '2px',
                            }}
                          >
                            <PackageIcon size={13} color="#ffffff" />
                            <span>Xem toàn bộ lịch sử đơn mua</span>
                          </button>
                        </div>
                      )}

                      {/* Card Vòng Quay & Mini Xu Khuyến Mãi */}
                      {m.rewardsInfo && (
                        <div
                          style={{
                            marginTop: '8px',
                            background:
                              'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(245, 158, 11, 0.18))',
                            border: '1px solid rgba(234, 179, 8, 0.4)',
                            borderRadius: '10px',
                            padding: '10px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', color: '#d97706' }}>
                                <CoinIcon size={20} color="#f59e0b" />
                              </span>
                              <div>
                                <div style={{ fontSize: '10.5px', color: '#b45309', fontWeight: 600 }}>
                                  Mini Xu khả dụng:
                                </div>
                                <div
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: '#d97706',
                                  }}
                                >
                                  {coins.toLocaleString('vi-VN')} Xu
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '9.5px', color: '#b45309' }}>
                                Lượt quay:
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  color: '#059669',
                                }}
                              >
                                {totalSpins} lượt
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: '5px',
                              marginTop: '8px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setShowRewardsModal(true)}
                              style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #d97706, #b45309)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.35)',
                              }}
                            >
                              <SparklesIcon size={12} color="#ffffff" />
                              <span>Mở Vòng Quay May Mắn</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleQuickCheckIn}
                              style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #d97706',
                                color: '#b45309',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Điểm danh nhận xu 7 ngày liên tiếp"
                            >
                              <CalendarIcon size={11} color="#2563eb" />
                              <span>Điểm danh</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card Gian Hàng Shopee Mall Chính Hãng */}
                      {m.stores && m.stores.length > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'grid',
                            gridTemplateColumns:
                              isExpanded && m.stores.length > 1
                                ? 'repeat(auto-fill, minmax(220px, 1fr))'
                                : '1fr',
                            gap: '7px',
                          }}
                        >
                          {m.stores.map((st) => (
                            <div
                              key={st.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg-muted, #f1f5f9)',
                                border: '1px solid var(--border-medium, #cbd5e1)',
                                borderRadius: '8px',
                                padding: '6px 8px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <strong style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>
                                    {st.name}
                                  </strong>
                                  <span
                                    style={{
                                      background: '#dc2626',
                                      color: '#fff',
                                      fontSize: '8.5px',
                                      padding: '1px 3px',
                                      borderRadius: '3px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    MALL
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted, #64748b)',
                                    marginTop: '2px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <span>{st.category} •</span>
                                  <StarIcon size={10} fill="#f59e0b" color="#f59e0b" />
                                  <span>{st.rating}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/shop/${st.id}`);
                                  setIsOpen(false);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '5px',
                                  padding: '3px 7px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                  <span>Xem Shop</span>
                                  <ChevronRightIcon size={10} color="#ea580c" />
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Đánh giá chất lượng hỗ trợ của Chuyên viên Kim Ngân */}
                      {isHuman && m.showRatingPrompt && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '7px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderRadius: '7px',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          <div style={{ fontSize: '10.5px', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {agentRating ? (
                              <>
                                <span>Cảm ơn bạn đã đánh giá {agentRating}</span>
                                <StarIcon size={12} fill="#f59e0b" color="#f59e0b" />
                                <span>cho Kim Ngân!</span>
                              </>
                            ) : (
                              'Đánh giá chất lượng hỗ trợ của Kim Ngân:'
                            )}
                          </div>
                          {!agentRating && (
                            <div style={{ display: 'flex', gap: '5px', marginTop: '3px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setAgentRating(star);
                                    playAudioChime('voucher', soundEnabled);
                                    showToast(
                                      `Cảm ơn bạn đã đánh giá ${star} sao cho Chuyên viên Kim Ngân!`,
                                      'success'
                                    );
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                  }}
                                  title={`${star} sao`}
                                >
                                  <StarIcon size={16} fill="#f59e0b" color="#f59e0b" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Suggestion Chips phụ dưới tin nhắn */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '3px',
                          marginTop: '5px',
                          marginLeft: '3px',
                        }}
                      >
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSendMessage(sug)}
                            style={{
                              background: 'transparent',
                              border: isHuman
                                ? '1px solid rgba(16, 185, 129, 0.4)'
                                : '1px solid rgba(234, 88, 12, 0.35)',
                              color: isHuman ? '#059669' : '#ea580c',
                              padding: '2px 7px',
                              borderRadius: '9px',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ChatIcon size={10} color="#2563eb" />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '9.5px',
                        color: 'var(--text-muted, #94a3b8)',
                        marginTop: '2px',
                        textAlign: isUser ? 'right' : 'left',
                        padding: '0 3px',
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    padding: '7px 12px',
                    borderRadius: '14px 14px 14px 4px',
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    fontSize: '11.5px',
                    color: 'var(--text-muted, #64748b)',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {chatMode === 'human' ? (
                    <>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      Chuyên viên Kim Ngân đang soạn phản hồi...
                    </>
                  ) : (
                    <>
                      <span style={{ display: 'inline-flex', alignItems: 'center', animation: 'spin 1.5s linear infinite', color: '#ea580c' }}>
                        <SparklesIcon size={13} color="#ea580c" />
                      </span>
                      Trợ lý Mua Sắm đang tìm giải pháp tối ưu...
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Nhập Tin Nhắn: Hỗ trợ Giọng Nói (Voice) & Gửi */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-card, #ffffff)',
              borderTop: '1px solid var(--border-medium, #e2e8f0)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              className="shopee-form-input"
              placeholder={
                isListening
                  ? 'Đang lắng nghe giọng nói của bạn...'
                  : chatMode === 'human'
                  ? 'Nhắn tin trực tiếp với Kim Ngân...'
                  : 'Hỏi sản phẩm, tra đơn, xin voucher, quay thưởng...'
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12.5px',
                borderRadius: '9999px',
                background: isListening ? '#fef2f2' : 'var(--bg-page, #f8fafc)',
                border: isListening
                  ? '1.5px solid #ef4444'
                  : '1px solid var(--border-medium, #cbd5e1)',
                transition: 'all 0.2s',
              }}
            />

            {/* Nút Voice Input bằng giọng nói */}
            <button
              type="button"
              onClick={handleToggleVoice}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isListening ? '#ef4444' : 'var(--bg-muted, #f1f5f9)',
                color: isListening ? '#ffffff' : 'var(--text-primary)',
                border: isListening ? 'none' : '1px solid var(--border-medium, #cbd5e1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.7)' : 'none',
                animation: isListening ? 'soundWave 1.2s infinite' : 'none',
              }}
              title={isListening ? 'Dừng lắng nghe' : 'Nói bằng giọng nói'}
            >
              <MicIcon size={16} color={isListening ? "#ef4444" : "#64748b"} />
            </button>

            {/* Nút Gửi Tin Nhắn */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: inputMessage.trim()
                  ? chatMode === 'human'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ea580c, #f97316)'
                  : 'var(--bg-muted, #cbd5e1)',
                color: '#ffffff',
                border: 'none',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: inputMessage.trim()
                  ? chatMode === 'human'
                    ? '0 2px 6px rgba(16, 185, 129, 0.4)'
                    : '0 2px 6px rgba(234, 88, 12, 0.4)'
                  : 'none',
              }}
              title="Gửi tin nhắn"
            >
              <SendIcon size={15} color="#ffffff" />
            </button>
          </form>
        </div>
      )}

      {/* RewardsHubModal (Vòng quay may mắn & Mini Xu) khi được kích hoạt từ Chat */}
      {showRewardsModal && (
        <RewardsHubModal onClose={() => setShowRewardsModal(false)} />
      )}
    </>
  );
}
