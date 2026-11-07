import React, { useState } from 'react';
import { Settings2, X, ShoppingBag, Check, RefreshCw, Download, Sparkles, RotateCcw, Globe, Save } from 'lucide-react';
import { CURRENT_APP_VERSION, OFFICIAL_GITHUB_REPO, AppUpdateInfo } from '../config/version';
import {
  checkForUpdates,
  installAppUpdate,
  getTargetRepo,
  setCustomRepo,
  resetToDefaultRepo,
  isCustomRepoActive,
  getTargetApkUrl,
  cleanGitHubRepo,
} from '../utils/updateChecker';
import { toBnNum } from '../utils/bengali';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kroyKhataEnabled: boolean;
  onToggleKroyKhata: (enabled: boolean) => void;
  onShowUpdateModal?: (info: AppUpdateInfo) => void;
  onToast?: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  kroyKhataEnabled,
  onToggleKroyKhata,
  onShowUpdateModal,
  onToast,
}) => {
  const [repoInput, setRepoInput] = useState<string>(() => getTargetRepo());
  const [isCustom, setIsCustom] = useState<boolean>(() => isCustomRepoActive());
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [foundUpdate, setFoundUpdate] = useState<AppUpdateInfo | null>(null);

  if (!isOpen) return null;

  const handleSaveRepo = () => {
    const cleaned = cleanGitHubRepo(repoInput);
    if (!cleaned) {
      if (onToast) onToast('⚠️ রিপোজিটরি লিংক খালি রাখা যাবে না');
      return;
    }
    setCustomRepo(cleaned);
    const active = getTargetRepo();
    setRepoInput(active);
    setIsCustom(isCustomRepoActive());
    if (onToast) {
      onToast(`✅ আপডেট লিংক সেভ হয়েছে: ${active}`);
    }
  };

  const handleResetDefault = () => {
    resetToDefaultRepo();
    setRepoInput(OFFICIAL_GITHUB_REPO);
    setIsCustom(false);
    if (onToast) {
      onToast(`🔄 ডিফল্ট লিংক (${OFFICIAL_GITHUB_REPO}) ফিরিয়ে আনা হয়েছে!`);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      // Save input if user typed something new before checking
      const cleaned = cleanGitHubRepo(repoInput);
      if (cleaned && cleaned !== getTargetRepo()) {
        setCustomRepo(cleaned);
        setIsCustom(isCustomRepoActive());
      }

      const info = await checkForUpdates();
      if (info.hasUpdate) {
        setFoundUpdate(info);
        setUpdateStatus(`নতুন আপডেট পাওয়া গেছে: v${toBnNum(info.latestVersion)}`);
        if (onShowUpdateModal) {
          onShowUpdateModal(info);
        }
      } else {
        setFoundUpdate(null);
        setUpdateStatus(`আপনার অ্যাপটি লেটেস্ট ভার্সনে আছে (v${toBnNum(CURRENT_APP_VERSION)})`);
        if (onToast) {
          onToast(`✅ অ্যাপটি লেটেস্ট ভার্সন (v${toBnNum(CURRENT_APP_VERSION)})`);
        }
      }
    } catch {
      setUpdateStatus('ইন্টারনেট বা রিপোজিটরি চেক করুন');
      if (onToast) onToast('⚠️ আপডেট চেক করা যায়নি');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDirectInstall = () => {
    const targetUrl = foundUpdate?.apkUrl || getTargetApkUrl();
    if (onToast) onToast('📥 নতুন ভার্সন ডাউনলোড ও ইনস্টল শুরু হচ্ছে...');
    installAppUpdate(targetUrl);
  };

  return (
    <div className="modal-overlay show no-print" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: '430px',
          width: '94%',
          textAlign: 'left',
          borderRadius: '18px',
          padding: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <Settings2 className="w-5 h-5" />
            </div>
            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              অ্যাপ সেটিংস
            </h4>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Card: দৈনিক সুপারি ক্রয় খাতা */}
        <div
          style={{
            background: kroyKhataEnabled ? '#f0fdf4' : '#f8fafc',
            border: `1.5px solid ${kroyKhataEnabled ? '#86efac' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '14px',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: kroyKhataEnabled ? '#10b981' : '#cbd5e1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.25s ease',
                }}
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                  দৈনিক সুপারি ক্রয় খাতা
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.35 }}>
                  ক্রয় চালান ট্র্যাকিং, বিক্রেতার তালিকা ও দিনশেষের মোট খরচের হিসাব
                </div>
              </div>
            </div>

            {/* Custom Modern Toggle Switch */}
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '28px',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={kroyKhataEnabled}
                onChange={(e) => onToggleKroyKhata(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: kroyKhataEnabled ? '#10b981' : '#cbd5e1',
                  borderRadius: '28px',
                  transition: '0.25s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    height: '22px',
                    width: '22px',
                    left: kroyKhataEnabled ? '25px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </span>
            </label>
          </div>

          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11.5px',
            }}
          >
            <span style={{ color: '#64748b' }}>ফিচার স্ট্যাটাস:</span>
            <span
              style={{
                fontWeight: 800,
                color: kroyKhataEnabled ? '#047857' : '#64748b',
                background: kroyKhataEnabled ? '#dcfce7' : '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {kroyKhataEnabled ? '✓ সক্রিয় (ON)' : '✕ বন্ধ (OFF)'}
            </span>
          </div>
        </div>

        {/* App Version & Customizable Auto-Update Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '15px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>অটো আপডেট ও ইনস্টল</div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>স্বয়ংক্রিয় আপডেট সক্রিয়</div>
              </div>
            </div>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#047857',
                background: '#dcfce7',
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
              }}
            >
              v{toBnNum(CURRENT_APP_VERSION)}
            </span>
          </div>

          {/* GitHub Repository Link Setting (Editable with 1-Click Default Reset) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>গিটহাব আপডেট লিংক:</span>
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: isCustom ? '#fef3c7' : '#ecfdf5',
                  color: isCustom ? '#b45309' : '#047857',
                  border: `1px solid ${isCustom ? '#fde68a' : '#a7f3d0'}`,
                }}
              >
                {isCustom ? 'কাস্টম লিংক' : 'ডিফল্ট অফিসিয়াল লিংক'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="username/repo (ডিফল্ট: rahatsharif504/supari-calculator)"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSaveRepo}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="পরিবর্তন সেভ করুন"
              >
                <Save className="w-3.5 h-3.5" />
                সেভ
              </button>
            </div>

            {/* 1-Click Default Reset Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                ডিফল্ট: <code style={{ color: '#0f172a', fontWeight: 600 }}>{OFFICIAL_GITHUB_REPO}</code>
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#047857',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                title="১-ক্লিকে ডিফল্ট অফিসিয়াল লিংকে ফিরে যান"
              >
                <RotateCcw className="w-3 h-3 text-emerald-600" />
                ডিফল্ট ফিরিয়ে আনুন
              </button>
            </div>
          </div>

          {/* Action Buttons: Direct Install if update is available, or Check & Install */}
          {foundUpdate?.hasUpdate ? (
            <button
              onClick={handleDirectInstall}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Download className="w-4 h-4" />
              নতুন APK ইনস্টল করুন (v{toBnNum(foundUpdate.latestVersion)})
            </button>
          ) : (
            <button
              onClick={handleManualCheck}
              disabled={isCheckingUpdate}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #047857',
                color: '#047857',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: isCheckingUpdate ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              {isCheckingUpdate ? 'আপডেট চেক হচ্ছে...' : 'আপডেট চেক ও ইনস্টল করুন'}
            </button>
          )}

          {updateStatus && (
            <div
              style={{
                fontSize: '11.5px',
                marginTop: '8px',
                textAlign: 'center',
                fontWeight: 700,
                color: updateStatus.includes('পাওয়া গেছে') ? '#047857' : '#475569',
              }}
            >
              {updateStatus}
            </div>
          )}

          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
            💡 অ্যাপ চালুর সময় বা নেট সংযোগ পেলেই স্বয়ংক্রিয়ভাবে নতুন আপডেট নোটিফিকেশন আসবে।
          </div>
        </div>

        {/* Helpful Tip */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#92400e',
            marginBottom: '16px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '15px' }}>💡</span>
          <div>
            <strong>টিপস:</strong> আপনি যদি শুধু কেনা-বেচার সাধারণ হিসাব করতে চান তবে এটি বন্ধ
            রাখতে পারেন। বন্ধ রাখলে হোম স্ক্রিন ও ক্যালকুলেটর থেকে ক্রয় খাতার অতিরিক্ত বাটনগুলো লুকানো
            থাকবে।
          </div>
        </div>

        {/* Close Button */}
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '11px', fontWeight: 700, borderRadius: '10px', fontSize: '14px' }}
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
};
