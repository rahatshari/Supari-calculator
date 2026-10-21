import React from 'react';
import { Download, ShoppingBag, ArrowRight } from 'lucide-react';
import { AppView } from '../types';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  canInstall: boolean;
  onInstall: () => void;
  kroyKhataEnabled: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  canInstall,
  onInstall,
  kroyKhataEnabled,
}) => {
  return (
    <div className="view-panel active">
      <div className="home-hero">
        <div className="home-logo">
          <img src="icon.svg" alt="Supari Logo" width="88" height="88" />
        </div>
        <h2 className="home-title">সুপারি হিসাব অ্যাপ</h2>
        <p className="home-subtitle">আপনি কোন হিসাবটি করতে চান নিচে নির্বাচন করুন</p>
      </div>

      {/* App Install Banner (Visible when not installed) */}
      {canInstall && (
        <div className="install-banner">
          <div className="install-banner-left">
            <div className="install-icon-badge">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="install-banner-title">অ্যাপটি মোবাইলে ইনস্টল করুন</div>
              <div className="install-banner-desc">নেট ছাড়া সরাসরি ব্যবহারের জন্য এক ক্লিকে ইনস্টল করুন</div>
            </div>
          </div>
          <button className="install-action-btn" onClick={onInstall}>
            <Download className="w-3.5 h-3.5 mr-1" />
            ইন্সটল করুন
          </button>
        </div>
      )}

      {/* Module 1: কাঁচা-পাকা সুপারি */}
      <div className="module-card" onClick={() => onNavigate('kacha-paka')}>
        <div className="module-icon-box">
          <svg className="icon-svg" viewBox="0 0 100 100" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="rawGradHome" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#15803d" />
              </radialGradient>
            </defs>
            <path d="M50 15 C80 15, 85 50, 70 80 C60 95, 40 95, 30 80 C15 50, 20 15, 50 15 Z" fill="url(#rawGradHome)" />
            <path d="M45 18 C48 10, 52 10, 55 18 Z" fill="#166534" />
            <ellipse cx="40" cy="35" rx="6" ry="12" fill="#ffedd5" opacity="0.3" transform="rotate(-20 40 35)" />
          </svg>
        </div>
        <div className="module-info">
          <h3>কাঁচা-পাকা সুপারি হিসাব</h3>
          <p>কুড়ি, ঘা ও পিস অনুযায়ী হিসাব এবং দর যাচাই</p>
        </div>
        <div className="module-arrow">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      {/* Module 2: শুকনো সুপারি */}
      <div className="module-card" onClick={() => onNavigate('shukno')}>
        <div className="module-icon-box">
          <svg className="icon-svg" viewBox="0 0 100 100" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="dryGradHome" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#9a3412" />
                <stop offset="60%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </radialGradient>
            </defs>
            <path d="M50 18 C85 18, 80 55, 65 82 C55 95, 45 95, 35 82 C20 55, 15 18, 50 18 Z" fill="url(#dryGradHome)" />
            <path d="M35 30 Q40 55 32 78 M65 30 Q60 55 68 78 M50 25 Q55 55 48 82 M42 28 Q48 50 40 80 M58 28 Q52 50 60 80" stroke="#280f02" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
            <path d="M45 18 C48 12, 52 12, 55 18 Z" fill="#3f1e04" />
          </svg>
        </div>
        <div className="module-info">
          <h3>শুকনো সুপারির হিসাব</h3>
          <p>বস্তা ও মোট ওজন হিসাব এবং খালি বস্তার ওজন বাদ</p>
        </div>
        <div className="module-arrow">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      {/* Module 3: দৈনিক সুপারি ক্রয় খাতা (Only visible when enabled in settings) */}
      {kroyKhataEnabled && (
        <div className="module-card" onClick={() => onNavigate('kroy-khata')}>
          <div
            className="module-icon-box"
            style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderColor: '#6ee7b7',
            }}
          >
            <ShoppingBag className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="module-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ marginBottom: '2px' }}>দৈনিক সুপারি ক্রয় খাতা</h3>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: '#10b981',
                  color: 'white',
                  padding: '2px 7px',
                  borderRadius: '10px',
                }}
              >
                নতুন
              </span>
            </div>
            <p>ক্রয়কৃত সুপারি ট্র্যাকিং, মোট কুড়ি ও দিনশেষের মোট খরচের হিসাব</p>
          </div>
          <div className="module-arrow">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
};
