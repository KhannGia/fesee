'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import LoanManager from '../components/LoanManager';
import CollateralManager from '../components/CollateralManager';
import { 
  ShieldCheck, 
  Wallet, 
  Activity, 
  Lock, 
  TrendingUp, 
  AlertTriangle, 
  Terminal, 
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Zap,
  Cpu,
  Database,
  Globe,
  ArrowRight,
  Layers,
  ArrowLeft,
  Home,
  Users,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Crown,
  ExternalLink
} from 'lucide-react';

// --- SHARED COMPONENTS ---
const Navbar = ({ onViewChange, currentView, web3 }) => {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet, switchAccount, isOnSepolia } = web3 || {};
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onViewChange('landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Zap className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">StreamCredit</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {currentView === 'landing' ? (
            <>
              <a href="#features" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Tính năng</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Cách hoạt động</a>
              <button onClick={() => onViewChange('team')} className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Đội ngũ</button>
              <a href="#roadmap" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Lộ trình</a>
            </>
          ) : (
            <button onClick={() => onViewChange('landing')} className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition flex items-center gap-2">
              <Home size={16} /> Quay về trang chủ
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {currentView === 'landing' && (
            <>
              <button 
                onClick={() => onViewChange('manage')}
                className="hidden md:flex px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium transition items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <TrendingUp size={14} /> Manage Loans
              </button>
              <button 
                onClick={() => onViewChange('collateral')}
                className="hidden md:flex px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Layers size={14} /> Collateral NFT
              </button>
              <button 
                onClick={() => onViewChange('console')}
                className="hidden md:flex px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition items-center gap-2"
              >
                <Terminal size={14} /> Launch App
              </button>
            </>
          )}
          
          {/* Wallet Connection Button with Dropdown */}
          {isConnected ? (
            <div className="relative">
              <button 
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium transition-all flex items-center gap-2 text-emerald-400"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {formatAddress(account)}
                {!isOnSepolia && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">Wrong Net</span>
                )}
                <ChevronRight size={14} className={`transition-transform ${showWalletMenu ? 'rotate-90' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showWalletMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Connected Wallet</div>
                    <div className="text-sm font-mono text-slate-300">{formatAddress(account)}</div>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={() => { switchAccount?.(); setShowWalletMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Switch Account
                    </button>
                    <button 
                      onClick={() => { disconnectWallet?.(); setShowWalletMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <AlertTriangle size={14} />
                      Disconnect
                    </button>
                  </div>
                  <div className="p-2 bg-slate-800/50 border-t border-slate-700">
                    <div className="text-[10px] text-slate-500 text-center">
                      Tip: Tạo ví mới trong MetaMask để test kịch bản khác
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Wallet size={16} />
              )}
              <span className="hidden sm:inline">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="border-t border-white/5 py-12 text-center bg-slate-950/50">
    <div className="flex items-center justify-center gap-2 mb-4 text-cyan-400">
      <ShieldCheck size={20} />
      <span className="text-lg font-bold">StreamCredit Protocol</span>
    </div>
    <p className="text-slate-500 text-sm max-w-md mx-auto">
      Giải pháp tài chính phi tập trung thế hệ mới. Bảo mật bởi Zero-Knowledge Proofs và vận hành trên Sepolia Testnet.
      <br/><br/>
      © 2024 StreamCredit Labs.
    </p>
  </footer>
);

// --- PAGE 1: LANDING PAGE VIEW ---
const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="glass-panel glass-card-hover p-6 rounded-2xl h-full border-t border-white/5">
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center mb-5 text-cyan-400 shadow-inner">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

const LandingView = ({ onNavigate }) => (
  <div className="fade-in">
    {/* HERO SECTION */}
    <header className="relative pt-20 pb-32 px-6 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-300 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Live on Sepolia Testnet
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
          Tín dụng <span className="text-gradient">Minh bạch</span> <br className="hidden md:block"/>
          Bảo mật <span className="text-slate-100">Tuyệt đối</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Giải pháp RWA Lending đầu tiên kết hợp <strong>Zero-Knowledge Proofs</strong> và <strong>Benford's Law</strong> để xác thực dòng tiền doanh nghiệp mà không lộ dữ liệu nhạy cảm.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => onNavigate('console')}
            className="btn-action px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-lg"
          >
            <Terminal size={20} />
            Mở Demo App
          </button>
          <a href="#how-it-works" className="px-8 py-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-all flex items-center gap-2">
            Tìm hiểu thêm <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </header>

    {/* FEATURES GRID */}
    <section id="features" className="py-24 relative bg-slate-950/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Công nghệ Cốt lõi</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Chúng tôi xây dựng trust-layer cho tài chính phi tập trung bằng cách kết hợp mật mã học tiên tiến và phân tích thống kê.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={Lock}
            title="Zero-Knowledge Privacy"
            desc="Tạo bằng chứng xác thực doanh thu (ZK-Proof) ngay trên trình duyệt. Dữ liệu gốc không bao giờ rời khỏi máy của bạn."
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Fraud Detection"
            desc="Sử dụng Benford's Law để phát hiện các mẫu dữ liệu wash trading hoặc làm giả báo cáo tài chính tự động."
          />
          <FeatureCard 
            icon={Globe}
            title="Real-World Assets"
            desc="Kết nối dữ liệu doanh thu thực tế (Off-chain) với thanh khoản trên chuỗi (On-chain) thông qua Oracle."
          />
          <FeatureCard 
            icon={Cpu}
            title="Dynamic Credit"
            desc="Hạn mức tín dụng được cập nhật theo thời gian thực dựa trên sức khỏe dòng tiền được chứng minh."
          />
        </div>
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section id="how-it-works" className="py-24 container mx-auto px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start gap-12">
        <div className="md:w-1/3 sticky top-24">
          <h2 className="text-3xl font-bold text-white mb-6">Luồng Dữ Liệu <br/><span className="text-gradient">Hoạt Động Như Thế Nào?</span></h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Hệ thống đảm bảo tính toàn vẹn dữ liệu từ lúc nhập liệu cho đến khi hợp đồng thông minh xử lý khoản vay, hoàn toàn phi tập trung.
          </p>
          <button 
            onClick={() => onNavigate('console')}
            className="text-cyan-400 font-medium flex items-center gap-2 hover:gap-3 transition-all cursor-pointer"
          >
            Trải nghiệm ngay <ArrowRight size={16} />
          </button>
        </div>

        <div className="md:w-2/3 space-y-8">
          {/* Step 1 */}
          <div className="glass-panel p-6 rounded-2xl flex gap-6 relative group">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800 -z-10 md:hidden"></div>
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-lg z-10">1</div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">Data Ingestion <Database size={16} className="text-slate-500"/></h3>
              <p className="text-slate-400 text-sm">Người dùng kết nối API bán hàng (Shopify/Stripe). Hệ thống fetch dữ liệu giao dịch thô về máy khách (Client-side).</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-6 rounded-2xl flex gap-6 relative group">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800 -z-10 md:hidden"></div>
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 font-bold text-lg z-10">2</div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">Anomaly Check <Activity size={16} className="text-slate-500"/></h3>
              <p className="text-slate-400 text-sm">Thuật toán Benford chạy cục bộ để tính toán điểm số bất thường. Nếu điểm số &gt; ngưỡng (Threshold), quy trình dừng lại.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-6 rounded-2xl flex gap-6 relative group">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800 -z-10 md:hidden"></div>
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-lg z-10">3</div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">ZK Proving <Lock size={16} className="text-slate-500"/></h3>
              <p className="text-slate-400 text-sm">Tạo bằng chứng Groth16 chứng minh: "Tôi có doanh thu &gt; $X và Benford Score hợp lệ" mà không tiết lộ số tiền cụ thể.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass-panel p-6 rounded-2xl flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">4</div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">On-Chain Settlement <Layers size={16} className="text-slate-500"/></h3>
              <p className="text-slate-400 text-sm">Smart Contract xác thực proof. Nếu đúng, hạn mức tín dụng (Credit Limit) được cập nhật và USDC được mở khóa.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ROADMAP */}
    <section id="roadmap" className="py-24 bg-slate-900/20 border-y border-white/5">
      <div className="container mx-auto px-6 max-w-5xl">
        <h2 className="text-3xl font-bold text-center text-white mb-16">Lộ Trình Phát Triển</h2>
        
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 hidden md:block"></div>

          <div className="space-y-12">
            {/* Item 1 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              <div className="md:w-1/2 md:text-right order-2 md:order-1">
                <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-2">Q4 2024 - HOÀN THÀNH</div>
                <h3 className="text-xl font-bold text-white mb-2">MVP Launch (Sepolia)</h3>
                <p className="text-slate-400 text-sm">Ra mắt bản demo tích hợp Benford check, ZK circuit cơ bản và mock USDC faucet.</p>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.6)] hidden md:block"></div>
              <div className="md:w-1/2 order-1 md:order-2 opacity-50 hidden md:block"></div>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              <div className="md:w-1/2 order-2 md:order-1 opacity-50 hidden md:block"></div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 border-4 border-slate-900 shadow-[0_0_15px_rgba(168,85,247,0.4)] hidden md:block"></div>
              <div className="md:w-1/2 order-1 md:order-2">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold mb-2">Q1 2025 - ĐANG PHÁT TRIỂN</div>
                <h3 className="text-xl font-bold text-white mb-2">Liquidity Pools & Staking</h3>
                <p className="text-slate-400 text-sm">Cho phép Lenders cung cấp thanh khoản (USDC) để kiếm lợi suất (Yield) từ lãi vay của Borrowers.</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              <div className="md:w-1/2 md:text-right order-2 md:order-1">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-700/30 border border-slate-600 text-slate-400 text-xs font-bold mb-2">Q2 2025 - KẾ HOẠCH</div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">Decentralized Oracles</h3>
                <p className="text-slate-500 text-sm">Thay thế Mock API bằng mạng lưới Oracle phi tập trung (Chainlink Functions) để xác thực nguồn dữ liệu.</p>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-slate-700 border-4 border-slate-900 hidden md:block"></div>
              <div className="md:w-1/2 order-1 md:order-2 opacity-50 hidden md:block"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

// --- PAGE 2: TEAM VIEW ---
const TeamView = () => {
  const TEAM_MEMBERS = [
    {
      name: "Nguyễn Văn An",
      role: "Co-Founder & CEO",
      bio: "10 năm kinh nghiệm trong Fintech và Ngân hàng số. Cựu Product Manager tại TechBank.",
      initials: "AN",
      color: "from-cyan-500 to-blue-500",
      isLeader: true // Đánh dấu Leader
    },
    {
      name: "Trần Thị Bình",
      role: "CTO & Lead ZK Researcher",
      bio: "Chuyên gia về Cryptography và ZK-Rollups. Đóng góp tích cực cho cộng đồng Ethereum.",
      initials: "TB",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Lê Minh Cường",
      role: "Smart Contract Engineer",
      bio: "Full-stack Web3 developer. Đã audit an ninh cho nhiều giao thức DeFi lớn.",
      initials: "MC",
      color: "from-emerald-400 to-cyan-500"
    }
  ];

  return (
    <div className="container mx-auto px-6 max-w-6xl py-20 fade-in min-h-screen">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Những người <span className="text-gradient">kiến tạo</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Chúng tôi là tập hợp của những kỹ sư, nhà nghiên cứu và chuyên gia tài chính với niềm tin mãnh liệt vào tương lai của DeFi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 justify-center">
        {TEAM_MEMBERS.map((member, idx) => (
          <div 
            key={idx} 
            className={`
              glass-panel p-6 rounded-3xl text-center group relative overflow-hidden flex flex-col items-center
              ${member.isLeader ? 'leader-card' : 'glass-card-hover'}
            `}
          >
            {member.isLeader && (
              <div className="absolute top-3 right-3 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-cyan-500/50">
                <Crown size={12} fill="currentColor" /> LEADER
              </div>
            )}

            <div className={`
              w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${member.color} 
              flex items-center justify-center text-3xl font-bold text-white mb-6 
              shadow-xl shadow-cyan-500/10 relative z-10
              ${member.isLeader ? 'ring-4 ring-cyan-500/20' : ''}
            `}>
              {member.initials}
            </div>
            
            <h3 className={`text-xl font-bold mb-1 ${member.isLeader ? 'text-cyan-100' : 'text-white'}`}>
              {member.name}
            </h3>
            <p className={`text-sm font-semibold mb-4 uppercase tracking-wider text-[10px] ${member.isLeader ? 'text-cyan-300' : 'text-cyan-400'}`}>
              {member.role}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow">
              {member.bio}
            </p>

            <div className="flex justify-center gap-4 text-slate-500 pt-4 border-t border-white/5 w-full mt-auto">
              <a href="#" className="social-icon"><Linkedin size={18} /></a>
              <a href="#" className="social-icon"><Twitter size={18} /></a>
              <a href="#" className="social-icon"><Github size={18} /></a>
            </div>
          </div>
        ))}
      </div>

      {/* Advisory / Join Us */}
      <div className="glass-panel p-10 rounded-3xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        <h3 className="text-2xl font-bold text-white mb-4">Bạn muốn tham gia cùng chúng tôi?</h3>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          StreamCredit đang tìm kiếm những tài năng đam mê ZK-Proofs và DeFi. Hãy gửi CV của bạn ngay hôm nay.
        </p>
        <button className="px-8 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-cyan-50 hover:text-cyan-900 transition flex items-center gap-2 mx-auto">
          <Mail size={18} />
          Gửi Email Ứng Tuyển
        </button>
      </div>
    </div>
  );
};

// --- PAGE 3: CONSOLE APP VIEW ---
const API_BASE = process.env.NEXT_PUBLIC_MOCK_API_URL || 'http://localhost:3001';

const ConsoleView = ({ onNavigate, web3 }) => {
  const { 
    account, 
    isConnected, 
    connectWallet, 
    submitZKProof, 
    getAccountInfo,
    borrow: contractBorrow,
    repay: contractRepay,
    isOnSepolia
  } = web3 || {};

  // State for Console
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioData, setScenarioData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState([]);
  const [creditLimit, setCreditLimit] = useState(0);
  const [borrowed, setBorrowed] = useState(0);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [zkProof, setZkProof] = useState(null);
  const [publicSignals, setPublicSignals] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lastTxHash, setLastTxHash] = useState(null);

  const SCENARIOS = {
    HONEST: { name: 'Honest Merchant', desc: 'Dữ liệu bán lẻ tự nhiên tuân theo quy luật Benford.' },
    FRAUD: { name: 'Wash Trader', desc: 'Dấu hiệu thao túng volume (số tròn, lặp lại bất thường).' }
  };

  // Load on-chain account info when connected
  useEffect(() => {
    if (isConnected && getAccountInfo) {
      loadAccountInfo();
    }
  }, [isConnected, account]);

  const loadAccountInfo = async () => {
    if (!getAccountInfo) return;
    
    setOnChainLoading(true);
    try {
      const info = await getAccountInfo();
      if (info) {
        const limit = parseFloat(info.creditLimit);
        const debt = parseFloat(info.borrowed);
        
        // Only update if on-chain has data (not zero)
        if (limit > 0 || debt > 0) {
          setCreditLimit(limit);
          setBorrowed(debt);
          addLog(`📊 On-chain position synced:`, 'success');
          addLog(`   Credit Limit: $${limit.toLocaleString()} USDC`, 'info');
          addLog(`   Borrowed: $${debt.toLocaleString()} USDC`, 'info');
          addLog(`   Available: $${(limit - debt).toLocaleString()} USDC`, 'info');
        } else {
          addLog(`ℹ️ No on-chain position yet - submit ZK proof to get credit`, 'info');
        }
      }
    } catch (error) {
      console.error('Failed to load account info:', error);
      // Don't reset local state on error - keep existing values
      addLog(`⚠️ Could not sync on-chain data (using local state)`, 'info');
    }
    setOnChainLoading(false);
  };

  useEffect(() => {
    addLog('Console initialized. Waiting for user input...');
    if (!isConnected) {
      addLog('⚠️ Connect your MetaMask wallet to interact with on-chain features', 'info');
    }
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const handleScenarioSelect = async (key) => {
    setIsLoading(true);
    setSelectedScenario(key);
    addLog(`Fetching data from API for scenario: ${key}...`);
    
    try {
      // Call real API
      const response = await fetch(`${API_BASE}/api/credit/demo/${key}`);
      const data = await response.json();
      
      if (data.success) {
        setScenarioData({
          ...SCENARIOS[key],
          revenue: data.revenue,
          score: data.benfordAnalysis.fraudProbability,
          status: data.benfordAnalysis.isFraud ? 'danger' : 'safe',
          creditScore: data.score,
          creditLimit: data.creditLimit,
          decision: data.decision,
          riskLevel: data.riskLevel
        });
        
        setStep(2);
        addLog(`Data loaded. Revenue: ${data.revenue}. Calculating Benford Score...`);
        addLog(`Benford Score: ${data.benfordAnalysis.fraudProbability}% - ${data.benfordAnalysis.interpretation}`, 
               data.benfordAnalysis.isFraud ? 'error' : 'success');
        addLog(`Credit Decision: ${data.decision} (Score: ${data.score}/100)`, 
               data.decision === 'APPROVED' ? 'success' : data.decision === 'REJECTED' ? 'error' : 'info');
      } else {
        addLog('API Error: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      addLog(`Network Error: ${error.message}`, 'error');
      // Fallback to mock data
      setScenarioData({
        ...SCENARIOS[key],
        revenue: key === 'HONEST' ? '$125,400' : '$980,000',
        score: key === 'HONEST' ? 8 : 45,
        status: key === 'HONEST' ? 'safe' : 'danger'
      });
      setStep(2);
    }
    
    setIsLoading(false);
  };

  const handleGenerateProof = async () => {
    if (!scenarioData) return;
    
    setIsLoading(true);
    addLog('Initializing ZK Circuit (Groth16)...');
    
    try {
      // Fetch raw data for ZK proof
      const dataResponse = await fetch(`${API_BASE}/api/user/${selectedScenario.toLowerCase()}`);
      const userData = await dataResponse.json();
      const amounts = userData.orders.map(o => o.amount);
      
      addLog(`Loaded ${amounts.length} transactions for proof generation...`);
      addLog('Generating ZK proof with Groth16...');
      
      // Call ZK proof API
      const proofResponse = await fetch(`${API_BASE}/api/zk/generate-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amounts,
          revenueThreshold: 10000,
          benfordThreshold: 50
        })
      });
      
      const proofData = await proofResponse.json();
      
      if (proofData.success) {
        setZkProof(proofData.proof);
        setPublicSignals(proofData.publicInputs);
        setTotalRevenue(proofData.analysis.totalRevenue);
        setStep(3);
        addLog(`ZK Proof generated in ${proofData.generationTimeMs.toFixed(0)}ms ✅`, 'success');
        addLog(`Revenue verified: $${proofData.analysis.totalRevenue.toLocaleString()}`, 'info');
        addLog(`Benford Score: ${proofData.analysis.benfordScore}% (threshold: 20%)`, 'info');
        if (isConnected) {
          addLog('Ready to submit proof on-chain. Click "Submit On-Chain" to continue.', 'success');
        } else {
          addLog('⚠️ Connect wallet to submit proof on-chain', 'info');
        }
      } else {
        addLog(`Proof Generation Failed: ${proofData.error}`, 'error');
      }
    } catch (error) {
      addLog(`Error generating proof: ${error.message}`, 'error');
    }
    
    setIsLoading(false);
  };

  const handleSubmitOnChain = async () => {
    if (!scenarioData || scenarioData.status === 'danger') {
      addLog('Transaction reverted: Invalid Proof (High fraud risk)', 'error');
      return;
    }

    // Check if wallet is connected
    if (!isConnected) {
      addLog('⚠️ Please connect your MetaMask wallet first', 'error');
      try {
        await connectWallet();
        addLog('Wallet connected! Please try again.', 'success');
      } catch (e) {
        addLog('Failed to connect wallet', 'error');
      }
      return;
    }

    if (!isOnSepolia) {
      addLog('⚠️ Please switch to Sepolia testnet in MetaMask', 'error');
      return;
    }

    if (!zkProof) {
      addLog('⚠️ Generate ZK proof first', 'error');
      return;
    }
    
    setIsLoading(true);
    addLog('Submitting proof to Sepolia testnet...');
    addLog(`Contract: 0xCF2a...5475`, 'info');
    
    try {
      // Submit to real contract
      const result = await submitZKProof(zkProof, publicSignals, totalRevenue);
      
      if (result.success) {
        setLastTxHash(result.txHash);
        addLog(`✅ Transaction confirmed!`, 'success');
        addLog(`TxHash: ${result.txHash}`, 'success');
        
        // Calculate credit limit (30% of revenue)
        const newCreditLimit = Math.round(totalRevenue * 0.3);
        
        // Update local state immediately
        setCreditLimit(newCreditLimit);
        setBorrowed(0);
        addLog(`💳 Credit Limit Updated: $${newCreditLimit.toLocaleString()}`, 'success');
        
        // Try to refresh from on-chain (may take a moment)
        setTimeout(async () => {
          try {
            await loadAccountInfo();
          } catch (e) {
            console.log('On-chain read delayed, using local state');
          }
        }, 2000);
        
        setStep(4);
        alert("🎉 ZK Proof verified on-chain! Credit Limit Updated!");
      }
    } catch (error) {
      console.error('On-chain submission error:', error);
      addLog(`❌ Transaction failed: ${error.message || error.reason || 'Unknown error'}`, 'error');
      
      // Check for specific error types
      if (error.code === 'ACTION_REJECTED') {
        addLog('Transaction was rejected by user', 'error');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        addLog('Insufficient ETH for gas fees', 'error');
      }
    }
    
    setIsLoading(false);
  };

  const handleBorrow = async () => {
    const amount = 500; // Demo amount
    const termDays = 30; // Default 30 days
    
    if (!isConnected) {
      addLog('⚠️ Connect wallet to borrow', 'error');
      return;
    }

    if (creditLimit - borrowed < amount) {
      addLog(`⚠️ Insufficient credit! Available: $${(creditLimit - borrowed).toLocaleString()}`, 'error');
      return;
    }

    setIsLoading(true);
    addLog(`Borrowing $${amount} USDC for ${termDays} days...`);
    
    try {
      const result = await contractBorrow(amount, termDays);
      if (result.success) {
        setLastTxHash(result.txHash);
        
        // Update local state immediately
        setBorrowed(prev => prev + amount);
        
        addLog(`✅ Borrowed $${amount} successfully for ${termDays} days!`, 'success');
        addLog(`TxHash: ${result.txHash}`, 'info');
        addLog(`📊 New borrowed amount: $${(borrowed + amount).toLocaleString()}`, 'info');
      }
    } catch (error) {
      addLog(`❌ Borrow failed: ${error.message}`, 'error');
    }
    
    setIsLoading(false);
  };

  const handleRepay = async () => {
    const amount = 200; // Demo amount
    
    if (!isConnected) {
      addLog('⚠️ Connect wallet to repay', 'error');
      return;
    }

    if (borrowed < amount) {
      addLog(`⚠️ Repay amount exceeds borrowed! Borrowed: $${borrowed.toLocaleString()}`, 'error');
      return;
    }

    setIsLoading(true);
    addLog(`Repaying $${amount} USDC...`);
    
    try {
      const result = await contractRepay(amount);
      if (result.success) {
        setLastTxHash(result.txHash);
        
        // Update local state immediately
        setBorrowed(prev => Math.max(0, prev - amount));
        
        addLog(`✅ Repaid $${amount} successfully!`, 'success');
        addLog(`TxHash: ${result.txHash}`, 'info');
        addLog(`📊 Remaining debt: $${Math.max(0, borrowed - amount).toLocaleString()}`, 'info');
      }
    } catch (error) {
      addLog(`❌ Repay failed: ${error.message}`, 'error');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-6 max-w-7xl py-8 min-h-screen fade-in">
      {/* Header with Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => onNavigate('landing')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Terminal className="text-cyan-400" size={24} />
              </div>
              Protocol Console
            </h2>
            <p className="text-slate-400 text-sm mt-1">Xác thực doanh thu → Tạo ZK Proof → Nhận Credit On-Chain</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-400 font-mono">
              Sepolia Testnet
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400 font-mono">
              v0.2.0-beta
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between max-w-2xl mx-auto mb-2">
          {[
            { num: 1, label: 'Chọn dữ liệu', icon: Database },
            { num: 2, label: 'Phân tích', icon: Activity },
            { num: 3, label: 'Tạo Proof', icon: Lock },
            { num: 4, label: 'On-Chain', icon: Zap }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex flex-col items-center ${step >= s.num ? 'text-cyan-400' : 'text-slate-600'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  step > s.num 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                    : step === s.num 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 glow-cyan' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-600'
                } border`}>
                  {step > s.num ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
                </div>
                <span className="text-[10px] mt-1.5 font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < 3 && (
                <div className={`w-12 md:w-20 h-0.5 mx-2 rounded transition-all duration-500 ${
                  step > s.num ? 'bg-emerald-500/50' : 'bg-slate-800'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Scenario Selection - Redesigned */}
          <div className={`glass-panel rounded-2xl overflow-hidden transition-all duration-500 ${step === 1 ? 'ring-2 ring-cyan-500/40 glow-cyan' : ''}`}>
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/50 px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 flex items-center gap-3">
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  step > 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                  step === 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                  'bg-slate-700 text-slate-500 border border-slate-600'
                }`}>
                  {step > 1 ? <CheckCircle2 size={14} /> : '1'}
                </span>
                Chọn nguồn dữ liệu giao dịch
              </h3>
              {selectedScenario && (
                <button 
                  onClick={() => { setSelectedScenario(null); setScenarioData(null); setStep(1); setZkProof(null); }} 
                  className="text-xs text-slate-500 hover:text-cyan-400 transition flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              )}
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(SCENARIOS).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleScenarioSelect(key)}
                  disabled={isLoading}
                  className={`text-left p-5 rounded-xl border-2 transition-all duration-300 relative group card-lift ${
                    selectedScenario === key 
                      ? key === 'HONEST' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                        : 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
                    key === 'HONEST' 
                      ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20'
                  }`}>
                    {key === 'HONEST' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  
                  {/* Content */}
                  <div className="font-bold text-lg text-slate-100 mb-2">{data.name}</div>
                  <div className="text-sm text-slate-400 leading-relaxed">{data.desc}</div>
                  
                  {/* Selected indicator */}
                  {selectedScenario === key && (
                    <div className="absolute top-3 right-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        key === 'HONEST' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 & 3: ZK Process - Redesigned */}
          <div className={`glass-panel rounded-2xl overflow-hidden transition-all duration-500 ${
            !selectedScenario ? 'opacity-40 pointer-events-none' : 'opacity-100'
          } ${step >= 2 && step <= 3 ? 'ring-2 ring-cyan-500/40 glow-cyan' : ''}`}>
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/50 px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 flex items-center gap-3">
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  step > 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                  step >= 2 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                  'bg-slate-700 text-slate-500 border border-slate-600'
                }`}>
                  {step > 3 ? <CheckCircle2 size={14} /> : '2'}
                </span>
                Phân tích & Tạo ZK Proof
              </h3>
              {scenarioData && (
                <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  scenarioData.score < 20 
                  ? 'status-safe' 
                  : 'status-danger'
                }`}>
                  Benford: {scenarioData.score}%
                </span>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <TrendingUp size={14} />
                    Doanh thu phát hiện
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100">
                    {scenarioData ? scenarioData.revenue : '---'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <ShieldCheck size={14} />
                    Trạng thái rủi ro
                  </div>
                  <div className={`text-2xl font-bold ${
                    !scenarioData ? 'text-slate-600' :
                    scenarioData.status === 'safe' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {scenarioData ? (scenarioData.status === 'safe' ? '✓ AN TOÀN' : '⚠ RỦI RO') : '---'}
                  </div>
                </div>
              </div>

              {/* Credit Decision Card */}
              {scenarioData && scenarioData.decision && (
                <div className={`p-4 rounded-xl border-2 ${
                  scenarioData.decision === 'APPROVED' 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 border-emerald-500/30' 
                    : scenarioData.decision === 'REJECTED'
                    ? 'bg-gradient-to-r from-rose-500/10 to-orange-500/5 border-rose-500/30'
                    : 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/30'
                }`}>
                  <div className="flex justify-center items-center">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 text-center">Credit Decision</div>
                      <div className={`text-xl font-bold flex items-center gap-2 ${
                        scenarioData.decision === 'APPROVED' ? 'text-emerald-400' :
                        scenarioData.decision === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {scenarioData.decision === 'APPROVED' && <CheckCircle2 size={20} />}
                        {scenarioData.decision === 'REJECTED' && <AlertTriangle size={20} />}
                        {scenarioData.decision}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={handleGenerateProof}
                  disabled={isLoading || step > 2 || !selectedScenario}
                  className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-600 flex justify-center items-center gap-2 group"
                >
                  {isLoading && step === 2 ? (
                    <RefreshCw className="animate-spin w-4 h-4" />
                  ) : (
                    <Lock size={16} className="group-hover:scale-110 transition-transform" />
                  )}
                  Generate ZK Proof
                </button>
                <button 
                  onClick={handleSubmitOnChain}
                  disabled={isLoading || step < 3 || (scenarioData && scenarioData.status === 'danger')}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 group ${
                    scenarioData && scenarioData.status === 'danger'
                    ? 'bg-rose-900/20 text-rose-400 border-2 border-rose-900/50 cursor-not-allowed'
                    : 'btn-action shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  {isLoading && step === 3 ? (
                    <RefreshCw className="animate-spin w-4 h-4" />
                  ) : (
                    <Zap size={16} className="group-hover:scale-110 transition-transform" />
                  )}
                  Submit On-Chain
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TERMINAL & WALLET */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Connection Status Card - Redesigned */}
          {!isConnected && (
            <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-amber-500/50 bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Wallet className="text-amber-400" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-200">Wallet not connected</p>
                  <p className="text-xs text-amber-400/60 mt-0.5">Connect MetaMask to interact with on-chain features</p>
                </div>
                <button 
                  onClick={connectWallet}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-400 text-sm font-semibold transition-all border border-amber-500/30 hover:border-amber-500/50"
                >
                  Connect
                </button>
              </div>
            </div>
          )}
          
          {/* Wallet Card - Redesigned */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <Wallet className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Your Position</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Credit Overview</p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-700/50 text-xs text-slate-500">
                    Offline
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Credit Limit Display */}
              <div className="credit-meter rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Credit Limit</div>
                    <div className="text-3xl font-bold text-white tracking-tight">
                      ${creditLimit.toLocaleString()}
                      <span className="text-sm text-slate-500 font-normal ml-1">USDC</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Available</div>
                    <div className="text-xl font-semibold text-emerald-400">
                      ${(creditLimit - borrowed).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full progress-bar bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-1000 rounded-full" 
                    style={{ width: creditLimit > 0 ? `${Math.min(100, (borrowed/creditLimit)*100)}%` : '0%' }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500/50" />
                    Borrowed: ${borrowed.toLocaleString()}
                  </span>
                  <span>{creditLimit > 0 ? ((borrowed/creditLimit)*100).toFixed(1) : '0'}% utilized</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleBorrow}
                  disabled={isLoading || !isConnected || creditLimit - borrowed < 500}
                  className="group py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-400 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500/20 hover:border-cyan-500/40 flex items-center justify-center gap-2"
                >
                  <TrendingUp size={16} className="group-hover:scale-110 transition-transform" />
                  Borrow $500
                </button>
                <button 
                  onClick={handleRepay}
                  disabled={isLoading || !isConnected || borrowed < 200}
                  className="group py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-400 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-purple-500/20 hover:border-purple-500/40 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} className="group-hover:scale-110 transition-transform" />
                  Repay $200
                </button>
              </div>

              {/* Quick Stats */}
              {creditLimit > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  <div className="text-center p-2">
                    <div className="text-lg font-bold text-white">{creditLimit > 0 ? Math.round((creditLimit - borrowed) / 500) : 0}</div>
                    <div className="text-[10px] text-slate-500">Borrows Left</div>
                  </div>
                  <div className="text-center p-2 border-x border-slate-800">
                    <div className="text-lg font-bold text-cyan-400">0%</div>
                    <div className="text-[10px] text-slate-500">APR</div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-lg font-bold text-emerald-400">A+</div>
                    <div className="text-[10px] text-slate-500">Health</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Terminal - Redesigned */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[380px]">
            <div className="terminal-header px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/70 hover:bg-rose-500 transition cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70 hover:bg-amber-500 transition cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70 hover:bg-emerald-500 transition cursor-pointer" />
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-xs font-medium text-slate-400">StreamCredit Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-600 bg-slate-800/80 px-2 py-0.5 rounded">
                  {logs.length} entries
                </span>
              </div>
            </div>
            <div className="terminal-container p-4 font-mono text-xs overflow-y-auto flex-1 space-y-1.5">
              <div className="text-slate-600 italic pb-2 border-b border-slate-800/50 mb-2">
                {'// '}StreamCredit Protocol v0.2.0 - Ready
              </div>
              {logs.map((log, i) => (
                <div key={i} className="log-entry flex items-start gap-2 py-0.5 hover:bg-slate-800/30 px-1 -mx-1 rounded transition">
                  <span className="text-slate-700 select-none shrink-0">[{log.time}]</span>
                  <span className={`flex-1 ${
                    log.type === 'error' ? 'text-rose-400' : 
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.msg.startsWith('   ') ? 'text-slate-400' : 'text-cyan-300'
                  }`}>
                    <span className="text-slate-600 select-none">{'>'} </span>
                    {log.msg}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="text-cyan-400 animate-pulse flex items-center gap-2 py-1">
                  <RefreshCw size={12} className="animate-spin" />
                  Processing...
                </div>
              )}
              {logs.length === 0 && !isLoading && (
                <div className="text-slate-600 text-center py-8">
                  <Terminal size={24} className="mx-auto mb-2 opacity-50" />
                  <p>Chọn một scenario để bắt đầu</p>
                </div>
              )}
            </div>
          </div>

          {/* Last Transaction Link - Redesigned */}
          {lastTxHash && (
            <a 
              href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/60 transition-all group border-l-4 border-l-emerald-500/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                  <ExternalLink size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-white transition">
                    View on Etherscan
                  </div>
                  <div className="text-xs text-slate-500">Last confirmed transaction</div>
                </div>
              </div>
              <span className="text-xs text-slate-600 font-mono group-hover:text-emerald-400 transition bg-slate-800/50 px-2 py-1 rounded">
                {lastTxHash.slice(0, 8)}...{lastTxHash.slice(-6)}
              </span>
            </a>
          )}

        </div>
      </div>
    </div>
  );
};

// --- MAIN APP CONTAINER ---
export default function StreamCreditApp() {
  const [view, setView] = useState('landing'); // 'landing' | 'console' | 'manage' | 'collateral' | 'team'
  
  // Get Web3 context - must be inside Web3Provider (see layout.js)
  const web3Context = useWeb3();

  // Cuộn lên đầu trang khi chuyển view
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
    <>
      <div className="min-h-screen">
        <Navbar onViewChange={setView} currentView={view} web3={web3Context} />
        
        {/* VIEW SWITCHER */}
        {view === 'landing' && <LandingView onNavigate={setView} />}
        {view === 'console' && <ConsoleView onNavigate={setView} web3={web3Context} />}
        {view === 'manage' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-6 py-12">
              <div className="mb-8">
                <button 
                  onClick={() => setView('landing')}
                  className="text-slate-400 hover:text-cyan-400 transition flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={16} /> Back to Home
                </button>
                <h1 className="text-4xl font-bold text-white mb-2">Loan Management</h1>
                <p className="text-slate-400">Manage your loans with reverse interest curve and commitment fees</p>
              </div>
              <LoanManager />
            </div>
          </div>
        )}
        {view === 'collateral' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-6 py-12">
              <div className="mb-8">
                <button 
                  onClick={() => setView('landing')}
                  className="text-slate-400 hover:text-cyan-400 transition flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={16} /> Back to Home
                </button>
                <h1 className="text-4xl font-bold text-white mb-2">🏦 Collateral Tokenization</h1>
                <p className="text-slate-400">Tokenize your assets from images with IPFS storage and file hash verification</p>
              </div>
              <CollateralManager />
            </div>
          </div>
        )}
        {view === 'team' && <TeamView />}

        <Footer />
      </div>
    </>
  );
}