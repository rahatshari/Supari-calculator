import React from 'react';
import { ArrowLeft, Download, History, Settings, MoreVertical } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  canInstall: boolean;
  onInstall: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  canInstall,
  onInstall,
  onOpenHistory,
  onOpenSettings,
}) => {
  const getTitle = () => {
    switch (currentView) {
      case 'kacha-paka':
        return 'কাঁচা-পাকা সুপারি হিসাব';
      case 'shukno':
        return 'শুকনো সুপারির হিসাব';
      case 'kroy-khata':
        return 'দৈনিক সুপারি ক্রয় খাতা';
      default:
        return 'সুপারি হিসাব অ্যাপ';
    }
  };

  return (
    <header className="app-header no-print">
      <div className="header-left">
        {currentView !== 'home' ? (
          <>
            <button
              className="nav-icon-btn"
              onClick={() => onNavigate('home')}
              title="মূল মেনুতে ফিরে যান"
              aria-label="মূল মেনু"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              মেনু
            </button>
            <button
              className="nav-icon-btn settings-header-btn"
              onClick={onOpenSettings}
              title="অ্যাপ সেটিংস (ক্রয় খাতা চালু/বন্ধ)"
              aria-label="অ্যাপ সেটিংস"
              style={{ padding: '6px 8px' }}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            className="nav-icon-btn settings-header-btn"
            onClick={onOpenSettings}
            title="অ্যাপ সেটিংস ও ক্রয় খাতা অপশন"
            aria-label="অ্যাপ সেটিংস"
            style={{
              background: 'rgba(255, 255, 255, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.42)',
              borderRadius: '9px',
              padding: '6px 11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Settings className="w-3.5 h-3.5" />
            </div>
            <span>সেটিংস</span>
          </button>
        )}
      </div>

      <div className="header-center">
        <h1 className="header-title">{getTitle()}</h1>
      </div>

      <div className="header-right">
        {canInstall && (
          <button
            className="nav-icon-btn install-header-btn"
            onClick={onInstall}
            title="অ্যাপ ইনস্টল করুন"
            aria-label="অ্যাপ ইনস্টল করুন"
          >
            <Download className="w-3.5 h-3.5" />
            ইন্সটল
          </button>
        )}

        <button
          className="nav-icon-btn"
          onClick={onOpenHistory}
          title="হিস্ট্রি দেখুন"
          aria-label="হিস্ট্রি দেখুন"
        >
          <History className="w-3.5 h-3.5" />
          হিস্ট্রি
        </button>
      </div>
    </header>
  );
};
